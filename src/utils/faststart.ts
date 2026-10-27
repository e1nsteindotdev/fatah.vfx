/**
 * FastStart utility for MP4/MOV video files.
 *
 * In web video playback, if the `moov` atom (metadata containing frame offsets and durations)
 * is positioned at the END of an MP4/MOV file (which DaVinci Resolve, Premiere, and default
 * encoders do), browsers cannot stream or play the video until the entire file is downloaded
 * or until multiple range requests are negotiated.
 *
 * This utility inspects the atom structure and repositions `moov` before `mdat`,
 * adjusting the chunk offset tables (`stco` and `co64`) by adding the size of `moov`.
 * Since `file.slice()` creates zero-copy Blob pointers, this runs in ~50ms even for
 * gigabyte-sized files without exhausting browser memory.
 */

export interface FastStartResult {
  file: File
  wasOptimized: boolean
  originalMoovPos?: number
  mdatPos?: number
  moovSize?: number
}

interface Atom {
  name: string
  pos: number
  size: number
  headerSize: number
}

/**
 * Reads atom headers by slicing only the minimal required bytes.
 */
async function parseTopLevelAtoms(file: Blob): Promise<Atom[]> {
  const atoms: Atom[] = []
  let pos = 0
  const fileSize = file.size

  while (pos < fileSize) {
    // Read 16 bytes to cover both 32-bit and 64-bit atom headers
    const headerBlob = file.slice(pos, Math.min(pos + 16, fileSize))
    const buffer = await headerBlob.arrayBuffer()
    if (buffer.byteLength < 8) break

    const view = new DataView(buffer)
    let size = view.getUint32(0, false)
    let headerSize = 8

    // Read 4-character ASCII atom type
    const name = String.fromCharCode(
      view.getUint8(4),
      view.getUint8(5),
      view.getUint8(6),
      view.getUint8(7)
    )

    if (size === 1) {
      // 64-bit extended size
      if (buffer.byteLength < 16) break
      const high = view.getUint32(8, false)
      const low = view.getUint32(12, false)
      size = high * 4294967296 + low
      headerSize = 16
    } else if (size === 0) {
      // Box extends to EOF
      size = fileSize - pos
    }

    if (size < headerSize) break

    atoms.push({ name, pos, size, headerSize })
    pos += size
  }

  return atoms
}

/**
 * Recursively or iteratively searches and patches `stco` and `co64` atoms inside a `moov` buffer.
 */
function patchChunkOffsets(moovBuffer: ArrayBuffer, offsetDelta: number) {
  const view = new DataView(moovBuffer)
  const len = moovBuffer.byteLength
  let idx = 0

  while (idx < len - 8) {
    const atomSize = view.getUint32(idx, false)
    const atomType = String.fromCharCode(
      view.getUint8(idx + 4),
      view.getUint8(idx + 5),
      view.getUint8(idx + 6),
      view.getUint8(idx + 7)
    )

    if (atomType === 'stco') {
      // stco: [4 bytes size][4 bytes 'stco'][1 byte version][3 bytes flags][4 bytes entry_count][entries...]
      if (idx + 16 <= len) {
        const entryCount = view.getUint32(idx + 12, false)
        for (let i = 0; i < entryCount; i++) {
          const entryPos = idx + 16 + i * 4
          if (entryPos + 4 <= len) {
            const currentOffset = view.getUint32(entryPos, false)
            view.setUint32(entryPos, currentOffset + offsetDelta, false)
          }
        }
      }
      idx += Math.max(8, atomSize > 0 && atomSize <= len - idx ? atomSize : 8)
    } else if (atomType === 'co64') {
      // co64: [4 bytes size][4 bytes 'co64'][1 byte version][3 bytes flags][4 bytes entry_count][entries...]
      if (idx + 16 <= len) {
        const entryCount = view.getUint32(idx + 12, false)
        const deltaBig = BigInt(offsetDelta)
        for (let i = 0; i < entryCount; i++) {
          const entryPos = idx + 16 + i * 8
          if (entryPos + 8 <= len) {
            const currentOffset = view.getBigUint64(entryPos, false)
            view.setBigUint64(entryPos, currentOffset + deltaBig, false)
          }
        }
      }
      idx += Math.max(8, atomSize > 0 && atomSize <= len - idx ? atomSize : 8)
    } else {
      // Advance by 1 byte to find nested sub-boxes (stbl/minf/mdia/trak)
      idx++
    }
  }
}

/**
 * Ensures an MP4 or MOV file is ready for instant progressive streaming.
 * If `moov` is already at the beginning of the file, returns the file directly.
 * If `moov` is placed at the end, relocates it before `mdat` and patches offsets.
 */
export async function optimizeForStreaming(file: File): Promise<FastStartResult> {
  // Only attempt on MP4/MOV container formats
  const lowerName = file.name.toLowerCase()
  const isMp4OrMov =
    file.type.includes('mp4') ||
    file.type.includes('quicktime') ||
    lowerName.endsWith('.mp4') ||
    lowerName.endsWith('.mov') ||
    lowerName.endsWith('.m4v')

  if (!isMp4OrMov) {
    return { file, wasOptimized: false }
  }

  try {
    const atoms = await parseTopLevelAtoms(file)
    const moovAtom = atoms.find((a) => a.name === 'moov')
    const mdatAtom = atoms.find((a) => a.name === 'mdat')

    if (!moovAtom || !mdatAtom) {
      // If we cannot parse valid moov/mdat, do not alter the file
      return { file, wasOptimized: false }
    }

    // If moov is already before mdat, it is already web-optimized for instant streaming!
    if (moovAtom.pos < mdatAtom.pos) {
      return {
        file,
        wasOptimized: false,
        originalMoovPos: moovAtom.pos,
        mdatPos: mdatAtom.pos,
      }
    }

    // moov is located after mdat — needs optimization!
    // 1. Read moov into an ArrayBuffer
    const moovBlob = file.slice(moovAtom.pos, moovAtom.pos + moovAtom.size)
    const moovBuffer = await moovBlob.arrayBuffer()

    // 2. Patch stco and co64 offsets inside moov
    patchChunkOffsets(moovBuffer, moovAtom.size)

    // 3. Assemble the optimized parts:
    //    [all atoms before mdat, like ftyp / wide]
    //    [patched moov]
    //    [mdat and any atoms between mdat and moov]
    //    [any atoms after moov]
    const prefix = file.slice(0, mdatAtom.pos)
    const mdatAndIntervening = file.slice(mdatAtom.pos, moovAtom.pos)
    const suffix = file.slice(moovAtom.pos + moovAtom.size)

    const optimizedFile = new File(
      [prefix, moovBuffer, mdatAndIntervening, suffix],
      file.name,
      {
        type: file.type || 'video/mp4',
        lastModified: file.lastModified,
      }
    )

    return {
      file: optimizedFile,
      wasOptimized: true,
      originalMoovPos: moovAtom.pos,
      mdatPos: mdatAtom.pos,
      moovSize: moovAtom.size,
    }
  } catch (err) {
    console.warn('Faststart optimization could not be applied, uploading original file:', err)
    return { file, wasOptimized: false }
  }
}

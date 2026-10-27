// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { optimizeForStreaming } from '../utils/faststart'

describe('FastStart video optimization', () => {
  it('returns non-mp4 files unchanged', async () => {
    const file = new File(['image data'], 'photo.jpg', { type: 'image/jpeg' })
    const result = await optimizeForStreaming(file)
    expect(result.wasOptimized).toBe(false)
    expect(result.file).toBe(file)
  })

  it('detects when moov is already before mdat and does not alter file', async () => {
    // Construct synthetic MP4:
    // ftyp (16 bytes) + moov (24 bytes with dummy stco) + mdat (32 bytes)
    const ftyp = new Uint8Array([0, 0, 0, 16, 0x66, 0x74, 0x79, 0x70, 0, 0, 0, 0, 0, 0, 0, 0])
    const moov = new Uint8Array([0, 0, 0, 16, 0x6d, 0x6f, 0x6f, 0x76, 0, 0, 0, 0, 0, 0, 0, 0])
    const mdat = new Uint8Array([0, 0, 0, 16, 0x6d, 0x64, 0x61, 0x74, 0, 0, 0, 0, 0, 0, 0, 0])
    const file = new File([ftyp, moov, mdat], 'test_already_fast.mp4', { type: 'video/mp4' })

    const result = await optimizeForStreaming(file)
    expect(result.wasOptimized).toBe(false)
    expect(result.originalMoovPos).toBe(16)
    expect(result.mdatPos).toBe(32)
  })

  it('re-orders moov before mdat when moov is at the end and patches stco', async () => {
    // Construct synthetic MP4 with moov after mdat:
    // 1. ftyp atom: 16 bytes
    const ftyp = new Uint8Array([0, 0, 0, 16, 0x66, 0x74, 0x79, 0x70, 0, 0, 0, 0, 0, 0, 0, 0])

    // 2. mdat atom: 24 bytes
    const mdat = new Uint8Array([0, 0, 0, 24, 0x6d, 0x64, 0x61, 0x74, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])

    // 3. moov atom with an stco atom inside:
    // moov size = 8 (moov header) + 24 (stco atom: 8 header + 4 ver/flags + 4 count + 8 data for 2 offsets) = 32 bytes
    const moovHeader = [0, 0, 0, 32, 0x6d, 0x6f, 0x6f, 0x76]
    // stco atom: size 24, 'stco', version=0, flags=0, count=2, offsets=[100, 200]
    const stcoAtom = [
      0, 0, 0, 24, // size = 24
      0x73, 0x74, 0x63, 0x6f, // 'stco'
      0, 0, 0, 0, // version 0, flags 0
      0, 0, 0, 2, // entry count = 2
      0, 0, 0, 100, // offset 1 = 100
      0, 0, 0, 200, // offset 2 = 200
    ]
    const moov = new Uint8Array([...moovHeader, ...stcoAtom])

    // File structure before: [ftyp (16)] + [mdat (24)] + [moov (32)]
    const originalFile = new File([ftyp, mdat, moov], 'unoptimized.mp4', { type: 'video/mp4' })

    const result = await optimizeForStreaming(originalFile)
    expect(result.wasOptimized).toBe(true)
    expect(result.moovSize).toBe(32)
    expect(result.originalMoovPos).toBe(40) // 16 + 24 = 40
    expect(result.mdatPos).toBe(16)

    // Verify optimized file content
    const buf = await result.file.arrayBuffer()
    const view = new DataView(buf)

    // After optimization: [ftyp (16)] + [moov (32)] + [mdat (24)]
    // Byte 0-15: ftyp
    expect(String.fromCharCode(view.getUint8(4), view.getUint8(5), view.getUint8(6), view.getUint8(7))).toBe('ftyp')

    // Byte 16-47: moov
    expect(view.getUint32(16, false)).toBe(32) // moov size
    expect(String.fromCharCode(view.getUint8(20), view.getUint8(21), view.getUint8(22), view.getUint8(23))).toBe('moov')

    // Check patched stco inside moov:
    // stco starts at byte 24: size 24, 'stco', entry count 2
    // offset 1: was 100 -> should now be 100 + 32 (moov size) = 132
    // offset 2: was 200 -> should now be 200 + 32 (moov size) = 232
    const stcoOffset1 = view.getUint32(24 + 16, false)
    const stcoOffset2 = view.getUint32(24 + 20, false)
    expect(stcoOffset1).toBe(132)
    expect(stcoOffset2).toBe(232)

    // Byte 48+: mdat
    expect(view.getUint32(48, false)).toBe(24) // mdat size
    expect(String.fromCharCode(view.getUint8(52), view.getUint8(53), view.getUint8(54), view.getUint8(55))).toBe('mdat')
  })
})

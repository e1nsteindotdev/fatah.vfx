import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  AlertCircle,
} from 'lucide-react'
import type { VideoItem } from './VideoCard'

interface VideoPlayerModalProps {
  video: VideoItem | null
  onClose: () => void
}

export function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrubberRef = useRef<HTMLDivElement>(null)

  // Playback & Stream States
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [progress, setProgress] = useState(0)
  const [bufferedProgress, setBufferedProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState('00:00')
  const [totalDuration, setTotalDuration] = useState(video?.duration || '00:00')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Loading & Buffering States
  const [isLoading, setIsLoading] = useState(true)
  const [isBuffering, setIsBuffering] = useState(false)
  const [isSeeking, setIsSeeking] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Scrubber Hover Preview Tooltip
  const [hoverTime, setHoverTime] = useState<string | null>(null)
  const [hoverPosition, setHoverPosition] = useState<number>(0)
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Update buffer bar progress (calculates how much stream is loaded ahead)
  const updateBufferedProgress = useCallback(() => {
    const el = videoRef.current
    if (!el || !el.duration || isNaN(el.duration)) return

    const duration = el.duration
    const current = el.currentTime
    const buffered = el.buffered

    if (buffered && buffered.length > 0) {
      // Find the buffered range containing currentTime
      for (let i = 0; i < buffered.length; i++) {
        if (buffered.start(i) <= current && current <= buffered.end(i)) {
          const pct = (buffered.end(i) / duration) * 100
          setBufferedProgress(Math.min(100, Math.max(0, pct)))
          return
        }
      }
      // Or fallback to the furthest loaded range
      const lastEnd = buffered.end(buffered.length - 1)
      const pct = (lastEnd / duration) * 100
      setBufferedProgress(Math.min(100, Math.max(0, pct)))
    }
  }, [])

  // Reset states whenever video changes
  useEffect(() => {
    if (!video) return
    setIsLoading(true)
    setIsBuffering(false)
    setIsSeeking(false)
    setHasError(false)
    setErrorMessage('')
    setProgress(0)
    setBufferedProgress(0)
    setCurrentTime('00:00')
    setTotalDuration(video.duration || '00:00')

    // Try autoplay once video element is mounted
    const el = videoRef.current
    if (el) {
      el.currentTime = 0
      const playPromise = el.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
          })
          .catch(() => {
            // Autoplay with sound might be blocked by browser policy
            setIsPlaying(false)
          })
      }
    }
  }, [video])

  // Keyboard Navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      const el = videoRef.current

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault()
          togglePlay()
          break
        case 'm':
        case 'M':
          e.preventDefault()
          toggleMute()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullScreen()
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (el) {
            el.currentTime = Math.max(0, el.currentTime - 5)
            updateTimeState()
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (el) {
            el.currentTime = Math.min(el.duration || 0, el.currentTime + 5)
            updateTimeState()
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          if (el) {
            const newVol = Math.min(1, el.volume + 0.1)
            el.volume = newVol
            setVolume(newVol)
            if (newVol > 0 && isMuted) {
              el.muted = false
              setIsMuted(false)
            }
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          if (el) {
            const newVol = Math.max(0, el.volume - 0.1)
            el.volume = newVol
            setVolume(newVol)
            if (newVol === 0 && !isMuted) {
              el.muted = true
              setIsMuted(true)
            }
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, isMuted])

  // Fullscreen listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  if (!video) return null

  const togglePlay = () => {
    const el = videoRef.current
    if (!el) return

    if (el.paused || el.ended) {
      el.play().catch(() => {})
      setIsPlaying(true)
    } else {
      el.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    const el = videoRef.current
    if (!el) return
    el.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value)
    const el = videoRef.current
    if (el) {
      el.volume = newVol
      setVolume(newVol)
      if (newVol === 0) {
        el.muted = true
        setIsMuted(true)
      } else if (isMuted) {
        el.muted = false
        setIsMuted(false)
      }
    }
  }

  const updateTimeState = () => {
    const el = videoRef.current
    if (!el) return
    const current = el.currentTime
    const duration = el.duration || 1
    setProgress((current / duration) * 100)
    setCurrentTime(formatTime(current))
    updateBufferedProgress()
  }

  const handleTimeUpdate = () => {
    updateTimeState()
  }

  const handleLoadedMetadata = () => {
    const el = videoRef.current
    if (el) {
      const duration = el.duration
      if (duration && !isNaN(duration)) {
        setTotalDuration(formatTime(duration))
      }
    }
    setIsLoading(false)
    updateBufferedProgress()
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const scrubber = scrubberRef.current
    const el = videoRef.current
    if (!scrubber || !el) return

    const rect = scrubber.getBoundingClientRect()
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newTime = pos * (el.duration || 1)
    el.currentTime = newTime
    setProgress(pos * 100)
    setCurrentTime(formatTime(newTime))
  }

  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const scrubber = scrubberRef.current
    const el = videoRef.current
    if (!scrubber || !el || !el.duration) return

    const rect = scrubber.getBoundingClientRect()
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setHoverPosition(pos * 100)
    setHoverTime(formatTime(pos * el.duration))
  }

  const handleScrubberMouseLeave = () => {
    setHoverTime(null)
  }

  const toggleFullScreen = () => {
    const container = containerRef.current
    if (!container) return

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      container.requestFullscreen?.().catch(() => {})
    }
  }

  const retryPlayback = () => {
    setHasError(false)
    setIsLoading(true)
    const el = videoRef.current
    if (el) {
      el.load()
      el.play().catch(() => {})
    }
  }

  // Auto-hide controls during active playback
  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 2800)
    }
  }

  const isVertical =
    video.aspectRatio === '9:16' || video.resolution?.toLowerCase().includes('vertical')

  const showSpinner = (isLoading || isBuffering || isSeeking) && !hasError

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-1.5 sm:p-4 select-none animate-in fade-in duration-200"
    >
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div
        className={`relative z-10 w-full bg-neutral-950 border border-neutral-800 rounded-md overflow-hidden shadow-2xl flex flex-col ${
          isVertical
            ? 'h-fit max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)]'
            : 'max-w-5xl max-h-[calc(100dvh-2rem)]'
        }`}
        style={{
          maxWidth: isVertical
            ? 'min(calc(100vw - 1rem), calc((100dvh - 4rem) * 9 / 16))'
            : 'min(calc(100vw - 2rem), calc((100dvh - 4rem) * 16 / 9), 68rem)',
        }}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 border-b border-neutral-800 bg-neutral-900/90 text-white shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f5d020] animate-pulse shrink-0 shadow-[0_0_8px_rgba(245,208,32,0.6)]" />
            <span className="font-display uppercase text-xs sm:text-sm tracking-widest text-neutral-200 truncate font-semibold">
              {video.category} • {video.clientOrArtist || video.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
              aria-label="Close"
              title="Close (Esc)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Box */}
        <div
          onClick={togglePlay}
          className={`relative w-full bg-black flex items-center justify-center overflow-hidden group shrink min-h-0 cursor-pointer ${
            isVertical ? 'aspect-[9/16]' : 'aspect-video'
          }`}
        >
          {/* Real HTML5 Video element with FastStart progressive streaming */}
          <video
            ref={videoRef}
            src={video.videoSrc}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="auto"
            crossOrigin="anonymous"
            onTimeUpdate={handleTimeUpdate}
            onProgress={updateBufferedProgress}
            onLoadedMetadata={handleLoadedMetadata}
            onLoadStart={() => setIsLoading(true)}
            onLoadedData={() => {
              setIsLoading(false)
              updateBufferedProgress()
            }}
            onCanPlay={() => {
              setIsLoading(false)
              setIsBuffering(false)
            }}
            onCanPlayThrough={() => {
              setIsLoading(false)
              setIsBuffering(false)
            }}
            onWaiting={() => setIsBuffering(true)}
            onStalled={() => setIsBuffering(true)}
            onPlaying={() => {
              setIsLoading(false)
              setIsBuffering(false)
              setIsPlaying(true)
            }}
            onPause={() => setIsPlaying(false)}
            onSeeking={() => setIsSeeking(true)}
            onSeeked={() => {
              setIsSeeking(false)
              setIsBuffering(false)
            }}
            onError={() => {
              setIsLoading(false)
              setIsBuffering(false)
              setHasError(true)
              setErrorMessage('Video could not be loaded.')
            }}
            className="w-full h-full object-contain bg-black"
          />

          {/* Letterbox Bars if 2.39:1 */}
          {video.aspectRatio === '2.39:1' && (
            <>
              <div className="absolute top-0 inset-x-0 h-[8%] bg-black pointer-events-none z-10" />
              <div className="absolute bottom-0 inset-x-0 h-[8%] bg-black pointer-events-none z-10" />
            </>
          )}

          {/* Film Viewfinder HUD */}
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 font-mono text-[10px] sm:text-[11px] text-[#f5d020]/90 tracking-wider flex items-center gap-2 pointer-events-none bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs border border-white/10">
            <span>TC {video.timecode}</span>
            <span>|</span>
            <span>{video.aspectRatio}</span>
            <span>|</span>
            <span>{video.resolution}</span>
          </div>

          {/* Center Buffering & Loading Spinner */}
          {showSpinner && (
            <div
              data-testid="video-player-spinner"
              className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none bg-black/35 backdrop-blur-[2px] transition-opacity duration-200"
            >
              <div className="relative flex items-center justify-center">
                {/* Outer spinning ring */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-white/15 border-t-[#f5d020] animate-spin" />
                {/* Inner glowing core */}
                <div className="absolute w-8 h-8 rounded-full bg-[#f5d020]/10 blur-xs" />
              </div>
              <span className="mt-3 text-xs font-mono text-neutral-300 font-medium tracking-wider bg-black/60 px-2.5 py-1 rounded border border-neutral-700/60 shadow-lg">
                Loading...
              </span>
            </div>
          )}

          {/* Center Play/Pause Indicator (momentary overlay when paused) */}
          {!isPlaying && !showSpinner && !hasError && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/60 border border-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-2xl transition-transform duration-300 hover:scale-105">
                <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-current ml-1 text-[#f5d020]" />
              </div>
            </div>
          )}

          {/* Error Fallback Banner */}
          {hasError && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
              <p className="text-white font-medium text-sm sm:text-base mb-1">
                Playback Error
              </p>
              <p className="text-neutral-400 text-xs sm:text-sm max-w-md mb-4">
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  retryPlayback()
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs font-mono cursor-pointer transition-colors border border-neutral-700"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#f5d020]" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Video Controls Bar (YouTube-style with Dual Buffered & Progress Scrubber) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`absolute bottom-0 inset-x-0 z-30 p-2.5 sm:p-4 bg-gradient-to-t from-black via-black/85 to-transparent flex flex-col gap-1.5 sm:gap-2 transition-opacity duration-300 ${
              showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Scrubber Bar Container */}
            <div
              ref={scrubberRef}
              onClick={handleSeek}
              onMouseMove={handleScrubberMouseMove}
              onMouseLeave={handleScrubberMouseLeave}
              className="relative w-full h-5 flex items-center cursor-pointer group/scrubber"
            >
              {/* Background Inactive Track */}
              <div className="relative w-full h-1 sm:h-1.5 bg-neutral-800 group-hover/scrubber:h-2 rounded-full overflow-hidden transition-all duration-150">
                {/* YouTube-style Buffered Stream Bar */}
                <div
                  className="absolute inset-y-0 left-0 bg-white/25 rounded-full transition-all duration-150"
                  style={{ width: `${bufferedProgress}%` }}
                />

                {/* Played Progress Bar */}
                <div
                  className="absolute inset-y-0 left-0 bg-[#f5d020] rounded-full transition-all duration-75 shadow-[0_0_10px_rgba(245,208,32,0.8)]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Scrubber Playhead Handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#f5d020] border-2 border-white shadow-md transition-transform scale-0 group-hover/scrubber:scale-100 pointer-events-none"
                style={{ left: `calc(${progress}% - 7px)` }}
              />

              {/* Hover Time Tooltip (YouTube style) */}
              {hoverTime && (
                <div
                  className="absolute -top-7 transform -translate-x-1/2 bg-black/90 text-white font-mono text-[10px] px-1.5 py-0.5 rounded border border-neutral-700 pointer-events-none shadow-md"
                  style={{ left: `${hoverPosition}%` }}
                >
                  {hoverTime}
                </div>
              )}
            </div>

            {/* Button Controls Row */}
            <div className="flex items-center justify-between text-white pt-0.5">
              <div className="flex items-center gap-1.5 sm:gap-3">
                {/* Play / Pause Toggle */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1 sm:p-1.5 rounded hover:bg-white/10 text-white cursor-pointer transition-colors"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  title={isPlaying ? 'Pause (Space / K)' : 'Play (Space / K)'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-[#f5d020]" />
                  )}
                </button>

                {/* Volume & Mute */}
                <div className="flex items-center group/volume gap-1.5">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-1 sm:p-1.5 rounded hover:bg-white/10 text-white cursor-pointer transition-colors"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                    title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-14 sm:w-20 h-1 accent-[#f5d020] bg-neutral-700 rounded-lg cursor-pointer hidden group-hover/volume:inline-block transition-all"
                    aria-label="Volume Slider"
                  />
                </div>

                {/* Time Display */}
                <div className="text-[11px] sm:text-xs font-mono text-neutral-300 ml-1">
                  <span className="text-white font-medium">{currentTime}</span> /{' '}
                  <span className="text-neutral-400">{totalDuration}</span>
                </div>
              </div>

              {/* Right Side Info & Fullscreen */}
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase bg-neutral-800/80 px-2 py-0.5 rounded text-neutral-300 border border-neutral-700/60">
                  {video.resolution}
                </span>

                <button
                  type="button"
                  onClick={toggleFullScreen}
                  className="p-1 sm:p-1.5 rounded hover:bg-white/10 text-white cursor-pointer transition-colors"
                  aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

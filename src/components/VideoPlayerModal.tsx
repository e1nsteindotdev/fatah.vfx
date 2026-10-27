import React, { useEffect, useRef, useState } from 'react'
import { X, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'
import type { VideoItem } from './VideoCard'

interface VideoPlayerModalProps {
  video: VideoItem | null
  onClose: () => void
}

export function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState('00:00')
  const [totalDuration, setTotalDuration] = useState(video?.duration || '00:00')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!video) return null

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime
      const duration = videoRef.current.duration || 1
      setProgress((current / duration) * 100)

      const mins = Math.floor(current / 60)
      const secs = Math.floor(current % 60)
      setCurrentTime(`${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration
      if (duration && !isNaN(duration)) {
        const mins = Math.floor(duration / 60)
        const secs = Math.floor(duration % 60)
        setTotalDuration(`${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`)
      }
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    if (videoRef.current) {
      videoRef.current.currentTime = pos * (videoRef.current.duration || 1)
      setProgress(pos * 100)
    }
  }

  const toggleFullScreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen?.()
      }
    }
  }

  const isVertical = video.aspectRatio === '9:16'

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-8 animate-in fade-in duration-200">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div
        className={`relative z-10 w-full bg-neutral-950 border border-neutral-800 rounded-sm overflow-hidden shadow-2xl flex flex-col ${
          isVertical ? 'max-w-sm sm:max-w-md max-h-[94vh]' : 'max-w-5xl'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/90 text-white">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-display uppercase text-sm tracking-widest text-neutral-300">
              {video.category} • {video.clientOrArtist}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Box */}
        <div
          className={`relative w-full bg-black flex items-center justify-center overflow-hidden group ${
            isVertical ? 'aspect-[9/16] max-h-[66vh]' : 'aspect-video'
          }`}
        >
          <video
            ref={videoRef}
            src={video.videoSrc}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            className="w-full h-full object-contain bg-black"
          />

          {/* Letterbox Bars if 2.39:1 */}
          {video.aspectRatio === '2.39:1' && (
            <>
              <div className="absolute top-0 inset-x-0 h-[8%] bg-black pointer-events-none z-10" />
              <div className="absolute bottom-0 inset-x-0 h-[8%] bg-black pointer-events-none z-10" />
            </>
          )}

          {/* Fallback overlay if video cannot play */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/20" />

          {/* Film Viewfinder HUD */}
          <div className="absolute top-4 left-4 z-20 font-mono text-[11px] text-amber-400/90 tracking-wider flex items-center gap-2">
            <span>TC {video.timecode}</span>
            <span>|</span>
            <span>{video.aspectRatio}</span>
            <span>|</span>
            <span>{video.resolution}</span>
          </div>

          {/* Video Controls Bar */}
          <div className="absolute bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col gap-2">
            {/* Scrubber Bar */}
            <div
              onClick={handleSeek}
              className="w-full h-1.5 bg-neutral-700/80 rounded-full cursor-pointer overflow-hidden group/bar relative"
            >
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Button Controls */}
            <div className="flex items-center justify-between text-white pt-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="p-1.5 rounded hover:bg-white/10 text-white cursor-pointer transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded hover:bg-white/10 text-white cursor-pointer transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <div className="text-xs font-mono text-neutral-300">
                  <span>{currentTime}</span> / <span>{totalDuration}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono uppercase bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">
                  {video.resolution}
                </span>
                <button
                  onClick={toggleFullScreen}
                  className="p-1.5 rounded hover:bg-white/10 text-white cursor-pointer transition-colors"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Info Footer */}
        <div className="p-5 bg-neutral-950 border-t border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-display font-medium text-white uppercase tracking-wider">
              {video.title}
            </h2>
            <p className="text-xs md:text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              {video.description}
            </p>
          </div>
          <div className="flex flex-col md:items-end shrink-0 gap-1 text-xs font-mono text-neutral-400">
            <span className="text-amber-400 font-sans font-semibold uppercase">{video.role}</span>
            <span>Production Year: {video.year}</span>
            <span className="text-[11px] text-neutral-500">Filmed & Directed by Fatah Chafaa</span>
          </div>
        </div>
      </div>
    </div>
  )
}

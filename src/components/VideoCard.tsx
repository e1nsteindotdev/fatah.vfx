import React from 'react'
import { Play, Clock, Film } from 'lucide-react'

export interface VideoItem {
  id: string
  title: string
  category: 'Commercial' | 'Music Video' | 'Narrative' | 'Documentary' | 'Fashion'
  clientOrArtist: string
  year: string
  duration: string
  role: string
  aspectRatio: string
  resolution: string
  videoSrc: string
  description: string
  gradient: string
  timecode: string
}

interface VideoCardProps {
  video: VideoItem
  isActive?: boolean
  onPlay: (video: VideoItem) => void
}

export function VideoCard({ video, isActive = false, onPlay }: VideoCardProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const isVertical = video.aspectRatio === '9:16'
  const isSquare = video.aspectRatio === '1:1'
  const videoSrcWithTimestamp = video.videoSrc
    ? video.videoSrc.includes('#')
      ? video.videoSrc
      : `${video.videoSrc}#t=0.001`
    : undefined

  React.useEffect(() => {
    if (isActive) {
      videoRef.current?.play()?.catch(() => {})
    } else {
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.currentTime = 0.001
      }
    }
  }, [isActive])

  const handleMouseEnter = () => {
    videoRef.current?.play()?.catch(() => {})
  }

  const handleMouseLeave = () => {
    if (!isActive && videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0.001
    }
  }

  return (
    <div
      onClick={() => onPlay(video)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex flex-col justify-between w-full h-full bg-neutral-950 border border-neutral-800 hover:border-[#f5d020] transition-all duration-300 rounded-sm overflow-hidden cursor-pointer shadow-2xl select-none"
    >
      {/* Maximized Video Background & Display Frame */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-neutral-950">
        {/* Ambient Blurred Video Background for depth */}
        <video
          src={videoSrcWithTimestamp}
          preload="metadata"
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-110 pointer-events-none"
        />

        {/* Ambient Color Glow */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${video.gradient} opacity-25 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none`}
        />

        {/* Real Video Element */}
        {isVertical ? (
          <video
            ref={videoRef}
            src={videoSrcWithTimestamp}
            preload="metadata"
            muted
            loop
            playsInline
            className="relative z-10 w-full h-full object-cover mx-auto shadow-2xl transition-transform duration-700 group-hover:scale-105"
          />
        ) : isSquare ? (
          <video
            ref={videoRef}
            src={videoSrcWithTimestamp}
            preload="metadata"
            muted
            loop
            playsInline
            className="relative z-10 w-full max-h-full object-contain mx-auto my-auto shadow-2xl transition-transform duration-700 group-hover:scale-101"
          />
        ) : (
          <video
            ref={videoRef}
            src={videoSrcWithTimestamp}
            preload="metadata"
            muted
            loop
            playsInline
            className="relative z-10 w-full h-auto max-h-full object-contain my-auto shadow-2xl transition-transform duration-700 group-hover:scale-101"
          />
        )}

        {/* Cinematic Film Letterbox Bars (Simulated 2.39:1 anamorphic) */}
        {video.aspectRatio === '2.39:1' && (
          <>
            <div className="absolute top-0 inset-x-0 h-[8%] bg-black z-20 pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-[8%] bg-black z-20 pointer-events-none" />
          </>
        )}

        {/* Subtle Vignette Gradient */}
        <div className="absolute inset-0 bg-radial from-transparent via-black/10 to-black/60 pointer-events-none z-10" />
      </div>

      {/* Top Overlay Bar */}
      <div className={`relative z-20 ${isVertical ? 'p-3 sm:p-4' : 'p-4 sm:p-6'} flex items-start justify-between bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none gap-2`}>
        {/* Category Pill & Client */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="bg-black/80 px-2.5 py-1 rounded text-xs font-sans font-bold uppercase tracking-wider text-[#f5d020] border border-[#f5d020]/30 backdrop-blur-md shadow-sm shrink-0">
            {video.category}
          </span>
          {!isVertical && (
            <span className="hidden sm:inline-block font-mono text-neutral-300 text-xs tracking-wider bg-black/60 px-2.5 py-1 rounded border border-neutral-800 backdrop-blur-md truncate">
              {video.clientOrArtist}
            </span>
          )}
        </div>

        {/* Badges: Aspect Ratio & Duration */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="bg-black/70 px-2 py-1 rounded text-xs font-mono font-bold text-neutral-300 backdrop-blur-md border border-neutral-700/60">
            {video.aspectRatio}
          </span>
          <div className="flex items-center gap-1 bg-black/70 px-2 py-1 rounded text-xs font-mono text-neutral-300 backdrop-blur-md border border-neutral-700/60">
            <Clock className="w-3.5 h-3.5 text-[#f5d020]" />
            <span>{video.duration}</span>
          </div>
        </div>
      </div>

      {/* Center Play Button Interaction */}
      <div className="relative z-20 flex items-center justify-center my-auto pointer-events-none">
        <div className={`${isVertical ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-18 h-18 sm:w-22 sm:h-22'} rounded-full bg-black/60 border border-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-2xl group-hover:bg-[#f5d020] group-hover:border-[#f5d020] group-hover:scale-110 group-hover:text-black transition-all duration-300`}>
          <Play className={`${isVertical ? 'w-6 h-6' : 'w-8 h-8 sm:w-9 sm:h-9'} fill-current ml-1`} />
        </div>
      </div>

      {/* Bottom Information Overlay */}
      <div className={`relative z-20 ${isVertical ? 'p-3.5 sm:p-5 pt-10' : 'p-4 sm:p-8 pt-16'} flex flex-col justify-end bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none`}>
        <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
          <span className="font-mono text-[#f5d020] tracking-wider font-semibold drop-shadow-sm truncate mr-2">
            {video.clientOrArtist}
          </span>
          <span className="font-mono text-neutral-400 drop-shadow-sm shrink-0">
            {video.year}
          </span>
        </div>

        <h3 className={`font-display font-medium ${isVertical ? 'text-lg sm:text-xl md:text-2xl line-clamp-2' : 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl'} text-white uppercase tracking-wide group-hover:text-[#f5d020] transition-colors drop-shadow-md`}>
          {video.title}
        </h3>

        <p className={`text-xs ${isVertical ? 'line-clamp-2 mt-1' : 'sm:text-sm md:text-base mt-2 max-w-3xl leading-relaxed'} text-neutral-300 drop-shadow-sm`}>
          {video.description}
        </p>

        <div className={`mt-3 pt-2.5 border-t border-neutral-700/60 flex items-center justify-between gap-2 text-xs font-mono text-neutral-300`}>
          <span className="flex items-center gap-1.5 text-neutral-300 truncate">
            <Film className="w-3.5 h-3.5 text-[#f5d020] shrink-0" />
            <span className="truncate">{video.role}</span>
          </span>
          <span className="text-[#f5d020] uppercase font-bold text-xs tracking-wider group-hover:underline shrink-0">
            {isVertical ? 'Watch →' : 'Click To Watch Full Video →'}
          </span>
        </div>
      </div>
    </div>
  )
}

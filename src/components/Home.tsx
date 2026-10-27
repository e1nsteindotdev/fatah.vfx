import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { VideoCard, type VideoItem } from './VideoCard'
import { VideoPlayerModal } from './VideoPlayerModal'
import { DEFAULT_PROFILE, type ProfileData } from './EditProfileModal'
import { Video, Mail, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

export function Home() {
  let convexVideos: VideoItem[] | undefined
  try {
    convexVideos = useQuery(api.videos.list) as VideoItem[] | undefined
  } catch {
    convexVideos = undefined
  }

  const isLoading = convexVideos === undefined
  const videos: VideoItem[] = convexVideos ?? []

  let convexProfile: any
  try {
    convexProfile = useQuery(api.profile.get)
  } catch {
    convexProfile = undefined
  }
  const profile: ProfileData =
    convexProfile && !Array.isArray(convexProfile) && convexProfile.name
      ? convexProfile
      : DEFAULT_PROFILE

  const [activeModalVideo, setActiveModalVideo] = useState<VideoItem | null>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const scrollToIndex = useCallback((index: number) => {
    if (rowRef.current && rowRef.current.children[index]) {
      const targetElement = rowRef.current.children[index] as HTMLElement
      const container = rowRef.current
      container.scrollTo({
        left: targetElement.offsetLeft,
        behavior: 'smooth'
      })
      setCurrentIndex(index)
    }
  }, [])

  const updateScrollState = useCallback(() => {
    if (!rowRef.current) return
    const container = rowRef.current
    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 20)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20)

    const children = Array.from(container.children) as HTMLElement[]
    let closestIndex = 0
    let minDistance = Infinity
    children.forEach((child, idx) => {
      const childStart = child.offsetLeft
      const distance = Math.abs(childStart - scrollLeft)
      if (distance < minDistance) {
        minDistance = distance
        closestIndex = idx
      }
    })
    setCurrentIndex(closestIndex)
  }, [])

  const scrollRow = (direction: 'left' | 'right') => {
    if (!rowRef.current) return
    const container = rowRef.current
    const children = Array.from(container.children) as HTMLElement[]
    const currentScroll = container.scrollLeft

    if (direction === 'right') {
      const nextChildIndex = children.findIndex((child) => child.offsetLeft > currentScroll + 30)
      if (nextChildIndex !== -1) {
        scrollToIndex(nextChildIndex)
      } else {
        container.scrollBy({ left: container.clientWidth * 0.75, behavior: 'smooth' })
      }
    } else {
      let prevChildIndex = -1
      for (let i = children.length - 1; i >= 0; i--) {
        if (children[i].offsetLeft < currentScroll - 30) {
          prevChildIndex = i
          break
        }
      }
      if (prevChildIndex !== -1) {
        scrollToIndex(prevChildIndex)
      } else {
        scrollToIndex(0)
      }
    }
  }

  const handleScroll = () => {
    updateScrollState()
  }

  useEffect(() => {
    updateScrollState()
    const handleResize = () => {
      updateScrollState()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateScrollState])

  const scrollToWorks = () => {
    const el = document.getElementById('works-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col noise-overlay bg-[url('/images/bg-texture.png')] bg-repeat overflow-x-hidden text-slate-900">
      {/* UPPER HERO SECTION */}
      <section className="relative w-full min-h-[650px] md:h-[650px] bg-black overflow-hidden select-none border-b border-neutral-800 flex flex-col justify-between">
        {/* Hero Background Image */}
        <img
          src="/hero.jpg"
          alt="Fatah Chafaa"
          className="absolute inset-0 w-full h-full object-cover object-[60%_15%] md:object-[55%_10%] scale-110 sm:scale-115 translate-x-8 sm:translate-x-16 md:translate-x-24 -translate-y-6 sm:-translate-y-10 pointer-events-none select-none z-0"
        />

        {/* Cinematic Darkness & Contrast Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-10 pointer-events-none" />

        {/* Top Navigation Bar inside Hero */}
        <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-display font-black text-xl sm:text-2xl uppercase tracking-wider text-white">
              {profile.name}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-black/60 text-[#f5d020] uppercase border border-[#f5d020]/30 backdrop-blur-xs">
              {profile.handle || 'fatah.vfx'}
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-8">
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-[#f5d020] hover:bg-yellow-400 text-black font-sans font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact</span>
            </a>
          </div>
        </header>

        {/* Hero Content Overlay */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center pb-8 sm:pb-12 md:pb-16 pt-2">
          <div className="max-w-2xl">
            <span className="block font-sans font-bold text-lg sm:text-xl md:text-2xl text-[#f5d020] tracking-wide mb-1 drop-shadow-sm">
              Hi I’m
            </span>

            <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl uppercase tracking-tight text-white leading-none drop-shadow-lg whitespace-nowrap">
              {profile.name}
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-neutral-300 font-sans font-normal leading-relaxed mt-2.5 sm:mt-3.5 max-w-xl drop-shadow">
              {profile.description}
            </p>

            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl uppercase tracking-tight text-[#f5d020] leading-none mt-4 sm:mt-5 drop-shadow-lg whitespace-nowrap">
              {profile.title}
            </h2>

            <div className="flex flex-wrap items-center gap-3 mt-5 sm:mt-6">
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#f5d020] hover:bg-yellow-400 text-black font-sans font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg cursor-pointer"
              >
                <Mail className="w-4 h-4 text-black" />
                <span>Contact Me</span>
              </a>

              <button
                onClick={scrollToWorks}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm border border-white/30 hover:border-white bg-black/40 hover:bg-black/60 text-white font-sans font-semibold text-xs uppercase tracking-wider backdrop-blur-sm transition-all duration-200 cursor-pointer group"
              >
                <span>See Work</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#f5d020] group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col gap-10 md:gap-14">
        {/* Subtle Watermark Background Text */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0 opacity-10">
          <span className="font-faith text-[9vw] sm:text-[8vw] md:text-[7vw] leading-none capitalize text-black whitespace-nowrap tracking-normal">
            Fatah Chafaa
          </span>
        </div>

        {/* SELECTED WORKS SECTION */}
        <section id="works-section" className="relative z-10 w-full flex flex-col gap-6 scroll-mt-8">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300/60 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <Video className="w-5 h-5 text-amber-600" />
                <h2 className="font-display font-medium text-2xl md:text-3xl uppercase tracking-tight text-slate-950">
                  Selected Works
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-black text-amber-400">
                  {isLoading ? '...' : videos.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Films, commercials, music videos, and cinematic works directed by Fatah Chafaa.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Header Navigation Arrows & Counter */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-700 mr-1 select-none">
                  {isLoading ? (
                    <span className="text-slate-400">-- / --</span>
                  ) : videos.length === 0 ? (
                    <span className="text-slate-400">00 / 00</span>
                  ) : (
                    <>
                      <span className="text-amber-600">{String(currentIndex + 1).padStart(2, '0')}</span>
                      <span className="text-slate-400"> / {String(videos.length).padStart(2, '0')}</span>
                    </>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => scrollRow('left')}
                  disabled={!canScrollLeft || isLoading || videos.length <= 1}
                  className={`p-2 rounded-sm border transition-all ${
                    canScrollLeft && !isLoading && videos.length > 1
                      ? 'bg-white hover:bg-black text-slate-700 hover:text-[#f5d020] border-slate-300 cursor-pointer shadow-xs'
                      : 'bg-white/40 text-slate-300 border-slate-200 cursor-not-allowed opacity-50'
                  }`}
                  aria-label="Previous video"
                  title="Previous video"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRow('right')}
                  disabled={!canScrollRight || isLoading || videos.length <= 1}
                  className={`p-2 rounded-sm border transition-all ${
                    canScrollRight && !isLoading && videos.length > 1
                      ? 'bg-white hover:bg-black text-slate-700 hover:text-[#f5d020] border-slate-300 cursor-pointer shadow-xs'
                      : 'bg-white/40 text-slate-300 border-slate-200 cursor-not-allowed opacity-50'
                  }`}
                  aria-label="Next video"
                  title="Next video"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Video Showcase Carousel or Loading / Empty State */}
          {isLoading ? (
            <div
              data-testid="convex-loading-spinner"
              className="w-full h-[400px] sm:h-[480px] md:h-[540px] rounded-sm bg-neutral-950/5 border border-dashed border-neutral-300 flex flex-col items-center justify-center gap-3 text-center px-4"
            >
              <span className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-slate-800">
                Loading...
              </span>
            </div>
          ) : videos.length === 0 ? (
            <div className="w-full h-[320px] sm:h-[380px] rounded-sm bg-neutral-950/5 border border-dashed border-neutral-300 flex flex-col items-center justify-center gap-3 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="font-display font-medium text-lg uppercase text-slate-800">
                No videos published yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Videos added in the dashboard will appear here in the portfolio showcase.
              </p>
              <a
                href="/dashboard"
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-black hover:bg-neutral-800 text-[#f5d020] text-xs font-mono font-bold uppercase tracking-wider transition-colors"
              >
                Go to Dashboard
              </a>
            </div>
          ) : (
            <div className="relative group/carousel w-full">
              <div
                ref={rowRef}
                onScroll={handleScroll}
                className="relative flex flex-nowrap overflow-x-auto w-full h-[520px] sm:h-[600px] md:h-[680px] lg:h-[720px] snap-x snap-mandatory scroll-smooth rounded-sm overflow-y-hidden hide-scrollbar gap-4 sm:gap-6 py-0.5"
              >
                {videos.map((video, idx) => {
                  const isVertical = video.aspectRatio === '9:16'
                  const isSquare = video.aspectRatio === '1:1'

                  return (
                    <div
                      key={video.id}
                      className={`h-full shrink-0 snap-start transition-all duration-300 ${
                        isVertical
                          ? 'aspect-[9/16] w-auto max-w-[85vw]'
                          : isSquare
                          ? 'aspect-square w-auto max-w-[85vw]'
                          : 'w-full min-w-[85vw] md:min-w-full'
                      }`}
                    >
                      <VideoCard
                        video={video}
                        isActive={idx === currentIndex}
                        onPlay={(selected) => setActiveModalVideo(selected)}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Left & Right floating navigation chevrons */}
              <button
                type="button"
                onClick={() => scrollRow('left')}
                disabled={!canScrollLeft}
                className={`absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/85 text-white border border-neutral-700 shadow-2xl flex items-center justify-center transition-all duration-200 backdrop-blur-md ${
                  canScrollLeft
                    ? 'hover:bg-[#f5d020] hover:text-black hover:border-[#f5d020] hover:scale-110 active:scale-95 cursor-pointer opacity-100'
                    : 'opacity-0 pointer-events-none'
                }`}
                aria-label="Previous video"
                title="Previous video"
              >
                <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
              <button
                type="button"
                onClick={() => scrollRow('right')}
                disabled={!canScrollRight}
                className={`absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/85 text-white border border-neutral-700 shadow-2xl flex items-center justify-center transition-all duration-200 backdrop-blur-md ${
                  canScrollRight
                    ? 'hover:bg-[#f5d020] hover:text-black hover:border-[#f5d020] hover:scale-110 active:scale-95 cursor-pointer opacity-100'
                    : 'opacity-0 pointer-events-none'
                }`}
                aria-label="Next video"
                title="Next video"
              >
                <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
            </div>
          )}

          {/* Dots Indicator / Jump bar */}
          {!isLoading && videos.length > 0 && (
            <div className="flex items-center justify-center gap-2 pt-1 pb-2">
              {videos.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => scrollToIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    i === currentIndex
                      ? 'w-8 bg-[#f5d020]'
                      : 'w-2 bg-neutral-400/50 hover:bg-neutral-600'
                  }`}
                  aria-label={`Go to ${v.title}`}
                  title={v.title}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full border-t border-slate-300/70 bg-white/70 backdrop-blur-xs py-8 mt-12 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-display uppercase text-sm font-bold text-slate-800 tracking-wider">
              {profile.name}
            </span>
            <span>•</span>
            <span className="uppercase">{profile.title}</span>
            <span>•</span>
            <span className="text-amber-600 font-semibold">{profile.handle || 'fatah.vfx'}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <a
              href="/dashboard"
              className="hover:text-black underline underline-offset-4 transition-colors font-medium text-amber-700"
            >
              Dashboard
            </a>
            <a
              href={`mailto:${profile.email}`}
              className="hover:text-black underline underline-offset-4 transition-colors"
            >
              {profile.email}
            </a>
            <span>© {new Date().getFullYear()} All Rights Reserved</span>
          </div>
        </div>
      </footer>

      {/* MODAL PLAYER */}
      <VideoPlayerModal
        video={activeModalVideo}
        onClose={() => setActiveModalVideo(null)}
      />
    </div>
  )
}

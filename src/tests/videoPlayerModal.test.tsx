// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { VideoPlayerModal } from '../components/VideoPlayerModal'
import type { VideoItem } from '../components/VideoCard'

const mockVideo: VideoItem = {
  id: 'vid-test-1',
  title: 'TEST STREAMING VIDEO',
  category: 'Commercial',
  clientOrArtist: 'Test Artist',
  year: '2025',
  duration: '01:30',
  role: 'Director',
  aspectRatio: '16:9',
  resolution: '4K UHD',
  videoSrc: '/vids/cars.mp4',
  description: 'Test description for video streaming.',
  gradient: 'from-amber-950 via-neutral-900 to-black',
  timecode: '00:01:30:00',
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('VideoPlayerModal UX & Streaming', () => {
  it('renders loading spinner initially while loading', () => {
    const handleClose = vi.fn()
    render(<VideoPlayerModal video={mockVideo} onClose={handleClose} />)

    // Spinner must be present when video starts loading
    const spinner = screen.getByTestId('video-player-spinner')
    expect(spinner).not.toBeNull()
    expect(screen.getByText(/^loading\.\.\.$/i)).toBeDefined()
  })

  it('renders video header, timecode, resolution, and title correctly', () => {
    const handleClose = vi.fn()
    render(<VideoPlayerModal video={mockVideo} onClose={handleClose} />)

    expect(screen.getByText(/commercial • test artist/i)).toBeDefined()
    expect(screen.getByText(/TC 00:01:30:00/i)).toBeDefined()
    expect(screen.getAllByText(/4K UHD/i).length).toBeGreaterThan(0)
  })

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn()
    render(<VideoPlayerModal video={mockVideo} onClose={handleClose} />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn()
    render(<VideoPlayerModal video={mockVideo} onClose={handleClose} />)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})

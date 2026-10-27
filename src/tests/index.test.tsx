// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Home } from '../components/Home'

const mockVideos = [
  {
    id: 'test-1',
    _id: 'test-1',
    title: 'SOLARIS MUSIC FESTIVAL',
    category: 'Music Video',
    clientOrArtist: 'Live & Sound Experience',
    year: '2025',
    duration: '04:44',
    role: 'Director & DP',
    aspectRatio: '16:9',
    resolution: '4K UHD',
    videoSrc: 'https://example.com/festival.mp4',
    description: 'Electrifying open-air festival experience.',
    gradient: 'from-fuchsia-950 via-purple-900 to-black',
    timecode: '00:04:44:12',
    order: 0,
  },
  {
    id: 'test-2',
    _id: 'test-2',
    title: 'VELOCITY // AUTOMOTIVE DRIFT',
    category: 'Commercial',
    clientOrArtist: 'Motorsport & Performance',
    year: '2025',
    duration: '00:14',
    role: 'Director & Cinematographer',
    aspectRatio: '9:16',
    resolution: '4K Vertical',
    videoSrc: 'https://example.com/cars.mp4',
    description: 'High-speed track footage.',
    gradient: 'from-red-950 via-neutral-900 to-black',
    timecode: '00:00:14:06',
    order: 1,
  },
]

const mockUseQuery = vi.fn()

vi.mock('convex/react', () => ({
  useQuery: (queryRef: any) => mockUseQuery(queryRef),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Selected Works & VideoCard', () => {
  it('renders a spinner while videos are loading', () => {
    mockUseQuery.mockReturnValue(undefined)
    render(<Home />)

    expect(screen.getByTestId('convex-loading-spinner')).toBeDefined()
    expect(screen.getByText(/loading/i)).toBeDefined()
  })

  it('renders empty state when convex returns no videos', () => {
    mockUseQuery.mockReturnValue([])
    render(<Home />)

    expect(screen.getByText(/no videos published yet/i)).toBeDefined()
  })

  it('does not render category filter buttons', () => {
    mockUseQuery.mockReturnValue(mockVideos)
    render(<Home />)

    // There should be no category buttons like 'All', 'Commercial', 'Music Video' as filter pills in Selected Works
    const allButtons = screen.queryByRole('button', { name: /^all$/i })
    expect(allButtons).toBeNull()
  })

  it('renders 9:16 videos with aspect-[9/16] class and without w-full min-w-full', () => {
    mockUseQuery.mockReturnValue(mockVideos)
    render(<Home />)

    // Find the cars video container (which has 9:16 aspect ratio)
    const carsVideoTitles = screen.getAllByText(/VELOCITY \/\/ AUTOMOTIVE DRIFT/i)
    const cardWrapper = carsVideoTitles[0].closest('.aspect-\\[9\\/16\\]')
    expect(cardWrapper).not.toBeNull()
    expect(cardWrapper?.className).toContain('aspect-[9/16]')
    expect(cardWrapper?.className).not.toContain('min-w-full')
  })

  it('renders 16:9 videos with w-full class', () => {
    mockUseQuery.mockReturnValue(mockVideos)
    render(<Home />)

    const festivalTitles = screen.getAllByText(/SOLARIS MUSIC FESTIVAL/i)
    const cardWrapper = festivalTitles[0].closest('.w-full')
    expect(cardWrapper).not.toBeNull()
    expect(cardWrapper?.className).toContain('w-full')
  })

  it('does not render navbar navigation items like ideation, shooting, editing, or dashboard in navbar', () => {
    mockUseQuery.mockReturnValue(mockVideos)
    render(<Home />)

    expect(screen.queryByText(/ideation/i)).toBeNull()
    expect(screen.queryByText(/shooting/i)).toBeNull()
    expect(screen.queryByText(/editing/i)).toBeNull()
    const header = screen.getByRole('banner')
    expect(header.querySelector('nav')).toBeNull()
  })
})

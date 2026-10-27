// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Home } from '../components/Home'

afterEach(() => {
  cleanup()
})

describe('Selected Works & VideoCard', () => {
  it('does not render category filter buttons', () => {
    render(<Home />)
    
    // There should be no category buttons like 'All', 'Commercial', 'Music Video' as filter pills in Selected Works
    const allButtons = screen.queryByRole('button', { name: /^all$/i })
    expect(allButtons).toBeNull()
  })

  it('renders 9:16 videos with aspect-[9/16] class and without w-full min-w-full', () => {
    render(<Home />)

    // Find the cars video container (which has 9:16 aspect ratio)
    const carsVideoTitles = screen.getAllByText(/VELOCITY \/\/ AUTOMOTIVE DRIFT/i)
    const cardWrapper = carsVideoTitles[0].closest('.aspect-\\[9\\/16\\]')
    expect(cardWrapper).not.toBeNull()
    expect(cardWrapper?.className).toContain('aspect-[9/16]')
    expect(cardWrapper?.className).not.toContain('min-w-full')
  })

  it('renders 16:9 videos with w-full class', () => {
    render(<Home />)

    const festivalTitles = screen.getAllByText(/SOLARIS MUSIC FESTIVAL/i)
    const cardWrapper = festivalTitles[0].closest('.w-full')
    expect(cardWrapper).not.toBeNull()
    expect(cardWrapper?.className).toContain('w-full')
  })
})

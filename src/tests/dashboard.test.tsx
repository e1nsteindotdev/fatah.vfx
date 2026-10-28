// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { Dashboard } from '../components/Dashboard'

const mockReorder = vi.fn()
const mockUpdate = vi.fn()
const mockCreate = vi.fn()
const mockRemove = vi.fn()
const mockProfileUpdate = vi.fn()

vi.mock('convex/react', () => ({
  useQuery: vi.fn().mockReturnValue([
    {
      id: 'test-video-1',
      _id: 'test-video-1',
      title: 'FIRST REEL',
      category: 'Commercial',
      clientOrArtist: 'First Client',
      year: '2026',
      duration: '01:00',
      role: 'Director & DP',
      aspectRatio: '16:9',
      resolution: '4K UHD',
      videoSrc: '/vids/cars.mp4',
      storageId: 'storage-1',
      description: 'First video description',
      gradient: 'from-amber-950 via-neutral-900 to-black',
      timecode: '00:01:00:00',
      order: 0,
    },
    {
      id: 'test-video-2',
      _id: 'test-video-2',
      title: 'SECOND REEL',
      category: 'Music Video',
      clientOrArtist: 'Second Artist',
      year: '2025',
      duration: '03:30',
      role: 'Director of Photography',
      aspectRatio: '9:16',
      resolution: '4K Vertical',
      videoSrc: '/vids/festival.mp4',
      storageId: 'storage-2',
      description: 'Second video description',
      gradient: 'from-fuchsia-950 via-purple-900 to-black',
      timecode: '00:03:30:15',
      order: 1,
    },
  ]),
  useMutation: vi.fn((_mutationRef) => {
    // Return specific mocks or general vi.fn()
    return vi.fn((args) => {
      mockReorder(args)
      mockUpdate(args)
      mockCreate(args)
      mockRemove(args)
      mockProfileUpdate(args)
      return Promise.resolve({ success: true })
    })
  }),
  useAction: vi.fn((_actionRef) => {
    return vi.fn((args) => {
      mockRemove(args)
      return Promise.resolve({
        isConfigured: true,
        missingVars: [],
        bucketName: 'test-bucket',
        publicUrl: 'https://pub-test.r2.dev',
        uploadUrl: 'https://test-upload.r2.cloudflarestorage.com',
        key: 'videos/test-key.mp4',
        success: true,
      })
    })
  }),
}))

beforeEach(() => {
  sessionStorage.setItem('dashboard_auth', 'collo21')
})

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe('Dashboard Password Protection', () => {
  it('renders password lock screen by default when not authenticated', () => {
    sessionStorage.clear()
    render(<Dashboard initialAuthenticated={false} />)

    expect(screen.getByText(/dashboard access/i)).toBeDefined()
    expect(screen.getByLabelText(/^password$/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /unlock dashboard/i })).toBeDefined()
    expect(screen.queryByText(/portfolio videos/i)).toBeNull()
  })

  it('shows error when incorrect password is submitted', () => {
    sessionStorage.clear()
    render(<Dashboard initialAuthenticated={false} />)

    const passwordInput = screen.getByLabelText(/^password$/i)
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } })

    const unlockButton = screen.getByRole('button', { name: /unlock dashboard/i })
    fireEvent.click(unlockButton)

    expect(screen.getByText(/incorrect password\. access denied\./i)).toBeDefined()
    expect(screen.queryByText(/portfolio videos/i)).toBeNull()
  })

  it('unlocks dashboard when entering fixed password collo21', () => {
    sessionStorage.clear()
    render(<Dashboard initialAuthenticated={false} />)

    const passwordInput = screen.getByLabelText(/^password$/i)
    fireEvent.change(passwordInput, { target: { value: 'collo21' } })

    const unlockButton = screen.getByRole('button', { name: /unlock dashboard/i })
    fireEvent.click(unlockButton)

    expect(screen.getByText(/portfolio videos/i)).toBeDefined()
    expect(sessionStorage.getItem('dashboard_auth')).toBe('collo21')
  })

  it('allows locking the dashboard again', () => {
    render(<Dashboard />)
    expect(screen.getByText(/portfolio videos/i)).toBeDefined()

    const lockButton = screen.getByRole('button', { name: /lock dashboard/i })
    fireEvent.click(lockButton)

    expect(screen.getByText(/dashboard access/i)).toBeDefined()
    expect(screen.queryByText(/portfolio videos/i)).toBeNull()
    expect(sessionStorage.getItem('dashboard_auth')).toBeNull()
  })
})

describe('Dashboard Route Component', () => {
  it('displays existing videos list by default with order badges and re-order buttons', () => {
    render(<Dashboard />)

    // Heading & Video list
    expect(screen.getByText(/portfolio videos/i)).toBeDefined()
    expect(screen.getByText('FIRST REEL')).toBeDefined()
    expect(screen.getByText('SECOND REEL')).toBeDefined()

    // Order numbers
    expect(screen.getByText('#01')).toBeDefined()
    expect(screen.getByText('#02')).toBeDefined()

    // Add Video button is present
    const addButtons = screen.getAllByRole('button', { name: /add video/i })
    expect(addButtons.length).toBeGreaterThan(0)

    // Re-order buttons
    const moveDownButtons = screen.getAllByLabelText(/move video down/i)
    expect(moveDownButtons.length).toBe(2)
  })

  it('navigates to add video form when "Add Video" is clicked', () => {
    render(<Dashboard />)

    const addButtons = screen.getAllByRole('button', { name: /add video/i })
    fireEvent.click(addButtons[0])

    // Should display upload form
    expect(screen.getByText(/upload portfolio video/i)).toBeDefined()
    expect(screen.getByLabelText(/video title/i)).toBeDefined()
    expect(screen.getByLabelText(/category/i)).toBeDefined()
    expect(screen.getByLabelText(/client \/ artist/i)).toBeDefined()
    expect(screen.getByLabelText(/duration/i)).toBeDefined()
    expect(screen.getByLabelText(/role/i)).toBeDefined()
    expect(screen.getByLabelText(/aspect ratio/i)).toBeDefined()
    expect(screen.getByLabelText(/resolution/i)).toBeDefined()
    expect(screen.getByLabelText(/description/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /upload video to portfolio/i })).toBeDefined()
  })

  it('opens edit form pre-filled with data when clicking on an existing video', () => {
    render(<Dashboard />)

    // Click on the first video card text
    const videoTitle = screen.getByText('FIRST REEL')
    fireEvent.click(videoTitle)

    // Should display edit form with prefilled values
    expect(screen.getByText(/edit video: first reel/i)).toBeDefined()
    const titleInput = screen.getByLabelText(/video title/i) as HTMLInputElement
    expect(titleInput.value).toBe('FIRST REEL')

    const clientInput = screen.getByLabelText(/client \/ artist/i) as HTMLInputElement
    expect(clientInput.value).toBe('First Client')

    expect(screen.getByRole('button', { name: /save video changes/i })).toBeDefined()
  })

  it('triggers re-order when moving video down', () => {
    render(<Dashboard />)

    const moveDownButtons = screen.getAllByLabelText(/move video down/i)
    fireEvent.click(moveDownButtons[0])

    expect(mockReorder).toHaveBeenCalled()
  })

  it('displays edit profile buttons on the dashboard page and opens modal with profile fields', () => {
    render(<Dashboard />)

    // Check profile info banner is displayed
    expect(screen.getByText('Fatah Chafaa')).toBeDefined()
    expect(screen.getByText('Filmmaker')).toBeDefined()

    // Find and click the Edit Profile Info button
    const editProfileBtn = screen.getByRole('button', { name: /edit profile info/i })
    expect(editProfileBtn).toBeDefined()
    fireEvent.click(editProfileBtn)

    // Modal should appear
    expect(screen.getByRole('dialog')).toBeDefined()
    expect(screen.getByText(/edit profile information/i)).toBeDefined()

    // Form fields should exist with initial values
    const nameInput = screen.getByLabelText(/full name \*/i) as HTMLInputElement
    expect(nameInput.value).toBe('Fatah Chafaa')

    const titleInput = screen.getByLabelText(/professional title \*/i) as HTMLInputElement
    expect(titleInput.value).toBe('Filmmaker')

    const emailInput = screen.getByLabelText(/email address \*/i) as HTMLInputElement
    expect(emailInput.value).toBe('contact@fatah.vfx')

    const descInput = screen.getByLabelText(/description \/ bio \*/i) as HTMLTextAreaElement
    expect(descInput.value).toContain('Directing, Cinematography')

    const handleInput = screen.getByLabelText(/handle \/ brand/i) as HTMLInputElement
    expect(handleInput.value).toBe('fatah.vfx')
  })

  it('submits profile updates when save is clicked in the modal', () => {
    render(<Dashboard />)

    // Open modal
    const editProfileBtn = screen.getByRole('button', { name: /edit profile info/i })
    fireEvent.click(editProfileBtn)

    // Modify fields
    const emailInput = screen.getByLabelText(/email address \*/i) as HTMLInputElement
    fireEvent.change(emailInput, { target: { value: 'newcontact@fatah.vfx' } })

    const titleInput = screen.getByLabelText(/professional title \*/i) as HTMLInputElement
    fireEvent.change(titleInput, { target: { value: 'Executive Director' } })

    // Click Save Profile
    const saveBtn = screen.getByRole('button', { name: /save profile/i })
    fireEvent.click(saveBtn)

    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'newcontact@fatah.vfx',
        title: 'Executive Director',
      })
    )
  })

  it('closes the edit profile modal when cancel is clicked', () => {
    render(<Dashboard />)

    const editProfileBtn = screen.getByRole('button', { name: /edit profile info/i })
    fireEvent.click(editProfileBtn)

    expect(screen.getByRole('dialog')).toBeDefined()

    const cancelBtn = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelBtn)

    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

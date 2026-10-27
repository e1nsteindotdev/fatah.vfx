import { useState, useRef, useId } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import {
  UploadCloud,
  Film,
  Clock,
  Trash2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowLeft,
  Ratio,
  Layers,
  Palette,
  FileVideo,
  Database,
  Plus,
  Pencil,
  ArrowUp,
  ArrowDown,
  X,
  Check,
  User,
  Mail,
  MapPin,
} from 'lucide-react'
import { VideoPlayerModal } from './VideoPlayerModal'
import { EditProfileModal, DEFAULT_PROFILE, type ProfileData } from './EditProfileModal'
import type { VideoItem } from './VideoCard'

const CATEGORIES = ['Commercial', 'Music Video', 'Narrative', 'Documentary', 'Fashion'] as const
type Category = (typeof CATEGORIES)[number]

const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '2.39:1'] as const
type AspectRatio = (typeof ASPECT_RATIOS)[number]

const GRADIENT_PRESETS = [
  { label: 'Electric Purple', value: 'from-fuchsia-950 via-purple-900 to-black' },
  { label: 'Warm Amber', value: 'from-amber-950 via-neutral-900 to-black' },
  { label: 'Velocity Red', value: 'from-red-950 via-neutral-900 to-black' },
  { label: 'Emerald Night', value: 'from-emerald-950 via-slate-900 to-black' },
  { label: 'Neo-Noir Zinc', value: 'from-zinc-900 via-neutral-900 to-black' },
  { label: 'Golden Orange', value: 'from-amber-900 via-orange-950 to-black' },
  { label: 'Cyan Chill', value: 'from-cyan-950 via-blue-950 to-black' },
  { label: 'Deep Indigo', value: 'from-blue-950 via-indigo-950 to-black' },
  { label: 'Midnight Slate', value: 'from-slate-900 via-neutral-900 to-black' },
]

type ViewMode = 'list' | 'create' | 'edit'

export function Dashboard() {
  // Convex Query & Mutations
  const videos = useQuery(api.videos.list)
  const generateUploadUrl = useMutation(api.videos.generateUploadUrl)
  const createVideo = useMutation(api.videos.create)
  const updateVideo = useMutation(api.videos.update)
  const reorderVideos = useMutation(api.videos.reorder)
  const removeVideo = useMutation(api.videos.remove)
  const seedVideos = useMutation(api.videos.seedInitialVideos)

  // Profile Query & Mutation
  let convexProfile: any
  try {
    convexProfile = useQuery(api.profile.get)
  } catch {
    convexProfile = undefined
  }
  const updateProfile = useMutation(api.profile.update)

  const profile: ProfileData =
    convexProfile && !Array.isArray(convexProfile) && convexProfile.name
      ? convexProfile
      : DEFAULT_PROFILE

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  // Navigation / View State
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null)
  const [existingVideoSrc, setExistingVideoSrc] = useState<string>('')
  const [existingStorageId, setExistingStorageId] = useState<string | undefined>(undefined)

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('')
  const [videoUrlFallback, setVideoUrlFallback] = useState<string>('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('Commercial')
  const [clientOrArtist, setClientOrArtist] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [duration, setDuration] = useState('01:00')
  const [role, setRole] = useState('Director & DP')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9')
  const [resolution, setResolution] = useState('4K UHD')
  const [description, setDescription] = useState('')
  const [gradient, setGradient] = useState(GRADIENT_PRESETS[0].value)
  const [timecode, setTimecode] = useState('00:01:00:00')

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [isSeeding, setIsSeeding] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [previewModalVideo, setPreviewModalVideo] = useState<VideoItem | null>(null)

  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const tempVideoRef = useRef<HTMLVideoElement>(null)

  // Open "Add Video" Form
  const openCreateForm = () => {
    setEditingVideoId(null)
    setExistingVideoSrc('')
    setExistingStorageId(undefined)
    setSelectedFile(null)
    setFilePreviewUrl('')
    setVideoUrlFallback('')
    setTitle('')
    setCategory('Commercial')
    setClientOrArtist('')
    setYear(new Date().getFullYear().toString())
    setDuration('01:00')
    setRole('Director & DP')
    setAspectRatio('16:9')
    setResolution('4K UHD')
    setDescription('')
    setGradient(GRADIENT_PRESETS[0].value)
    setTimecode('00:01:00:00')
    setErrorMessage('')
    setViewMode('create')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Open "Edit Video" Form with pre-populated data
  const openEditForm = (vid: {
    id: string
    title: string
    category: string
    clientOrArtist: string
    year: string
    duration: string
    role: string
    aspectRatio: string
    resolution: string
    videoSrc: string
    storageId?: string
    description: string
    gradient: string
    timecode: string
  }) => {
    setEditingVideoId(vid.id)
    setExistingVideoSrc(vid.videoSrc)
    setExistingStorageId(vid.storageId)
    setSelectedFile(null)
    setFilePreviewUrl('')
    setVideoUrlFallback(vid.storageId ? '' : vid.videoSrc)
    setTitle(vid.title)
    setCategory(
      CATEGORIES.includes(vid.category as Category)
        ? (vid.category as Category)
        : 'Commercial'
    )
    setClientOrArtist(vid.clientOrArtist)
    setYear(vid.year)
    setDuration(vid.duration)
    setRole(vid.role)
    setAspectRatio(
      ASPECT_RATIOS.includes(vid.aspectRatio as AspectRatio)
        ? (vid.aspectRatio as AspectRatio)
        : '16:9'
    )
    setResolution(vid.resolution)
    setDescription(vid.description)
    setGradient(vid.gradient || GRADIENT_PRESETS[0].value)
    setTimecode(vid.timecode)
    setErrorMessage('')
    setViewMode('edit')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle file selection and auto-detect metadata
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    const previewUrl = URL.createObjectURL(file)
    setFilePreviewUrl(previewUrl)
    setErrorMessage('')

    // Derive initial title from filename if title is empty
    if (!title) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .toUpperCase()
      setTitle(cleanName)
    }

    // Inspect video element to detect aspect ratio and duration
    const tempVideo = document.createElement('video')
    tempVideo.preload = 'metadata'
    tempVideo.src = previewUrl

    tempVideo.onloadedmetadata = () => {
      // Auto detect duration
      const totalSec = Math.floor(tempVideo.duration)
      if (!isNaN(totalSec) && totalSec > 0) {
        const mins = Math.floor(totalSec / 60)
        const secs = totalSec % 60
        const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        setDuration(formatted)
        setTimecode(`00:${formatted}:00`)
      }

      // Auto detect aspect ratio
      const width = tempVideo.videoWidth
      const height = tempVideo.videoHeight
      if (width && height) {
        const ratio = width / height
        if (Math.abs(ratio - 9 / 16) < 0.15 || ratio < 0.75) {
          setAspectRatio('9:16')
          setResolution('4K Vertical')
        } else if (Math.abs(ratio - 1) < 0.15) {
          setAspectRatio('1:1')
          setResolution('2K Square')
        } else if (Math.abs(ratio - 2.39) < 0.25 || ratio > 2.1) {
          setAspectRatio('2.39:1')
          setResolution('4K Scope')
        } else {
          setAspectRatio('16:9')
          setResolution('4K UHD')
        }
      }
    }
  }

  // Handle Form Submit (Create or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const isEdit = viewMode === 'edit' && editingVideoId

    if (!isEdit && !selectedFile && !videoUrlFallback.trim()) {
      setErrorMessage('Please select a video file to upload, or specify a video URL.')
      return
    }

    if (!title.trim()) {
      setErrorMessage('Please provide a video title.')
      return
    }

    try {
      setIsSubmitting(true)
      let storageId: Id<'_storage'> | undefined = existingStorageId as Id<'_storage'> | undefined
      let finalVideoSrc = videoUrlFallback.trim() || existingVideoSrc

      // 1. Upload to Convex Storage if a new file is chosen
      if (selectedFile) {
        setUploadStatus('1/3: Requesting secure Convex storage upload URL...')
        const postUrl = await generateUploadUrl()

        setUploadStatus(`2/3: Uploading ${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB to Convex storage...`)
        let contentType = selectedFile.type
        if (!contentType) {
          const lowerName = selectedFile.name.toLowerCase()
          if (lowerName.endsWith('.mov')) contentType = 'video/quicktime'
          else if (lowerName.endsWith('.webm')) contentType = 'video/webm'
          else if (lowerName.endsWith('.m4v')) contentType = 'video/mp4'
          else contentType = 'video/mp4'
        }

        const response = await fetch(postUrl, {
          method: 'POST',
          headers: {
            'Content-Type': contentType,
          },
          body: selectedFile,
        })

        if (!response.ok) {
          throw new Error(`Upload to storage failed with status ${response.status}: ${response.statusText}`)
        }

        const json = await response.json()
        storageId = json.storageId as Id<'_storage'>
        finalVideoSrc = '' // Storage ID takes precedence
      }

      setUploadStatus('3/3: Saving video record to database...')

      if (isEdit) {
        // Update existing record
        await updateVideo({
          id: editingVideoId as Id<'videos'>,
          title: title.trim(),
          category,
          clientOrArtist: clientOrArtist.trim() || 'Independent Project',
          year: year.trim() || new Date().getFullYear().toString(),
          duration: duration.trim() || '01:00',
          role: role.trim() || 'Director & DP',
          aspectRatio,
          resolution: resolution.trim() || '4K UHD',
          videoSrc: finalVideoSrc,
          storageId,
          description: description.trim() || 'Cinematic video directed and produced by Fatah Chafaa.',
          gradient,
          timecode: timecode.trim() || `00:${duration}:00`,
        })

        setSuccessMessage(`Successfully updated "${title}"!`)
      } else {
        // Insert new record
        await createVideo({
          title: title.trim(),
          category,
          clientOrArtist: clientOrArtist.trim() || 'Independent Project',
          year: year.trim() || new Date().getFullYear().toString(),
          duration: duration.trim() || '01:00',
          role: role.trim() || 'Director & DP',
          aspectRatio,
          resolution: resolution.trim() || '4K UHD',
          videoSrc: finalVideoSrc,
          storageId,
          description: description.trim() || 'Cinematic video directed and produced by Fatah Chafaa.',
          gradient,
          timecode: timecode.trim() || `00:${duration}:00`,
        })

        setSuccessMessage(`Successfully uploaded "${title}" to Convex storage! It is now live on the portfolio.`)
      }

      // Reset form and return to list
      setSelectedFile(null)
      setFilePreviewUrl('')
      setVideoUrlFallback('')
      setTitle('')
      setClientOrArtist('')
      setDescription('')
      setViewMode('list')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: unknown) {
      console.error('Save failed:', err)
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
      setUploadStatus('')
    }
  }

  // Handle Re-ordering (Move Up / Down)
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (!videos || isReordering) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= videos.length) return

    const newOrder = [...videos]
    const [moved] = newOrder.splice(index, 1)
    newOrder.splice(targetIndex, 0, moved)

    try {
      setIsReordering(true)
      await reorderVideos({
        orderedIds: newOrder.map((v) => v.id as Id<'videos'>),
      })
    } catch (err) {
      console.error('Failed to reorder:', err)
      setErrorMessage('Failed to save new video order.')
    } finally {
      setIsReordering(false)
    }
  }

  // Handle Delete Video
  const handleDelete = async (id: string, videoTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${videoTitle}"? This will also remove any uploaded file from Convex storage.`)) {
      return
    }

    try {
      setDeletingId(id)
      await removeVideo({ id: id as Id<'videos'> })
      setSuccessMessage(`Deleted "${videoTitle}" successfully.`)
      if (editingVideoId === id) {
        setViewMode('list')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete video.'
      setErrorMessage(msg)
    } finally {
      setDeletingId(null)
    }
  }

  // Handle Seed Initial Sample Videos
  const handleSeed = async () => {
    try {
      setIsSeeding(true)
      const res = await seedVideos()
      setSuccessMessage(res.message || 'Sample videos added!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to seed sample videos.'
      setErrorMessage(msg)
    } finally {
      setIsSeeding(false)
    }
  }

  // Handle Save Profile
  const handleSaveProfile = async (updated: ProfileData) => {
    try {
      await updateProfile({
        name: updated.name,
        title: updated.title,
        tagline: updated.tagline,
        email: updated.email,
        description: updated.description,
        handle: updated.handle,
        location: updated.location,
      })
      setSuccessMessage('Profile information updated successfully!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile changes.'
      setErrorMessage(msg)
      throw err
    }
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans selection:bg-[#f5d020] selection:text-black">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Portfolio</span>
            </a>
            <span className="text-neutral-700">|</span>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-lg sm:text-xl uppercase tracking-wider text-white">
                Dashboard
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-black text-[#f5d020] uppercase border border-[#f5d020]/30">
                Convex Storage
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white font-sans font-medium text-xs uppercase tracking-wider border border-neutral-700 hover:border-neutral-500 transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[#f5d020]" />
              <span>Edit Profile</span>
            </button>

            {viewMode === 'list' ? (
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-[#f5d020] hover:bg-yellow-400 text-black font-sans font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:scale-102 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Video</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-neutral-800 hover:bg-neutral-700 text-white font-sans font-medium text-xs uppercase tracking-wider border border-neutral-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Videos</span>
              </button>
            )}

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white font-sans text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span>View Live</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Status Alerts */}
        {errorMessage && (
          <div className="flex items-start gap-3 p-4 rounded bg-red-950/60 border border-red-800/80 text-red-200 text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-red-300">Error</p>
              <p className="mt-0.5 text-red-200">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-red-400 hover:text-red-200 text-xs uppercase font-mono cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-3 p-4 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-emerald-300">Success</p>
              <p className="mt-0.5 text-emerald-200">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-emerald-400 hover:text-emerald-200 text-xs uppercase font-mono cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* VIEW 1: VIDEOS LIST & RE-ORDERING (DEFAULT) */}
        {viewMode === 'list' && (
          <section className="flex flex-col gap-6">
            {/* Profile Info Banner / Card */}
            <div className="bg-neutral-950 border border-neutral-800 p-5 sm:p-6 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl relative overflow-hidden group/profile">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f5d020]/40 to-transparent" />
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center shrink-0 text-[#f5d020] shadow-inner">
                  <User className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display font-black text-xl sm:text-2xl uppercase tracking-wider text-white">
                      {profile.name}
                    </h1>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-black text-[#f5d020] uppercase border border-[#f5d020]/30">
                      {profile.title}
                    </span>
                    {profile.handle && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800">
                        {profile.handle}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-1 max-w-2xl">
                    {profile.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-500 mt-0.5">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <Mail className="w-3.5 h-3.5 text-[#f5d020]" />
                      <span>{profile.email}</span>
                    </span>
                    {profile.location && (
                      <span className="flex items-center gap-1.5 text-neutral-400">
                        <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{profile.location}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-neutral-900 hover:bg-neutral-800 text-white font-sans font-bold text-xs uppercase tracking-wider border border-neutral-700 hover:border-[#f5d020]/50 transition-all cursor-pointer shadow-sm group"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#f5d020] group-hover:rotate-12 transition-transform" />
                  <span>Edit Profile Info</span>
                </button>
              </div>
            </div>

            {/* Action Bar & Summary */}
            <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-[#f5d020]" />
                  <h2 className="font-display font-medium text-2xl uppercase tracking-tight text-white">
                    Portfolio Videos
                  </h2>
                  <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-neutral-900 text-[#f5d020] border border-neutral-700">
                    {videos ? `${videos.length} videos` : 'Loading...'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
                  Click on any video to edit its details. Use the Up/Down arrows to re-order how videos appear in the portfolio carousel.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {(!videos || videos.length === 0) && (
                  <button
                    type="button"
                    onClick={handleSeed}
                    disabled={isSeeding}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-sm bg-neutral-900 hover:bg-neutral-800 text-[#f5d020] text-xs font-mono border border-neutral-700 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isSeeding ? 'Seeding...' : 'Seed 9 Defaults'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={openCreateForm}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#f5d020] hover:bg-yellow-400 text-black font-sans font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:scale-102 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Video</span>
                </button>
              </div>
            </div>

            {/* Videos Grid */}
            {!videos ? (
              <div className="p-16 text-center text-neutral-500 font-mono text-sm flex flex-col items-center gap-3">
                <span className="w-6 h-6 border-2 border-[#f5d020] border-t-transparent rounded-full animate-spin" />
                <span>Loading videos from Convex...</span>
              </div>
            ) : videos.length === 0 ? (
              <div className="p-16 rounded-sm bg-neutral-950 border border-dashed border-neutral-800 text-center flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-neutral-900 text-neutral-500 flex items-center justify-center">
                  <FileVideo className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-white uppercase">No videos in Convex database yet</h3>
                  <p className="text-xs text-neutral-400 max-w-md mt-1">
                    Upload your first video to show on the portfolio, or seed the 9 default portfolio videos with one click.
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#f5d020] hover:bg-yellow-400 text-black text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Upload New Video</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSeed}
                    disabled={isSeeding}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-mono border border-neutral-700 cursor-pointer transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#f5d020]" />
                    <span>{isSeeding ? 'Seeding...' : 'Seed 9 Sample Videos'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((vid, index) => {
                  const isDeleting = deletingId === vid.id
                  const isFirst = index === 0
                  const isLast = index === videos.length - 1

                  return (
                    <div
                      key={vid.id}
                      className="group relative bg-neutral-950 border border-neutral-800 hover:border-[#f5d020]/70 rounded-sm overflow-hidden flex flex-col justify-between transition-all duration-200 shadow-lg hover:shadow-2xl"
                    >
                      {/* Media Header / Preview Frame */}
                      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
                        {/* Ambient gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${vid.gradient} opacity-25`} />

                        {vid.videoSrc ? (
                          <video
                            src={`${vid.videoSrc}#t=0.001`}
                            preload="metadata"
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Film className="w-10 h-10 text-neutral-700" />
                        )}

                        {/* Top Badges: Order Index & Category */}
                        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#f5d020] text-black shadow-md">
                            #{String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-black/80 text-[#f5d020] border border-[#f5d020]/30 backdrop-blur-xs">
                            {vid.category}
                          </span>
                        </div>

                        {/* Top Right Badges: Storage & Ratio */}
                        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
                          {vid.storageId ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-950/90 text-emerald-300 border border-emerald-700/80 backdrop-blur-xs">
                              Convex Storage
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-neutral-900/90 text-neutral-400 border border-neutral-700 backdrop-blur-xs">
                              Local / URL
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/80 text-neutral-300 border border-neutral-700">
                            {vid.aspectRatio}
                          </span>
                        </div>

                        {/* Play Video Trigger Overlay */}
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewModalVideo({
                              id: vid.id,
                              title: vid.title,
                              category: vid.category,
                              clientOrArtist: vid.clientOrArtist,
                              year: vid.year,
                              duration: vid.duration,
                              role: vid.role,
                              aspectRatio: vid.aspectRatio,
                              resolution: vid.resolution,
                              videoSrc: vid.videoSrc,
                              description: vid.description,
                              gradient: vid.gradient,
                              timecode: vid.timecode,
                            })
                          }
                          className="absolute inset-0 z-10 flex items-center justify-center bg-black/35 group-hover:bg-black/15 transition-colors cursor-pointer"
                          title="Preview video"
                        >
                          <div className="w-10 h-10 rounded-full bg-black/70 border border-white/40 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-[#f5d020] group-hover:text-black group-hover:border-[#f5d020] transition-all">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </button>
                      </div>

                      {/* Video Info: Click to Edit */}
                      <div
                        onClick={() => openEditForm(vid)}
                        className="p-4 flex flex-col flex-1 justify-between gap-3 cursor-pointer hover:bg-neutral-900/40 transition-colors"
                        title="Click to edit this video"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-1">
                            <span className="text-[#f5d020] font-semibold truncate mr-2">{vid.clientOrArtist}</span>
                            <span>{vid.year}</span>
                          </div>

                          <h3 className="font-display font-bold text-lg text-white uppercase tracking-tight line-clamp-1 group-hover:text-[#f5d020] transition-colors">
                            {vid.title}
                          </h3>

                          <p className="text-xs text-neutral-400 line-clamp-2 mt-1">
                            {vid.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs font-mono text-neutral-400 pt-2 border-t border-neutral-800/80">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#f5d020]" />
                            <span>{vid.duration}</span>
                          </span>
                          <span className="truncate max-w-[150px]">{vid.role}</span>
                        </div>
                      </div>

                      {/* Footer Actions: Re-order & Edit / Delete */}
                      <div className="p-3 bg-neutral-900/60 border-t border-neutral-800 flex items-center justify-between gap-2">
                        {/* Re-order Controls */}
                        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded border border-neutral-800">
                          <span className="text-[10px] font-mono text-neutral-500 uppercase px-1">Order</span>
                          <button
                            type="button"
                            onClick={() => handleMove(index, 'up')}
                            disabled={isFirst || isReordering}
                            className={`p-1 rounded transition-colors ${
                              isFirst
                                ? 'text-neutral-700 cursor-not-allowed'
                                : 'text-neutral-300 hover:text-black hover:bg-[#f5d020] cursor-pointer'
                            }`}
                            title={isFirst ? 'Already at top' : 'Move video earlier'}
                            aria-label="Move video up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(index, 'down')}
                            disabled={isLast || isReordering}
                            className={`p-1 rounded transition-colors ${
                              isLast
                                ? 'text-neutral-700 cursor-not-allowed'
                                : 'text-neutral-300 hover:text-black hover:bg-[#f5d020] cursor-pointer'
                            }`}
                            title={isLast ? 'Already at end' : 'Move video later'}
                            aria-label="Move video down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Edit & Delete Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(vid)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-[#f5d020] hover:text-black text-neutral-200 text-xs font-mono transition-all cursor-pointer"
                            title="Edit this video"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(vid.id, vid.title)}
                            disabled={isDeleting}
                            className="p-1.5 rounded text-neutral-400 hover:text-red-300 hover:bg-red-950/60 transition-colors cursor-pointer"
                            title="Delete video"
                            aria-label="Delete video"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* VIEW 2 & 3: FORM VIEW (ADD OR EDIT VIDEO) */}
        {(viewMode === 'create' || viewMode === 'edit') && (
          <section className="bg-neutral-950 border border-neutral-800 rounded-sm overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-neutral-800/80 bg-gradient-to-r from-neutral-900 to-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="p-2 rounded-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Back to list"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    {viewMode === 'edit' ? (
                      <Pencil className="w-5 h-5 text-[#f5d020]" />
                    ) : (
                      <UploadCloud className="w-5 h-5 text-[#f5d020]" />
                    )}
                    <h2 className="font-display font-medium text-xl sm:text-2xl uppercase tracking-tight text-white">
                      {viewMode === 'edit' ? `Edit Video: ${title || 'Selected Video'}` : 'Upload Portfolio Video'}
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    {viewMode === 'edit'
                      ? 'Update text fields or upload a new video file to replace the existing one in Convex storage.'
                      : 'Upload a video file to Convex Storage and configure all cinematic fields for the portfolio.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-3 py-1.5 rounded text-xs font-mono bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 flex flex-col gap-8">
              {/* File Dropzone & Video Preview */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* File Picker Card */}
                <div className="flex-1 flex flex-col">
                  <label
                    htmlFor={fileInputId}
                    className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 mb-2"
                  >
                    {viewMode === 'edit' ? 'Replace Video File (Optional)' : 'Video File (Convex Storage Upload) *'}
                  </label>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 min-h-[220px] border-2 border-dashed rounded-sm p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                      selectedFile
                        ? 'border-[#f5d020] bg-neutral-900/60'
                        : 'border-neutral-700 hover:border-neutral-500 bg-neutral-900/30 hover:bg-neutral-900/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      id={fileInputId}
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isSubmitting}
                    />

                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#f5d020]/20 text-[#f5d020] flex items-center justify-center">
                          <FileVideo className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white max-w-sm truncate">{selectedFile.name}</p>
                          <p className="text-xs text-neutral-400 font-mono mt-1">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'video'}
                          </p>
                        </div>
                        <span className="text-[11px] font-mono text-[#f5d020] underline">
                          Click to choose a different video file
                        </span>
                      </div>
                    ) : viewMode === 'edit' && existingVideoSrc ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800">
                          <Check className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-200">
                            Currently using existing video
                          </p>
                          <p className="text-xs text-neutral-400 font-mono mt-1">
                            {existingStorageId ? 'Stored in Convex File Storage' : 'Direct URL source'}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded text-xs font-mono bg-neutral-800 text-neutral-300 border border-neutral-700">
                          Click to select a new file to replace it
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-200">
                            Click to select a video file from your computer
                          </p>
                          <p className="text-xs text-neutral-500 font-mono mt-1">
                            Auto-detects duration and aspect ratio • Uploads straight to Convex Storage
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded text-xs font-mono bg-neutral-800 text-neutral-300 border border-neutral-700">
                          Choose MP4 / MOV / WEBM
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Optional Fallback URL */}
                  <div className="mt-3">
                    <label htmlFor="video-url-fallback" className="block text-[11px] font-mono text-neutral-400 mb-1">
                      Or direct video URL (optional fallback if already hosted):
                    </label>
                    <input
                      id="video-url-fallback"
                      type="text"
                      value={videoUrlFallback}
                      onChange={(e) => setVideoUrlFallback(e.target.value)}
                      placeholder="e.g. /vids/festival.mp4 or https://domain.com/video.mp4"
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-xs font-mono bg-neutral-900 border border-neutral-800 rounded-sm text-neutral-200 placeholder-neutral-600 focus:outline-hidden focus:border-[#f5d020]"
                    />
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="w-full lg:w-80 flex flex-col">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 mb-2">
                    Preview Frame
                  </label>
                  <div className="flex-1 min-h-[220px] rounded-sm bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden relative group">
                    {filePreviewUrl ? (
                      <video
                        ref={tempVideoRef}
                        src={filePreviewUrl}
                        controls
                        playsInline
                        className="w-full h-full object-contain max-h-[240px]"
                      />
                    ) : existingVideoSrc ? (
                      <video
                        src={existingVideoSrc}
                        controls
                        playsInline
                        className="w-full h-full object-contain max-h-[240px]"
                      />
                    ) : (
                      <div className="p-6 text-center text-neutral-600 flex flex-col items-center gap-2">
                        <Film className="w-8 h-8 opacity-40" />
                        <p className="text-xs font-mono">No video selected yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-neutral-800/80">
                {/* Title */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label htmlFor="video-title" className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-[#f5d020]" />
                    <span>Video Title *</span>
                  </label>
                  <input
                    id="video-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. SOLARIS MUSIC FESTIVAL"
                    disabled={isSubmitting}
                    className="px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-sm text-white placeholder-neutral-600 focus:outline-hidden focus:border-[#f5d020] transition-colors"
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="video-category" className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#f5d020]" />
                    <span>Category *</span>
                  </label>
                  <select
                    id="video-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    disabled={isSubmitting}
                    className="px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-sm text-white focus:outline-hidden focus:border-[#f5d020] transition-colors"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Client or Artist */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="video-client" className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                    Client / Artist *
                  </label>
                  <input
                    id="video-client"
                    type="text"
                    required
                    value={clientOrArtist}
                    onChange={(e) => setClientOrArtist(e.target.value)}
                    placeholder="e.g. Live & Sound Experience"
                    disabled={isSubmitting}
                    className="px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-sm text-white placeholder-neutral-600 focus:outline-hidden focus:border-[#f5d020] transition-colors"
                  />
                </div>

                {/* Role */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="video-role" className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                    Role *
                  </label>
                  <input
                    id="video-role"
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Director & DP"
                    disabled={isSubmitting}
                    className="px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-sm text-white placeholder-neutral-600 focus:outline-hidden focus:border-[#f5d020] transition-colors"
                  />
                </div>

                {/* Year */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="video-year" className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                    Year *
                  </label>
                  <input
                    id="video-year"
                    type="text"
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2026"
                    disabled={isSubmitting}
                    className="px-3.5 py-2.5 text-sm font-mono bg-neutral-900 border border-neutral-800 rounded-sm text-white placeholder-neutral-600 focus:outline-hidden focus:border-[#f5d020] transition-colors"
                  />
                </div>

                {/* Aspect Ratio */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="video-aspect-ratio" className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                    <Ratio className="w-3.5 h-3.5 text-[#f5d020]" />
                    <span>Aspect Ratio *</span>
                  </label>
                  <select
                    id="video-aspect-ratio"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    disabled={isSubmitting}
                    className="px-3.5 py-2.5 text-sm font-mono bg-neutral-900 border border-neutral-800 rounded-sm text-white focus:outline-hidden focus:border-[#f5d020] transition-colors"
                  >
                    {ASPECT_RATIOS.map((ratio) => (
                      <option key={ratio} value={ratio}>
                        {ratio} {ratio === '9:16' ? '(Vertical Reel)' : ratio === '1:1' ? '(Square)' : ratio === '2.39:1' ? '(Scope)' : '(Widescreen)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resolution */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="video-resolution" className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                    Resolution *
                  </label>
                  <input
                    id="video-resolution"
                    type="text"
                    required
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="e.g. 4K UHD, 4K Vertical, 1080p HD"
                    disabled={isSubmitting}
                    className="px-3.5 py-2.5 text-sm font-mono bg-neutral-900 border border-neutral-800 rounded-sm text-white placeholder-neutral-600 focus:outline-hidden focus:border-[#f5d020] transition-colors"
                  />
                </div>

                {/* Duration */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="video-duration" className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#f5d020]" />
                    <span>Duration (MM:SS) *</span>
                  </label>
                  <input
                    id="video-duration"
                    type="text"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="01:30"
                    disabled={isSubmitting}
                    className="px-3.5 py-2.5 text-sm font-mono bg-neutral-900 border border-neutral-800 rounded-sm text-white placeholder-neutral-600 focus:outline-hidden focus:border-[#f5d020] transition-colors"
                  />
                </div>

                {/* Timecode */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="video-timecode" className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                    Timecode *
                  </label>
                  <input
                    id="video-timecode"
                    type="text"
                    required
                    value={timecode}
                    onChange={(e) => setTimecode(e.target.value)}
                    placeholder="00:01:30:12"
                    disabled={isSubmitting}
                    className="px-3.5 py-2.5 text-sm font-mono bg-neutral-900 border border-neutral-800 rounded-sm text-white placeholder-neutral-600 focus:outline-hidden focus:border-[#f5d020] transition-colors"
                  />
                </div>

                {/* Gradient Accent */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label htmlFor="video-gradient" className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#f5d020]" />
                    <span>Background Mood Gradient *</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-sm border border-neutral-700 shrink-0 bg-gradient-to-br ${gradient}`}
                      title="Active gradient preview"
                    />
                    <select
                      id="video-gradient"
                      value={gradient}
                      onChange={(e) => setGradient(e.target.value)}
                      disabled={isSubmitting}
                      className="flex-1 px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-sm text-white focus:outline-hidden focus:border-[#f5d020] transition-colors"
                    >
                      {GRADIENT_PRESETS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label} ({p.value.slice(0, 30)}...)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3">
                  <label htmlFor="video-description" className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                    Description / Synopsis *
                  </label>
                  <textarea
                    id="video-description"
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Cinematic description capturing dynamic range, lighting design, narrative tension, and emotional pacing..."
                    disabled={isSubmitting}
                    className="px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-sm text-white placeholder-neutral-600 focus:outline-hidden focus:border-[#f5d020] transition-colors resize-y"
                  />
                </div>
              </div>

              {/* Submit Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-neutral-800">
                <div className="text-xs text-neutral-400 font-mono">
                  {isSubmitting ? (
                    <span className="text-[#f5d020] flex items-center gap-2">
                      <span className="inline-block w-3 h-3 border-2 border-[#f5d020] border-t-transparent rounded-full animate-spin" />
                      <span>{uploadStatus}</span>
                    </span>
                  ) : (
                    <span>
                      {viewMode === 'edit'
                        ? 'Changes will be saved directly to Convex and immediately update the portfolio.'
                        : 'New video will be uploaded to Convex storage and placed at the end of the carousel.'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-sm font-sans font-semibold text-xs uppercase tracking-wider border border-neutral-700 hover:border-neutral-500 text-neutral-300 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-sm font-sans font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg ${
                      isSubmitting
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : 'bg-[#f5d020] hover:bg-yellow-400 text-black hover:scale-102 cursor-pointer'
                    }`}
                  >
                    {viewMode === 'edit' ? (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>{isSubmitting ? 'Saving Changes...' : 'Save Video Changes'}</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>{isSubmitting ? 'Uploading to Convex...' : 'Upload Video to Portfolio'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </section>
        )}
      </main>

      {/* Video Preview Modal */}
      {previewModalVideo && (
        <VideoPlayerModal
          video={previewModalVideo}
          onClose={() => setPreviewModalVideo(null)}
        />
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentProfile={profile}
        onSave={handleSaveProfile}
      />
    </div>
  )
}

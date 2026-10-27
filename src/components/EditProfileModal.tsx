import { useState, useEffect } from 'react'
import { X, User, Mail, FileText, Briefcase, AtSign, MapPin, Sparkles, Check, AlertCircle } from 'lucide-react'

export interface ProfileData {
  name: string
  title: string
  email: string
  description: string
  tagline?: string
  handle?: string
  location?: string
}

export const DEFAULT_PROFILE: ProfileData = {
  name: 'Fatah Chafaa',
  title: 'Filmmaker',
  tagline: 'Visual Storyteller & Cinematographer',
  email: 'contact@fatah.vfx',
  description: 'Directing, Cinematography, and Visual Storytelling for Commercials, Films, and Documentaries.',
  handle: 'fatah.vfx',
  location: 'Paris / Worldwide',
}

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  currentProfile?: ProfileData | null
  onSave: (updated: ProfileData) => Promise<void>
}

export function EditProfileModal({
  isOpen,
  onClose,
  currentProfile,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState(DEFAULT_PROFILE.name)
  const [title, setTitle] = useState(DEFAULT_PROFILE.title)
  const [email, setEmail] = useState(DEFAULT_PROFILE.email)
  const [description, setDescription] = useState(DEFAULT_PROFILE.description)
  const [tagline, setTagline] = useState(DEFAULT_PROFILE.tagline || '')
  const [handle, setHandle] = useState(DEFAULT_PROFILE.handle || '')
  const [location, setLocation] = useState(DEFAULT_PROFILE.location || '')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync state whenever modal opens or currentProfile changes
  useEffect(() => {
    if (isOpen) {
      const p = currentProfile || DEFAULT_PROFILE
      setName(p.name || DEFAULT_PROFILE.name)
      setTitle(p.title || DEFAULT_PROFILE.title)
      setEmail(p.email || DEFAULT_PROFILE.email)
      setDescription(p.description || DEFAULT_PROFILE.description)
      setTagline(p.tagline || DEFAULT_PROFILE.tagline || '')
      setHandle(p.handle || DEFAULT_PROFILE.handle || '')
      setLocation(p.location || DEFAULT_PROFILE.location || '')
      setError(null)
    }
  }, [isOpen, currentProfile])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please provide your name.')
      return
    }
    if (!title.trim()) {
      setError('Please provide your title.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.')
      return
    }
    if (!description.trim()) {
      setError('Please provide a description/bio.')
      return
    }

    try {
      setIsSubmitting(true)
      await onSave({
        name: name.trim(),
        title: title.trim(),
        email: email.trim(),
        description: description.trim(),
        tagline: tagline.trim(),
        handle: handle.trim(),
        location: location.trim(),
      })
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile info.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetDefaults = () => {
    setName(DEFAULT_PROFILE.name)
    setTitle(DEFAULT_PROFILE.title)
    setEmail(DEFAULT_PROFILE.email)
    setDescription(DEFAULT_PROFILE.description)
    setTagline(DEFAULT_PROFILE.tagline || '')
    setHandle(DEFAULT_PROFILE.handle || '')
    setLocation(DEFAULT_PROFILE.location || '')
    setError(null)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Backdrop overlay click handler */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => {
          if (!isSubmitting) onClose()
        }}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-sm shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-800/90 bg-gradient-to-r from-neutral-900 to-neutral-950 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-[#f5d020]/10 border border-[#f5d020]/30 flex items-center justify-center text-[#f5d020]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="edit-profile-modal-title"
                  className="font-display font-medium text-xl uppercase tracking-tight text-white"
                >
                  Edit Profile Information
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-black text-[#f5d020] uppercase border border-[#f5d020]/30">
                  Profile
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Update your filmmaker biography, title, contact email, and showcase details.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded bg-red-950/60 border border-red-800/80 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="profile-name"
                className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-[#f5d020]" />
                <span>Full Name *</span>
              </label>
              <input
                id="profile-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Fatah Chafaa"
                disabled={isSubmitting}
                className="px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-sm text-white placeholder-neutral-600 focus:outline-hidden focus:border-[#f5d020] transition-colors"
              />
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="profile-title"
                className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5 text-[#f5d020]" />
                <span>Professional Title *</span>
              </label>
              <input
                id="profile-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Filmmaker, Director & DP"
                disabled={isSubmitting}
                className="px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-sm text-white placeholder-neutral-600 focus:outline-hidden focus:border-[#f5d020] transition-colors"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="profile-email"
                className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-[#f5d020]" />
                <span>Email Address *</span>
              </label>
              <input
                id="profile-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. contact@fatah.vfx"
                disabled={isSubmitting}
                className="px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-sm text-white placeholder-neutral-600 focus:outline-hidden focus:border-[#f5d020] transition-colors font-mono"
              />
            </div>

            {/* Handle / Social */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="profile-handle"
                className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5"
              >
                <AtSign className="w-3.5 h-3.5 text-[#f5d020]" />
                <span>Handle / Brand</span>
              </label>
              <input
                id="profile-handle"
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g. fatah.vfx"
                disabled={isSubmitting}
                className="px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-sm text-white placeholder-neutral-600 focus:outline-hidden focus:border-[#f5d020] transition-colors font-mono"
              />
            </div>

            {/* Tagline */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="profile-tagline"
                className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#f5d020]" />
                <span>Tagline / Subheading</span>
              </label>
              <input
                id="profile-tagline"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Visual Storyteller & Cinematographer"
                disabled={isSubmitting}
                className="px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-sm text-white placeholder-neutral-600 focus:outline-hidden focus:border-[#f5d020] transition-colors"
              />
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="profile-location"
                className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-[#f5d020]" />
                <span>Location</span>
              </label>
              <input
                id="profile-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Paris / Worldwide"
                disabled={isSubmitting}
                className="px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-sm text-white placeholder-neutral-600 focus:outline-hidden focus:border-[#f5d020] transition-colors"
              />
            </div>

            {/* Description / Bio */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label
                htmlFor="profile-description"
                className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-[#f5d020]" />
                <span>Description / Bio *</span>
              </label>
              <textarea
                id="profile-description"
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Directing, Cinematography, and Visual Storytelling for Commercials, Films, and Documentaries."
                disabled={isSubmitting}
                className="px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-sm text-white placeholder-neutral-600 focus:outline-hidden focus:border-[#f5d020] transition-colors resize-y"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-neutral-800 mt-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              disabled={isSubmitting}
              className="text-xs font-mono text-neutral-400 hover:text-[#f5d020] transition-colors cursor-pointer self-start sm:self-center"
            >
              Reset to Defaults
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-sm font-sans font-semibold text-xs uppercase tracking-wider border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2 rounded-sm font-sans font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md ${
                  isSubmitting
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    : 'bg-[#f5d020] hover:bg-yellow-400 text-black hover:scale-102 cursor-pointer'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

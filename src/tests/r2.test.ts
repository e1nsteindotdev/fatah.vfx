import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock AWS S3 SDK and request presigner
const mockSend = vi.fn().mockResolvedValue({})
const mockGetSignedUrl = vi.fn().mockResolvedValue('https://mock-r2-upload-url.com/signed')

vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: class {
      send = mockSend
    },
    PutObjectCommand: class {
      constructor(public args: any) {}
    },
    DeleteObjectCommand: class {
      constructor(public args: any) {}
    },
  }
})

vi.mock('@aws-sdk/s3-request-presigner', () => {
  return {
    getSignedUrl: mockGetSignedUrl,
  }
})

describe('Cloudflare R2 Storage Functions', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  it('detects missing R2 configuration in checkR2Config', async () => {
    delete process.env.R2_ACCOUNT_ID
    delete process.env.R2_ACCESS_KEY_ID
    delete process.env.R2_SECRET_ACCESS_KEY
    delete process.env.R2_BUCKET_NAME
    delete process.env.R2_PUBLIC_URL

    const { checkR2Config } = await import('../utils/r2')
    const result = checkR2Config()

    expect(result.isConfigured).toBe(false)
    expect(result.missingVars).toContain('R2_ACCOUNT_ID')
    expect(result.missingVars).toContain('R2_ACCESS_KEY_ID')
    expect(result.missingVars).toContain('R2_SECRET_ACCESS_KEY')
    expect(result.missingVars).toContain('R2_BUCKET_NAME')
    expect(result.missingVars).toContain('R2_PUBLIC_URL')
  })

  it('reports isConfigured true when all R2 environment variables are set', async () => {
    process.env.R2_ACCOUNT_ID = 'test-account-id'
    process.env.R2_ACCESS_KEY_ID = 'test-access-key'
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key'
    process.env.R2_BUCKET_NAME = 'fatah-portfolio-videos'
    process.env.R2_PUBLIC_URL = 'https://pub-abc123xyz.r2.dev/'

    const { checkR2Config } = await import('../utils/r2')
    const result = checkR2Config()

    expect(result.isConfigured).toBe(true)
    expect(result.missingVars.length).toBe(0)
    expect(result.bucketName).toBe('fatah-portfolio-videos')
    expect(result.publicUrl).toBe('https://pub-abc123xyz.r2.dev') // Strips trailing slash
  })

  it('formats clean, unique R2 keys with sanitized filenames', async () => {
    const { formatR2Key } = await import('../utils/r2')
    const key = formatR2Key('My Action Film 2026! (final).MOV')

    expect(key).toMatch(/^videos\/\d+-[a-z0-9]+-my-action-film-2026-final\.mov$/)
  })
})

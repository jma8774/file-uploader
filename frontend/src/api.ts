// Emulated API client for the frontend-first phase.
//
// Function signatures and response shapes match the backend contract in
// ai/context/api-contracts.md. When the real backend lands, replace each
// // EMULATED: branch with the real network call.

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024
export const STORAGE_LIMIT_BYTES = 6 * 1024 * 1024 * 1024
export const MONTHLY_TRANSFER_SAFETY_LIMIT_BYTES = 250 * 1024 * 1024 * 1024
export const PER_FILE_TRANSFER_LIMIT_BYTES = 2 * 1024 * 1024 * 1024

export type ApiErrorCode =
  | 'FILE_TOO_LARGE'
  | 'UPLOADS_DISABLED'
  | 'DOWNLOADS_DISABLED'
  | 'FILE_NOT_FOUND'
  | 'EXPIRED'
  | 'MAX_DOWNLOADS_REACHED'
  | 'RATE_LIMITED'
  | 'SAFETY_LIMIT_REACHED'
  | 'INTERNAL_ERROR'

export class ApiError extends Error {
  readonly error: ApiErrorCode
  constructor(error: ApiErrorCode, message: string) {
    super(message)
    this.error = error
    this.name = 'ApiError'
  }
}

export interface UploadResponse {
  token: string
  downloadPageUrl: string
  directDownloadUrl: string
  originalName: string
  sizeBytes: number
  expiresAt: string
  maxDownloads: number
}

export interface FileInfoActive {
  status: 'active'
  token: string
  originalName: string
  sizeBytes: number
  uploadedAt: string
  expiresAt: string
  downloadCount: number
  maxDownloads: number
}

export interface FileInfoExpired {
  status: 'expired'
}

export type FileInfoResponse = FileInfoActive | FileInfoExpired

export interface StatsResponse {
  totalUploads: number
  totalDownloads: number
  activeFiles: number
  storageUsedBytes: number
  storageLimitBytes: number
  uploadsToday: number
  downloadsToday: number
  expiredFilesDeleted: number
  estimatedMonthlyTransferBytes: number
  monthlyTransferSafetyLimitBytes: number
  uploadsEnabled: boolean
  downloadsEnabled: boolean
}

export interface HealthResponse {
  status: 'ok'
  storageUsedBytes: number
  activeFiles: number
}

// EMULATED: rolling fake stats. Each getStats() call bumps these slightly so
// the homepage panel visibly updates after a successful upload.
const MOCK_STATS: StatsResponse = {
  totalUploads: 128,
  totalDownloads: 902,
  activeFiles: 17,
  storageUsedBytes: 1932735283,
  storageLimitBytes: STORAGE_LIMIT_BYTES,
  uploadsToday: 9,
  downloadsToday: 44,
  expiredFilesDeleted: 81,
  estimatedMonthlyTransferBytes: 13314398617,
  monthlyTransferSafetyLimitBytes: MONTHLY_TRANSFER_SAFETY_LIMIT_BYTES,
  uploadsEnabled: true,
  downloadsEnabled: true,
}

const EMULATED_MIN_LATENCY_MS = 300
const EMULATED_MAX_LATENCY_MS = 800

function emulatedLatency(): number {
  return (
    EMULATED_MIN_LATENCY_MS +
    Math.random() * (EMULATED_MAX_LATENCY_MS - EMULATED_MIN_LATENCY_MS)
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomToken(): string {
  // EMULATED: matches the backend's `crypto.randomBytes(16).toString('base64url')`
  // shape closely enough for UI development.
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function computeMaxDownloads(sizeBytes: number): number {
  if (sizeBytes <= 0) return 1
  return Math.max(1, Math.floor(PER_FILE_TRANSFER_LIMIT_BYTES / sizeBytes))
}

export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadResponse> {
  // EMULATED: enforce the same size limit the real backend will.
  if (file.size > MAX_UPLOAD_BYTES) {
    await sleep(150)
    throw new ApiError(
      'FILE_TOO_LARGE',
      'File is too large. Max size is 100 MB.',
    )
  }

  // EMULATED: simulate XHR upload progress events.
  const totalMs = emulatedLatency() + 800
  const tickMs = 60
  const ticks = Math.max(8, Math.floor(totalMs / tickMs))
  for (let i = 1; i <= ticks; i++) {
    await sleep(tickMs)
    const pct = Math.min(100, Math.round((i / ticks) * 100))
    onProgress?.(pct)
  }
  onProgress?.(100)

  // EMULATED: bump rolling stats so the homepage panel updates after upload.
  MOCK_STATS.totalUploads += 1
  MOCK_STATS.uploadsToday += 1
  MOCK_STATS.activeFiles += 1
  MOCK_STATS.storageUsedBytes += file.size

  const token = randomToken()
  const uploadedAt = new Date()
  const expiresAt = new Date(uploadedAt.getTime() + 24 * 60 * 60 * 1000)
  return {
    token,
    downloadPageUrl: `/file/${token}`,
    directDownloadUrl: `/d/${token}`,
    originalName: file.name,
    sizeBytes: file.size,
    expiresAt: expiresAt.toISOString(),
    maxDownloads: computeMaxDownloads(file.size),
  }
}

export async function getFileInfo(token: string): Promise<FileInfoResponse> {
  await sleep(emulatedLatency())

  // EMULATED: sentinel tokens for testing UI branches.
  if (!token || token.length < 3) {
    return { status: 'expired' }
  }
  if (token.toLowerCase().includes('expired')) {
    return { status: 'expired' }
  }
  if (token.toLowerCase().includes('error')) {
    throw new ApiError('INTERNAL_ERROR', 'Something went wrong. Please try the link again later.')
  }

  const sizeBytes = 44879012 // EMULATED: canned 42.8 MB
  const uploadedAt = new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 h ago
  const expiresAt = new Date(uploadedAt.getTime() + 24 * 60 * 60 * 1000)
  return {
    status: 'active',
    token,
    originalName: 'example.zip',
    sizeBytes,
    uploadedAt: uploadedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    downloadCount: 3,
    maxDownloads: computeMaxDownloads(sizeBytes),
  }
}

export async function getStats(): Promise<StatsResponse> {
  await sleep(emulatedLatency())
  // EMULATED: return a snapshot so callers can't mutate the source-of-truth object.
  return { ...MOCK_STATS }
}

export async function getHealth(): Promise<HealthResponse> {
  await sleep(emulatedLatency())
  return {
    status: 'ok',
    storageUsedBytes: MOCK_STATS.storageUsedBytes,
    activeFiles: MOCK_STATS.activeFiles,
  }
}

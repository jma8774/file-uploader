import axios, { AxiosError } from 'axios'

// Frontend API client. Hits the backend on same-origin /api/* and /d/*.
// In dev, Vite proxies those paths to http://localhost:3000 (see vite.config.ts).
// In production, Nginx routes them.

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024

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

interface BackendErrorBody {
  error?: string
  message?: string
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return (
    typeof value === 'string' &&
    [
      'FILE_TOO_LARGE',
      'UPLOADS_DISABLED',
      'DOWNLOADS_DISABLED',
      'FILE_NOT_FOUND',
      'EXPIRED',
      'MAX_DOWNLOADS_REACHED',
      'RATE_LIMITED',
      'SAFETY_LIMIT_REACHED',
      'INTERNAL_ERROR',
    ].includes(value)
  )
}

function toApiError(body: unknown, fallbackMessage: string): ApiError {
  if (body && typeof body === 'object') {
    const candidate = body as BackendErrorBody
    if (isApiErrorCode(candidate.error)) {
      return new ApiError(candidate.error, candidate.message ?? fallbackMessage)
    }
  }
  return new ApiError('INTERNAL_ERROR', fallbackMessage)
}

async function getJson<T>(path: string, fallbackMessage: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, { headers: { accept: 'application/json' } })
  } catch {
    throw new ApiError('INTERNAL_ERROR', fallbackMessage)
  }
  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    if (!response.ok) throw new ApiError('INTERNAL_ERROR', fallbackMessage)
    throw new ApiError('INTERNAL_ERROR', fallbackMessage)
  }
  if (!response.ok) throw toApiError(body, fallbackMessage)
  return body as T
}

export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadResponse> {
  const form = new FormData()
  form.append('file', file)
  try {
    const response = await axios.post<UploadResponse>('/api/upload', form, {
      onUploadProgress: (event) => {
        if (!onProgress) return
        const total = event.total ?? file.size
        if (!total) return
        const pct = Math.min(100, Math.round((event.loaded / total) * 100))
        onProgress(pct)
      },
    })
    onProgress?.(100)
    return response.data
  } catch (err) {
    if (err instanceof AxiosError && err.response) {
      throw toApiError(err.response.data, 'Upload failed. Please try again.')
    }
    throw new ApiError('INTERNAL_ERROR', 'Upload failed. Please try again.')
  }
}

export function getFileInfo(token: string): Promise<FileInfoResponse> {
  return getJson<FileInfoResponse>(
    `/api/file/${encodeURIComponent(token)}`,
    'Something went wrong. Please try the link again later.',
  )
}

export function getStats(): Promise<StatsResponse> {
  return getJson<StatsResponse>('/api/stats', 'Stats unavailable.')
}

export function getHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>('/api/health', 'Health check failed.')
}

import { db } from '../db.js'
import { config } from '../config.js'

export interface FileRow {
  id: string
  token: string
  original_name: string
  stored_name: string
  size_bytes: number
  mime_type: string | null
  uploaded_at: string
  expires_at: string
  download_count: number
  max_downloads: number
  bytes_downloaded_estimate: number
  max_transfer_bytes: number
  is_deleted: number
  deleted_at: string | null
}

export interface InsertFileInput {
  id: string
  token: string
  originalName: string
  storedName: string
  sizeBytes: number
  mimeType: string | null
  uploadedAt: string
  expiresAt: string
  maxDownloads: number
  maxTransferBytes: number
}

const insertFileStmt = db.prepare(
  `INSERT INTO files (
    id, token, original_name, stored_name, size_bytes, mime_type,
    uploaded_at, expires_at, download_count, max_downloads,
    bytes_downloaded_estimate, max_transfer_bytes, is_deleted
  ) VALUES (
    @id, @token, @original_name, @stored_name, @size_bytes, @mime_type,
    @uploaded_at, @expires_at, 0, @max_downloads,
    0, @max_transfer_bytes, 0
  )`,
)

export function insertFile(input: InsertFileInput): void {
  insertFileStmt.run({
    id: input.id,
    token: input.token,
    original_name: input.originalName,
    stored_name: input.storedName,
    size_bytes: input.sizeBytes,
    mime_type: input.mimeType,
    uploaded_at: input.uploadedAt,
    expires_at: input.expiresAt,
    max_downloads: input.maxDownloads,
    max_transfer_bytes: input.maxTransferBytes,
  })
}

export function computeMaxDownloads(sizeBytes: number): number {
  if (sizeBytes <= 0) return 1
  return Math.max(1, Math.floor(config.perFileTransferLimitBytes / sizeBytes))
}

export function computeExpiresAt(uploadedAt: Date): string {
  return new Date(
    uploadedAt.getTime() + config.fileTtlHours * 60 * 60 * 1000,
  ).toISOString()
}

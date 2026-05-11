import { db } from '../db.js'

const bumpFileStmt = db.prepare(
  `UPDATE files
   SET download_count = download_count + 1,
       bytes_downloaded_estimate = bytes_downloaded_estimate + @size
   WHERE id = @id`,
)

const insertDownloadEventStmt = db.prepare(
  `INSERT INTO download_events
     (file_id, downloaded_at, bytes, ip_hash, user_agent)
   VALUES (@file_id, @downloaded_at, @bytes, @ip_hash, @user_agent)`,
)

const insertBandwidthEventStmt = db.prepare(
  `INSERT INTO bandwidth_events
     (file_id, bytes, event_type, created_at)
   VALUES (@file_id, @bytes, 'download', @created_at)`,
)

export interface RecordDownloadInput {
  fileId: string
  sizeBytes: number
  ipHash: string | null
  userAgent: string | null
}

export const recordDownload = db.transaction((input: RecordDownloadInput) => {
  const now = new Date().toISOString()
  bumpFileStmt.run({ id: input.fileId, size: input.sizeBytes })
  insertDownloadEventStmt.run({
    file_id: input.fileId,
    downloaded_at: now,
    bytes: input.sizeBytes,
    ip_hash: input.ipHash,
    user_agent: input.userAgent,
  })
  insertBandwidthEventStmt.run({
    file_id: input.fileId,
    bytes: input.sizeBytes,
    created_at: now,
  })
})

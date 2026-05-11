import { Router, type Request, type Response } from 'express'
import { join, resolve } from 'node:path'
import { config } from '../config.js'
import { getFileByToken, isActive } from '../services/fileService.js'
import { recordDownload } from '../services/downloadService.js'
import { hashIp } from '../services/ipHash.js'

export const downloadRouter = Router()

const RESOLVED_UPLOAD_DIR = resolve(config.uploadDir)

downloadRouter.get('/:token', (req: Request, res: Response) => {
  const token = req.params.token
  const row = token ? getFileByToken(token) : undefined
  const now = new Date().toISOString()

  if (!row || !isActive(row, now)) {
    return res.status(404).json({
      error: 'EXPIRED',
      message: 'This download link is no longer available.',
    })
  }

  if (row.download_count >= row.max_downloads) {
    return res.status(403).json({
      error: 'MAX_DOWNLOADS_REACHED',
      message: 'This file has reached its download limit.',
    })
  }

  if (row.bytes_downloaded_estimate + row.size_bytes > row.max_transfer_bytes) {
    return res.status(403).json({
      error: 'MAX_DOWNLOADS_REACHED',
      message: 'This file has reached its transfer limit.',
    })
  }

  const absolutePath = resolve(join(config.uploadDir, row.stored_name))
  if (!absolutePath.startsWith(RESOLVED_UPLOAD_DIR + '/') && absolutePath !== RESOLVED_UPLOAD_DIR) {
    console.error(
      `[download] refusing to serve path outside upload dir: ${absolutePath}`,
    )
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Something went wrong serving this file.',
    })
  }

  // Bump counters first so a mid-stream disconnect doesn't drop the record.
  try {
    recordDownload({
      fileId: row.id,
      sizeBytes: row.size_bytes,
      ipHash: hashIp(req.ip),
      userAgent: (req.get('user-agent') ?? '').slice(0, 256) || null,
    })
  } catch (err) {
    console.error('[download] failed to record download', err)
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Something went wrong serving this file.',
    })
  }

  res.download(absolutePath, row.original_name, (err) => {
    if (err) console.error('[download] res.download error', err)
  })
})

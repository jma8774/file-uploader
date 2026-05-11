import { Router, type Request, type Response } from 'express'
import { getFileByToken, isActive } from '../services/fileService.js'

export const fileInfoRouter = Router()

fileInfoRouter.get('/file/:token', (req: Request, res: Response) => {
  const token = req.params.token
  const row = token ? getFileByToken(token) : undefined
  const now = new Date().toISOString()

  if (!row || !isActive(row, now)) {
    return res.json({ status: 'expired' })
  }

  res.json({
    status: 'active',
    token: row.token,
    originalName: row.original_name,
    sizeBytes: row.size_bytes,
    uploadedAt: row.uploaded_at,
    expiresAt: row.expires_at,
    downloadCount: row.download_count,
    maxDownloads: row.max_downloads,
  })
})

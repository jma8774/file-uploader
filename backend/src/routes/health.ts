import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'

export const healthRouter = Router()

const activeFilesStmt = db.prepare<[string], { count: number }>(
  `SELECT COUNT(*) AS count FROM files
   WHERE is_deleted = 0 AND expires_at > ?`,
)
const storageUsedStmt = db.prepare<[], { total: number }>(
  `SELECT COALESCE(SUM(size_bytes), 0) AS total FROM files
   WHERE is_deleted = 0`,
)

healthRouter.get('/health', (_req: Request, res: Response) => {
  const now = new Date().toISOString()
  const activeFiles = activeFilesStmt.get(now)?.count ?? 0
  const storageUsedBytes = storageUsedStmt.get()?.total ?? 0
  res.json({
    status: 'ok',
    storageUsedBytes,
    activeFiles,
  })
})

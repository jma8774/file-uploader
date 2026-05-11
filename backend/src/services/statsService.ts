import { db } from '../db.js'
import { config } from '../config.js'
import { getSetting } from './settingsService.js'

const countAllFilesStmt = db.prepare<[], { c: number }>(
  'SELECT COUNT(*) AS c FROM files',
)
const sumDownloadsStmt = db.prepare<[], { c: number }>(
  'SELECT COALESCE(SUM(download_count), 0) AS c FROM files',
)
const countActiveStmt = db.prepare<[string], { c: number }>(
  `SELECT COUNT(*) AS c FROM files
   WHERE is_deleted = 0 AND expires_at > ?`,
)
const sumStorageStmt = db.prepare<[], { c: number }>(
  `SELECT COALESCE(SUM(size_bytes), 0) AS c FROM files
   WHERE is_deleted = 0`,
)
const uploadsTodayStmt = db.prepare<[string], { c: number }>(
  'SELECT COUNT(*) AS c FROM files WHERE uploaded_at >= ?',
)
const downloadsTodayStmt = db.prepare<[string], { c: number }>(
  'SELECT COUNT(*) AS c FROM download_events WHERE downloaded_at >= ?',
)
const expiredDeletedStmt = db.prepare<[], { c: number }>(
  'SELECT COUNT(*) AS c FROM files WHERE is_deleted = 1',
)
const monthlyTransferStmt = db.prepare<[string], { c: number }>(
  'SELECT COALESCE(SUM(bytes), 0) AS c FROM bandwidth_events WHERE created_at >= ?',
)

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

function startOfTodayUtc(now: Date): string {
  return `${now.toISOString().slice(0, 10)}T00:00:00.000Z`
}

function startOfMonthUtc(now: Date): string {
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01T00:00:00.000Z`
}

export function getStats(): StatsResponse {
  const now = new Date()
  const nowIso = now.toISOString()
  const dayStart = startOfTodayUtc(now)
  const monthStart = startOfMonthUtc(now)

  return {
    totalUploads: countAllFilesStmt.get()?.c ?? 0,
    totalDownloads: sumDownloadsStmt.get()?.c ?? 0,
    activeFiles: countActiveStmt.get(nowIso)?.c ?? 0,
    storageUsedBytes: sumStorageStmt.get()?.c ?? 0,
    storageLimitBytes: config.storageLimitBytes,
    uploadsToday: uploadsTodayStmt.get(dayStart)?.c ?? 0,
    downloadsToday: downloadsTodayStmt.get(dayStart)?.c ?? 0,
    expiredFilesDeleted: expiredDeletedStmt.get()?.c ?? 0,
    estimatedMonthlyTransferBytes: monthlyTransferStmt.get(monthStart)?.c ?? 0,
    monthlyTransferSafetyLimitBytes: config.monthlyTransferSafetyLimitBytes,
    uploadsEnabled: getSetting('uploads_enabled') !== 'false',
    downloadsEnabled: getSetting('downloads_enabled') !== 'false',
  }
}

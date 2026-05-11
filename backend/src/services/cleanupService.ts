import { unlink } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { db } from '../db.js'
import { config } from '../config.js'
import { getSetting, setSetting } from './settingsService.js'
import { clearFlagCache } from '../middleware/safetyCap.js'

const RESOLVED_UPLOAD_DIR = resolve(config.uploadDir)

interface ExpiredRow {
  id: string
  stored_name: string
}

const selectExpiredStmt = db.prepare<[string], ExpiredRow>(
  `SELECT id, stored_name FROM files
   WHERE is_deleted = 0 AND expires_at <= ?`,
)

const selectOldestActiveStmt = db.prepare<[], ExpiredRow>(
  `SELECT id, stored_name FROM files
   WHERE is_deleted = 0
   ORDER BY uploaded_at ASC
   LIMIT 1`,
)

const markDeletedStmt = db.prepare(
  `UPDATE files SET is_deleted = 1, deleted_at = ? WHERE id = ?`,
)

const sumActiveBytesStmt = db.prepare<[], { total: number }>(
  `SELECT COALESCE(SUM(size_bytes), 0) AS total FROM files WHERE is_deleted = 0`,
)

const sumMonthlyTransferStmt = db.prepare<[string], { total: number }>(
  `SELECT COALESCE(SUM(bytes), 0) AS total FROM bandwidth_events
   WHERE created_at >= ?`,
)

function startOfMonthUtc(now: Date): string {
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01T00:00:00.000Z`
}

async function deleteFromDisk(storedName: string): Promise<void> {
  const absolutePath = resolve(join(config.uploadDir, storedName))
  if (
    !absolutePath.startsWith(RESOLVED_UPLOAD_DIR + '/') &&
    absolutePath !== RESOLVED_UPLOAD_DIR
  ) {
    console.error(
      `[cleanup] refusing to unlink path outside upload dir: ${absolutePath}`,
    )
    return
  }
  try {
    await unlink(absolutePath)
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code !== 'ENOENT') throw err
    // File already gone on disk — fine, still mark the row deleted.
  }
}

async function deleteRow(row: ExpiredRow): Promise<void> {
  try {
    await deleteFromDisk(row.stored_name)
  } catch (err) {
    console.warn(`[cleanup] disk delete failed for ${row.stored_name}`, err)
  }
  markDeletedStmt.run(new Date().toISOString(), row.id)
}

export interface CleanupSummary {
  expired: number
  evicted: number
  usageBytes: number
  limitBytes: number
  capTripped: boolean
}

function maybeTripSafetyCap(): boolean {
  const monthStart = startOfMonthUtc(new Date())
  const transferred = sumMonthlyTransferStmt.get(monthStart)?.total ?? 0
  if (transferred < config.monthlyTransferSafetyLimitBytes) return false
  // Already tripped: don't re-log on every pass.
  if (
    getSetting('uploads_enabled') === 'false' &&
    getSetting('downloads_enabled') === 'false'
  ) {
    return false
  }
  setSetting('uploads_enabled', 'false')
  setSetting('downloads_enabled', 'false')
  clearFlagCache()
  console.warn(
    `[cleanup] monthly transfer ${transferred} >= cap ${config.monthlyTransferSafetyLimitBytes} — uploads + downloads auto-disabled`,
  )
  return true
}

export async function runCleanup(): Promise<CleanupSummary> {
  let expired = 0
  let evicted = 0

  // 1. Expire any file past its TTL.
  const now = new Date().toISOString()
  const expiredRows = selectExpiredStmt.all(now)
  for (const row of expiredRows) {
    await deleteRow(row)
    expired += 1
  }

  // 2. If we're still over the storage cap, evict oldest active until we're back under.
  while (true) {
    const usage = sumActiveBytesStmt.get()?.total ?? 0
    if (usage <= config.storageLimitBytes) break
    const oldest = selectOldestActiveStmt.get()
    if (!oldest) break // safety: nothing left to evict but cap somehow still over
    await deleteRow(oldest)
    evicted += 1
  }

  const usageBytes = sumActiveBytesStmt.get()?.total ?? 0
  const capTripped = maybeTripSafetyCap()
  return {
    expired,
    evicted,
    usageBytes,
    limitBytes: config.storageLimitBytes,
    capTripped,
  }
}

let timer: NodeJS.Timeout | undefined

export function startCleanupLoop(): void {
  if (timer) return
  void tick()
  timer = setInterval(tick, config.cleanupIntervalMs)
  // Don't keep the Node event loop alive solely because of cleanup.
  timer.unref?.()
}

export function stopCleanupLoop(): void {
  if (!timer) return
  clearInterval(timer)
  timer = undefined
}

async function tick(): Promise<void> {
  try {
    const summary = await runCleanup()
    console.log(
      `cleanup: expired ${summary.expired}, evicted ${summary.evicted}, usage ${summary.usageBytes} / ${summary.limitBytes} bytes`,
    )
  } catch (err) {
    console.error('[cleanup] pass failed', err)
  }
}

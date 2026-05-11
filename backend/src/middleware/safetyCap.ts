import type { Request, Response, NextFunction } from 'express'
import { getSetting } from '../services/settingsService.js'

const CACHE_TTL_MS = 5_000

interface FlagCache {
  value: boolean
  expiresAt: number
}

const flagCache = new Map<string, FlagCache>()

function readFlag(key: string): boolean {
  const cached = flagCache.get(key)
  const now = Date.now()
  if (cached && cached.expiresAt > now) return cached.value
  const fresh = getSetting(key) !== 'false'
  flagCache.set(key, { value: fresh, expiresAt: now + CACHE_TTL_MS })
  return fresh
}

export function clearFlagCache(): void {
  flagCache.clear()
}

export function enforceUploadEnabled(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (readFlag('uploads_enabled')) {
    next()
    return
  }
  res.status(503).json({
    error: 'UPLOADS_DISABLED',
    message:
      'Monthly safety limit reached. Uploads and downloads are temporarily paused.',
  })
}

export function enforceDownloadEnabled(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (readFlag('downloads_enabled')) {
    next()
    return
  }
  res.status(503).json({
    error: 'DOWNLOADS_DISABLED',
    message:
      'Monthly safety limit reached. Uploads and downloads are temporarily paused.',
  })
}

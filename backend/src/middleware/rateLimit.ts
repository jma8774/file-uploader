import { ipKeyGenerator, rateLimit, type Options } from 'express-rate-limit'
import type { Request } from 'express'

const HOUR_MS = 60 * 60 * 1000

function jsonError(code: string, message: string): NonNullable<Options['handler']> {
  return (_req, res) => {
    res.status(429).json({ error: code, message })
  }
}

// 5 uploads per IP per hour.
export const uploadLimiter = rateLimit({
  windowMs: HOUR_MS,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonError(
    'RATE_LIMITED',
    'Too many uploads from this address. Please wait and try again.',
  ),
})

// 30 downloads per IP per hour.
export const downloadLimiter = rateLimit({
  windowMs: HOUR_MS,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonError(
    'RATE_LIMITED',
    'Too many downloads from this address. Please wait and try again.',
  ),
})

// 3 downloads of the SAME file by the SAME IP per hour. Mount before the
// per-IP downloadLimiter so the more specific cap fires first.
export const perFileDownloadLimiter = rateLimit({
  windowMs: HOUR_MS,
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    // ipKeyGenerator buckets IPv6 addresses by subnet so a single host with a
    // /64 can't mint unlimited per-file keys by rotating the last bytes.
    // Pass-through for IPv4. Wrapping it (instead of using req.ip raw) is what
    // makes the express-rate-limit v8 ERR_ERL_KEY_GEN_IPV6 validator happy.
    const ipKey = ipKeyGenerator(req.ip ?? 'unknown')
    const token = req.params.token ?? ''
    return `${ipKey}:${token}`
  },
  handler: jsonError(
    'RATE_LIMITED',
    'Too many downloads of this file from this address. Please wait and try again.',
  ),
})

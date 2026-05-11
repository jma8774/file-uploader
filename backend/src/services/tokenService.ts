import { randomBytes } from 'node:crypto'

// Public-facing handle for a file. Spec §13.2: 16 random bytes, base64url.
export function createToken(): string {
  return randomBytes(16).toString('base64url')
}

// Internal on-disk filename component. Short enough to keep paths readable,
// long enough to be collision-resistant for one upload directory.
export function createStoredBaseName(): string {
  return randomBytes(12).toString('hex')
}

// YYYY-MM bucket for the on-disk layout, e.g. "2026-05".
export function currentMonthBucket(now: Date = new Date()): string {
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

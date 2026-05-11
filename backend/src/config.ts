import 'dotenv/config'
import { dirname, resolve } from 'node:path'
import { mkdirSync } from 'node:fs'

function readInt(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) ? n : fallback
}

const nodeEnv = process.env.NODE_ENV ?? 'development'
const port = readInt('PORT', 3000)
const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? `http://localhost:${port}`

// Paths default to a backend/var/ subtree so they survive `git clean` and are
// macOS-friendly. Production sets absolute Linux paths via /etc/filedrop.env.
const databasePath = resolve(process.env.DATABASE_PATH ?? './var/app.db')
const uploadDir = resolve(process.env.UPLOAD_DIR ?? './var/uploads')

const maxUploadBytes = readInt('MAX_UPLOAD_BYTES', 100 * 1024 * 1024)
const fileTtlHours = readInt('FILE_TTL_HOURS', 24)
const storageLimitBytes = readInt('STORAGE_LIMIT_BYTES', 6 * 1024 * 1024 * 1024)
const perFileTransferLimitBytes = readInt(
  'PER_FILE_TRANSFER_LIMIT_BYTES',
  2 * 1024 * 1024 * 1024,
)
const monthlyTransferSafetyLimitBytes = readInt(
  'MONTHLY_TRANSFER_SAFETY_LIMIT_BYTES',
  250 * 1024 * 1024 * 1024,
)

const ipHashSecretRaw = process.env.IP_HASH_SECRET
let ipHashSecret: string
if (!ipHashSecretRaw) {
  if (nodeEnv === 'production') {
    // Production must have a real secret. Fail fast and loud.
    console.error(
      'FATAL: IP_HASH_SECRET is required in production. Refusing to start.',
    )
    process.exit(1)
  }
  console.warn(
    '[config] IP_HASH_SECRET not set — using a development placeholder. Set a real secret for production.',
  )
  ipHashSecret = 'dev-placeholder-do-not-use-in-production'
} else {
  ipHashSecret = ipHashSecretRaw
}

export const config = Object.freeze({
  nodeEnv,
  port,
  publicBaseUrl,
  databasePath,
  uploadDir,
  maxUploadBytes,
  fileTtlHours,
  storageLimitBytes,
  perFileTransferLimitBytes,
  monthlyTransferSafetyLimitBytes,
  ipHashSecret,
})

export type Config = typeof config

export function ensureDirs(): void {
  mkdirSync(uploadDir, { recursive: true })
  mkdirSync(dirname(databasePath), { recursive: true })
}

// Run on import so the SQLite open in db.ts and the file writes in routes/
// always see the directories. ESM hoists imports above non-import statements,
// so dropping this here is the simplest correct place for it.
ensureDirs()

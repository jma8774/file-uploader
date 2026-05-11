import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createTestApp, type TestApp } from '../helpers/createTestApp.js'

type RunCleanup = typeof import('../../src/services/cleanupService.js').runCleanup

interface InsertOpts {
  id: string
  token: string
  storedName: string
  sizeBytes: number
  uploadedAt: string
  expiresAt: string
  bytes?: Buffer
}

function insertFile(db: Database.Database, uploadDir: string, opts: InsertOpts) {
  const fullPath = join(uploadDir, opts.storedName)
  mkdirSync(dirname(fullPath), { recursive: true })
  writeFileSync(fullPath, opts.bytes ?? Buffer.alloc(opts.sizeBytes, 0))
  db.prepare(
    `INSERT INTO files (
      id, token, original_name, stored_name, size_bytes, mime_type,
      uploaded_at, expires_at, max_downloads, max_transfer_bytes
    ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
  ).run(
    opts.id,
    opts.token,
    `${opts.id}.bin`,
    opts.storedName,
    opts.sizeBytes,
    opts.uploadedAt,
    opts.expiresAt,
    1,
    2 * 1024 ** 3,
  )
}

describe('cleanupService.runCleanup', () => {
  let ctx: TestApp
  let runCleanup: RunCleanup
  let db: Database.Database

  beforeEach(async () => {
    ctx = await createTestApp()
    const mod = await import('../../src/services/cleanupService.js')
    runCleanup = mod.runCleanup
    db = new Database(ctx.databasePath)
  })

  afterEach(() => {
    db.close()
    ctx.cleanup()
  })

  it('expires files past their TTL: unlinks bytes + flips is_deleted', async () => {
    insertFile(db, ctx.uploadDir, {
      id: 'fresh',
      token: 't-fresh',
      storedName: '2026-05/fresh.bin',
      sizeBytes: 5,
      uploadedAt: '2026-05-10T00:00:00.000Z',
      expiresAt: '2099-01-01T00:00:00.000Z', // future
    })
    insertFile(db, ctx.uploadDir, {
      id: 'old',
      token: 't-old',
      storedName: '2026-04/old.bin',
      sizeBytes: 5,
      uploadedAt: '2026-04-01T00:00:00.000Z',
      expiresAt: '2000-01-01T00:00:00.000Z', // past
    })

    const summary = await runCleanup()
    expect(summary.expired).toBe(1)
    expect(summary.evicted).toBe(0)

    expect(existsSync(join(ctx.uploadDir, '2026-04/old.bin'))).toBe(false)
    expect(existsSync(join(ctx.uploadDir, '2026-05/fresh.bin'))).toBe(true)

    const old = db
      .prepare(
        'SELECT is_deleted, deleted_at FROM files WHERE id = ?',
      )
      .get('old') as { is_deleted: number; deleted_at: string | null }
    expect(old.is_deleted).toBe(1)
    expect(old.deleted_at).not.toBeNull()

    const fresh = db
      .prepare('SELECT is_deleted FROM files WHERE id = ?')
      .get('fresh') as { is_deleted: number }
    expect(fresh.is_deleted).toBe(0)
  })

  it('does not crash if the on-disk file is already gone (ENOENT)', async () => {
    insertFile(db, ctx.uploadDir, {
      id: 'ghost',
      token: 't-ghost',
      storedName: '2026-04/ghost.bin',
      sizeBytes: 5,
      uploadedAt: '2026-04-01T00:00:00.000Z',
      expiresAt: '2000-01-01T00:00:00.000Z',
    })
    // Remove the file behind the service's back.
    const path = join(ctx.uploadDir, '2026-04/ghost.bin')
    require('node:fs').unlinkSync(path)

    const summary = await runCleanup()
    expect(summary.expired).toBe(1)
    const row = db
      .prepare('SELECT is_deleted FROM files WHERE id = ?')
      .get('ghost') as { is_deleted: number }
    expect(row.is_deleted).toBe(1)
  })

  it('evicts oldest active files until usage falls under the storage cap', async () => {
    process.env.STORAGE_LIMIT_BYTES = '100'
    const fresh = await createTestApp()
    try {
      const mod = await import('../../src/services/cleanupService.js')
      const freshDb = new Database(fresh.databasePath)
      try {
        // Three files at 60 bytes each = 180 bytes total. Cap is 100 bytes.
        // Eviction must run until usage <= 100, so oldest two get evicted.
        insertFile(freshDb, fresh.uploadDir, {
          id: 'a',
          token: 'a',
          storedName: '2026-05/a.bin',
          sizeBytes: 60,
          uploadedAt: '2026-05-01T00:00:00.000Z',
          expiresAt: '2099-01-01T00:00:00.000Z',
        })
        insertFile(freshDb, fresh.uploadDir, {
          id: 'b',
          token: 'b',
          storedName: '2026-05/b.bin',
          sizeBytes: 60,
          uploadedAt: '2026-05-02T00:00:00.000Z',
          expiresAt: '2099-01-01T00:00:00.000Z',
        })
        insertFile(freshDb, fresh.uploadDir, {
          id: 'c',
          token: 'c',
          storedName: '2026-05/c.bin',
          sizeBytes: 60,
          uploadedAt: '2026-05-03T00:00:00.000Z',
          expiresAt: '2099-01-01T00:00:00.000Z',
        })

        const summary = await mod.runCleanup()
        expect(summary.expired).toBe(0)
        expect(summary.evicted).toBe(2) // a + b
        expect(summary.usageBytes).toBeLessThanOrEqual(100)

        const rows = freshDb
          .prepare('SELECT id, is_deleted FROM files ORDER BY id')
          .all() as { id: string; is_deleted: number }[]
        expect(rows.find((r) => r.id === 'a')?.is_deleted).toBe(1)
        expect(rows.find((r) => r.id === 'b')?.is_deleted).toBe(1)
        expect(rows.find((r) => r.id === 'c')?.is_deleted).toBe(0)
      } finally {
        freshDb.close()
      }
    } finally {
      fresh.cleanup()
      delete process.env.STORAGE_LIMIT_BYTES
    }
  })

  it('auto-trips the safety cap when monthly transfer >= limit', async () => {
    process.env.MONTHLY_TRANSFER_SAFETY_LIMIT_BYTES = '10'
    const fresh = await createTestApp()
    try {
      const mod = await import('../../src/services/cleanupService.js')
      const freshDb = new Database(fresh.databasePath)
      try {
        // Plant a bandwidth_event past the (tiny) cap.
        freshDb
          .prepare(
            `INSERT INTO bandwidth_events (file_id, bytes, event_type, created_at)
             VALUES (NULL, ?, 'download', ?)`,
          )
          .run(50, new Date().toISOString())

        const summary = await mod.runCleanup()
        expect(summary.capTripped).toBe(true)

        const flags = freshDb
          .prepare(
            `SELECT key, value FROM app_settings WHERE key IN ('uploads_enabled', 'downloads_enabled')`,
          )
          .all() as { key: string; value: string }[]
        const byKey = Object.fromEntries(flags.map((r) => [r.key, r.value]))
        expect(byKey.uploads_enabled).toBe('false')
        expect(byKey.downloads_enabled).toBe('false')

        // A second pass shouldn't re-trip (no-op when both already false).
        const second = await mod.runCleanup()
        expect(second.capTripped).toBe(false)
      } finally {
        freshDb.close()
      }
    } finally {
      fresh.cleanup()
      delete process.env.MONTHLY_TRANSFER_SAFETY_LIMIT_BYTES
    }
  })

  it('does not flip the safety cap when monthly transfer is under the limit', async () => {
    process.env.MONTHLY_TRANSFER_SAFETY_LIMIT_BYTES = String(250 * 1024 ** 3)
    const fresh = await createTestApp()
    try {
      const mod = await import('../../src/services/cleanupService.js')
      const freshDb = new Database(fresh.databasePath)
      try {
        freshDb
          .prepare(
            `INSERT INTO bandwidth_events (file_id, bytes, event_type, created_at)
             VALUES (NULL, ?, 'download', ?)`,
          )
          .run(5, new Date().toISOString())

        const summary = await mod.runCleanup()
        expect(summary.capTripped).toBe(false)

        const uploadsEnabled = (
          freshDb
            .prepare(`SELECT value FROM app_settings WHERE key = 'uploads_enabled'`)
            .get() as { value: string }
        ).value
        expect(uploadsEnabled).toBe('true')
      } finally {
        freshDb.close()
      }
    } finally {
      fresh.cleanup()
    }
  })
})

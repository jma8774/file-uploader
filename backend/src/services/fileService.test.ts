import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Point config at a throwaway dir before importing fileService so its module
// import doesn't touch the dev DB.
const baseDir = mkdtempSync(join(tmpdir(), 'filedrop-unit-'))
process.env.UPLOAD_DIR = join(baseDir, 'uploads')
process.env.DATABASE_PATH = join(baseDir, 'app.db')

let computeMaxDownloads: typeof import('./fileService.js').computeMaxDownloads
let isActive: typeof import('./fileService.js').isActive

beforeAll(async () => {
  const mod = await import('./fileService.js')
  computeMaxDownloads = mod.computeMaxDownloads
  isActive = mod.isActive
})

afterAll(() => {
  rmSync(baseDir, { recursive: true, force: true })
})

const PER_FILE_LIMIT = 2 * 1024 * 1024 * 1024

describe('computeMaxDownloads', () => {
  it('returns at least 1 for tiny files', () => {
    expect(computeMaxDownloads(1)).toBe(PER_FILE_LIMIT)
    expect(computeMaxDownloads(0)).toBe(1)
    expect(computeMaxDownloads(-5)).toBe(1)
  })

  it('matches the spec formula for ordinary files', () => {
    expect(computeMaxDownloads(10 * 1024 * 1024)).toBe(
      Math.floor(PER_FILE_LIMIT / (10 * 1024 * 1024)),
    )
    expect(computeMaxDownloads(100 * 1024 * 1024)).toBe(
      Math.floor(PER_FILE_LIMIT / (100 * 1024 * 1024)),
    )
  })

  it('floors to 1 when size exceeds the per-file cap', () => {
    expect(computeMaxDownloads(PER_FILE_LIMIT + 1)).toBe(1)
  })
})

describe('isActive', () => {
  const baseRow = {
    id: 'x',
    token: 't',
    original_name: 'a.txt',
    stored_name: 's',
    size_bytes: 1,
    mime_type: null,
    uploaded_at: '2026-05-10T00:00:00.000Z',
    expires_at: '2026-05-11T00:00:00.000Z',
    download_count: 0,
    max_downloads: 1,
    bytes_downloaded_estimate: 0,
    max_transfer_bytes: PER_FILE_LIMIT,
    is_deleted: 0,
    deleted_at: null,
  }

  it('returns true when not deleted and expires in the future', () => {
    expect(isActive(baseRow, '2026-05-10T12:00:00.000Z')).toBe(true)
  })

  it('returns false when expires_at is in the past', () => {
    expect(isActive(baseRow, '2026-05-12T00:00:00.000Z')).toBe(false)
  })

  it('returns false when is_deleted is 1', () => {
    expect(isActive({ ...baseRow, is_deleted: 1 }, '2026-05-10T12:00:00.000Z')).toBe(false)
  })
})

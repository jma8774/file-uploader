import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { vi } from 'vitest'
import type { Express } from 'express'

export interface TestApp {
  app: Express
  cleanup: () => void
  uploadDir: string
  databasePath: string
}

/**
 * Spin up a fully-isolated backend instance for a single test. Each call:
 *   - mkdtemp a per-test directory under os.tmpdir()
 *   - point DATABASE_PATH + UPLOAD_DIR at it
 *   - clear the module cache so config + db + middleware see the new env
 *   - dynamic-import app.ts to get a fresh createApp + a freshly migrated DB
 *
 * Returned cleanup() unlinks the temp dir.
 */
export async function createTestApp(): Promise<TestApp> {
  const baseDir = mkdtempSync(join(tmpdir(), 'filedrop-test-'))
  const uploadDir = join(baseDir, 'uploads')
  const databasePath = join(baseDir, 'app.db')

  process.env.UPLOAD_DIR = uploadDir
  process.env.DATABASE_PATH = databasePath
  // Each test starts with the rate-limit windows clean.
  vi.resetModules()

  const { createApp } = await import('../../src/app.js')
  const app = createApp()

  return {
    app,
    uploadDir,
    databasePath,
    cleanup: () => {
      try {
        rmSync(baseDir, { recursive: true, force: true })
      } catch {
        // ignore — temp cleanup is best-effort
      }
    },
  }
}

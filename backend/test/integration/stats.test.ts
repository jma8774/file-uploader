import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import request from 'supertest'
import { createTestApp, type TestApp } from '../helpers/createTestApp.js'

describe('GET /api/stats', () => {
  let ctx: TestApp

  beforeEach(async () => {
    ctx = await createTestApp()
  })
  afterEach(() => {
    ctx.cleanup()
  })

  it('returns zeros + configured limits on an empty DB', async () => {
    const res = await request(ctx.app).get('/api/stats')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      totalUploads: 0,
      totalDownloads: 0,
      activeFiles: 0,
      storageUsedBytes: 0,
      uploadsToday: 0,
      downloadsToday: 0,
      expiredFilesDeleted: 0,
      estimatedMonthlyTransferBytes: 0,
      uploadsEnabled: true,
      downloadsEnabled: true,
    })
    expect(res.body.storageLimitBytes).toBeGreaterThan(0)
    expect(res.body.monthlyTransferSafetyLimitBytes).toBeGreaterThan(0)
  })

  it('increments after an upload + a download', async () => {
    const upload = await request(ctx.app)
      .post('/api/upload')
      .attach('file', Buffer.from('hello'), 'h.txt')
    await request(ctx.app).get(`/d/${upload.body.token}`).expect(200)

    const stats = await request(ctx.app).get('/api/stats')
    expect(stats.body).toMatchObject({
      totalUploads: 1,
      totalDownloads: 1,
      activeFiles: 1,
      storageUsedBytes: 5,
      uploadsToday: 1,
      downloadsToday: 1,
    })
    expect(stats.body.estimatedMonthlyTransferBytes).toBeGreaterThanOrEqual(5)
  })

  it('reflects uploads_enabled=false flipped in app_settings', async () => {
    const db = new Database(ctx.databasePath)
    db.prepare(
      `UPDATE app_settings SET value = 'false' WHERE key = 'uploads_enabled'`,
    ).run()
    db.close()

    const res = await request(ctx.app).get('/api/stats')
    expect(res.body.uploadsEnabled).toBe(false)
    expect(res.body.downloadsEnabled).toBe(true)
  })
})

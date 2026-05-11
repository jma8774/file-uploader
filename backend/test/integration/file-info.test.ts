import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import request from 'supertest'
import { createTestApp, type TestApp } from '../helpers/createTestApp.js'

async function uploadSample(ctx: TestApp): Promise<string> {
  const res = await request(ctx.app)
    .post('/api/upload')
    .attach('file', Buffer.from('hi'), 'hi.txt')
  return res.body.token as string
}

describe('GET /api/file/:token', () => {
  let ctx: TestApp

  beforeEach(async () => {
    ctx = await createTestApp()
  })
  afterEach(() => {
    ctx.cleanup()
  })

  it('returns the active shape for a fresh upload', async () => {
    const token = await uploadSample(ctx)
    const res = await request(ctx.app).get(`/api/file/${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      status: 'active',
      token,
      originalName: 'hi.txt',
      sizeBytes: 2,
      downloadCount: 0,
    })
  })

  it('returns {status:"expired"} for an unknown token', async () => {
    const res = await request(ctx.app).get('/api/file/does-not-exist')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'expired' })
  })

  it('returns {status:"expired"} when expires_at is in the past', async () => {
    const token = await uploadSample(ctx)
    const db = new Database(ctx.databasePath)
    db.prepare('UPDATE files SET expires_at = ? WHERE token = ?').run(
      '2000-01-01T00:00:00.000Z',
      token,
    )
    db.close()

    const res = await request(ctx.app).get(`/api/file/${token}`)
    expect(res.body).toEqual({ status: 'expired' })
  })

  it('does not mutate download_count', async () => {
    const token = await uploadSample(ctx)
    await request(ctx.app).get(`/api/file/${token}`)
    await request(ctx.app).get(`/api/file/${token}`)

    const db = new Database(ctx.databasePath)
    const row = db
      .prepare('SELECT download_count FROM files WHERE token = ?')
      .get(token) as { download_count: number }
    db.close()
    expect(row.download_count).toBe(0)
  })
})

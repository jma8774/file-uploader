import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import request from 'supertest'
import { createTestApp, type TestApp } from '../helpers/createTestApp.js'

async function uploadFile(
  ctx: TestApp,
  contents = 'hello world',
  name = 'sample.txt',
): Promise<string> {
  const res = await request(ctx.app)
    .post('/api/upload')
    .attach('file', Buffer.from(contents), name)
  return res.body.token as string
}

describe('GET /d/:token', () => {
  let ctx: TestApp

  beforeEach(async () => {
    ctx = await createTestApp()
  })
  afterEach(() => {
    ctx.cleanup()
  })

  it('streams the file bytes with the original filename', async () => {
    const token = await uploadFile(ctx, 'hello world', 'greeting.txt')
    const res = await request(ctx.app)
      .get(`/d/${token}`)
      .buffer(true)
      .parse((response, cb) => {
        const chunks: Buffer[] = []
        response.on('data', (c: Buffer) => chunks.push(Buffer.from(c)))
        response.on('end', () => cb(null, Buffer.concat(chunks)))
      })

    expect(res.status).toBe(200)
    expect(res.headers['content-disposition']).toContain('greeting.txt')
    expect((res.body as Buffer).toString('utf8')).toBe('hello world')
  })

  it('increments download_count and inserts event rows', async () => {
    const token = await uploadFile(ctx)
    await request(ctx.app).get(`/d/${token}`)

    const db = new Database(ctx.databasePath)
    const row = db
      .prepare(
        'SELECT id, download_count, bytes_downloaded_estimate, size_bytes FROM files WHERE token = ?',
      )
      .get(token) as {
      id: string
      download_count: number
      bytes_downloaded_estimate: number
      size_bytes: number
    }
    expect(row.download_count).toBe(1)
    expect(row.bytes_downloaded_estimate).toBe(row.size_bytes)

    const downloadEvents = db
      .prepare('SELECT COUNT(*) AS c FROM download_events WHERE file_id = ?')
      .get(row.id) as { c: number }
    expect(downloadEvents.c).toBe(1)

    const bandwidthEvents = db
      .prepare('SELECT COUNT(*) AS c FROM bandwidth_events WHERE file_id = ?')
      .get(row.id) as { c: number }
    expect(bandwidthEvents.c).toBe(1)

    db.close()
  })

  it('returns 404 EXPIRED for an unknown token', async () => {
    const res = await request(ctx.app).get('/d/does-not-exist-token')
    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ error: 'EXPIRED' })
  })

  it('returns 403 MAX_DOWNLOADS_REACHED once the cap is hit', async () => {
    const token = await uploadFile(ctx)
    const db = new Database(ctx.databasePath)
    db.prepare('UPDATE files SET max_downloads = 1 WHERE token = ?').run(token)
    db.close()

    await request(ctx.app).get(`/d/${token}`).expect(200)
    const res = await request(ctx.app).get(`/d/${token}`)
    expect(res.status).toBe(403)
    expect(res.body).toMatchObject({ error: 'MAX_DOWNLOADS_REACHED' })
  })
})

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import request from 'supertest'
import { createTestApp, type TestApp } from '../helpers/createTestApp.js'

describe('POST /api/upload', () => {
  let ctx: TestApp

  beforeEach(async () => {
    ctx = await createTestApp()
  })
  afterEach(() => {
    ctx.cleanup()
  })

  it('returns the spec UploadResponse and writes the file to disk', async () => {
    const res = await request(ctx.app)
      .post('/api/upload')
      .attach('file', Buffer.from('hello'), 'hello.txt')

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      originalName: 'hello.txt',
      sizeBytes: 5,
    })
    expect(typeof res.body.token).toBe('string')
    expect(res.body.downloadPageUrl).toBe(`/file/${res.body.token}`)
    expect(res.body.directDownloadUrl).toBe(`/d/${res.body.token}`)

    // File on disk under <upload_dir>/YYYY-MM/<random>.bin
    const months = readdirSync(ctx.uploadDir)
    expect(months.length).toBe(1)
    const files = readdirSync(join(ctx.uploadDir, months[0]!))
    expect(files.length).toBe(1)
    expect(files[0]).toMatch(/^[0-9a-f]{24}\.bin$/)
  })

  it('rejects a file over MAX_UPLOAD_BYTES with 413 FILE_TOO_LARGE', async () => {
    process.env.MAX_UPLOAD_BYTES = String(1024)
    const fresh = await createTestApp()
    try {
      const res = await request(fresh.app)
        .post('/api/upload')
        .attach('file', Buffer.alloc(2048), 'big.bin')

      expect(res.status).toBe(413)
      expect(res.body).toMatchObject({ error: 'FILE_TOO_LARGE' })
    } finally {
      fresh.cleanup()
      process.env.MAX_UPLOAD_BYTES = String(100 * 1024 * 1024)
    }
  })

  it('returns 400 INTERNAL_ERROR when no file field is present', async () => {
    const res = await request(ctx.app).post('/api/upload').send()
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ error: 'INTERNAL_ERROR' })
  })

  it('leaves no on-disk file behind if rejected at the size limit', async () => {
    process.env.MAX_UPLOAD_BYTES = String(1024)
    const fresh = await createTestApp()
    try {
      await request(fresh.app)
        .post('/api/upload')
        .attach('file', Buffer.alloc(2048), 'big.bin')

      // Either no month dir exists, or it's empty.
      const months = existsSync(fresh.uploadDir) ? readdirSync(fresh.uploadDir) : []
      for (const m of months) {
        expect(readdirSync(join(fresh.uploadDir, m)).length).toBe(0)
      }
    } finally {
      fresh.cleanup()
      process.env.MAX_UPLOAD_BYTES = String(100 * 1024 * 1024)
    }
  })
})

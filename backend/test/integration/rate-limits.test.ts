import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import request from 'supertest'
import { createTestApp, type TestApp } from '../helpers/createTestApp.js'

describe('rate limits + safety cap', () => {
  let ctx: TestApp

  beforeEach(async () => {
    ctx = await createTestApp()
  })
  afterEach(() => {
    ctx.cleanup()
  })

  it('returns 429 RATE_LIMITED on the 6th upload from the same IP', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(ctx.app)
        .post('/api/upload')
        .attach('file', Buffer.from('x'), `f${i}.txt`)
      expect(res.status).toBe(200)
    }
    const res = await request(ctx.app)
      .post('/api/upload')
      .attach('file', Buffer.from('x'), 'sixth.txt')
    expect(res.status).toBe(429)
    expect(res.body).toMatchObject({ error: 'RATE_LIMITED' })
  })

  it('returns 429 on the 4th download of the same token from the same IP', async () => {
    const upload = await request(ctx.app)
      .post('/api/upload')
      .attach('file', Buffer.from('hi'), 'a.txt')
    const token = upload.body.token as string

    for (let i = 0; i < 3; i++) {
      await request(ctx.app).get(`/d/${token}`).expect(200)
    }
    const res = await request(ctx.app).get(`/d/${token}`)
    expect(res.status).toBe(429)
    expect(res.body).toMatchObject({ error: 'RATE_LIMITED' })
  })

  it('returns 503 UPLOADS_DISABLED when uploads_enabled is false', async () => {
    const db = new Database(ctx.databasePath)
    db.prepare(
      `UPDATE app_settings SET value = 'false' WHERE key = 'uploads_enabled'`,
    ).run()
    db.close()

    const res = await request(ctx.app)
      .post('/api/upload')
      .attach('file', Buffer.from('x'), 'a.txt')
    expect(res.status).toBe(503)
    expect(res.body).toMatchObject({ error: 'UPLOADS_DISABLED' })
  })

  it('returns 503 DOWNLOADS_DISABLED when downloads_enabled is false', async () => {
    const upload = await request(ctx.app)
      .post('/api/upload')
      .attach('file', Buffer.from('x'), 'a.txt')
    const token = upload.body.token as string

    const db = new Database(ctx.databasePath)
    db.prepare(
      `UPDATE app_settings SET value = 'false' WHERE key = 'downloads_enabled'`,
    ).run()
    db.close()

    const res = await request(ctx.app).get(`/d/${token}`)
    expect(res.status).toBe(503)
    expect(res.body).toMatchObject({ error: 'DOWNLOADS_DISABLED' })
  })
})

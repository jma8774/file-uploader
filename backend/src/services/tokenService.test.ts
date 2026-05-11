import { describe, expect, it } from 'vitest'
import {
  createStoredBaseName,
  createToken,
  currentMonthBucket,
} from './tokenService.js'

describe('createToken', () => {
  it('returns a base64url string', () => {
    const token = createToken()
    // 16 random bytes -> 22 char base64url with no padding
    expect(token).toMatch(/^[A-Za-z0-9_-]{22}$/)
  })

  it('produces a different token on each call', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 1000; i++) seen.add(createToken())
    expect(seen.size).toBe(1000)
  })
})

describe('createStoredBaseName', () => {
  it('returns a 24-char hex string', () => {
    const name = createStoredBaseName()
    expect(name).toMatch(/^[0-9a-f]{24}$/)
  })

  it('produces unique names across many calls', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 1000; i++) seen.add(createStoredBaseName())
    expect(seen.size).toBe(1000)
  })
})

describe('currentMonthBucket', () => {
  it('formats as YYYY-MM in UTC', () => {
    const date = new Date('2026-05-10T23:00:00.000Z')
    expect(currentMonthBucket(date)).toBe('2026-05')
  })

  it('pads single-digit months', () => {
    const date = new Date('2026-01-15T00:00:00.000Z')
    expect(currentMonthBucket(date)).toBe('2026-01')
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatTimeRemaining } from './formatTime'

const NOW = new Date('2026-05-10T12:00:00.000Z').getTime()

describe('formatTimeRemaining', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders an 18-hour gap as "Expires in 18 hours"', () => {
    const target = new Date(NOW + 18 * 60 * 60 * 1000).toISOString()
    expect(formatTimeRemaining(target)).toBe('Expires in 18 hours')
  })

  it('uses the singular form for exactly 1 hour', () => {
    const target = new Date(NOW + 60 * 60 * 1000).toISOString()
    expect(formatTimeRemaining(target)).toBe('Expires in 1 hour')
  })

  it('falls back to minutes under an hour', () => {
    const target = new Date(NOW + 23 * 60 * 1000).toISOString()
    expect(formatTimeRemaining(target)).toBe('Expires in 23 minutes')
  })

  it('falls back to seconds under a minute', () => {
    const target = new Date(NOW + 12 * 1000).toISOString()
    expect(formatTimeRemaining(target)).toBe('Expires in 12 seconds')
  })

  it('returns "Expired" for a past timestamp', () => {
    const target = new Date(NOW - 60 * 1000).toISOString()
    expect(formatTimeRemaining(target)).toBe('Expired')
  })

  it('returns "Expired" for an invalid date string', () => {
    expect(formatTimeRemaining('not a date')).toBe('Expired')
  })

  it('switches to days when >= 24 hours remain', () => {
    const target = new Date(NOW + 2 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatTimeRemaining(target)).toBe('Expires in 2 days')
  })
})

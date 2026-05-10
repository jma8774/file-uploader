import { describe, expect, it } from 'vitest'
import { formatBytes } from './formatBytes'

describe('formatBytes', () => {
  it('returns "0 B" for zero', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('handles a small byte count without decimals', () => {
    expect(formatBytes(500)).toBe('500 B')
  })

  it('renders 44,879,012 bytes as "42.8 MB"', () => {
    expect(formatBytes(44879012)).toBe('42.8 MB')
  })

  it('renders 1,932,735,283 bytes as "1.8 GB"', () => {
    expect(formatBytes(1932735283)).toBe('1.8 GB')
  })

  it('trims a trailing .0 for whole-number caps', () => {
    expect(formatBytes(6 * 1024 ** 3)).toBe('6 GB')
  })

  it('drops decimals at >= 100', () => {
    expect(formatBytes(250 * 1024 ** 3)).toBe('250 GB')
  })

  it('returns "0 B" for negative input', () => {
    expect(formatBytes(-1)).toBe('0 B')
  })

  it('returns "0 B" for NaN', () => {
    expect(formatBytes(Number.NaN)).toBe('0 B')
  })
})

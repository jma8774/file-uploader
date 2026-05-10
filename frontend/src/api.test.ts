import { describe, expect, it, vi } from 'vitest'
import { ApiError, getFileInfo, getStats, uploadFile } from './api'

function makeFile(sizeBytes: number, name = 'example.bin'): File {
  // jsdom's File constructor stores blob bytes; reading file.size requires content.
  const bytes = new Uint8Array(sizeBytes)
  return new File([bytes], name, { type: 'application/octet-stream' })
}

describe('uploadFile', () => {
  it('rejects with FILE_TOO_LARGE for files over the limit', async () => {
    const tooBig = makeFile(101 * 1024 * 1024)
    await expect(uploadFile(tooBig)).rejects.toBeInstanceOf(ApiError)
    await expect(uploadFile(tooBig)).rejects.toMatchObject({
      error: 'FILE_TOO_LARGE',
    })
  })

  it('calls onProgress repeatedly and resolves at 100', async () => {
    const file = makeFile(2048, 'small.txt')
    const ticks: number[] = []
    const result = await uploadFile(file, (pct) => ticks.push(pct))
    expect(ticks.length).toBeGreaterThanOrEqual(2)
    expect(ticks[ticks.length - 1]).toBe(100)
    expect(result.originalName).toBe('small.txt')
    expect(result.sizeBytes).toBe(2048)
    expect(result.downloadPageUrl).toBe(`/file/${result.token}`)
  })
})

describe('getFileInfo', () => {
  it('returns the expired shape for a token containing "expired"', async () => {
    const response = await getFileInfo('expired-test')
    expect(response.status).toBe('expired')
  })

  it('throws an ApiError for a token containing "error"', async () => {
    await expect(getFileInfo('error-test')).rejects.toBeInstanceOf(ApiError)
  })

  it('returns active metadata for a normal token', async () => {
    const response = await getFileInfo('abc123')
    expect(response.status).toBe('active')
    if (response.status === 'active') {
      expect(response.token).toBe('abc123')
      expect(response.sizeBytes).toBeGreaterThan(0)
    }
  })
})

describe('getStats', () => {
  it('resolves with numeric totals and a storage limit', async () => {
    const stats = await getStats()
    expect(typeof stats.totalUploads).toBe('number')
    expect(typeof stats.totalDownloads).toBe('number')
    expect(stats.storageLimitBytes).toBeGreaterThan(0)
    expect(stats.uploadsEnabled).toBe(true)
  })

  it('bumps totals after a successful upload', async () => {
    const before = await getStats()
    await uploadFile(makeFile(1024, 'bump.txt'))
    const after = await getStats()
    expect(after.totalUploads).toBe(before.totalUploads + 1)
  })
})

// Silence the EMULATED console.log from FileUploader when run as part of a wider
// suite. (Not used here directly but harmless to set globally.)
vi.spyOn(console, 'log').mockImplementation(() => {})

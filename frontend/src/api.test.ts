import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { ApiError, getFileInfo, getStats, uploadFile } from './api'

function makeFile(sizeBytes: number, name = 'sample.bin'): File {
  return new File([new Uint8Array(sizeBytes)], name, {
    type: 'application/octet-stream',
  })
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('uploadFile', () => {
  let postSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    postSpy = vi.spyOn(axios, 'post')
  })
  afterEach(() => {
    postSpy.mockRestore()
  })

  it('returns the parsed body on success and fires onProgress', async () => {
    postSpy.mockImplementationOnce(async (..._args: unknown[]) => {
      const config = _args[2] as { onUploadProgress?: (e: { loaded: number; total: number }) => void } | undefined
      config?.onUploadProgress?.({ loaded: 50, total: 100 })
      return {
        data: {
          token: 'tok',
          downloadPageUrl: '/file/tok',
          directDownloadUrl: '/d/tok',
          originalName: 'sample.bin',
          sizeBytes: 100,
          expiresAt: '2030-01-01T00:00:00.000Z',
          maxDownloads: 21,
        },
      }
    })

    const ticks: number[] = []
    const result = await uploadFile(makeFile(100), (pct) => ticks.push(pct))

    expect(result.token).toBe('tok')
    expect(ticks).toContain(50)
    expect(ticks[ticks.length - 1]).toBe(100)
  })

  it('maps a 413 FILE_TOO_LARGE response to ApiError', async () => {
    const { AxiosError } = await import('axios')
    const axiosError = new AxiosError('Request failed', 'ERR_BAD_REQUEST')
    axiosError.response = {
      status: 413,
      statusText: 'Payload Too Large',
      headers: {},
      config: {} as any,
      data: { error: 'FILE_TOO_LARGE', message: 'File is too large. Max size is 100 MB.' },
    }
    postSpy.mockRejectedValueOnce(axiosError)

    let caught: unknown
    try {
      await uploadFile(makeFile(1))
    } catch (err) {
      caught = err
    }
    expect(caught).toBeInstanceOf(ApiError)
    expect(caught).toMatchObject({ error: 'FILE_TOO_LARGE' })
  })

  it('maps a network failure to INTERNAL_ERROR', async () => {
    postSpy.mockRejectedValueOnce(new Error('Network down'))
    await expect(uploadFile(makeFile(1))).rejects.toMatchObject({
      error: 'INTERNAL_ERROR',
      message: 'Upload failed. Please try again.',
    })
  })
})

describe('getFileInfo', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('returns the active shape for a 200 active response', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(200, {
        status: 'active',
        token: 'abc',
        originalName: 'x.zip',
        sizeBytes: 1024,
        uploadedAt: '2026-05-10T12:00:00.000Z',
        expiresAt: '2026-05-11T12:00:00.000Z',
        downloadCount: 0,
        maxDownloads: 200,
      }),
    )
    const response = await getFileInfo('abc')
    expect(response.status).toBe('active')
  })

  it('returns the expired shape for a 200 expired response', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(200, { status: 'expired' }))
    const response = await getFileInfo('whatever')
    expect(response.status).toBe('expired')
  })

  it('throws ApiError on a 500', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(500, { error: 'INTERNAL_ERROR', message: 'boom' }),
    )
    await expect(getFileInfo('x')).rejects.toBeInstanceOf(ApiError)
  })
})

describe('getStats', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('returns the parsed body', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(200, {
        totalUploads: 1,
        totalDownloads: 2,
        activeFiles: 1,
        storageUsedBytes: 1024,
        storageLimitBytes: 6 * 1024 ** 3,
        uploadsToday: 1,
        downloadsToday: 2,
        expiredFilesDeleted: 0,
        estimatedMonthlyTransferBytes: 2048,
        monthlyTransferSafetyLimitBytes: 250 * 1024 ** 3,
        uploadsEnabled: true,
        downloadsEnabled: true,
      }),
    )
    const stats = await getStats()
    expect(stats.totalUploads).toBe(1)
    expect(stats.uploadsEnabled).toBe(true)
  })

  it('throws ApiError when the network rejects', async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(getStats()).rejects.toBeInstanceOf(ApiError)
  })
})

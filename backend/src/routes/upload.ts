import { Router, type Request, type Response, type NextFunction } from 'express'
import multer, { MulterError } from 'multer'
import { mkdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { nanoid } from 'nanoid'
import { config } from '../config.js'
import {
  computeExpiresAt,
  computeMaxDownloads,
  insertFile,
} from '../services/fileService.js'
import {
  createStoredBaseName,
  createToken,
  currentMonthBucket,
} from '../services/tokenService.js'

export const uploadRouter = Router()

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const bucket = currentMonthBucket()
    const dir = join(config.uploadDir, bucket)
    try {
      await mkdir(dir, { recursive: true })
      cb(null, dir)
    } catch (err) {
      cb(err as Error, dir)
    }
  },
  filename: (_req, _file, cb) => {
    cb(null, `${createStoredBaseName()}.bin`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadBytes, files: 1 },
})

uploadRouter.post(
  '/upload',
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err: unknown) => {
      if (!err) return next()
      if (err instanceof MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'FILE_TOO_LARGE',
          message: 'File is too large. Max size is 100 MB.',
        })
      }
      console.error('[upload] multer error', err)
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Upload failed. Please try again.',
      })
    })
  },
  async (req: Request, res: Response) => {
    const file = req.file
    if (!file) {
      return res.status(400).json({
        error: 'INTERNAL_ERROR',
        message: 'No file uploaded.',
      })
    }

    const storedName = `${currentMonthBucket()}/${file.filename}`
    const uploadedAt = new Date()
    const sizeBytes = file.size
    const token = createToken()
    const id = nanoid()
    const maxDownloads = computeMaxDownloads(sizeBytes)
    const expiresAt = computeExpiresAt(uploadedAt)

    try {
      insertFile({
        id,
        token,
        originalName: file.originalname,
        storedName,
        sizeBytes,
        mimeType: file.mimetype || null,
        uploadedAt: uploadedAt.toISOString(),
        expiresAt,
        maxDownloads,
        maxTransferBytes: config.perFileTransferLimitBytes,
      })
    } catch (err) {
      // Clean up the on-disk file so a failed insert doesn't leave an orphan.
      try {
        await unlink(file.path)
      } catch (cleanupErr) {
        console.error('[upload] orphan cleanup failed', cleanupErr)
      }
      console.error('[upload] insert failed', err)
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Upload failed. Please try again.',
      })
    }

    res.json({
      token,
      downloadPageUrl: `/file/${token}`,
      directDownloadUrl: `/d/${token}`,
      originalName: file.originalname,
      sizeBytes,
      expiresAt,
      maxDownloads,
    })
  },
)

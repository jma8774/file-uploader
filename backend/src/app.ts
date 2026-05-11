import express, { type Express } from 'express'
import './db.js' // open + migrate + seed on import
import { healthRouter } from './routes/health.js'
import { uploadRouter } from './routes/upload.js'
import { fileInfoRouter } from './routes/fileInfo.js'
import { downloadRouter } from './routes/download.js'
import { statsRouter } from './routes/stats.js'

export function createApp(): Express {
  const app = express()
  app.set('trust proxy', 1)
  app.use(express.json())
  app.use('/api', healthRouter)
  app.use('/api', uploadRouter)
  app.use('/api', fileInfoRouter)
  app.use('/api', statsRouter)
  app.use('/d', downloadRouter)
  return app
}

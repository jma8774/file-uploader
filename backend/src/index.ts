import express from 'express'
import { config } from './config.js'
import './db.js' // open + migrate + seed on import
import { healthRouter } from './routes/health.js'
import { uploadRouter } from './routes/upload.js'
import { fileInfoRouter } from './routes/fileInfo.js'

const app = express()
app.use(express.json())
app.use('/api', healthRouter)
app.use('/api', uploadRouter)
app.use('/api', fileInfoRouter)

app.listen(config.port, () => {
  console.log(
    `FileDrop backend listening on ${config.publicBaseUrl} (env=${config.nodeEnv})`,
  )
  console.log(`  upload dir:    ${config.uploadDir}`)
  console.log(`  database path: ${config.databasePath}`)
})

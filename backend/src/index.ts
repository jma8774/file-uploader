import express from 'express'
import { config, ensureDirs } from './config.js'
import { healthRouter } from './routes/health.js'

ensureDirs()

const app = express()
app.use(express.json())
app.use('/api', healthRouter)

app.listen(config.port, () => {
  console.log(
    `FileDrop backend listening on ${config.publicBaseUrl} (env=${config.nodeEnv})`,
  )
  console.log(`  upload dir:    ${config.uploadDir}`)
  console.log(`  database path: ${config.databasePath}`)
})

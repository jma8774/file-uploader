import { config } from './config.js'
import { createApp } from './app.js'
import { startCleanupLoop } from './services/cleanupService.js'

const app = createApp()

app.listen(config.port, () => {
  console.log(
    `FileDrop backend listening on ${config.publicBaseUrl} (env=${config.nodeEnv})`,
  )
  console.log(`  upload dir:    ${config.uploadDir}`)
  console.log(`  database path: ${config.databasePath}`)
  startCleanupLoop()
})

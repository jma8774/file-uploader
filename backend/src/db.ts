import BetterSqlite3 from 'better-sqlite3'
import { config } from './config.js'
import { runMigrations } from './migrations/runner.js'

export const db = new BetterSqlite3(config.databasePath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

runMigrations(db)

seedAppSettings()

function seedAppSettings(): void {
  const insertIfMissing = db.prepare(
    'INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)',
  )
  insertIfMissing.run('uploads_enabled', 'true')
  insertIfMissing.run('downloads_enabled', 'true')
  insertIfMissing.run('storage_limit_bytes', String(config.storageLimitBytes))
  insertIfMissing.run(
    'monthly_transfer_safety_limit_bytes',
    String(config.monthlyTransferSafetyLimitBytes),
  )
}

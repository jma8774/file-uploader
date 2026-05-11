import { db } from '../db.js'

const selectStmt = db.prepare<[string], { value: string }>(
  'SELECT value FROM app_settings WHERE key = ?',
)
const upsertStmt = db.prepare(
  `INSERT INTO app_settings (key, value) VALUES (?, ?)
   ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
)

export function getSetting(key: string): string | undefined {
  return selectStmt.get(key)?.value
}

export function setSetting(key: string, value: string): void {
  upsertStmt.run(key, value)
}

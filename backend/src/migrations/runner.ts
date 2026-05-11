import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type Database from 'better-sqlite3'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Migrations live at backend/migrations/, two levels up from src/migrations/runner.ts.
// We resolve relative to the source file so dev (tsx) and prod (dist/) both find them.
const MIGRATIONS_DIR = resolve(__dirname, '..', '..', 'migrations')

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `)

  const applied = new Set(
    db
      .prepare<[], { version: string }>('SELECT version FROM schema_migrations')
      .all()
      .map((row) => row.version),
  )

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort()

  const insertVersion = db.prepare(
    'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
  )

  for (const file of files) {
    if (applied.has(file)) continue
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8')
    const apply = db.transaction(() => {
      db.exec(sql)
      insertVersion.run(file, new Date().toISOString())
    })
    apply()
    console.log(`[migrations] applied ${file}`)
  }
}

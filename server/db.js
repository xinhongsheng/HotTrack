import initSqlJs from 'sql.js'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, 'data')
const dbPath = join(dataDir, 'hottrack.db')

mkdirSync(dataDir, { recursive: true })

let db = null

export async function initDB() {
  const SQL = await initSqlJs()

  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run('PRAGMA foreign_keys = ON')

  db.run(`
    CREATE TABLE IF NOT EXISTS keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS hot_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT,
      source TEXT NOT NULL,
      summary TEXT,
      ai_score REAL DEFAULT 0,
      ai_analysis TEXT,
      keyword_id INTEGER,
      is_notified INTEGER DEFAULT 0,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE SET NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hot_topic_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hot_topic_id) REFERENCES hot_topics(id) ON DELETE CASCADE
    )
  `)

  try {
    db.run('CREATE INDEX IF NOT EXISTS idx_hot_topics_source ON hot_topics(source)')
    db.run('CREATE INDEX IF NOT EXISTS idx_hot_topics_keyword ON hot_topics(keyword_id)')
    db.run('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)')
  } catch {}

  saveDB()
  return db
}

export function getDB() {
  if (!db) throw new Error('Database not initialized. Call initDB() first.')
  return db
}

export function saveDB() {
  if (!db) return
  const data = db.export()
  writeFileSync(dbPath, Buffer.from(data))
}

// Query helpers that return plain objects
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

export function queryOne(sql, params = []) {
  const rows = queryAll(sql, params)
  return rows[0] || null
}

export function runSQL(sql, params = []) {
  db.run(sql, params)
  saveDB()
  return {
    lastInsertRowid: db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] || 0,
    changes: db.getRowsModified(),
  }
}

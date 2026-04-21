import BetterSqlite3 from 'better-sqlite3';
import { config } from '../config';
import * as fs from 'fs';
import * as path from 'path';

let db: BetterSqlite3.Database;

export function initDatabase(): BetterSqlite3.Database {
  // Ensure data directory exists
  const dir = path.dirname(config.db.path);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new BetterSqlite3(config.db.path);
  db.pragma('journal_mode = WAL');

  createTables();
  return db;
}

export function getDb(): BetterSqlite3.Database {
  if (!db) {
    return initDatabase();
  }
  return db;
}

function createTables(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS llm_config (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      api_key TEXT NOT NULL,
      base_url TEXT NOT NULL,
      model TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS skill_store (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      intent TEXT NOT NULL,
      code TEXT NOT NULL,
      input_schema TEXT DEFAULT '{}',
      output_schema TEXT DEFAULT '{}',
      version INTEGER DEFAULT 1,
      enabled INTEGER DEFAULT 1,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS operation_log (
      id TEXT PRIMARY KEY,
      operator TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      result TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS llm_call_log (
      id TEXT PRIMARY KEY,
      model_name TEXT NOT NULL,
      intent TEXT,
      user_input TEXT,
      response_time INTEGER,
      result TEXT NOT NULL,
      request_params TEXT,
      response_content TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}
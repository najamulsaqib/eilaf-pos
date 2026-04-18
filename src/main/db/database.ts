import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

let db: any | null = null;

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function getDb(): any {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'eilaf-pos.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

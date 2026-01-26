import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 1;
const DATABASE_NAME = 'dodo.db';

/**
 * Initialize the database schema
 * This function is called when the database is first opened
 */
export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  // Enable WAL mode for better performance
  await db.execAsync('PRAGMA journal_mode = WAL');
  
  // Check current database version
  const versionResult = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = versionResult?.user_version || 0;

  // If database is already at current version, skip migration
  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  // Create tables if they don't exist
  if (currentVersion === 0) {
    // Create todos table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        notes TEXT,
        completed_at TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        focused_at TEXT,
        time_spent INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Create habits table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        entries TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Create indexes for better query performance
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_todos_order ON todos("order");
      CREATE INDEX IF NOT EXISTS idx_todos_completed_at ON todos(completed_at);
      CREATE INDEX IF NOT EXISTS idx_habits_order ON habits("order");
    `);
  }

  // Update database version
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

/**
 * Get the database instance
 * This will be used with SQLiteProvider in the app
 */
export function getDatabaseName(): string {
  return DATABASE_NAME;
}

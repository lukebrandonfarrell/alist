import { Habit } from '@/types/habit';
import type { SQLiteDatabase } from 'expo-sqlite';

interface HabitRow {
  id: string;
  name: string;
  entries: string; // JSON string
  created_at: string;
  order: number;
}

/**
 * Load all habits from SQLite database
 */
export async function loadHabits(db: SQLiteDatabase): Promise<Habit[]> {
  try {
    const rows = await db.getAllAsync<HabitRow>(
      'SELECT * FROM habits ORDER BY "order" ASC'
    );
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      entries: JSON.parse(row.entries) as string[],
      createdAt: row.created_at,
      order: row.order,
    }));
  } catch (error) {
    console.error('Error loading habits:', error);
    return [];
  }
}

/**
 * Save a single habit (insert or update)
 */
export async function saveHabit(db: SQLiteDatabase, habit: Habit): Promise<void> {
  try {
    await db.runAsync(
      `INSERT INTO habits (id, name, entries, created_at, "order", updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         entries = excluded.entries,
         "order" = excluded."order",
         updated_at = datetime('now')`,
      habit.id,
      habit.name,
      JSON.stringify(habit.entries),
      habit.createdAt,
      habit.order
    );
  } catch (error) {
    console.error('Error saving habit:', error);
    throw error;
  }
}

/**
 * Delete a habit by ID
 */
export async function deleteHabit(db: SQLiteDatabase, id: string): Promise<void> {
  try {
    await db.runAsync('DELETE FROM habits WHERE id = ?', id);
  } catch (error) {
    console.error('Error deleting habit:', error);
    throw error;
  }
}

/**
 * Update a habit by ID (partial update)
 */
export async function updateHabit(
  db: SQLiteDatabase,
  id: string,
  updates: Partial<Habit>
): Promise<void> {
  try {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.entries !== undefined) {
      fields.push('entries = ?');
      values.push(JSON.stringify(updates.entries));
    }
    if (updates.order !== undefined) {
      fields.push('"order" = ?');
      values.push(updates.order);
    }

    if (fields.length === 0) {
      return; // No updates to make
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    await db.runAsync(
      `UPDATE habits SET ${fields.join(', ')} WHERE id = ?`,
      ...values
    );
  } catch (error) {
    console.error('Error updating habit:', error);
    throw error;
  }
}

/**
 * Save multiple habits in a transaction
 * Useful for reordering operations
 */
export async function saveHabits(db: SQLiteDatabase, habits: Habit[]): Promise<void> {
  try {
    await db.withTransactionAsync(async () => {
      for (const habit of habits) {
        await saveHabit(db, habit);
      }
    });
  } catch (error) {
    console.error('Error saving habits:', error);
    throw error;
  }
}

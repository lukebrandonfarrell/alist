import { Todo } from '@/types/todo';
import type { SQLiteDatabase } from 'expo-sqlite';

interface TodoRow {
  id: string;
  name: string;
  notes: string | null;
  completed_at: string | null;
  order: number;
  focused_at: string | null;
  time_spent: number | null;
}

/**
 * Load all todos from SQLite database
 */
export async function loadTodos(db: SQLiteDatabase): Promise<Todo[]> {
  try {
    const rows = await db.getAllAsync<TodoRow>(
      'SELECT * FROM todos ORDER BY "order" ASC'
    );
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      notes: row.notes || undefined,
      completedAt: row.completed_at,
      order: row.order,
      focusedAt: row.focused_at,
      timeSpent: row.time_spent,
    }));
  } catch (error) {
    console.error('Error loading todos:', error);
    return [];
  }
}

/**
 * Save a single todo (insert or update)
 */
export async function saveTodo(db: SQLiteDatabase, todo: Todo): Promise<void> {
  try {
    await db.runAsync(
      `INSERT INTO todos (id, name, notes, completed_at, "order", focused_at, time_spent, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         notes = excluded.notes,
         completed_at = excluded.completed_at,
         "order" = excluded."order",
         focused_at = excluded.focused_at,
         time_spent = excluded.time_spent,
         updated_at = datetime('now')`,
      todo.id,
      todo.name,
      todo.notes || null,
      todo.completedAt || null,
      todo.order,
      todo.focusedAt || null,
      todo.timeSpent || null
    );
  } catch (error) {
    console.error('Error saving todo:', error);
    throw error;
  }
}

/**
 * Delete a todo by ID
 */
export async function deleteTodo(db: SQLiteDatabase, id: string): Promise<void> {
  try {
    await db.runAsync('DELETE FROM todos WHERE id = ?', id);
  } catch (error) {
    console.error('Error deleting todo:', error);
    throw error;
  }
}

/**
 * Update a todo by ID (partial update)
 */
export async function updateTodo(
  db: SQLiteDatabase,
  id: string,
  updates: Partial<Todo>
): Promise<void> {
  try {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes || null);
    }
    if (updates.completedAt !== undefined) {
      fields.push('completed_at = ?');
      values.push(updates.completedAt || null);
    }
    if (updates.order !== undefined) {
      fields.push('"order" = ?');
      values.push(updates.order);
    }
    if (updates.focusedAt !== undefined) {
      fields.push('focused_at = ?');
      values.push(updates.focusedAt || null);
    }
    if (updates.timeSpent !== undefined) {
      fields.push('time_spent = ?');
      values.push(updates.timeSpent || null);
    }

    if (fields.length === 0) {
      return; // No updates to make
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    await db.runAsync(
      `UPDATE todos SET ${fields.join(', ')} WHERE id = ?`,
      ...values
    );
  } catch (error) {
    console.error('Error updating todo:', error);
    throw error;
  }
}

/**
 * Save multiple todos in a transaction
 * Useful for reordering operations
 */
export async function saveTodos(db: SQLiteDatabase, todos: Todo[]): Promise<void> {
  try {
    await db.withTransactionAsync(async () => {
      // Clear all todos first (for reordering scenarios)
      // Actually, let's not do this - we'll use upsert instead
      for (const todo of todos) {
        await saveTodo(db, todo);
      }
    });
  } catch (error) {
    console.error('Error saving todos:', error);
    throw error;
  }
}

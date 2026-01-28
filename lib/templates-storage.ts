import { TaskTemplate } from '@/types/task-template';
import type { SQLiteDatabase } from 'expo-sqlite';

interface TemplateRow {
  id: string;
  name: string;
  notes: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Load all templates from SQLite database
 */
export async function loadTemplates(db: SQLiteDatabase): Promise<TaskTemplate[]> {
  try {
    const rows = await db.getAllAsync<TemplateRow>(
      'SELECT * FROM task_templates ORDER BY "order" ASC'
    );
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      notes: row.notes || undefined,
      order: row.order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error('Error loading templates:', error);
    return [];
  }
}

/**
 * Save a single template (insert or update)
 */
export async function saveTemplate(db: SQLiteDatabase, template: TaskTemplate): Promise<void> {
  try {
    await db.runAsync(
      `INSERT INTO task_templates (id, name, notes, "order", created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         notes = excluded.notes,
         "order" = excluded."order",
         updated_at = datetime('now')`,
      template.id,
      template.name,
      template.notes || null,
      template.order,
      template.createdAt || new Date().toISOString()
    );
  } catch (error) {
    console.error('Error saving template:', error);
    throw error;
  }
}

/**
 * Delete a template by ID
 */
export async function deleteTemplate(db: SQLiteDatabase, id: string): Promise<void> {
  try {
    await db.runAsync('DELETE FROM task_templates WHERE id = ?', id);
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

/**
 * Update a template by ID (partial update)
 */
export async function updateTemplate(
  db: SQLiteDatabase,
  id: string,
  updates: Partial<TaskTemplate>
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
      `UPDATE task_templates SET ${fields.join(', ')} WHERE id = ?`,
      ...values
    );
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}

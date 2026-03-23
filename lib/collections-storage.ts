import { Collection, CollectionItem } from '@/types/collection';
import type { SQLiteDatabase } from 'expo-sqlite';

interface CollectionRow {
  id: string;
  name: string;
  completed_at: string | null;
  order: number;
}

interface CollectionItemRow {
  id: string;
  collection_id: string;
  name: string;
  description: string | null;
  completed_at: string | null;
  order: number;
}

/**
 * Load all collections from SQLite database
 */
export async function loadCollections(db: SQLiteDatabase): Promise<Collection[]> {
  try {
    const rows = await db.getAllAsync<CollectionRow>(
      'SELECT id, name, completed_at, "order" FROM collections ORDER BY "order" ASC'
    );
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      completedAt: row.completed_at,
      order: row.order,
    }));
  } catch (error) {
    console.error('Error loading collections:', error);
    return [];
  }
}

/**
 * Save a single collection (insert or update)
 */
export async function saveCollection(db: SQLiteDatabase, collection: Collection): Promise<void> {
  try {
    await db.runAsync(
      `INSERT INTO collections (id, name, completed_at, "order", updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         completed_at = excluded.completed_at,
         "order" = excluded."order",
         updated_at = datetime('now')`,
      collection.id,
      collection.name,
      collection.completedAt || null,
      collection.order
    );
  } catch (error) {
    console.error('Error saving collection:', error);
    throw error;
  }
}

/**
 * Delete a collection by ID
 */
export async function deleteCollection(db: SQLiteDatabase, id: string): Promise<void> {
  try {
    await db.runAsync('DELETE FROM collection_items WHERE collection_id = ?', id);
    await db.runAsync('DELETE FROM collections WHERE id = ?', id);
  } catch (error) {
    console.error('Error deleting collection:', error);
    throw error;
  }
}

/**
 * Update a collection by ID (partial update)
 */
export async function updateCollection(
  db: SQLiteDatabase,
  id: string,
  updates: Partial<Collection>
): Promise<void> {
  try {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.completedAt !== undefined) {
      fields.push('completed_at = ?');
      values.push(updates.completedAt || null);
    }
    if (updates.order !== undefined) {
      fields.push('"order" = ?');
      values.push(updates.order);
    }

    if (fields.length === 0) {
      return;
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    await db.runAsync(
      `UPDATE collections SET ${fields.join(', ')} WHERE id = ?`,
      ...values
    );
  } catch (error) {
    console.error('Error updating collection:', error);
    throw error;
  }
}

/**
 * Load all items for a collection
 */
export async function loadCollectionItems(
  db: SQLiteDatabase,
  collectionId: string
): Promise<CollectionItem[]> {
  try {
    const rows = await db.getAllAsync<CollectionItemRow>(
      'SELECT id, collection_id, name, description, completed_at, "order" FROM collection_items WHERE collection_id = ? ORDER BY "order" ASC',
      collectionId
    );
    return rows.map(row => ({
      id: row.id,
      collectionId: row.collection_id,
      name: row.name,
      description: row.description || undefined,
      completedAt: row.completed_at,
      order: row.order,
    }));
  } catch (error) {
    console.error('Error loading collection items:', error);
    return [];
  }
}

/**
 * Save a single collection item (insert or update)
 */
export async function saveCollectionItem(
  db: SQLiteDatabase,
  item: CollectionItem
): Promise<void> {
  try {
    await db.runAsync(
      `INSERT INTO collection_items (id, collection_id, name, description, completed_at, "order", updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         description = excluded.description,
         completed_at = excluded.completed_at,
         "order" = excluded."order",
         updated_at = datetime('now')`,
      item.id,
      item.collectionId,
      item.name,
      item.description || null,
      item.completedAt || null,
      item.order
    );
  } catch (error) {
    console.error('Error saving collection item:', error);
    throw error;
  }
}

/**
 * Delete a collection item by ID
 */
export async function deleteCollectionItem(db: SQLiteDatabase, id: string): Promise<void> {
  try {
    await db.runAsync('DELETE FROM collection_items WHERE id = ?', id);
  } catch (error) {
    console.error('Error deleting collection item:', error);
    throw error;
  }
}

/**
 * Update a collection item by ID (partial update)
 */
export async function updateCollectionItem(
  db: SQLiteDatabase,
  id: string,
  updates: Partial<CollectionItem>
): Promise<void> {
  try {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description || null);
    }
    if (updates.completedAt !== undefined) {
      fields.push('completed_at = ?');
      values.push(updates.completedAt || null);
    }
    if (updates.order !== undefined) {
      fields.push('"order" = ?');
      values.push(updates.order);
    }

    if (fields.length === 0) {
      return;
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    await db.runAsync(
      `UPDATE collection_items SET ${fields.join(', ')} WHERE id = ?`,
      ...values
    );
  } catch (error) {
    console.error('Error updating collection item:', error);
    throw error;
  }
}

import {
  loadCollectionItems,
  loadCollections,
  saveCollection,
  saveCollectionItem,
  deleteCollection as deleteCollectionFromDb,
  deleteCollectionItem as deleteCollectionItemFromDb,
  updateCollection as updateCollectionInDb,
  updateCollectionItem as updateCollectionItemInDb,
} from '@/lib/collections-storage';
import { Collection, CollectionItem } from '@/types/collection';
import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface CollectionsContextType {
  collections: Collection[];
  loading: boolean;
  createCollection: (name: string) => Promise<void>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  completeCollection: (id: string) => Promise<void>;
  restoreCollection: (id: string) => Promise<void>;
  getItemsForCollection: (collectionId: string) => CollectionItem[];
  loadItemsForCollection: (collectionId: string) => Promise<void>;
  createCollectionItem: (collectionId: string, name: string, description?: string) => Promise<void>;
  updateCollectionItem: (id: string, updates: Partial<CollectionItem>) => Promise<void>;
  deleteCollectionItem: (id: string) => Promise<void>;
  completeCollectionItem: (id: string) => Promise<void>;
  restoreCollectionItem: (id: string) => Promise<void>;
}

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined);

export function CollectionsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsByCollectionId, setItemsByCollectionId] = useState<Record<string, CollectionItem[]>>({});

  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadCollections(db);
        setCollections(loaded);
      } catch (error) {
        console.error('Error loading collections:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [db]);

  const createCollection = useCallback(async (name: string) => {
    const maxOrder =
      collections.length > 0 ? Math.max(...collections.map(c => c.order)) : -1;
    const newCollection: Collection = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      completedAt: null,
      order: maxOrder + 1,
    };
    await saveCollection(db, newCollection);
    setCollections([...collections, newCollection]);
  }, [collections, db]);

  const updateCollection = useCallback(async (id: string, updates: Partial<Collection>) => {
    await updateCollectionInDb(db, id, updates);
    setCollections(collections.map(c => (c.id === id ? { ...c, ...updates } : c)));
  }, [collections, db]);

  const deleteCollection = useCallback(async (id: string) => {
    await deleteCollectionFromDb(db, id);
    setCollections(collections.filter(c => c.id !== id));
    setItemsByCollectionId(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, [collections, db]);

  const completeCollection = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    await updateCollectionInDb(db, id, { completedAt: now });
    setCollections(collections.map(c => (c.id === id ? { ...c, completedAt: now } : c)));
  }, [collections, db]);

  const restoreCollection = useCallback(async (id: string) => {
    await updateCollectionInDb(db, id, { completedAt: null });
    setCollections(collections.map(c => (c.id === id ? { ...c, completedAt: null } : c)));
  }, [collections, db]);

  const loadItemsForCollection = useCallback(async (collectionId: string) => {
    const items = await loadCollectionItems(db, collectionId);
    setItemsByCollectionId(prev => ({ ...prev, [collectionId]: items }));
  }, [db]);

  const getItemsForCollection = useCallback((collectionId: string): CollectionItem[] => {
    return itemsByCollectionId[collectionId] ?? [];
  }, [itemsByCollectionId]);

  const createCollectionItem = useCallback(
    async (collectionId: string, name: string, description?: string) => {
      const existing = itemsByCollectionId[collectionId] ?? [];
      const maxOrder = existing.length > 0 ? Math.max(...existing.map(i => i.order)) : -1;
      const newItem: CollectionItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        collectionId,
        name,
        description,
        completedAt: null,
        order: maxOrder + 1,
      };
      await saveCollectionItem(db, newItem);
      setItemsByCollectionId(prev => ({
        ...prev,
        [collectionId]: [...(prev[collectionId] ?? []), newItem],
      }));
    },
    [itemsByCollectionId, db]
  );

  const updateCollectionItem = useCallback(
    async (id: string, updates: Partial<CollectionItem>) => {
      await updateCollectionItemInDb(db, id, updates);
      setItemsByCollectionId(prev => {
        const next = { ...prev };
        for (const collectionId of Object.keys(next)) {
          const items = next[collectionId];
          const idx = items.findIndex(i => i.id === id);
          if (idx !== -1) {
            next[collectionId] = items.map(i =>
              i.id === id ? { ...i, ...updates } : i
            );
            break;
          }
        }
        return next;
      });
    },
    [db]
  );

  const deleteCollectionItem = useCallback(async (id: string) => {
    await deleteCollectionItemFromDb(db, id);
    setItemsByCollectionId(prev => {
      const next = { ...prev };
      for (const collectionId of Object.keys(next)) {
        if (next[collectionId].some(i => i.id === id)) {
          next[collectionId] = next[collectionId].filter(i => i.id !== id);
          break;
        }
      }
      return next;
    });
  }, [db]);

  const completeCollectionItem = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    await updateCollectionItem(id, { completedAt: now });
  }, [updateCollectionItem]);

  const restoreCollectionItem = useCallback(async (id: string) => {
    await updateCollectionItem(id, { completedAt: null });
  }, [updateCollectionItem]);

  return (
    <CollectionsContext.Provider
      value={{
        collections,
        loading,
        createCollection,
        updateCollection,
        deleteCollection,
        completeCollection,
        restoreCollection,
        getItemsForCollection,
        loadItemsForCollection,
        createCollectionItem,
        updateCollectionItem,
        deleteCollectionItem,
        completeCollectionItem,
        restoreCollectionItem,
      }}
    >
      {children}
    </CollectionsContext.Provider>
  );
}

export function useCollections() {
  const context = useContext(CollectionsContext);
  if (context === undefined) {
    throw new Error('useCollections must be used within a CollectionsProvider');
  }
  return context;
}

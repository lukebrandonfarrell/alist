import { deleteTemplate as deleteTemplateFromDb, loadTemplates, saveTemplate, updateTemplate as updateTemplateInDb } from '@/lib/templates-storage';
import { TaskTemplate } from '@/types/task-template';
import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface TemplatesContextType {
  templates: TaskTemplate[];
  loading: boolean;
  createTemplate: (name: string, notes?: string) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<TaskTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  reorderTemplates: (fromIndex: number, toIndex: number) => Promise<void>;
}

const TemplatesContext = createContext<TemplatesContextType | undefined>(undefined);

export function TemplatesProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadTemplates(db);
        setTemplates(loaded);
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [db]);

  const createTemplate = useCallback(async (name: string, notes?: string) => {
    const maxOrder = templates.length > 0 
      ? Math.max(...templates.map(t => t.order))
      : -1;
    
    const newTemplate: TaskTemplate = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      notes,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveTemplate(db, newTemplate);
    setTemplates([...templates, newTemplate]);
  }, [templates, db]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<TaskTemplate>) => {
    await updateTemplateInDb(db, id, updates);
    const updated = templates.map(t => 
      t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    );
    setTemplates(updated);
  }, [templates, db]);

  const deleteTemplate = useCallback(async (id: string) => {
    await deleteTemplateFromDb(db, id);
    const filtered = templates.filter(t => t.id !== id);
    setTemplates(filtered);
  }, [templates, db]);

  const reorderTemplates = useCallback(async (fromIndex: number, toIndex: number) => {
    const reordered = [...templates];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    // Update order for all templates
    const reorderedTemplates = reordered.map((t, idx) => ({ ...t, order: idx }));
    
    // Save all reordered templates in a transaction
    await db.withTransactionAsync(async () => {
      for (const template of reorderedTemplates) {
        await saveTemplate(db, template);
      }
    });

    setTemplates(reorderedTemplates);
  }, [templates, db]);

  return (
    <TemplatesContext.Provider
      value={{
        templates,
        loading,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        reorderTemplates,
      }}
    >
      {children}
    </TemplatesContext.Provider>
  );
}

export function useTemplates() {
  const context = useContext(TemplatesContext);
  if (context === undefined) {
    throw new Error('useTemplates must be used within a TemplatesProvider');
  }
  return context;
}

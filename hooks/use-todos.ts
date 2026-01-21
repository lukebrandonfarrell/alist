import { useState, useEffect, useCallback } from 'react';
import { Todo } from '@/types/todo';
import { loadTodos, saveTodos } from '@/lib/storage';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const loaded = await loadTodos();
      setTodos(loaded);
      setLoading(false);
    })();
  }, []);

  const persistTodos = useCallback(async (newTodos: Todo[]) => {
    setTodos(newTodos);
    await saveTodos(newTodos);
  }, []);

  const createTodo = useCallback(async (name: string, notes?: string) => {
    const activeTodos = todos.filter(t => t.completedAt === null);
    const maxOrder = activeTodos.length > 0 
      ? Math.max(...activeTodos.map(t => t.order))
      : -1;
    
    const newTodo: Todo = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      notes,
      completedAt: null,
      order: maxOrder + 1,
    };

    await persistTodos([...todos, newTodo]);
  }, [todos, persistTodos]);

  const updateTodo = useCallback(async (id: string, updates: Partial<Todo>) => {
    const updated = todos.map(t => 
      t.id === id ? { ...t, ...updates } : t
    );
    await persistTodos(updated);
  }, [todos, persistTodos]);

  const deleteTodo = useCallback(async (id: string) => {
    const filtered = todos.filter(t => t.id !== id);
    await persistTodos(filtered);
  }, [todos, persistTodos]);

  const completeTodo = useCallback(async (id: string) => {
    const updated = todos.map(t => 
      t.id === id ? { ...t, completedAt: new Date().toISOString() } : t
    );
    await persistTodos(updated);
  }, [todos, persistTodos]);

  const restoreTodo = useCallback(async (id: string) => {
    const activeTodos = todos.filter(t => t.completedAt === null);
    const maxOrder = activeTodos.length > 0 
      ? Math.max(...activeTodos.map(t => t.order))
      : -1;
    
    const updated = todos.map(t => 
      t.id === id ? { ...t, completedAt: null, order: maxOrder + 1 } : t
    );
    await persistTodos(updated);
  }, [todos, persistTodos]);

  const reorderTodos = useCallback(async (fromIndex: number, toIndex: number) => {
    const activeTodos = todos
      .filter(t => t.completedAt === null)
      .sort((a, b) => a.order - b.order);
    
    const [moved] = activeTodos.splice(fromIndex, 1);
    activeTodos.splice(toIndex, 0, moved);

    // Update order for all active todos
    const reorderedActive = activeTodos.map((t, idx) => ({ ...t, order: idx }));
    const completedTodos = todos.filter(t => t.completedAt !== null);
    
    await persistTodos([...reorderedActive, ...completedTodos]);
  }, [todos, persistTodos]);

  return {
    todos,
    loading,
    createTodo,
    updateTodo,
    deleteTodo,
    completeTodo,
    restoreTodo,
    reorderTodos,
  };
}

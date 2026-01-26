import { createTodoLiveActivityUI } from '@/components/todo/todo-live-activity';
import { deleteTodo as deleteTodoFromDb, loadTodos, saveTodo, updateTodo as updateTodoInDb } from '@/lib/storage';
import { Todo } from '@/types/todo';
import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { addVoltraListener, startLiveActivity, stopLiveActivity } from 'voltra/client';

interface TodosContextType {
  todos: Todo[];
  loading: boolean;
  createTodo: (name: string, notes?: string, insertIndex?: number) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  completeTodo: (id: string) => Promise<void>;
  restoreTodo: (id: string) => Promise<void>;
  reorderTodos: (fromIndex: number, toIndex: number) => Promise<void>;
  focusTodo: (id: string) => Promise<void>;
  unfocusTodo: (id: string) => Promise<void>;
}

const TodosContext = createContext<TodosContextType | undefined>(undefined);

export function TodosProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const activityIdsRef = useRef<Map<string, string>>(new Map()); // Maps todo ID -> activity ID
  const todoIdsByActivityRef = useRef<Map<string, string>>(new Map()); // Maps activity ID -> todo ID
  const activityNamesRef = useRef<Map<string, string>>(new Map()); // Maps todo ID -> activity name

  /**
   * Get the activity name for a todo
   */
  const getActivityName = useCallback((todoId: string) => {
    return `focused-task-${todoId}`;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadTodos(db);
        setTodos(loaded);
      } catch (error) {
        console.error('Error loading todos:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [db]);

  const createTodo = useCallback(async (name: string, notes?: string, insertIndex?: number) => {
    const activeTodos = todos
      .filter(t => t.completedAt === null)
      .sort((a, b) => a.order - b.order);
    
    const newTodo: Todo = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      notes,
      completedAt: null,
      order: 0, // Will be set based on insertIndex
      focusedAt: null,
      timeSpent: null,
    };

    if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= activeTodos.length) {
      // Insert at specific index
      const updatedActiveTodos = [...activeTodos];
      updatedActiveTodos.splice(insertIndex, 0, newTodo);
      
      // Reorder all active todos
      const reorderedActive = updatedActiveTodos.map((t, idx) => ({ ...t, order: idx }));
      
      // Save all reordered todos
      await db.withTransactionAsync(async () => {
        for (const todo of reorderedActive) {
          await saveTodo(db, todo);
        }
      });
      
      // Update state
      const completedTodos = todos.filter(t => t.completedAt !== null);
      setTodos([...reorderedActive, ...completedTodos]);
    } else {
      // Append to end (original behavior)
      const maxOrder = activeTodos.length > 0 
        ? Math.max(...activeTodos.map(t => t.order))
        : -1;
      
      newTodo.order = maxOrder + 1;
      await saveTodo(db, newTodo);
      setTodos([...todos, newTodo]);
    }
  }, [todos, db]);

  const updateTodo = useCallback(async (id: string, updates: Partial<Todo>) => {
    await updateTodoInDb(db, id, updates);
    const updated = todos.map(t => 
      t.id === id ? { ...t, ...updates } : t
    );
    setTodos(updated);
  }, [todos, db]);

  const deleteTodo = useCallback(async (id: string) => {
    // Stop the Live Activity if the task being deleted has one
    if (Platform.OS === 'ios') {
      const activityId = activityIdsRef.current.get(id);
      
      // Check if activity exists in our refs
      if (activityId) {
        try {
          // Try to stop the activity - it's safe to stop even if already stopped
          await stopLiveActivity(activityId, {
            dismissalPolicy: { after: 0 }, // Dismiss immediately
          });
          console.log('Live Activity stopped for deleted todo:', id);
        } catch (error) {
          // Activity might already be stopped or not exist - that's okay
          console.log('Live Activity stop attempt (may already be stopped):', error);
        }
        // Always clear activity references
        const activityName = activityNamesRef.current.get(id);
        todoIdsByActivityRef.current.delete(activityId);
        activityIdsRef.current.delete(id);
        if (activityName) {
          activityNamesRef.current.delete(id);
        }
      }
    }

    await deleteTodoFromDb(db, id);
    const filtered = todos.filter(t => t.id !== id);
    setTodos(filtered);
  }, [todos, db]);

  const completeTodo = useCallback(async (id: string) => {
    const now = new Date();
    
    // Stop the Live Activity if task was focused
    if (Platform.OS === 'ios') {
      const activityId = activityIdsRef.current.get(id);
      
      // Check if activity exists in our refs
      if (activityId) {
        try {
          // Try to stop the activity - it's safe to stop even if already stopped
          await stopLiveActivity(activityId, {
            dismissalPolicy: { after: 0 }, // Dismiss immediately
          });
          console.log('Live Activity stopped for completed todo:', id);
        } catch (error) {
          // Activity might already be stopped or not exist - that's okay
          console.log('Live Activity stop attempt (may already be stopped):', error);
        }
        // Always clear activity references
        const activityName = activityNamesRef.current.get(id);
        todoIdsByActivityRef.current.delete(activityId);
        activityIdsRef.current.delete(id);
        if (activityName) {
          activityNamesRef.current.delete(id);
        }
      }
    }

    // Load current todos from storage to avoid stale state issues
    // This is critical when the app is backgrounded and state might be stale
    const currentTodos = await loadTodos(db);
    
    const todo = currentTodos.find(t => t.id === id);
    if (!todo) return;

    let timeSpent = null;
    // If task was focused, calculate time spent
    if (todo.focusedAt) {
      const focusedTime = new Date(todo.focusedAt).getTime();
      const completedTime = now.getTime();
      timeSpent = Math.floor((completedTime - focusedTime) / 1000); // Time in seconds
    }

    await updateTodoInDb(db, id, {
      completedAt: now.toISOString(),
      timeSpent,
      focusedAt: null, // Clear focus when completing
    });

    const updated = todos.map(t => 
      t.id === id ? {
        ...t,
        completedAt: now.toISOString(),
        timeSpent,
        focusedAt: null,
      } : t
    );
    setTodos(updated);
  }, [todos, db]);

  const restoreTodo = useCallback(async (id: string) => {
    const activeTodos = todos.filter(t => t.completedAt === null);
    const maxOrder = activeTodos.length > 0 
      ? Math.max(...activeTodos.map(t => t.order))
      : -1;
    
    await updateTodoInDb(db, id, {
      completedAt: null,
      order: maxOrder + 1,
      focusedAt: null,
      timeSpent: null,
    });

    const updated = todos.map(t => 
      t.id === id ? { 
        ...t, 
        completedAt: null, 
        order: maxOrder + 1,
        focusedAt: null,
        timeSpent: null,
      } : t
    );
    setTodos(updated);
  }, [todos, db]);

  // Set up Voltra interaction listener for Live Activity buttons
  // This must be after completeTodo is defined
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const subscription = addVoltraListener('interaction', (event) => {
      console.log('Live Activity interaction:', event.identifier);
      console.log('Payload:', event.payload);

      // Handle done button interactions
      if (event.identifier?.startsWith('done-button-')) {
        const todoId = event.identifier.replace('done-button-', '');
        console.log('Done button pressed for todo:', todoId);
        console.log('Activity ID in refs:', activityIdsRef.current.get(todoId));
        console.log('Activity name in refs:', activityNamesRef.current.get(todoId));
        
        // Complete the todo (which will also stop the Live Activity)
        completeTodo(todoId)
          .then(() => {
            console.log('Todo completed successfully from Live Activity');
          })
          .catch((error) => {
            console.error('Failed to complete todo from Live Activity:', error);
          });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [completeTodo]); // Depend on completeTodo so we have access to it

  const focusTodo = useCallback(async (id: string) => {
    // Focus the selected todo (allow multiple tasks to be focused)
    const todo = todos.find(t => t.id === id && !t.completedAt);
    if (!todo) return;

    const focusedAt = new Date().toISOString();
    const startAtMs = Date.now();

    await updateTodoInDb(db, id, { focusedAt });

    const updated = todos.map(t => {
      if (t.id === id && !t.completedAt) {
        return { ...t, focusedAt };
      }
      return t;
    });
    setTodos(updated);

    // Start live activity on iOS
    if (Platform.OS === 'ios') {
      // Use factory function to create UI - this avoids React component rendering issues
      const activityUI = createTodoLiveActivityUI({
        todo,
        startAtMs,
        onComplete: async () => {
          // Complete the todo when Done button is pressed
          await completeTodo(id);
        },
      });

      try {
        const activityName = getActivityName(id);
        const activityId = await startLiveActivity({
          lockScreen: activityUI,
        });
        // Store mappings: todo ID -> activity ID, activity ID -> todo ID, and todo ID -> activity name
        activityIdsRef.current.set(id, activityId);
        todoIdsByActivityRef.current.set(activityId, id);
        activityNamesRef.current.set(id, activityName);
      } catch (error) {
        console.error('Failed to start live activity:', error);
      }
    }
  }, [todos, completeTodo, getActivityName]);

  const unfocusTodo = useCallback(async (id: string) => {
    await updateTodoInDb(db, id, { focusedAt: null });

    const updated = todos.map(t => 
      t.id === id ? { ...t, focusedAt: null } : t
    );
    setTodos(updated);

    // Stop the Live Activity when focus is cancelled
    if (Platform.OS === 'ios') {
      const activityId = activityIdsRef.current.get(id);
      
      // Check if activity exists in our refs
      if (activityId) {
        try {
          // Try to stop the activity - it's safe to stop even if already stopped
          await stopLiveActivity(activityId, {
            dismissalPolicy: { after: 0 }, // Dismiss immediately
          });
          console.log('Live Activity stopped for unfocused todo:', id);
        } catch (error) {
          // Activity might already be stopped or not exist - that's okay
          console.log('Live Activity stop attempt (may already be stopped):', error);
        }
        // Always clear activity references
        const activityName = activityNamesRef.current.get(id);
        todoIdsByActivityRef.current.delete(activityId);
        activityIdsRef.current.delete(id);
        if (activityName) {
          activityNamesRef.current.delete(id);
        }
      }
    }
  }, [todos]);

  const reorderTodos = useCallback(async (fromIndex: number, toIndex: number) => {
    const activeTodos = todos
      .filter(t => t.completedAt === null)
      .sort((a, b) => a.order - b.order);
    
    const [moved] = activeTodos.splice(fromIndex, 1);
    activeTodos.splice(toIndex, 0, moved);

    // Update order for all active todos
    const reorderedActive = activeTodos.map((t, idx) => ({ ...t, order: idx }));
    
    // Save all reordered todos in a transaction
    await db.withTransactionAsync(async () => {
      for (const todo of reorderedActive) {
        await saveTodo(db, todo);
      }
    });

    const completedTodos = todos.filter(t => t.completedAt !== null);
    setTodos([...reorderedActive, ...completedTodos]);
  }, [todos, db]);

  return (
    <TodosContext.Provider
      value={{
        todos,
        loading,
        createTodo,
        updateTodo,
        deleteTodo,
        completeTodo,
        restoreTodo,
        reorderTodos,
        focusTodo,
        unfocusTodo,
      }}
    >
      {children}
    </TodosContext.Provider>
  );
}

export function useTodos() {
  const context = useContext(TodosContext);
  if (context === undefined) {
    throw new Error('useTodos must be used within a TodosProvider');
  }
  return context;
}

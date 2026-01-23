import { createTodoLiveActivityUI } from '@/components/todo/todo-live-activity';
import { loadTodos, saveTodos } from '@/lib/storage';
import { Todo } from '@/types/todo';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { addVoltraListener, startLiveActivity, stopLiveActivity } from 'voltra/client';

interface TodosContextType {
  todos: Todo[];
  loading: boolean;
  createTodo: (name: string, notes?: string) => Promise<void>;
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
      focusedAt: null,
      timeSpent: null,
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

    const filtered = todos.filter(t => t.id !== id);
    await persistTodos(filtered);
  }, [todos, persistTodos]);

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

    const updated = todos.map(t => {
      if (t.id === id) {
        let timeSpent = null;
        // If task was focused, calculate time spent
        if (t.focusedAt) {
          const focusedTime = new Date(t.focusedAt).getTime();
          const completedTime = now.getTime();
          timeSpent = Math.floor((completedTime - focusedTime) / 1000); // Time in seconds
        }
        return {
          ...t,
          completedAt: now.toISOString(),
          timeSpent,
          focusedAt: null, // Clear focus when completing
        };
      }
      return t;
    });
    await persistTodos(updated);
  }, [todos, persistTodos]);

  const restoreTodo = useCallback(async (id: string) => {
    const activeTodos = todos.filter(t => t.completedAt === null);
    const maxOrder = activeTodos.length > 0 
      ? Math.max(...activeTodos.map(t => t.order))
      : -1;
    
    const updated = todos.map(t => 
      t.id === id ? { 
        ...t, 
        completedAt: null, 
        order: maxOrder + 1,
        focusedAt: null,
        timeSpent: null,
      } : t
    );
    await persistTodos(updated);
  }, [todos, persistTodos]);

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

    const updated = todos.map(t => {
      if (t.id === id && !t.completedAt) {
        return { ...t, focusedAt };
      }
      return t;
    });
    await persistTodos(updated);

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
  }, [todos, persistTodos, completeTodo, getActivityName]);

  const unfocusTodo = useCallback(async (id: string) => {
    const updated = todos.map(t => 
      t.id === id ? { ...t, focusedAt: null } : t
    );
    await persistTodos(updated);

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

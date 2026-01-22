import { Todo } from '@/types/todo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@todos';

export async function loadTodos(): Promise<Todo[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    const todos = JSON.parse(json) as Todo[];
    // Migrate old todos to include new fields
    const migratedTodos = todos.map(todo => ({
      ...todo,
      focusedAt: todo.focusedAt ?? null,
      timeSpent: todo.timeSpent ?? null,
    }));
    return migratedTodos.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error loading todos:', error);
    return [];
  }
}

export async function saveTodos(todos: Todo[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.error('Error saving todos:', error);
  }
}

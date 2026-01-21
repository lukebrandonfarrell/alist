import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo } from '@/types/todo';

const STORAGE_KEY = '@todos';

export async function loadTodos(): Promise<Todo[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    const todos = JSON.parse(json) as Todo[];
    return todos.sort((a, b) => a.order - b.order);
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

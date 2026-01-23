import { Habit } from '@/types/habit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@habits';

export async function loadHabits(): Promise<Habit[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    const habits = JSON.parse(json) as Habit[];
    return habits.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error loading habits:', error);
    return [];
  }
}

export async function saveHabits(habits: Habit[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  } catch (error) {
    console.error('Error saving habits:', error);
  }
}

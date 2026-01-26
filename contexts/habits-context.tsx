import { loadHabits, saveHabit, deleteHabit as deleteHabitFromDb, updateHabit as updateHabitInDb } from '@/lib/habits-storage';
import { Habit } from '@/types/habit';
import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface HabitsContextType {
  habits: Habit[];
  loading: boolean;
  createHabit: (name: string) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitEntry: (id: string, date: Date) => Promise<void>;
  reorderHabits: (fromIndex: number, toIndex: number) => Promise<void>;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

export function HabitsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadHabits(db);
        setHabits(loaded);
      } catch (error) {
        console.error('Error loading habits:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [db]);

  const createHabit = useCallback(async (name: string) => {
    const activeHabits = habits.filter(h => h.order !== undefined);
    const maxOrder = activeHabits.length > 0 
      ? Math.max(...activeHabits.map(h => h.order))
      : -1;
    
    const newHabit: Habit = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      entries: [],
      createdAt: new Date().toISOString(),
      order: maxOrder + 1,
    };

    await saveHabit(db, newHabit);
    setHabits([...habits, newHabit]);
  }, [habits, db]);

  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    await updateHabitInDb(db, id, updates);
    const updated = habits.map(h => 
      h.id === id ? { ...h, ...updates } : h
    );
    setHabits(updated);
  }, [habits, db]);

  const deleteHabit = useCallback(async (id: string) => {
    await deleteHabitFromDb(db, id);
    const filtered = habits.filter(h => h.id !== id);
    setHabits(filtered);
  }, [habits, db]);

  const toggleHabitEntry = useCallback(async (id: string, date: Date) => {
    const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const hasEntry = habit.entries.some(entry => {
      const entryDate = new Date(entry);
      const entryDateKey = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate()).toISOString();
      return entryDateKey === dateKey;
    });

    const updatedEntries = hasEntry
      ? habit.entries.filter(entry => {
          const entryDate = new Date(entry);
          const entryDateKey = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate()).toISOString();
          return entryDateKey !== dateKey;
        })
      : [...habit.entries, date.toISOString()];

    await updateHabit(id, { entries: updatedEntries });
  }, [habits, updateHabit]);

  const reorderHabits = useCallback(async (fromIndex: number, toIndex: number) => {
    const sortedHabits = [...habits].sort((a, b) => a.order - b.order);
    const [moved] = sortedHabits.splice(fromIndex, 1);
    sortedHabits.splice(toIndex, 0, moved);

    // Update order for all habits
    const reordered = sortedHabits.map((h, idx) => ({ ...h, order: idx }));
    
    // Save all reordered habits in a transaction
    await db.withTransactionAsync(async () => {
      for (const habit of reordered) {
        await saveHabit(db, habit);
      }
    });

    setHabits(reordered);
  }, [habits, db]);

  return (
    <HabitsContext.Provider
      value={{
        habits,
        loading,
        createHabit,
        updateHabit,
        deleteHabit,
        toggleHabitEntry,
        reorderHabits,
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits() {
  const context = useContext(HabitsContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitsProvider');
  }
  return context;
}

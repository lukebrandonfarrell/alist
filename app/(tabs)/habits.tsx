import { EmptyState } from '@/components/todo/empty-state';
import { HabitForm } from '@/components/habit/habit-form';
import { HabitItem } from '@/components/habit/habit-item';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useHabits } from '@/contexts/habits-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Habit } from '@/types/habit';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HabitsScreen() {
  const { habits, loading, createHabit, updateHabit, deleteHabit, toggleHabitEntry } = useHabits();
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, +1 = next week
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  // Calculate week number of the year for a given date (week starts on Sunday)
  // Week 1 starts on the first Sunday of January (or January 1st if it's a Sunday)
  const getWeekNumber = (date: Date): number => {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 6 = Saturday
    const diff = d.getDate() - day; // Get Sunday of this week
    const sunday = new Date(d);
    sunday.setDate(diff);
    
    // Determine which year this week belongs to (use Thursday to handle cross-year weeks)
    const thursday = new Date(sunday);
    thursday.setDate(sunday.getDate() + 4); // Thursday is 4 days after Sunday
    const year = thursday.getFullYear(); // Use the year that contains Thursday
    
    // Find the first Sunday of January for that year
    // If Jan 1 is Sunday, that's Week 1. Otherwise, find the first Sunday in January
    const jan1 = new Date(year, 0, 1);
    const jan1Day = jan1.getDay(); // Day of week for Jan 1 (0 = Sunday)
    
    let firstJanSunday: Date;
    if (jan1Day === 0) {
      // Jan 1 is Sunday, so that's Week 1
      firstJanSunday = new Date(jan1);
    } else {
      // Find the first Sunday of January
      firstJanSunday = new Date(jan1);
      firstJanSunday.setDate(jan1.getDate() + (7 - jan1Day)); // Add days to get to next Sunday
    }
    
    // Calculate difference in milliseconds, then convert to days
    const diffTime = sunday.getTime() - firstJanSunday.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculate week number (1-indexed)
    const weekNum = Math.floor(diffDays / 7) + 1;
    
    // If the Sunday is before the first Sunday of January, it's part of the previous year's last week
    // In this case, we should still count it relative to the current year's first Sunday
    // (it will be week 0 or negative, which we'll handle)
    if (weekNum < 1) {
      // This week is before the first Sunday of January, so it's Week 52/53 of previous year
      // But for display purposes, we'll show it as Week 1 if it's very close
      return 1;
    }
    
    // Ensure week number is valid (should be between 1 and 53)
    return Math.max(1, Math.min(53, weekNum));
  };

  // Get the date for the Sunday of the week based on offset
  const getWeekSunday = (offset: number): Date => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, 6 = Saturday
    const diff = today.getDate() - day; // Get Sunday of this week
    const sunday = new Date(today);
    sunday.setDate(diff);
    sunday.setDate(sunday.getDate() + (offset * 7)); // Add/subtract weeks
    return sunday;
  };

  const currentWeekSunday = getWeekSunday(weekOffset);
  const weekNumber = getWeekNumber(currentWeekSunday);
  const currentYear = new Date().getFullYear();
  // Use Thursday to determine which year the week belongs to
  const thursday = new Date(currentWeekSunday);
  thursday.setDate(currentWeekSunday.getDate() + 4);
  const weekYear = thursday.getFullYear();
  const showYear = weekYear !== currentYear;

  const handlePreviousWeek = () => {
    setWeekOffset(weekOffset - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset(weekOffset + 1);
  };

  const handleTodayWeek = () => {
    setWeekOffset(0);
  };

  const handleCreate = async (name: string) => {
    await createHabit(name);
  };

  const handleEdit = async (name: string) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, { name });
      setEditingHabit(null);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteHabit(id);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Habits</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.tint }]}
          onPress={() => {
            setEditingHabit(null);
            setFormVisible(true);
          }}
        >
          <IconSymbol name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.weekNavigation, { borderBottomColor: colors.icon + '20' }]}>
        <TouchableOpacity
          style={styles.weekNavButton}
          onPress={handlePreviousWeek}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.icon} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.weekLabelContainer}
          onPress={handleTodayWeek}
        >
          <Text style={[styles.weekLabel, { color: colors.text }]}>
            Week {weekNumber}{showYear ? ` ${weekYear}` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.weekNavButton}
          onPress={handleNextWeek}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="chevron.right" size={20} color={colors.icon} />
        </TouchableOpacity>
      </View>

      {habits.length === 0 ? (
        <EmptyState
          title="No habits yet"
          message="Tap the + button to create your first habit"
        />
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {habits.map((habit) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              weekOffset={weekOffset}
              onToggleEntry={(date) => toggleHabitEntry(habit.id, date)}
              onEdit={() => {
                setEditingHabit(habit);
                setFormVisible(true);
              }}
              onDelete={() => handleDelete(habit.id)}
            />
          ))}
        </ScrollView>
      )}

      <HabitForm
        visible={formVisible}
        habit={editingHabit}
        onClose={() => {
          setFormVisible(false);
          setEditingHabit(null);
        }}
        onSubmit={editingHabit ? handleEdit : handleCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  weekNavButton: {
    padding: 8,
  },
  weekLabelContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
});

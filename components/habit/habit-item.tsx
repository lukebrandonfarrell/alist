import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Habit } from '@/types/habit';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HabitItemProps {
  habit: Habit;
  weekOffset?: number; // 0 = current week, -1 = last week, +1 = next week
  onToggleEntry: (date: Date) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function HabitItem({ habit, weekOffset = 0, onToggleEntry, onEdit, onDelete }: HabitItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Get the week's dates (Sunday to Saturday) based on weekOffset
  const getWeekDates = () => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, 6 = Saturday
    const diff = today.getDate() - day; // Get Sunday of this week
    const sunday = new Date(today);
    sunday.setDate(diff);
    sunday.setDate(sunday.getDate() + (weekOffset * 7)); // Add/subtract weeks
    
    const weekDates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const weekDates = getWeekDates();
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const hasEntryForDate = (date: Date): boolean => {
    const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    return habit.entries.some(entry => {
      const entryDate = new Date(entry);
      const entryDateKey = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate()).toISOString();
      return entryDateKey === dateKey;
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isFuture = (date: Date): boolean => {
    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return dateOnly.getTime() > todayOnly.getTime();
  };

  const handleTodayCheck = () => {
    const today = new Date();
    onToggleEntry(today);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Habit?',
      `Are you sure you want to delete "${habit.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={onEdit}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol 
              name="square.and.pencil" 
              size={16} 
              color={colors.icon} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol 
              name="trash" 
              size={16} 
              color="#e53935" 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkButton}
            onPress={handleTodayCheck}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
              <IconSymbol 
                name="checkmark.circle" 
                size={20} 
                color='#34C759' 
              />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.weekRow}>
        {weekDates.map((date, index) => {
          const hasEntry = hasEntryForDate(date);
          const today = isToday(date);
          const future = isFuture(date);
          
          return (
            <TouchableOpacity
              key={index}
              style={[styles.dayContainer, future && styles.disabledDay]}
              onPress={() => !future && onToggleEntry(date)}
              disabled={future}
            >
              <View
                style={[
                  styles.circle,
                  {
                    backgroundColor: hasEntry ? colors.tint : 'transparent',
                    borderColor: today ? colors.tint : (future ? colors.icon : colors.icon),
                    borderWidth: hasEntry ? 0 : (today ? 2 : 1),
                    opacity: future ? 0.4 : 1,
                  },
                ]}
              >
                {hasEntry && (
                  <IconSymbol name="checkmark" size={12} color="#fff" />
                )}
              </View>
              <Text style={[
                styles.dayLabel, 
                { color: colors.icon }, 
                today && { color: colors.tint },
                future && { opacity: 0.4 }
              ]}>
                {dayLabels[index]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'stretch',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  checkButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayContainer: {
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  disabledDay: {
    opacity: 0.4,
  },
});

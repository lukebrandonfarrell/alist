import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Todo } from '@/types/todo';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TodoItemProps {
  todo: Todo;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
  onFocus: () => void;
  onUnfocus: () => void;
  isActive?: boolean;
  canDrag?: boolean;
  onDrag?: () => void; 
}

export function TodoItem({
  todo,
  onEdit,
  onDelete,
  onToggleComplete,
  onFocus,
  onUnfocus,
  isActive,
  canDrag = true,
  onDrag,
}: TodoItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isCompleted = todo.completedAt !== null;
  const isFocused = todo.focusedAt !== null && !isCompleted;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const handlePress = () => {
    if (isFocused) {
      Alert.alert(
        'Cancel Focus?',
        'The counted time will be lost. Are you sure you want to cancel focus?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Yes, Cancel Focus',
            style: 'destructive',
            onPress: onUnfocus,
          },
        ]
      );
    } else {
      onFocus();
    }
  };

  // Timer effect for focused tasks
  useEffect(() => {
    if (!isFocused) {
      setElapsedSeconds(0);
      return;
    }

    const startTime = new Date(todo.focusedAt!).getTime();
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed);
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isFocused, todo.focusedAt]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: isFocused ? colors.tint : colors.background,
        },
        isActive && styles.activeContainer,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isCompleted}
    >
      {isFocused && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
        </View>
      )}
      {isCompleted && todo.timeSpent !== null && (
        <View style={styles.timerContainer}>
          <Text style={styles.completedTimeText}>{formatTime(todo.timeSpent)}</Text>
        </View>
      )}
      <View style={styles.topRow}>
        {canDrag && (
          <TouchableOpacity disabled={!canDrag} onPressIn={onDrag} style={styles.dragHandleContainer}>
            <IconSymbol 
              name="line.3.horizontal" 
              size={24} 
              color={isFocused ? '#fff' : '#999'} 
            />
          </TouchableOpacity>
        )}
        
        <View style={styles.content}>
          <Text
            style={[
              styles.name,
              { color: isFocused ? '#fff' : colors.text },
              isCompleted && styles.completedText,
            ]}
          >
            {todo.name}
          </Text>
          {todo.notes && (
            <Text
              style={[
                styles.notes,
                { color: isFocused ? '#fff' : colors.icon },
                isCompleted && styles.completedText,
              ]}
            >
              {todo.notes}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={onEdit}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol 
            name="pencil" 
            size={16} 
            color={isFocused ? '#fff' : colors.icon} 
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol 
            name="trash" 
            size={16} 
            color={isFocused ? '#fff' : '#e53935'} 
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.checkbox,
          ]}
          onPress={onToggleComplete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isCompleted ? (
            <IconSymbol name="checkmark.circle.fill" size={20} color="#6E52E2" />
          ) : (
            <IconSymbol 
              name="checkmark.circle" 
              size={20} 
              color={isFocused ? '#fff' : '#999'} 
            />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
  activeContainer: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dragHandleContainer: {
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  timerContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.9,
  },
  completedTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6E52E2',
    opacity: 0.8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  checkbox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
});

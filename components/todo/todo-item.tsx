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

export const TodoItem = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, TodoItemProps>(({
  todo,
  onEdit,
  onDelete,
  onToggleComplete,
  onFocus,
  onUnfocus,
  isActive,
  canDrag = true,
  onDrag,
}, ref) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isCompleted = todo.completedAt !== null;
  const isFocused = todo.focusedAt !== null && !isCompleted;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

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

  const handleDelete = () => {
    Alert.alert(
      'Delete Task?',
      `Are you sure you want to delete "${todo.name}"? This action cannot be undone.`,
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

  // Handle completion with delay to show strike-through
  const handleToggleComplete = () => {
    if (!isCompleted && !isAnimating) {
      setIsAnimating(true);
      // Show strike-through for a moment before completing
      setTimeout(() => {
        onToggleComplete();
        setIsAnimating(false);
      }, 250); // Show for ~0.8 seconds
    } else if (!isCompleted) {
      // If already animating, just complete immediately
      onToggleComplete();
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
      ref={ref}
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
      <View style={styles.content}>
        <Text
          style={[
            styles.name,
            { color: isFocused ? '#fff' : colors.text },
            (isCompleted || isAnimating) && styles.completedText,
          ]}
        >
          {todo.name}
        </Text>
        {todo.notes && (
          <Text
            style={[
              styles.notes,
              { color: isFocused ? '#fff' : colors.icon },
              (isCompleted || isAnimating) && styles.completedText,
            ]}
          >
            {todo.notes}
          </Text>
        )}
      </View>

      <View style={styles.controlsRow}>
        {canDrag && (
          <TouchableOpacity disabled={!canDrag} onPressIn={onDrag} style={styles.dragHandleContainer}>
            <IconSymbol 
              name="line.3.horizontal" 
              size={24} 
              color={isFocused ? '#fff' : '#999'} 
            />
          </TouchableOpacity>
        )}
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={onEdit}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol 
              name="square.and.pencil" 
              size={16} 
              color={isFocused ? '#fff' : colors.icon} 
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
              color={isFocused ? '#fff' : '#e53935'} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={handleToggleComplete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {!isCompleted && (
              <IconSymbol 
                name="checkmark.circle" 
                size={20} 
                color={isFocused ? '#fff' : '#34C759'} 
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {(isFocused || (isCompleted && todo.timeSpent !== null)) && (
        <View style={styles.timerContainer}>
          <Text style={[
            isFocused ? styles.timerText : styles.completedTimeText,
            !isFocused && { color: colors.icon }
          ]}>
            {isFocused ? formatTime(elapsedSeconds) : formatTime(todo.timeSpent!)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

TodoItem.displayName = 'TodoItem';

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
  content: {
    marginBottom: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dragHandleContainer: {
    marginRight: 'auto',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
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

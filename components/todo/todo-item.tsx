import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Todo } from '@/types/todo';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface TodoItemProps {
  todo: Todo;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
  dragHandle?: React.ReactNode;
  isActive?: boolean;
}

export function TodoItem({
  todo,
  onEdit,
  onDelete,
  onToggleComplete,
  dragHandle,
  isActive,
}: TodoItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isCompleted = todo.completedAt !== null;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.background },
        isActive && styles.activeContainer,
      ]}
      onPress={onEdit}
      activeOpacity={0.7}
    >
      {dragHandle && <View style={styles.dragHandleContainer}>{dragHandle}</View>}
      
      <TouchableOpacity
        style={[styles.checkbox, isCompleted && { backgroundColor: colors.tint }]}
        onPress={onToggleComplete}
      >
        {isCompleted && (
          <IconSymbol name="checkmark" size={16} color="#fff" />
        )}
      </TouchableOpacity>

      <View style={styles.content}>
        <Text
          style={[
            styles.name,
            { color: colors.text },
            isCompleted && styles.completedText,
          ]}
        >
          {todo.name}
        </Text>
        {todo.notes && (
          <Text
            style={[
              styles.notes,
              { color: colors.icon },
              isCompleted && styles.completedText,
            ]}
          >
            {todo.notes}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onDelete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <IconSymbol name="trash" size={18} color="#e53935" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    marginVertical: 4,
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeContainer: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
  },
  dragHandleContainer: {
    marginRight: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});

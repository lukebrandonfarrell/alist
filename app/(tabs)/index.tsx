import { DeleteConfirmModal } from '@/components/todo/delete-confirm-modal';
import { DragHandle } from '@/components/todo/drag-handle';
import { EmptyState } from '@/components/todo/empty-state';
import { TodoForm } from '@/components/todo/todo-form';
import { TodoItem } from '@/components/todo/todo-item';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useTodos } from '@/contexts/todos-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Todo } from '@/types/todo';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NestableDraggableFlatList, NestableScrollContainer } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TasksScreen() {
  const { todos, loading, createTodo, updateTodo, deleteTodo, completeTodo, reorderTodos } = useTodos();
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [deleteConfirmTodo, setDeleteConfirmTodo] = useState<Todo | null>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const activeTodos = useMemo(() => {
    return todos
      .filter(t => t.completedAt === null)
      .sort((a, b) => a.order - b.order);
  }, [todos]);

  const handleCreate = async (name: string, notes?: string) => {
    await createTodo(name, notes);
  };

  const handleEdit = async (name: string, notes?: string) => {
    if (editingTodo) {
      await updateTodo(editingTodo.id, { name, notes });
      setEditingTodo(null);
    }
  };

  const handleDeleteClick = (todo: Todo) => {
    setDeleteConfirmTodo(todo);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmTodo) {
      await deleteTodo(deleteConfirmTodo.id);
      setDeleteConfirmTodo(null);
    }
  };

  const handleComplete = async (id: string) => {
    await completeTodo(id);
  };

  const handleDragEnd = async ({ data: reorderedData }: { data: Todo[] }) => {
    // Compare current order with new order to find what changed
    const currentIds = activeTodos.map(t => t.id);
    const newIds = reorderedData.map(t => t.id);
    
    // Find the first difference to determine fromIndex and toIndex
    for (let i = 0; i < currentIds.length; i++) {
      if (currentIds[i] !== newIds[i]) {
        const fromIndex = currentIds.indexOf(newIds[i]);
        const toIndex = i;
        if (fromIndex !== -1) {
          await reorderTodos(fromIndex, toIndex);
          return;
        }
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Tasks</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.tint }]}
            onPress={() => {
              setEditingTodo(null);
              setFormVisible(true);
            }}
          >
            <IconSymbol name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {activeTodos.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            message="Tap the + button to create your first task"
          />
        ) : (
          <NestableScrollContainer style={styles.list}>
            <NestableDraggableFlatList
              data={activeTodos}
              onDragEnd={handleDragEnd}
              keyExtractor={(item) => item.id}
              renderItem={({ item, drag, isActive }) => (
                <TodoItem
                  todo={item}
                  onEdit={() => {
                    setEditingTodo(item);
                    setFormVisible(true);
                  }}
                  onDelete={() => handleDeleteClick(item)}
                  onToggleComplete={() => handleComplete(item.id)}
                  dragHandle={
                    <TouchableOpacity onPressIn={drag}>
                      <DragHandle />
                    </TouchableOpacity>
                  }
                  isActive={isActive}
                />
              )}
              contentContainerStyle={styles.listContent}
            />
          </NestableScrollContainer>
        )}

        <TodoForm
          visible={formVisible}
          todo={editingTodo}
          onClose={() => {
            setFormVisible(false);
            setEditingTodo(null);
          }}
          onSubmit={editingTodo ? handleEdit : handleCreate}
        />

        <DeleteConfirmModal
          visible={deleteConfirmTodo !== null}
          taskName={deleteConfirmTodo?.name || ''}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirmTodo(null)}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
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
    paddingBottom: 60,
  },
});

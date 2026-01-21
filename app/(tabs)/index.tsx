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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Sortable, { useItemContext } from 'react-native-sortables';

function SortableTodoItem({ item, onEdit, onDelete, onToggleComplete }: {
  item: Todo;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
}) {
  const { isActive } = useItemContext();

  return (
    <TodoItem
      todo={item}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleComplete={onToggleComplete}
      dragHandle={<Sortable.Handle><DragHandle /></Sortable.Handle>}
      isActive={isActive.value}
    />
  );
}

export default function TasksScreen() {
  const { todos, loading, createTodo, updateTodo, deleteTodo, completeTodo, reorderTodos } = useTodos();
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [deleteConfirmTodo, setDeleteConfirmTodo] = useState<Todo | null>(null);
  const animatedScrollRef = useAnimatedRef<Animated.ScrollView>();
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

  const handleDragEnd = async ({ fromIndex, toIndex }: { fromIndex: number; toIndex: number }) => {
    await reorderTodos(fromIndex, toIndex);
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
          <Animated.ScrollView
            ref={animatedScrollRef}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.sortableContainer}>
              <Sortable.Flex
                onDragEnd={handleDragEnd}
                customHandle={true}
                flexDirection="column"
                scrollableRef={animatedScrollRef}
              >
                {activeTodos.map((item) => (
                  <SortableTodoItem
                    key={item.id}
                    item={item}
                    onEdit={() => {
                      setEditingTodo(item);
                      setFormVisible(true);
                    }}
                    onDelete={() => handleDeleteClick(item)}
                    onToggleComplete={() => handleComplete(item.id)}
                  />
                ))}
              </Sortable.Flex>
            </View>
          </Animated.ScrollView>
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
    paddingBottom: 60,
  },
  sortableContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
});

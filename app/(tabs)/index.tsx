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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TasksScreen() {
  const { todos, loading, createTodo, updateTodo, deleteTodo, completeTodo, reorderTodos, focusTodo, unfocusTodo } = useTodos();
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

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

  const handleDelete = async (id: string) => {
    await deleteTodo(id);
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
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </View>
    );
  }

  const renderListHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Actions</Text>
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
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {activeTodos.length === 0 ? (
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            {renderListHeader()}
            <EmptyState
              title="No tasks yet"
              message="Tap the + button to create your first task"
            />
          </View>
        ) : (
          <NestableScrollContainer style={styles.list}>
            <NestableDraggableFlatList
              data={activeTodos}
              onDragEnd={handleDragEnd}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={renderListHeader}
              renderItem={({ item, drag, isActive }) => (
                <TodoItem
                  todo={item}
                  onEdit={() => {
                    setEditingTodo(item);
                    setFormVisible(true);
                  }}
                  onDelete={() => handleDelete(item.id)}
                  onToggleComplete={() => handleComplete(item.id)}
                  onFocus={() => focusTodo(item.id)}
                  onUnfocus={() => unfocusTodo(item.id)}
                  onDrag={drag}
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
      </View>
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
    paddingHorizontal: 4,
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
});

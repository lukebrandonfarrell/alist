import { DeleteConfirmModal } from '@/components/todo/delete-confirm-modal';
import { EmptyState } from '@/components/todo/empty-state';
import { TodoItem } from '@/components/todo/todo-item';
import { Colors } from '@/constants/theme';
import { useTodos } from '@/contexts/todos-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatCompletedDate, groupTodosByDate } from '@/lib/date-utils';
import { Todo } from '@/types/todo';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Section {
  title: string;
  data: Todo[];
}

export default function CompletedScreen() {
  const { todos, loading, deleteTodo, restoreTodo } = useTodos();
  const [deleteConfirmTodo, setDeleteConfirmTodo] = useState<Todo | null>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const sections = useMemo(() => {
    const completedTodos = todos.filter(t => t.completedAt !== null);
    const grouped = groupTodosByDate(completedTodos);
    
    return grouped.map(group => ({
      title: formatCompletedDate(group.date),
      data: group.todos,
    }));
  }, [todos]);

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Completed</Text>
      </View>

      {sections.length === 0 ? (
        <EmptyState
          title="No completed tasks"
          message="Tasks you complete will appear here"
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionHeaderText, { color: colors.text }]}>
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TodoItem
              todo={item}
              onEdit={() => {}}
              onDelete={() => setDeleteConfirmTodo(item)}
              onToggleComplete={() => restoreTodo(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <DeleteConfirmModal
        visible={deleteConfirmTodo !== null}
        taskName={deleteConfirmTodo?.name || ''}
        onConfirm={async () => {
          if (deleteConfirmTodo) {
            await deleteTodo(deleteConfirmTodo.id);
            setDeleteConfirmTodo(null);
          }
        }}
        onCancel={() => setDeleteConfirmTodo(null)}
      />
    </SafeAreaView>
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
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    paddingTop: 16,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

import { EmptyState } from '@/components/todo/empty-state';
import { TodoItem } from '@/components/todo/todo-item';
import { Colors } from '@/constants/theme';
import { useTodos } from '@/contexts/todos-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatCompletedDate, groupTodosByDate, isToday } from '@/lib/date-utils';
import { Todo } from '@/types/todo';
import React, { useMemo } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CompletedScreen() {
  const { todos, loading, deleteTodo, restoreTodo, unfocusTodo } = useTodos();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const sections = useMemo(() => {
    const completedTodos = todos.filter(t => t.completedAt !== null);
    const grouped = groupTodosByDate(completedTodos);
    
    return grouped.map((group, index) => ({
      title: formatCompletedDate(group.date),
      date: group.date,
      data: group.todos,
      isFirst: index === 0,
    }));
  }, [todos]);

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
      {sections.length === 0 ? (
        <View style={{ paddingTop: insets.top }}>
          <EmptyState
            title="No completed actions"
            message="Actions you complete will appear here"
          />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => {
            const isTodayDate = isToday(section.date);
            const taskCount = section.data.length;
            return (
              <View style={[
                styles.sectionHeader,
                { 
                  backgroundColor: 'transparent',
                  paddingTop: section.isFirst ? insets.top + 16 : 16
                }
              ]}>
                <Text style={[
                  styles.sectionHeaderText,
                  { color: isTodayDate ? colors.tint : colors.text }
                ]}>
                  {section.title}
                </Text>
                <Text style={[
                  styles.sectionHeaderCount,
                  { color: isTodayDate ? colors.tint : colors.icon }
                ]}>
                  {taskCount}
                </Text>
              </View>
            );
          }}
          renderItem={({ item }) => (
            <TodoItem
              todo={item}
              onEdit={() => {}}
              onDelete={() => deleteTodo(item.id)}
              onToggleComplete={() => restoreTodo(item.id)}
              onFocus={() => {}}
              onUnfocus={() => unfocusTodo(item.id)}
              canDrag={false}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    paddingTop: 16,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionHeaderCount: {
    fontSize: 14,
    fontWeight: '600',
  },
});

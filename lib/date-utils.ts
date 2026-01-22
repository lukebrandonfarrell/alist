import { Todo } from '@/types/todo';

export function formatCompletedDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  
  // Reset time to compare dates only
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  return dateOnly.getTime() === todayOnly.getTime();
}

export function groupTodosByDate(todos: Todo[]): Array<{ date: string; todos: Todo[] }> {
  const grouped: Record<string, Todo[]> = {};

  todos.forEach((todo) => {
    if (!todo.completedAt) return;
    const date = new Date(todo.completedAt);
    const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(todo);
  });

  // Sort groups by date (most recent first)
  const sortedDates = Object.keys(grouped).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return sortedDates.map((dateKey) => ({
    date: dateKey,
    todos: grouped[dateKey].sort((a, b) => 
      new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    ),
  }));
}

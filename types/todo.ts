export interface Todo {
  id: string;
  name: string;
  notes?: string;
  completedAt: string | null; // ISO date string, null if not completed
  order: number;
  focusedAt: string | null; // ISO date string, null if not focused
  timeSpent: number | null; // Time spent in seconds, null if not completed while focused
}

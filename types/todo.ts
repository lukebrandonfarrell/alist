export interface Todo {
  id: string;
  name: string;
  notes?: string;
  completedAt: string | null; // ISO date string, null if not completed
  order: number;
}

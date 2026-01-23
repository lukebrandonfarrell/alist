export interface Habit {
  id: string;
  name: string;
  entries: string[]; // Array of ISO date strings for when the habit was completed
  createdAt: string; // ISO date string
  order: number;
}

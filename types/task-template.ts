export interface TaskTemplate {
  id: string;
  name: string;
  notes?: string;
  order: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

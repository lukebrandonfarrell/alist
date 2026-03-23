export interface Collection {
  id: string;
  name: string;
  completedAt: string | null; // ISO date string, null if not completed
  order: number;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  name: string;
  description?: string;
  completedAt: string | null; // ISO date string, null if not completed
  order: number;
}

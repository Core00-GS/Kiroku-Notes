export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
}

export type NoteUpdate = Partial<Omit<Note, 'id' | 'createdAt'>>;

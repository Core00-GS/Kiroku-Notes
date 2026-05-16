import { Note } from '../types';

export const storage = {
  getNotes: async (): Promise<Note[]> => {
    try {
      const response = await fetch('/api/notes');
      if (!response.ok) throw new Error('Failed to fetch notes');
      return await response.json();
    } catch (e) {
      console.error('Failed to get notes from server', e);
      return [];
    }
  },

  saveNotes: async (notes: Note[]): Promise<void> => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notes),
      });
      if (!response.ok) throw new Error('Failed to save notes');
    } catch (e) {
      console.error('Failed to save notes to server', e);
    }
  },

  // Helpers that wrap the main save/get
  addNote: async (note: Note): Promise<void> => {
    const notes = await storage.getNotes();
    await storage.saveNotes([note, ...notes]);
  },

  updateNote: async (id: string, update: Partial<Note>): Promise<void> => {
    const notes = await storage.getNotes();
    const index = notes.findIndex(n => n.id === id);
    if (index !== -1) {
      notes[index] = { ...notes[index], ...update, updatedAt: Date.now() };
      await storage.saveNotes(notes);
    }
  },

  deleteNote: async (id: string): Promise<void> => {
    const notes = await storage.getNotes();
    await storage.saveNotes(notes.filter(n => n.id !== id));
  }
};

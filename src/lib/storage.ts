import { Note } from '../types';

const STORAGE_KEY = 'kiroku_notes_v1';

export const storage = {
  getNotes: (): Note[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse notes from storage', e);
      return [];
    }
  },

  saveNotes: (notes: Note[]): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  },

  addNote: (note: Note): void => {
    const notes = storage.getNotes();
    storage.saveNotes([note, ...notes]);
  },

  updateNote: (id: string, update: Partial<Note>): void => {
    const notes = storage.getNotes();
    const index = notes.findIndex(n => n.id === id);
    if (index !== -1) {
      notes[index] = { ...notes[index], ...update, updatedAt: Date.now() };
      storage.saveNotes(notes);
    }
  },

  deleteNote: (id: string): void => {
    const notes = storage.getNotes();
    storage.saveNotes(notes.filter(n => n.id !== id));
  }
};

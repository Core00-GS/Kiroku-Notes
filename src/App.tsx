import React from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Note } from './types';
import { storage } from './lib/storage';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee } from 'lucide-react';

export default function App() {
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = React.useState<string | null>(null);

  // Initial load
  React.useEffect(() => {
    const savedNotes = storage.getNotes();
    setNotes(savedNotes);
    if (savedNotes.length > 0) {
      setActiveNoteId(savedNotes[0].id);
    }
  }, []);

  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  const handleNewNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setActiveNoteId(newNote.id);
    storage.saveNotes(updatedNotes);
  };

  const handleUpdateNote = (update: Partial<Note>) => {
    if (!activeNoteId) return;
    const updatedNotes = notes.map(n => 
      n.id === activeNoteId ? { ...n, ...update, updatedAt: Date.now() } : n
    );
    setNotes(updatedNotes);
    storage.saveNotes(updatedNotes);
  };

  const handleDeleteNote = (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    storage.saveNotes(updatedNotes);
    if (activeNoteId === id) {
      setActiveNoteId(updatedNotes.length > 0 ? updatedNotes[0].id : null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        notes={notes}
        activeNoteId={activeNoteId}
        onSelectNote={setActiveNoteId}
        onNewNote={handleNewNote}
        onDeleteNote={handleDeleteNote}
      />
      
      <div className="flex-1 h-screen flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeNote ? (
            <motion.div
              key={activeNote.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full h-full"
            >
              <Editor
                note={activeNote}
                onUpdate={handleUpdateNote}
                onDelete={() => handleDeleteNote(activeNote.id)}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center space-y-6"
            >
              <div className="w-24 h-24 rounded-3xl bg-white/40 backdrop-blur-md flex items-center justify-center shadow-sm">
                <Coffee className="w-10 h-10 text-slate-400 animate-pulse" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-800">記録</h2>
                <p className="text-slate-400 mt-2 text-sm">Select or create a note to begin.</p>
              </div>
              <button
                onClick={handleNewNote}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                Create New Note
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


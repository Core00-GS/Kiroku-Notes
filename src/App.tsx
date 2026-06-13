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
  const [isFocusMode, setIsFocusMode] = React.useState(false);

  // Theme logic
  const [darkMode, setDarkMode] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Initial load
  React.useEffect(() => {
    const loadNotes = async () => {
      const savedNotes = await storage.getNotes();
      setNotes(savedNotes);
      // Select first non-archived note by default if available
      const activeRem = savedNotes.filter(n => !n.isArchived);
      if (activeRem.length > 0) {
        setActiveNoteId(activeRem[0].id);
      } else if (savedNotes.length > 0) {
        setActiveNoteId(savedNotes[0].id);
      }
    };
    loadNotes();
  }, []);

  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  const handleNewNote = async () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
      isArchived: false
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setActiveNoteId(newNote.id);
    await storage.saveNotes(updatedNotes);
  };

  const handleSaveNote = async (update: Partial<Note>) => {
    if (!activeNoteId) return;
    const updatedNotes = notes.map(n => 
      n.id === activeNoteId ? { ...n, ...update, updatedAt: Date.now() } : n
    );
    setNotes(updatedNotes);
    await storage.saveNotes(updatedNotes);
  };

  const handleTogglePin = async (id: string) => {
    const updatedNotes = notes.map(n => 
      n.id === id ? { ...n, isPinned: !n.isPinned } : n
    );
    setNotes(updatedNotes);
    await storage.saveNotes(updatedNotes);
  };

  const handleToggleArchive = async (id: string) => {
    const updatedNotes = notes.map(n => 
      n.id === id ? { ...n, isArchived: !n.isArchived } : n
    );
    setNotes(updatedNotes);
    await storage.saveNotes(updatedNotes);
    
    // If the active note was just archived or unarchived, find another note in current view context
    if (activeNoteId === id) {
      const currentlyArchivedNow = updatedNotes.find(n => n.id === id)?.isArchived;
      const sameViewNotes = updatedNotes.filter(n => currentlyArchivedNow ? n.isArchived : !n.isArchived);
      if (sameViewNotes.length > 0) {
        // select another note in same state if possible
        const remaining = sameViewNotes.filter(n => n.id !== id);
        setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
      } else {
        const otherViewNotes = updatedNotes.filter(n => currentlyArchivedNow ? !n.isArchived : n.isArchived);
        setActiveNoteId(otherViewNotes.length > 0 ? otherViewNotes[0].id : null);
      }
    }
  };

  const handleDeleteNote = async (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    await storage.saveNotes(updatedNotes);
    if (activeNoteId === id) {
      setActiveNoteId(updatedNotes.length > 0 ? updatedNotes[0].id : null);
    }
  };

  // Global Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N or Cmd+N -> New Note
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewNote();
      }
      
      // Ctrl+S or Cmd+S -> Trigger Save via Event (Editor will receive this)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('kiroku-trigger-save'));
      }

      // Ctrl+\ or Cmd+\ -> Toggle Focus Mode
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setIsFocusMode(prev => !prev);
      }

      // Escape -> Exit Focus Mode
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notes, activeNoteId, isFocusMode]);

  return (
    <div className="flex h-screen overflow-hidden text-slate-800 dark:text-slate-100 transition-colors duration-350">
      <AnimatePresence initial={false}>
        {!isFocusMode && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="shrink-0 h-screen overflow-hidden flex flex-col"
          >
            <Sidebar
              notes={notes}
              activeNoteId={activeNoteId}
              onSelectNote={setActiveNoteId}
              onNewNote={handleNewNote}
              onDeleteNote={handleDeleteNote}
              onTogglePin={handleTogglePin}
              onToggleArchive={handleToggleArchive}
              darkMode={darkMode}
              onToggleTheme={() => setDarkMode(!darkMode)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
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
                onSave={handleSaveNote}
                onDelete={() => handleDeleteNote(activeNote.id)}
                onTogglePin={handleTogglePin}
                onToggleArchive={handleToggleArchive}
                isFocusMode={isFocusMode}
                onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center space-y-6"
            >
              <div className="w-24 h-24 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20 dark:border-slate-800/10">
                <Coffee className="w-10 h-10 text-slate-400 dark:text-sky-400 animate-pulse" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">記録 ・ Kiroku</h2>
                <p className="text-slate-400 dark:text-slate-500 mt-2 text-sm">Select or create a note to begin your thoughts.</p>
              </div>
              <button
                onClick={handleNewNote}
                className="px-6 py-2.5 bg-slate-900 dark:bg-sky-500 text-white dark:text-slate-950 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-sky-400 transition-all shadow-lg shadow-slate-200 dark:shadow-none hover:scale-105 active:scale-95 cursor-pointer animate-bounce"
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


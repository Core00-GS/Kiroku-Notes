import React from 'react';
import { Plus, Search, Book, Trash2, Pin } from 'lucide-react';
import { Note } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  onDeleteNote: (id: string) => void;
}

export function Sidebar({ notes, activeNoteId, onSelectNote, onNewNote, onDeleteNote }: SidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 h-screen flex flex-col border-r border-slate-200/50 glass-panel bg-white/40">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <Book className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">記録</h1>
          </div>
          <button
            onClick={onNewNote}
            className="p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
            title="New Note"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full bg-slate-100/50 border border-transparent focus:border-slate-300 focus:bg-white rounded-xl py-2 pl-9 pr-4 text-sm outline-none transition-all"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-6">
        <AnimatePresence initial={false}>
          {filteredNotes.map((note, index) => (
            <motion.div
              layout
              key={note.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.03 }}
              className={cn(
                "group relative p-4 rounded-2xl cursor-pointer transition-all duration-200",
                activeNoteId === note.id 
                  ? "bg-white shadow-md shadow-slate-100 ring-1 ring-slate-200" 
                  : "hover:bg-white/50"
              )}
              onClick={() => onSelectNote(note.id)}
            >
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 truncate pr-6">
                    {note.title || 'Untitled Note'}
                  </h3>
                  {note.isPinned && <Pin className="w-3 h-3 text-slate-400 fill-current" />}
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {note.content || 'No content yet...'}
                </p>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                    {format(note.updatedAt, 'MMM dd, yyyy')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNote(note.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

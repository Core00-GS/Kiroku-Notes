import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Note } from '../types';
import { Maximize2, Eye, Edit3, Trash2, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface EditorProps {
  note: Note;
  onUpdate: (update: Partial<Note>) => void;
  onDelete: () => void;
}

export function Editor({ note, onUpdate, onDelete }: EditorProps) {
  const [view, setView] = React.useState<'edit' | 'preview' | 'split'>('split');

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-8 bg-white/40 backdrop-blur-sm border-b border-slate-200/50">
        <div className="flex flex-col min-w-0 flex-1 mr-4">
          <input
            className="bg-transparent text-2xl font-bold text-slate-900 outline-none border-none placeholder:text-slate-300 w-full truncate"
            placeholder="Note Title"
            value={note.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
          <div className="flex items-center space-x-4 mt-1 overflow-hidden">
            <div className="flex items-center text-xs text-slate-400 font-medium tracking-wide whitespace-nowrap">
              <Calendar className="w-3 h-3 mr-1" />
              {format(note.updatedAt, 'MMMM dd, HH:mm')}
            </div>
            {note.tags.length > 0 && (
              <div className="flex items-center space-x-2 invisible sm:visible">
                <Tag className="w-3 h-3 text-slate-400" />
                {note.tags.map(tag => (
                  <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-white/60 p-1 rounded-xl shadow-sm border border-slate-200/50">
          <button
            onClick={() => setView('edit')}
            className={cn(
              "p-2 rounded-lg transition-all",
              view === 'edit' ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
            title="Edit Mode"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('split')}
            className={cn(
              "p-2 rounded-lg transition-all",
              view === 'split' ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
            title="Split Mode"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('preview')}
            className={cn(
              "p-2 rounded-lg transition-all",
              view === 'preview' ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
            title="Preview Mode"
          >
            <Eye className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-slate-400 hover:text-red-500 transition-all"
            title="Delete Note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Editor Content */}
      <main className="flex-1 overflow-hidden flex">
        <AnimatePresence mode="wait">
          {(view === 'edit' || view === 'split') && (
            <motion.div
              layout
              key="edit-pane"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 h-full px-8 py-6 relative"
            >
              <textarea
                className="w-full h-full bg-transparent resize-none outline-none font-mono text-slate-700 leading-relaxed placeholder:text-slate-300"
                placeholder="Start writing your thoughts in Markdown..."
                value={note.content}
                onChange={(e) => onUpdate({ content: e.target.value })}
                spellCheck={false}
              />
            </motion.div>
          )}

          {view === 'split' && <div className="w-px h-full bg-slate-200/50" />}

          {(view === 'preview' || view === 'split') && (
            <motion.div
              layout
              key="preview-pane"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 h-full px-12 py-8 overflow-y-auto bg-white/20 backdrop-blur-sm"
            >
              <div className="prose">
                <ReactMarkdown>{note.content || '*Empty note*'}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}


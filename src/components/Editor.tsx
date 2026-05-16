import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Note } from '../types';
import { Trash2, Calendar, Save, Cloud } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface EditorProps {
  note: Note;
  onSave: (update: Partial<Note>) => Promise<void>;
  onDelete: () => void;
}

export function Editor({ note, onSave, onDelete }: EditorProps) {
  const [localTitle, setLocalTitle] = React.useState(note.title);
  const [localContent, setLocalContent] = React.useState(note.content);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Sync local state when note changes
  React.useEffect(() => {
    setLocalTitle(note.title);
    setLocalContent(note.content);
    setHasChanges(false);
  }, [note.id]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(e.target.value);
    setHasChanges(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges || isSaving) return;
    setIsSaving(true);
    try {
      await onSave({ title: localTitle, content: localContent });
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-8 bg-white/40 backdrop-blur-sm border-b border-slate-200/50">
        <div className="flex flex-col min-w-0 flex-1 mr-4">
          <input
            className="bg-transparent text-2xl font-bold text-slate-900 outline-none border-none placeholder:text-slate-300 w-full truncate"
            placeholder="Note Title"
            value={localTitle}
            onChange={handleTitleChange}
          />
          <div className="flex items-center space-x-4 mt-1 overflow-hidden">
            <div className="flex items-center text-xs text-slate-400 font-medium tracking-wide whitespace-nowrap">
              <Calendar className="w-3 h-3 mr-1" />
              {format(note.updatedAt, 'MMMM dd, HH:mm')}
            </div>
            <AnimatePresence>
              {hasChanges && (
                <motion.span 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter"
                >
                  Unsaved
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300",
              hasChanges 
                ? "bg-slate-900 text-white shadow-lg shadow-slate-200 hover:scale-105 active:scale-95" 
                : "bg-slate-100 text-slate-300 cursor-default"
            )}
          >
            {isSaving ? (
              <Cloud className="w-4 h-4 animate-pulse" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="text-sm font-semibold">Save Changes</span>
          </button>
          
          <div className="w-px h-6 bg-slate-200 mx-1" />

          <button
            onClick={onDelete}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 transition-all hover:bg-red-50"
            title="Delete Note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Editor Content */}
      <main className="flex-1 overflow-hidden p-8">
        <div className="glass-panel h-full rounded-3xl p-8 relative overflow-hidden bg-white/60">
          <textarea
            className="w-full h-full bg-transparent resize-none outline-none font-mono text-slate-700 leading-relaxed placeholder:text-slate-300 scrollbar-hide"
            placeholder="Write your thoughts..."
            value={localContent}
            onChange={handleContentChange}
            spellCheck={false}
          />
        </div>
      </main>
    </div>
  );
}


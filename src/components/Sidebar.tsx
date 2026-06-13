import React from 'react';
import { 
  Plus, 
  Search, 
  Book, 
  Trash2, 
  Pin, 
  X, 
  Tag, 
  Sun, 
  Moon, 
  Archive, 
  Inbox, 
  ArrowUpDown, 
  Clock, 
  Calendar, 
  SortAsc,
  ArchiveRestore
} from 'lucide-react';
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
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

type SortOption = 'updated' | 'created' | 'alphabetical';
type ViewTab = 'active' | 'archived';

export function Sidebar({ 
  notes, 
  activeNoteId, 
  onSelectNote, 
  onNewNote, 
  onDeleteNote, 
  onTogglePin,
  onToggleArchive,
  darkMode,
  onToggleTheme 
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  
  // Sidebar state: 'active' (normal notes) | 'archived' (archived ones)
  const [activeTab, setActiveTab] = React.useState<ViewTab>('active');
  
  // Sorting options: 'updated' | 'created' | 'alphabetical'
  const [sortBy, setSortBy] = React.useState<SortOption>('updated');

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Global Ctrl+F / Cmd+F shortcut to focus search bar
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter notes by active section (archived vs active), search query, and selected tag
  const filteredNotes = React.useMemo(() => {
    return notes.filter(n => {
      // 1. Is archived state matching?
      const noteArchived = !!n.isArchived;
      const isTargetArchived = activeTab === 'archived';
      if (noteArchived !== isTargetArchived) return false;

      // 2. Does search query match?
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            n.content.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 3. Does selected tag match?
      if (selectedTag) {
        return n.tags?.some(tag => tag.toLowerCase().trim() === selectedTag.toLowerCase().trim());
      }
      return true;
    });
  }, [notes, activeTab, searchQuery, selectedTag]);

  // Calculate unique tags from CURRENT VIEW notes with counts
  const allTagsWithCounts = React.useMemo(() => {
    const counts: { [key: string]: number } = {};
    // Calculate tag counts based on whether notes are active/archived
    notes.forEach(note => {
      const matchesArchive = !!note.isArchived === (activeTab === 'archived');
      if (matchesArchive && note.tags) {
        note.tags.forEach(tag => {
          const t = tag.trim();
          if (t) {
            const lower = t.toLowerCase();
            counts[lower] = (counts[lower] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [notes, activeTab]);

  // Sort notes based on SortOption & Pinned state (pinned always on top)
  const sortedNotes = React.useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      // Pinned notes always rank first
      const aPinned = a.isPinned ? 1 : 0;
      const bPinned = b.isPinned ? 1 : 0;
      if (aPinned !== bPinned) {
        return bPinned - aPinned; 
      }

      // secondary sorting
      if (sortBy === 'created') {
        return b.createdAt - a.createdAt; // Newer notes first
      } else if (sortBy === 'alphabetical') {
        const titleA = (a.title || '无标题').toLowerCase();
        const titleB = (b.title || '无标题').toLowerCase();
        return titleA.localeCompare(titleB, 'zh');
      } else {
        return b.updatedAt - a.updatedAt; // Last updated first
      }
    });
  }, [filteredNotes, sortBy]);

  return (
    <div className="w-full h-full flex flex-col border-r border-slate-200/50 dark:border-slate-800/50 glass-panel bg-white/40 dark:bg-slate-900/30">
      {/* Sidebar Header */}
      <div className="p-6 space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-sky-500 flex items-center justify-center transition-colors">
              <Book className="w-5 h-5 text-white dark:text-slate-950" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">記録</h1>
          </div>
          
          <div className="flex items-center space-x-1.5">
            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/80 border border-slate-200/40 dark:border-slate-700/40 text-slate-600 dark:text-yellow-400 hover:text-slate-950 dark:hover:text-yellow-300 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm animate-fade-in"
              title={darkMode ? "切换至日间晴空 / Light Mode" : "切换至夜幕星空 / Dark Mode"}
            >
              {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
            
            {/* Create New Note Button */}
            <button
              onClick={onNewNote}
              className="p-2 rounded-xl bg-slate-900 dark:bg-sky-500 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-sky-400 transition-colors shadow-sm cursor-pointer hover:scale-105 active:scale-95"
              title="新建笔记 (Ctrl+N)"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Input with Ctrl+F Hint */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            ref={searchInputRef}
            className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-transparent dark:border-slate-800 focus:border-slate-300 dark:focus:border-slate-700 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl py-2 pl-9 pr-14 text-sm outline-none transition-all placeholder:text-slate-450 dark:placeholder:text-slate-600"
            placeholder="搜索 / Search... (Ctrl+F)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-350 dark:text-slate-600 border border-slate-200 dark:border-slate-800 px-1 py-0.2 rounded pointer-events-none select-none">
              Ctrl+F
            </kbd>
          )}
        </div>

        {/* Tab Switcher: Active Notes vs Archived Notes */}
        <div className="grid grid-cols-2 p-1 bg-slate-100/60 dark:bg-slate-950/30 border border-slate-200/40 dark:border-slate-800/40 rounded-xl text-xs font-semibold gap-1">
          <button
            onClick={() => {
              setActiveTab('active');
              setSelectedTag(null);
            }}
            className={cn(
              "flex items-center justify-center space-x-1.5 py-1.5 rounded-lg transition-all cursor-pointer",
              activeTab === 'active'
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>全部 ({notes.filter(n => !n.isArchived).length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('archived');
              setSelectedTag(null);
            }}
            className={cn(
              "flex items-center justify-center space-x-1.5 py-1.5 rounded-lg transition-all cursor-pointer",
              activeTab === 'archived'
                ? "bg-white dark:bg-slate-800 text-sky-500 dark:text-sky-400 shadow-sm"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>归档 ({notes.filter(n => n.isArchived).length})</span>
          </button>
        </div>

        {/* Sorting Controller Row */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500 border-t border-b border-slate-100/50 dark:border-slate-800/30 py-2">
          <div className="flex items-center text-[11px] tracking-wide uppercase">
            <ArrowUpDown className="w-3 h-3 mr-1" />
            <span>排序 / Sorted By</span>
          </div>
          
          <div className="inline-flex items-center space-x-1">
            <button
              onClick={() => setSortBy('updated')}
              className={cn(
                "p-1 rounded-md transition-all cursor-pointer",
                sortBy === 'updated' 
                  ? "text-sky-500 bg-sky-50 dark:bg-sky-950/40 font-bold" 
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              )}
              title="按更新时间排序 (Last Updated)"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSortBy('created')}
              className={cn(
                "p-1 rounded-md transition-all cursor-pointer",
                sortBy === 'created' 
                  ? "text-sky-500 bg-sky-50 dark:bg-sky-950/40 font-bold" 
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              )}
              title="按创建时间排序 (Created Date)"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSortBy('alphabetical')}
              className={cn(
                "p-1 rounded-md transition-all cursor-pointer",
                sortBy === 'alphabetical' 
                  ? "text-sky-500 bg-sky-50 dark:bg-sky-950/40 font-bold" 
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              )}
              title="按标题字母排序 (Alphabetical)"
            >
              <SortAsc className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tags Filter Area */}
      {allTagsWithCounts.length > 0 && (
        <div className="px-6 pb-3 border-b border-slate-150/40 dark:border-slate-800/40 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest flex items-center">
              <Tag className="w-3 h-3 mr-1" /> 标签快捷键 / Tags Filter
            </span>
            {selectedTag && (
              <button 
                onClick={() => setSelectedTag(null)}
                className="text-[10px] text-sky-500 hover:text-sky-650 dark:text-sky-400 font-bold hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 select-none scrollbar-hide">
            {allTagsWithCounts.map(({ name, count }) => {
              const isActive = selectedTag === name;
              return (
                <button
                  key={name}
                  onClick={() => setSelectedTag(isActive ? null : name)}
                  className={cn(
                    "inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold cursor-pointer transition-all",
                    isActive 
                      ? "bg-sky-500 text-white shadow-sm ring-1 ring-sky-400" 
                      : "bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800"
                  )}
                >
                  <span>#{name}</span>
                  <span className={cn(
                    "text-[9px] px-1 rounded-full font-bold",
                    isActive ? "bg-white/20 text-white" : "bg-slate-250 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes List view */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-6 pt-4 scrollbar-hide">
        <AnimatePresence initial={false}>
          {sortedNotes.length > 0 ? (
            sortedNotes.map((note, index) => {
              const isSelected = activeNoteId === note.id;
              return (
                <motion.div
                  layout
                  key={note.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(index * 0.02, 0.15) }}
                  className={cn(
                    "group relative p-4 rounded-2xl cursor-pointer transition-all duration-200 border border-transparent",
                    isSelected 
                      ? "bg-white dark:bg-slate-900/60 shadow-md shadow-slate-100/50 dark:shadow-none ring-1 ring-slate-200/60 dark:ring-slate-800/60" 
                      : "hover:bg-white/50 dark:hover:bg-slate-800/20"
                  )}
                  onClick={() => onSelectNote(note.id)}
                >
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-14 text-sm transition-colors">
                        {note.title.trim() === '' ? 'Untitled' : note.title}
                      </h3>
                      <div className="flex items-center space-x-1 shrink-0">
                        {note.isPinned && (
                          <Pin className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 fill-sky-200 dark:fill-sky-950/60 rotate-45" />
                        )}
                        {note.isArchived && (
                          <Archive className="w-3.5 h-3.5 text-amber-500/80 dark:text-amber-400/80" />
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed transition-colors min-h-[2.25rem]">
                      {note.content ? note.content.substring(0, 150) : 'No content yet...'}
                    </p>
                    
                    {/* Tags block */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 py-1">
                        {note.tags.map(tag => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.2 bg-slate-100/80 dark:bg-slate-800/85 text-slate-400 dark:text-slate-500 rounded font-medium">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px]">
                        {format(note.updatedAt, 'MMM dd, yyyy')}
                      </span>
                      <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Archive / Unarchive Toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleArchive(note.id);
                          }}
                          className={cn(
                            "p-1 rounded-md transition-all cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800",
                            note.isArchived 
                              ? "text-sky-500 hover:text-sky-600" 
                              : "text-slate-400 hover:text-amber-500"
                          )}
                          title={note.isArchived ? "取消归档" : "移至归档"}
                        >
                          {note.isArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                        </button>

                        {/* Pin / Unpin button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(note.id);
                          }}
                          className={cn(
                            "p-1 rounded-md transition-all cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800",
                            note.isPinned 
                              ? "text-sky-500" 
                              : "text-slate-400 hover:text-sky-500"
                          )}
                          title={note.isPinned ? "取消置顶" : "置顶笔记"}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>

                        {/* Permanent Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNote(note.id);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                          title="彻底删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 px-4 text-center space-y-3"
            >
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">无匹配笔记 / No notes found</p>
              <p className="text-[11px] text-slate-350 dark:text-slate-650">
                {activeTab === 'archived' 
                  ? "归档箱空空如也" 
                  : "可以点击上方 ＋ 快速新建一篇笔记哦"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

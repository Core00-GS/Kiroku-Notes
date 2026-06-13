import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Note } from '../types';
import { 
  Trash2, 
  Calendar, 
  Save, 
  Cloud, 
  Download, 
  Pin, 
  Check, 
  Eye, 
  Edit3, 
  Columns, 
  Tag, 
  X,
  Archive,
  ArchiveRestore,
  Minimize2,
  Maximize2,
  BookOpen,
  Keyboard,
  ChevronRight,
  List,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface EditorProps {
  note: Note;
  onSave: (update: Partial<Note>) => Promise<void>;
  onDelete: () => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
}

export function Editor({ 
  note, 
  onSave, 
  onDelete, 
  onTogglePin, 
  onToggleArchive,
  isFocusMode,
  onToggleFocusMode 
}: EditorProps) {
  const [localTitle, setLocalTitle] = React.useState(note.title);
  const [localContent, setLocalContent] = React.useState(note.content);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = React.useState(false);
  
  // Editor view modes: 'edit' | 'split' | 'preview'
  const [viewMode, setViewMode] = React.useState<'edit' | 'split' | 'preview'>('split');
  
  // Tag input state
  const [tagInput, setTagInput] = React.useState('');

  // Table of Contents drawer visibility
  const [showTOC, setShowTOC] = React.useState(false);

  // Keyboard shortcut cheatsheet visibility
  const [showCheatsheet, setShowCheatsheet] = React.useState(false);

  const previewContainerRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Sync local state when note changes
  React.useEffect(() => {
    setLocalTitle(note.title);
    setLocalContent(note.content);
    setHasChanges(false);
    setShowSavedFeedback(false);
    setTagInput('');
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
      setShowSavedFeedback(true);
      setTimeout(() => {
        setShowSavedFeedback(false);
      }, 2500);
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard custom local listener hook synchronizing "Ctrl+S" saved trigger with active text state
  React.useEffect(() => {
    const triggerLocalSave = () => {
      handleSave();
    };
    window.addEventListener('kiroku-trigger-save', triggerLocalSave);
    return () => window.removeEventListener('kiroku-trigger-save', triggerLocalSave);
  }, [hasChanges, isSaving, localTitle, localContent]);

  const handleAddTag = () => {
    const rawTag = tagInput.trim().toLowerCase().replace(/#/g, '');
    if (!rawTag) return;
    
    const currentTags = note.tags || [];
    if (!currentTags.includes(rawTag)) {
      const updatedTags = [...currentTags, rawTag];
      onSave({ tags: updatedTags });
    }
    setTagInput('');
  };

  const handleExportMarkdown = () => {
    const title = localTitle.trim() || 'Untitled';
    const content = `# ${title}\n\n${localContent}`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Word, Character and Reading Time stats
  const stats = React.useMemo(() => {
    if (!localContent) return { words: 0, chars: 0, readTime: 1 };
    const chars = localContent.length;
    // Estimate words
    const words = localContent.trim().split(/\s+/).filter(Boolean).length;
    // Average reading speed: 200 words per minute
    const readTime = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readTime };
  }, [localContent]);

  // Parse H1 (# ) and H 2 (## ) headers from local content dynamically for TOC
  const tableOfContents = React.useMemo(() => {
    const lines = localContent.split('\n');
    const items: { text: string; level: number; lineIndex: number; id: string }[] = [];
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,2})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[*_#`[\]()]/g, '').trim(); // Strip markdown artifacts for TOC label
        const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
        items.push({ text, level, lineIndex: index, id });
      }
    });
    return items;
  }, [localContent]);

  // Smooth scroll helper matching active headings across viewmodes
  const handleScrollToHeading = (text: string, lineIndex: number) => {
    // If in Split or Preview mode, scroll the HTML preview container smoothly
    if (viewMode === 'split' || viewMode === 'preview') {
      const container = previewContainerRef.current;
      if (container) {
        // Find matching heading HTML tags
        const headings = container.querySelectorAll('h1, h2, h3, h4');
        for (let i = 0; i < headings.length; i++) {
          const h = headings[i];
          if (h.textContent?.toLowerCase().trim() === text.toLowerCase().trim()) {
            h.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
        }
      }
    }
    
    // Fallback: scroll the editor textarea estimate
    const textarea = textareaRef.current;
    if (textarea) {
      const totalLines = localContent.split('\n').length;
      const ratio = lineIndex / Math.max(1, totalLines);
      textarea.scrollTop = textarea.scrollHeight * ratio;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent font-sans">
      {/* Editor Main Header (Hidden entirely in Focus Mode to maximize visual canvas) */}
      {!isFocusMode && (
        <header className="h-20 flex items-center justify-between px-8 bg-white/40 dark:bg-slate-900/30 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-800/40 transition-colors shrink-0">
          <div className="flex flex-col min-w-0 flex-1 mr-4">
            <div className="flex items-center space-x-2">
              <input
                className="bg-transparent text-2xl font-bold text-slate-900 dark:text-white outline-none border-none placeholder:text-slate-300 dark:placeholder:text-slate-700 w-full truncate transition-colors"
                placeholder="Note Title"
                value={localTitle}
                onChange={handleTitleChange}
              />
              
              {/* Pin Indicator Button */}
              <button
                onClick={() => onTogglePin(note.id)}
                className={cn(
                  "p-1.5 rounded-lg transition-all shrink-0 hover:scale-105 active:scale-95 cursor-pointer",
                  note.isPinned 
                    ? "text-sky-500 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100" 
                    : "text-slate-300 dark:text-slate-600 hover:text-sky-400 hover:bg-slate-100/50 dark:hover:bg-slate-800"
                )}
                title={note.isPinned ? "取消置顶 / Unpin" : "置顶笔记 / Pin"}
              >
                <Pin className={cn("w-4 h-4", note.isPinned && "fill-sky-100 dark:fill-sky-955")} />
              </button>

              {/* Archive Indicator Button */}
              <button
                onClick={() => onToggleArchive(note.id)}
                className={cn(
                  "p-1.5 rounded-lg transition-all shrink-0 hover:scale-105 active:scale-95 cursor-pointer",
                  note.isArchived 
                    ? "text-amber-500 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100" 
                    : "text-slate-300 dark:text-slate-600 hover:text-amber-550 hover:bg-slate-100/50 dark:hover:bg-slate-800"
                )}
                title={note.isArchived ? "从归档库恢复 / Unarchive" : "移入归档库 / Archive"}
              >
                {note.isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center space-x-3 mt-1 overflow-hidden text-xs text-slate-400 dark:text-slate-500 font-semibold select-none">
              <div className="flex items-center whitespace-nowrap">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-slate-600" />
                {format(note.updatedAt, 'MMMM dd, HH:mm')}
              </div>
              
              <span className="text-slate-200 dark:text-slate-850">|</span>
              
              <div className="flex items-center space-x-1.5 whitespace-nowrap">
                <span>
                  字数: <strong className="text-slate-600 dark:text-slate-300 font-bold">{stats.words}</strong>
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span>
                  阅读: <strong className="text-sky-500 dark:text-sky-400 font-bold">~{stats.readTime} min</strong>
                </span>
              </div>
              
              <AnimatePresence>
                {hasChanges && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-[10px] bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter"
                  >
                    Unsaved
                  </motion.span>
                )}
                {showSavedFeedback && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center space-x-1 text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter"
                  >
                    <Check className="w-3 h-3" />
                    <span>Saved (Ctrl+S)</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Editor Header Controls */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Table of Contents Index Drawer Toggle */}
            <button
              onClick={() => setShowTOC(!showTOC)}
              className={cn(
                "flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-55/40 transition-all cursor-pointer",
                showTOC 
                  ? "bg-sky-50/80 dark:bg-sky-955/20 border-sky-200 dark:border-sky-900 text-sky-500" 
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              )}
              title="Table of Contents (目录大纲)"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">大纲</span>
              {tableOfContents.length > 0 && (
                <span className="bg-sky-100 dark:bg-sky-900/60 text-sky-655 dark:text-sky-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                  {tableOfContents.length}
                </span>
              )}
            </button>

            {/* Keyboard shortcuts cheatsheet trigger */}
            <button
              onClick={() => setShowCheatsheet(true)}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer shadow-sm"
              title="Keyboard Shortcuts (快捷键说明)"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* Focus Mode trigger button */}
            <button
              onClick={onToggleFocusMode}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-500 hover:border-sky-200 dark:hover:text-sky-400 transition-all text-xs font-semibold shadow-sm active:scale-95 cursor-pointer"
              title="进入专注模式 (Ctrl+\)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">专注</span>
            </button>

            {/* Split view switches */}
            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 rounded-xl space-x-0.5">
              <button
                onClick={() => setViewMode('edit')}
                className={cn(
                  "flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all",
                  viewMode === 'edit'
                    ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm"
                    : "text-slate-400 dark:text-slate-550 hover:text-slate-600 dark:hover:text-slate-300"
                )}
                title="Only edit markup"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={cn(
                  "flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all",
                  viewMode === 'split'
                    ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm"
                    : "text-slate-400 dark:text-slate-550 hover:text-slate-600 dark:hover:text-slate-300"
                )}
                title="Split edit + render preview"
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={cn(
                  "flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all",
                  viewMode === 'preview'
                    ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm"
                    : "text-slate-400 dark:text-slate-550 hover:text-slate-600 dark:hover:text-slate-300"
                )}
                title="Pure screen preview"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Export as MD trigger */}
            <button
              onClick={handleExportMarkdown}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-all text-xs font-bold shadow-sm active:scale-95 cursor-pointer"
              title="保存并导出为 Markdown 文件"
            >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">Export</span>
            </button>

            {/* Save trigger button */}
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 select-none",
                hasChanges 
                  ? "bg-slate-900 dark:bg-sky-500 text-white dark:text-slate-950 shadow-lg shadow-slate-200 dark:shadow-none hover:scale-105 active:scale-95 cursor-pointer" 
                  : "bg-slate-100 dark:bg-slate-900/40 text-slate-300 dark:text-slate-600 cursor-default"
              )}
            >
              {isSaving ? (
                <Cloud className="w-4 h-4 animate-pulse" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="text-xs font-bold">Save</span>
            </button>
            
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-0.5" />

            {/* Permanent trash trigger */}
            <button
              onClick={onDelete}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-100 dark:hover:border-red-950/30 transition-all hover:bg-red-50 dark:hover:bg-red-950/10 active:scale-95 cursor-pointer"
              title="Delete Note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* Focus Mode Overlay Header Controls (Sleek minimalist panel appearing only in Focus mode) */}
      {isFocusMode && (
        <div className="flex items-center justify-between px-8 py-4 bg-slate-50/40 dark:bg-slate-950/20 backdrop-blur-md border-b border-slate-250/20 dark:border-slate-800/10 select-none transition-all duration-300 max-w-5xl mx-auto w-full z-20 shrink-0">
          <div className="flex items-center space-x-4 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <input
              className="bg-transparent text-lg font-bold text-slate-800 dark:text-white outline-none border-none placeholder:text-slate-300 w-48 md:w-80 truncate"
              value={localTitle}
              onChange={handleTitleChange}
              placeholder="Focusing layout..."
            />
            {hasChanges && (
              <span className="text-[10px] bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded font-black font-mono">
                UNSAVED
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4 shrink-0 text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-medium">
              字数: <strong className="text-slate-700 dark:text-slate-305">{stats.words}</strong>
            </span>
            
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={cn(
                "p-1.5 rounded-lg border transition-all text-[11px] font-bold flex items-center space-x-1 cursor-pointer",
                hasChanges 
                  ? "bg-slate-900 border-transparent text-white dark:bg-sky-500 dark:text-slate-950" 
                  : "bg-transparent border-slate-200 dark:border-slate-850 text-slate-300 dark:text-slate-700"
              )}
            >
              <Save className="w-3.5 h-3.5" />
              <span>保存 (Ctrl+S)</span>
            </button>

            {/* Exit Focus Mode Button */}
            <button
              onClick={onToggleFocusMode}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-650 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold transition-all cursor-pointer"
              title="退出专注模式 (Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>退出 (Esc)</span>
            </button>
          </div>
        </div>
      )}

      {/* Tags Manager Section (Below Header) (Hidden inside Focus mode) */}
      {!isFocusMode && (
        <div className="flex items-center flex-wrap gap-1.5 py-2 px-8 border-b border-slate-100/50 dark:border-slate-800/40 bg-slate-50/20 dark:bg-slate-900/10 transition-colors shrink-0">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 dark:text-slate-500">
            <Tag className="w-3.5 h-3.5" />
            <span>标签 / tags:</span>
          </div>
          
          {/* Render tags with delete indicators */}
          <AnimatePresence>
            {note.tags && note.tags.map(tag => (
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={tag} 
                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-305 text-xs font-semibold border border-slate-200/40 dark:border-slate-750/40"
              >
                <span>#{tag}</span>
                <button 
                  onClick={() => {
                    const updated = (note.tags || []).filter(t => t !== tag);
                    onSave({ tags: updated });
                  }}
                  className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-550 hover:text-red-500 transition-colors cursor-pointer"
                  title="Remove tag"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>

          {/* Quick adding input */}
          <div className="relative inline-flex items-center pl-1">
            <input
              type="text"
              placeholder="+ 新建标签 / Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="bg-transparent border-b border-slate-205 dark:border-slate-800 focus:border-sky-400 dark:focus:border-sky-500 text-xs text-slate-600 dark:text-slate-400 px-1 py-0.5 outline-none w-28 transition-all placeholder:text-slate-420 dark:placeholder:text-slate-700"
            />
          </div>
        </div>
      )}

      {/* Editor Content Area splitting into Editor and optional TOC index bar */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Editor Writing Area */}
        <main className={cn(
          "flex-1 flex flex-col min-w-0 transition-all overflow-hidden",
          isFocusMode ? "max-w-4xl mx-auto px-6 py-6" : "p-8"
        )}>
          <div className="flex-1 overflow-hidden min-h-0 relative select-text">
            <AnimatePresence mode="wait">
              {viewMode === 'edit' && (
                <motion.div
                  key="edit-pane"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-panel h-full rounded-2xl p-6 relative overflow-hidden bg-white/60 dark:bg-slate-900/40"
                >
                  <textarea
                    ref={textareaRef}
                    className="w-full h-full bg-transparent resize-none outline-none font-mono text-slate-750 dark:text-slate-200 leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700 scrollbar-hide focus:ring-0 text-[14px]"
                    placeholder="在这里记录下你的思绪之旅 (支持完整 Markdown 语法)..."
                    value={localContent}
                    onChange={handleContentChange}
                    spellCheck={false}
                  />
                </motion.div>
              )}

              {viewMode === 'split' && (
                <motion.div
                  key="split-pane"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  {/* Editor columns left */}
                  <div className="glass-panel h-full rounded-2xl p-6 relative overflow-hidden bg-white/60 dark:bg-slate-900/40 flex flex-col">
                    <textarea
                      ref={textareaRef}
                      className="w-full flex-1 bg-transparent resize-none outline-none font-mono text-slate-750 dark:text-slate-200 leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700 pr-1 text-[14px]"
                      placeholder="在这里记录思绪吧..."
                      value={localContent}
                      onChange={handleContentChange}
                      spellCheck={false}
                    />
                  </div>
                  
                  {/* Formatting preview column right */}
                  <div 
                    ref={previewContainerRef}
                    className="glass-panel h-full rounded-2xl p-6 overflow-y-auto bg-white/60 dark:bg-slate-900/40 pr-3 scroll-smooth"
                  >
                    <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-100">
                      {localContent.trim() ? (
                        <ReactMarkdown>{localContent}</ReactMarkdown>
                      ) : (
                        <p className="text-slate-300 dark:text-slate-600 italic">空空如也，左侧面板打打字，自动实时排盘渲染 Markdown 哦~</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {viewMode === 'preview' && (
                <motion.div
                  key="preview-pane"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="glass-panel h-full rounded-2xl p-8 overflow-y-auto bg-white/60 dark:bg-slate-900/40 max-w-none pr-4 scroll-smooth"
                  ref={previewContainerRef}
                >
                  <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-100">
                    {localContent.trim() ? (
                      <ReactMarkdown>{localContent}</ReactMarkdown>
                    ) : (
                      <p className="text-slate-300 dark:text-slate-650 italic text-center py-16">
                        空空如也。点击右上角 "编辑" 或 "分栏" 丰富内容吧
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dynamic Status Bar (Only visible outside Focus mode) */}
          {!isFocusMode && (
            <div className="glass-panel rounded-xl px-5 py-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-semibold bg-white/50 dark:bg-slate-900/20 backdrop-blur-sm mt-4 shrink-0">
              <div className="flex items-center space-x-3">
                <span>
                  计字: <strong className="text-slate-600 dark:text-slate-300 font-bold">{stats.words}</strong>
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-205 dark:bg-slate-700" />
                <span>
                  字符数: <strong className="text-slate-600 dark:text-slate-305 font-bold">{stats.chars}</strong>
                </span>
                {tableOfContents.length > 0 && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-205 dark:bg-slate-700" />
                    <span className="text-sky-500 hover:underline cursor-pointer flex items-center" onClick={() => setShowTOC(!showTOC)}>
                      目录节点 ({tableOfContents.length}) {showTOC ? "▼" : "▲"}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2 text-slate-300 dark:text-slate-700 select-none">
                <span className="text-sky-500/80 dark:text-sky-400/80 font-bold">Kiroku Engine v1.2</span>
                <span className="text-slate-200 dark:text-slate-800">|</span>
                <span>快捷键: Ctrl+N (新建) • Ctrl+S (保存) • Ctrl+F (搜索) • Ctrl+\ (专注)</span>
              </div>
            </div>
          )}
        </main>

        {/* Slide-out Table of Contents (TOC) Right Sidebar Panel */}
        <AnimatePresence>
          {showTOC && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="border-l border-slate-200/50 dark:border-slate-800/50 bg-white/35 dark:bg-slate-900/30 backdrop-blur-md h-full flex flex-col shrink-0 select-none"
            >
              <div className="p-4 border-b border-slate-100/60 dark:border-slate-800/40 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-450 dark:text-slate-500 flex items-center">
                  <List className="w-3.5 h-3.5 mr-1.5" /> 目录大纲 / OUTLINE
                </span>
                <button
                  onClick={() => setShowTOC(false)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide font-medium text-xs">
                {tableOfContents.length > 0 ? (
                  tableOfContents.map((header, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleScrollToHeading(header.text, header.lineIndex)}
                      className={cn(
                        "w-full text-left py-1.5 px-2 rounded-lg transition-all line-clamp-1 block cursor-pointer",
                        header.level === 1 
                          ? "pl-2 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 border-l-2 border-slate-300 dark:border-slate-750" 
                          : "pl-5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-slate-800 dark:hover:text-slate-205"
                      )}
                    >
                      {header.text}
                    </button>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-600 font-medium space-y-2">
                    <p>文档暂无大纲节点</p>
                    <p className="text-[10px] text-slate-350 dark:text-slate-700">在正文中输入 # 或 ## 来生成文档目录索引</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Keyboard Shortcuts Help Drawer Diagonal Modal */}
      <AnimatePresence>
        {showCheatsheet && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowCheatsheet(false)}
                className="absolute right-4 top-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-450 dark:text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-2.5 mb-6">
                <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/50 text-sky-550 flex items-center justify-center">
                  <Keyboard className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">快捷命令手册</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">Keyboard Shortcuts cheatsheet</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-slate-650 dark:text-slate-300 font-medium">
                <div className="flex items-center justify-between border-b border-slate-100/50 dark:border-slate-800/50 pb-2">
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mr-2" />
                    新建文稿 / New Note
                  </span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-md shadow-sm font-mono text-[10px] font-bold">
                    Ctrl + N
                  </kbd>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100/50 dark:border-slate-800/50 pb-2">
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mr-2" />
                    保存修改 / Save Note
                  </span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-md shadow-sm font-mono text-[10px] font-bold">
                    Ctrl + S
                  </kbd>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100/50 dark:border-slate-800/50 pb-2">
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mr-2" />
                    全局查找 / Search Notes
                  </span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-md shadow-sm font-mono text-[10px] font-bold">
                    Ctrl + F
                  </kbd>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100/50 dark:border-slate-800/50 pb-2">
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mr-2" />
                    切换专注 / Toggle Focus
                  </span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-md shadow-sm font-mono text-[10px] font-bold">
                    Ctrl + \
                  </kbd>
                </div>

                <div className="flex items-center justify-between pb-2">
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2" />
                    退出专注 / Exit Focus
                  </span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-md shadow-sm font-mono text-[10px] font-bold">
                    Esc
                  </kbd>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-center">
                <button
                  onClick={() => setShowCheatsheet(false)}
                  className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 dark:hover:bg-sky-450 text-white dark:text-slate-950 text-xs font-bold transition-all shadow-md shadow-slate-100 dark:shadow-none cursor-pointer"
                >
                  确认已阅 / Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

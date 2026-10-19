import React from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Quote,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Search,
  Maximize2,
  Minimize2,
  Type,
  Baseline,
  Sparkles,
  Sun,
  Moon,
  Palette,
} from 'lucide-react';
import { ProjectSettings, Scene } from '../types/story';

interface EditorToolbarProps {
  onFormat: (command: string, value?: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  showFindReplace: boolean;
  setShowFindReplace: (show: boolean) => void;
  settings: ProjectSettings;
  onUpdateSettings: (settings: Partial<ProjectSettings>) => void;
  sceneStatus: Scene['status'];
  onChangeStatus: (status: Scene['status']) => void;
  wordCount: number;
  autoExtractStatus?: 'idle' | 'analyzing' | 'done';
  detectedCount?: number;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onFormat,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  showFindReplace,
  setShowFindReplace,
  settings,
  onUpdateSettings,
  sceneStatus,
  onChangeStatus,
  wordCount,
  autoExtractStatus = 'idle',
  detectedCount = 0,
}) => {
  return (
    <div className={`h-11 border-b px-4 flex items-center justify-between gap-2 select-none shrink-0 transition-colors shadow-xs ${
      settings.theme === 'grey'
        ? 'bg-[#e2e8f0] border-slate-300 text-slate-800'
        : 'border-neutral-200 dark:border-neutral-800 bg-[#f8fafc] dark:bg-[#151921]'
    }`}>
      {/* Left Formatting Group: Word Ribbon Home Style */}
      <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-neutral-300 dark:border-neutral-700">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-[#185abd] hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-[#185abd] hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Font Style Controls: Bold, Italic */}
        <div className="flex items-center gap-0.5 px-1 border-r border-neutral-300 dark:border-neutral-700">
          <button
            onClick={() => onFormat('bold')}
            title="Bold (Ctrl+B)"
            className="p-1.5 text-neutral-700 dark:text-neutral-300 hover:text-[#185abd] hover:bg-[#e8f0fe] dark:hover:bg-neutral-800 rounded transition-colors font-bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormat('italic')}
            title="Italic (Ctrl+I)"
            className="p-1.5 text-neutral-700 dark:text-neutral-300 hover:text-[#185abd] hover:bg-[#e8f0fe] dark:hover:bg-neutral-800 rounded transition-colors italic"
          >
            <Italic className="w-4 h-4" />
          </button>
        </div>

        {/* Headings & Blockquote */}
        <div className="flex items-center gap-0.5 px-1 border-r border-neutral-300 dark:border-neutral-700">
          <button
            onClick={() => onFormat('heading-1')}
            title="Heading 1 (Word Style)"
            className="p-1.5 text-neutral-700 dark:text-neutral-300 hover:text-[#185abd] hover:bg-[#e8f0fe] dark:hover:bg-neutral-800 rounded transition-colors"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormat('heading-2')}
            title="Heading 2 (Word Style)"
            className="p-1.5 text-neutral-700 dark:text-neutral-300 hover:text-[#185abd] hover:bg-[#e8f0fe] dark:hover:bg-neutral-800 rounded transition-colors"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormat('quote')}
            title="Blockquote"
            className="p-1.5 text-neutral-700 dark:text-neutral-300 hover:text-[#185abd] hover:bg-[#e8f0fe] dark:hover:bg-neutral-800 rounded transition-colors"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 px-1 border-r border-neutral-300 dark:border-neutral-700">
          <button
            onClick={() => onFormat('bullet-list')}
            title="Bullet List"
            className="p-1.5 text-neutral-700 dark:text-neutral-300 hover:text-[#185abd] hover:bg-[#e8f0fe] dark:hover:bg-neutral-800 rounded transition-colors"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFormat('ordered-list')}
            title="Numbered List"
            className="p-1.5 text-neutral-700 dark:text-neutral-300 hover:text-[#185abd] hover:bg-[#e8f0fe] dark:hover:bg-neutral-800 rounded transition-colors"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        {/* Find & Replace */}
        <button
          onClick={() => setShowFindReplace(!showFindReplace)}
          title="Find and Replace (Ctrl+F)"
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
            showFindReplace
              ? 'bg-[#185abd] text-white font-medium shadow-xs'
              : 'text-neutral-700 dark:text-neutral-300 hover:text-[#185abd] hover:bg-[#e8f0fe] dark:hover:bg-neutral-800'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Find & Replace</span>
        </button>
      </div>

      {/* Right Controls: Font settings, scene status, word count, focus mode */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Font Family selector */}
        <div className="flex items-center gap-0.5 bg-neutral-200/80 dark:bg-neutral-800/80 p-0.5 rounded text-xs border border-neutral-300 dark:border-neutral-700">
          <button
            onClick={() => onUpdateSettings({ fontFamily: 'serif' })}
            className={`px-2 py-0.5 rounded transition-all ${
              settings.fontFamily === 'serif' ? 'bg-white dark:bg-neutral-700 font-serif font-semibold text-[#185abd] dark:text-blue-300 shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
            title="Book Serif font (Source Serif 4)"
          >
            Serif
          </button>
          <button
            onClick={() => onUpdateSettings({ fontFamily: 'sans' })}
            className={`px-2 py-0.5 rounded transition-all ${
              settings.fontFamily === 'sans' ? 'bg-white dark:bg-neutral-700 font-sans font-semibold text-[#185abd] dark:text-blue-300 shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
            title="Clean Sans-serif (Plus Jakarta Sans)"
          >
            Sans
          </button>
          <button
            onClick={() => onUpdateSettings({ fontFamily: 'mono' })}
            className={`px-2 py-0.5 rounded transition-all ${
              settings.fontFamily === 'mono' ? 'bg-white dark:bg-neutral-700 font-mono font-semibold text-[#185abd] dark:text-blue-300 shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
            title="Typewriter Mono (Courier Prime)"
          >
            Mono
          </button>
        </div>

        {/* Font Size controls */}
        <div className="hidden sm:flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-200/70 dark:bg-neutral-800/70 px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700">
          <button
            onClick={() => onUpdateSettings({ fontSize: Math.max(14, settings.fontSize - 1) })}
            className="w-4 h-4 flex items-center justify-center hover:text-[#185abd] rounded font-bold"
            title="Decrease font size"
          >
            A-
          </button>
          <span className="tabular-nums font-mono text-[11px] font-semibold">{settings.fontSize}pt</span>
          <button
            onClick={() => onUpdateSettings({ fontSize: Math.min(24, settings.fontSize + 1) })}
            className="w-4 h-4 flex items-center justify-center hover:text-[#185abd] rounded font-bold"
            title="Increase font size"
          >
            A+
          </button>
        </div>

        {/* Scene Status Dropdown */}
        <select
          value={sceneStatus}
          onChange={(e) => onChangeStatus(e.target.value as Scene['status'])}
          className="text-xs font-medium px-2.5 py-1 bg-white dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-lime-500 cursor-pointer shadow-xs"
        >
          <option value="outline">Status: Outline</option>
          <option value="draft">Status: Draft</option>
          <option value="revision">Status: Revision</option>
          <option value="polished">Status: Polished</option>
          <option value="final">Status: Final</option>
        </select>

        {/* Scene Word Count */}
        <div className="text-xs text-neutral-600 dark:text-neutral-400 tabular-nums font-mono hidden md:inline bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
          {wordCount} words
        </div>

        {/* Automatic Feature: Auto-Extract Story Entities */}
        <button
          onClick={() => onUpdateSettings({ autoExtract: settings.autoExtract !== false ? false : true })}
          title={settings.autoExtract !== false ? 'Auto-Analyze is ON: Entities & continuity are automatically detected as you write. Click to pause.' : 'Auto-Analyze is OFF: Click to enable automatic entity extraction.'}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-all cursor-pointer ${
            settings.autoExtract !== false
              ? 'bg-lime-500/15 border-lime-500/40 text-lime-700 dark:text-lime-300 font-semibold'
              : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${autoExtractStatus === 'analyzing' ? 'animate-spin text-lime-400' : 'text-lime-500'}`} />
          <span>
            {autoExtractStatus === 'analyzing' 
              ? 'Analyzing...' 
              : settings.autoExtract !== false
                ? `Auto-Analyze: ON ${detectedCount ? `(${detectedCount})` : ''}`
                : 'Auto-Analyze: OFF'}
          </span>
        </button>

        {/* Theme Quick Toggle */}
        <button
          onClick={() => {
            const next = settings.theme === 'grey' ? 'dark' : settings.theme === 'dark' ? 'light' : 'grey';
            onUpdateSettings({ theme: next });
          }}
          title={`Theme: ${
            settings.theme === 'grey' ? 'White & Grey Mix (Click to cycle)' : settings.theme === 'dark' ? 'Dark (Click to cycle)' : 'Light (Click to cycle)'
          }`}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors cursor-pointer ${
            settings.theme === 'grey'
              ? 'bg-white border-slate-300 text-slate-800 font-semibold shadow-xs'
              : settings.theme === 'dark'
              ? 'bg-neutral-800 border-neutral-700 text-blue-300'
              : 'bg-white border-neutral-300 text-neutral-700 shadow-xs'
          }`}
        >
          {settings.theme === 'grey' ? (
            <Palette className="w-3.5 h-3.5 text-lime-600" />
          ) : settings.theme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-blue-400" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}
          <span className="hidden xl:inline text-[11px]">
            {settings.theme === 'grey' ? 'White & Grey' : settings.theme === 'dark' ? 'Dark' : 'White'}
          </span>
        </button>

        {/* Focus Mode button */}
        <button
          onClick={() => onUpdateSettings({ focusMode: !settings.focusMode })}
          title={settings.focusMode ? 'Exit Distraction-Free Mode (Esc)' : 'Enter Distraction-Free Mode'}
          className={`p-1.5 rounded transition-colors ${
            settings.focusMode
              ? 'bg-gradient-to-r from-lime-400 to-lime-500 text-neutral-950 font-bold shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-neutral-200/70 dark:hover:bg-neutral-800'
          }`}
        >
          {settings.focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

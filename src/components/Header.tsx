import React, { useState } from 'react';
import { 
  StoryView, 
  Project 
} from '../types/story';
import { 
  PenLine, 
  BookOpen, 
  Clock, 
  LayoutGrid, 
  Film, 
  Network, 
  Camera, 
  AlertCircle, 
  Search, 
  FolderGit2, 
  Sun, 
  Moon, 
  Palette,
  Check,
  FileDown,
  CloudCheck,
  ChevronDown,
  Home,
  Zap,
  Globe,
  Target,
  Trophy,
} from 'lucide-react';
import { calculateProjectWordCount } from '../services/storage';
import { ConnectivityModal } from './ConnectivityModal';
import { DailyGoalModal } from './DailyGoalModal';
import { useDailyGoal } from '../hooks/useDailyGoal';
import { ProjectSettings } from '../types/story';

interface HeaderProps {
  currentView: StoryView;
  setCurrentView: (view: StoryView) => void;
  project: Project;
  onOpenDashboard: () => void;
  onOpenSearch: () => void;
  onExport: () => void;
  onToggleTheme: () => void;
  onSetTheme?: (theme: ProjectSettings['theme']) => void;
  isAutosaving: boolean;
  activeSceneTitle?: string;
  activeChapterTitle?: string;
  onUpdateProject?: (updater: Project | ((prev: Project) => Project)) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  project,
  onOpenDashboard,
  onOpenSearch,
  onExport,
  onToggleTheme,
  onSetTheme,
  isAutosaving,
  activeSceneTitle,
  activeChapterTitle,
  onUpdateProject,
}) => {
  const totalWords = calculateProjectWordCount(project);
  const theme = project.settings.theme;
  const [isConnectivityModalOpen, setIsConnectivityModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  // Daily Writing Goal & Session Tracker
  const {
    dailyGoal,
    sessionWords,
    baselineWords,
    progressPercent,
    isGoalMet,
    wordsRemaining,
    updateGoal,
    resetSession,
  } = useDailyGoal(project, onUpdateProject);

  const navItems: { view: StoryView; label: string; icon: React.ReactNode }[] = [
    { view: 'home', label: 'Home', icon: <Home className="w-3.5 h-3.5" /> },
    { view: 'write', label: 'Write', icon: <PenLine className="w-3.5 h-3.5" /> },
    { view: 'bible', label: 'Story Bible', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { view: 'timeline', label: 'Timeline', icon: <Clock className="w-3.5 h-3.5" /> },
    { view: 'scenes', label: 'Scenes', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { view: 'script', label: 'Script', icon: <Film className="w-3.5 h-3.5" /> },
    { view: 'graph', label: 'Story Graph', icon: <Network className="w-3.5 h-3.5" /> },
    { view: 'animation', label: 'Animation', icon: <Camera className="w-3.5 h-3.5" /> },
    { view: 'continuity', label: 'Continuity', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className={`text-white flex flex-col select-none shrink-0 transition-colors z-30 shadow-xs border-b ${
      theme === 'grey'
        ? 'bg-[#1e293b] border-[#334155]'
        : theme === 'dark'
        ? 'bg-[#103f91] border-[#0c2f6d]'
        : 'bg-[#185abd] border-[#124896]'
    }`}>
      {/* Top Title Bar (Microsoft Word signature bar) */}
      <div className={`h-10 px-3.5 flex items-center justify-between text-xs border-b ${
        theme === 'grey' ? 'border-[#334155]' : 'border-[#124896]/60'
      }`}>
        {/* Left: Liime Words Brand & File Menu */}
        <div className="flex items-center gap-2.5">
          {/* File / Project Switcher (Word Backstage entry) */}
          <button
            onClick={onOpenDashboard}
            title="Open Projects Library (Word Backstage)"
            className="flex items-center gap-1 px-2.5 py-1 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-medium rounded text-xs transition-colors border border-white/20 shadow-xs"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>File</span>
          </button>

          {/* Liime Words logo badge */}
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 text-left group hover:opacity-95 transition-opacity"
            title="Liime Words Studio Home · Developed by LIIME"
          >
            <img
              src="./logo-64.png"
              alt="Liime Words Logo"
              className="w-6 h-6 object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
            />
            <span className="font-semibold text-sm tracking-tight text-white flex items-center gap-1">
              <span className="text-lime-300 font-bold">Liime</span>
              <span>Words</span>
            </span>
          </button>

          {/* Active Project Title with breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-blue-100/90 pl-2 border-l border-blue-400/30">
            <span className="font-medium text-white max-w-[180px] truncate" title={project.title}>
              {project.title}
            </span>
            <span className="text-[10px] text-blue-200">·</span>
            <span className="text-[11px] text-blue-200 font-light truncate max-w-[120px]">
              {project.genre || project.type}
            </span>
          </div>

          {activeSceneTitle && currentView === 'write' && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-blue-200 pl-2 border-l border-blue-400/30">
              <span className="truncate max-w-[130px] opacity-80">{activeChapterTitle?.split(':')[0]}</span>
              <span>›</span>
              <span className="truncate max-w-[160px] font-medium text-white">{activeSceneTitle}</span>
            </div>
          )}
        </div>

        {/* Center: Microsoft 365 style unified search bar */}
        <div className="max-w-md w-full mx-4 hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3 py-1 bg-white/15 hover:bg-white/25 active:bg-white/30 text-blue-100 hover:text-white rounded-md border border-white/20 transition-all text-xs"
            title="Search manuscript, characters, locations, events (Ctrl+K)"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-lime-300" />
              <span className="text-blue-100 font-normal">Search manuscript, bible, timeline, scenes...</span>
            </div>
            <kbd className="px-1.5 py-0.5 bg-black/25 text-[10px] text-lime-300/90 rounded font-mono border border-lime-400/20">⌘K</kbd>
          </button>
        </div>

        {/* Right: Autosave status, Word count, Theme, Export */}
        <div className="flex items-center gap-2">
          {/* Autosave Pill */}
          <div 
            className="flex items-center gap-1.5 text-blue-100 text-xs px-2 py-0.5 rounded bg-white/10 border border-white/15"
            title={isAutosaving ? 'Saving changes locally...' : 'All changes saved locally to device storage'}
          >
            <div className={`w-2 h-2 rounded-full ${isAutosaving ? 'bg-amber-300 animate-ping' : 'bg-lime-400 shadow-[0_0_6px_rgba(163,230,53,0.9)]'}`} />
            <span className="hidden xl:inline text-[11px]">
              {isAutosaving ? 'Saving...' : 'Saved to this device'}
            </span>
          </div>

          {/* Daily Writing Goal Progress Bar Button */}
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1 bg-white/10 hover:bg-white/20 active:bg-white/25 rounded border border-white/20 transition-all text-xs text-white cursor-pointer group shadow-xs"
            title={`Daily Goal: ${sessionWords.toLocaleString()} / ${dailyGoal.toLocaleString()} words this session (${progressPercent}%). Click to set goal or reset sprint.`}
          >
            <div className="flex items-center gap-1.5 font-medium">
              <Target className={`w-3.5 h-3.5 shrink-0 ${isGoalMet ? 'text-lime-300 animate-pulse' : 'text-lime-300 group-hover:scale-110 transition-transform'}`} />
              <span className="hidden xl:inline text-blue-100 text-[11px] font-normal">Session:</span>
              <span className="tabular-nums font-mono text-[11px] font-semibold text-lime-300">
                {sessionWords.toLocaleString()}<span className="text-blue-200 font-normal">/{dailyGoal.toLocaleString()}w</span>
              </span>
            </div>

            {/* Visual Progress Bar Track & Fill */}
            <div className="w-16 sm:w-20 md:w-24 h-2 bg-black/35 rounded-full overflow-hidden p-0.5 border border-white/20 relative shrink-0">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isGoalMet
                    ? 'bg-gradient-to-r from-lime-400 to-emerald-400 shadow-[0_0_8px_rgba(163,230,53,0.9)]'
                    : 'bg-lime-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Completion Percentage Badge */}
            <span className={`text-[10px] font-mono tabular-nums font-semibold px-1 rounded transition-colors ${
              isGoalMet 
                ? 'bg-lime-400/25 text-lime-300 border border-lime-400/40 shadow-xs' 
                : 'text-blue-100 bg-white/10'
            }`}>
              {progressPercent}%
            </span>
          </button>

          {/* Total Manuscript Word Count */}
          <span className="hidden 2xl:inline tabular-nums font-mono text-[11px] text-lime-300/90 bg-white/10 px-2 py-0.5 rounded border border-lime-400/20" title={`Total manuscript: ${totalWords.toLocaleString()} words`}>
            {totalWords.toLocaleString()} total
          </span>

          {/* Search button on small screens */}
          <button
            onClick={onOpenSearch}
            title="Search Project (Cmd+K)"
            className="md:hidden p-1.5 text-blue-100 hover:text-white hover:bg-white/15 rounded transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Export / Save As */}
          <button
            onClick={onExport}
            title="Export / Save As (Markdown, Plaintext, Fountain, JSON)"
            className="flex items-center gap-1 p-1.5 sm:px-2 sm:py-1 text-blue-100 hover:text-white hover:bg-white/15 rounded transition-colors text-xs font-medium"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Offline / Online Capability Indicator */}
          <button
            onClick={() => setIsConnectivityModalOpen(true)}
            title="View which studio features work offline vs. require internet"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] text-blue-100 hover:text-white transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-lime-300" />
            <span className="hidden sm:inline font-medium">Offline & Online Guide</span>
          </button>

          {/* Theme Switcher with Quick Menu */}
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(prev => !prev)}
              title={`Current Theme: ${
                theme === 'grey' ? 'White & Grey Mix (Slate Studio)' : theme === 'dark' ? 'Obsidian Dark' : theme === 'sepia' ? 'Warm Sepia' : 'Classic White'
              } · Click to choose theme`}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors cursor-pointer ${
                theme === 'grey'
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                  : 'text-blue-100 hover:text-white hover:bg-white/15'
              }`}
            >
              {theme === 'grey' ? (
                <Palette className="w-4 h-4 text-lime-400" />
              ) : theme === 'dark' ? (
                <Moon className="w-4 h-4 text-blue-200" />
              ) : (
                <Sun className="w-4 h-4 text-amber-300" />
              )}
              <span className="hidden xl:inline text-[11px] font-medium">
                {theme === 'grey' ? 'White & Grey' : theme === 'dark' ? 'Dark' : theme === 'sepia' ? 'Sepia' : 'Light'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {/* Dropdown Menu */}
            {isThemeMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsThemeMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl py-1.5 z-50 text-neutral-800 dark:text-neutral-200 text-xs">
                  <div className="px-3 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800">
                    Switch Theme
                  </div>

                  {/* 1. Classic Light */}
                  <button
                    onClick={() => {
                      if (onSetTheme) onSetTheme('light');
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                      theme === 'light' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500" />
                      <div>
                        <div className="font-medium">Classic White</div>
                        <div className="text-[10px] text-neutral-400">Pure white document & ribbon</div>
                      </div>
                    </div>
                    {theme === 'light' && <Check className="w-4 h-4 text-blue-600" />}
                  </button>

                  {/* 2. White & Grey Mix */}
                  <button
                    onClick={() => {
                      if (onSetTheme) onSetTheme('grey');
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                      theme === 'grey' ? 'bg-lime-50 dark:bg-lime-950/40 text-lime-800 dark:text-lime-300 font-semibold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-lime-600 dark:text-lime-400" />
                      <div>
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>White & Grey Mix</span>
                          <span className="text-[9px] bg-lime-500/20 text-lime-700 dark:text-lime-300 px-1 py-0.2 rounded font-bold uppercase">Studio</span>
                        </div>
                        <div className="text-[10px] text-neutral-400">Crisp white paper on matte slate desk</div>
                      </div>
                    </div>
                    {theme === 'grey' && <Check className="w-4 h-4 text-lime-600" />}
                  </button>

                  {/* 3. Obsidian Dark */}
                  <button
                    onClick={() => {
                      if (onSetTheme) onSetTheme('dark');
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                      theme === 'dark' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="font-medium">Obsidian Dark</div>
                        <div className="text-[10px] text-neutral-400">Low-light studio mode</div>
                      </div>
                    </div>
                    {theme === 'dark' && <Check className="w-4 h-4 text-blue-600" />}
                  </button>

                  {/* 4. Sepia Warm */}
                  <button
                    onClick={() => {
                      if (onSetTheme) onSetTheme('sepia');
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                      theme === 'sepia' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-medium">Warm Sepia</div>
                        <div className="text-[10px] text-neutral-400">Eye-friendly warm book paper</div>
                      </div>
                    </div>
                    {theme === 'sepia' && <Check className="w-4 h-4 text-amber-600" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Ribbon Tabs (Word Ribbon styling with Lime indicator) */}
      <div className={`h-9 px-2 flex items-center gap-1 overflow-x-auto scrollbar-none transition-colors ${
        theme === 'grey' ? 'bg-[#334155]' : 'bg-[#1550a8] dark:bg-[#0c2f6d]'
      }`}>
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={`flex items-center gap-1.5 px-3.5 py-1 text-xs font-medium rounded-t-md transition-all whitespace-nowrap border-b-2 cursor-pointer ${
                isActive
                  ? theme === 'grey'
                    ? 'bg-[#f8fafc] text-slate-900 border-lime-500 font-semibold shadow-xs'
                    : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-lime-500 dark:border-lime-400 font-semibold shadow-xs'
                  : 'text-blue-100 hover:text-white hover:bg-white/10 border-transparent'
              }`}
            >
              <span className={isActive ? 'text-lime-600 dark:text-lime-400' : ''}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Connectivity & Offline/Online Features Guide Modal */}
      <ConnectivityModal
        isOpen={isConnectivityModalOpen}
        onClose={() => setIsConnectivityModalOpen(false)}
      />

      {/* Daily Writing Goal & Session Tracker Modal */}
      <DailyGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        currentGoal={dailyGoal}
        sessionWords={sessionWords}
        totalWords={totalWords}
        baselineWords={baselineWords}
        onUpdateGoal={updateGoal}
        onResetSession={resetSession}
      />
    </header>
  );
};

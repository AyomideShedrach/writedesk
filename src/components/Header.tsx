import React, { useState } from 'react';
import { 
  Project, 
  StoryView, 
  ProjectSettings 
} from '../types/story';
import { 
  BookOpen, 
  Layers, 
  Compass, 
  Film, 
  Share2, 
  Search, 
  Settings, 
  Moon, 
  Sun, 
  Check, 
  FileDown, 
  ChevronDown, 
  Home, 
  Target, 
  Trophy 
} from 'lucide-react';
import { calculateProjectWordCount } from '../services/storage';
import { ConnectivityModal } from './ConnectivityModal';
import { DailyGoalModal } from './DailyGoalModal';
import { useDailyGoal } from '../hooks/useDailyGoal';

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

  const { dailyGoal, sessionWords, updateGoal } = useDailyGoal(project);

  const navItems: Array<{ id: StoryView; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'home', label: 'Backstage', icon: Home },
    { id: 'write', label: 'Write', icon: BookOpen },
    { id: 'bible', label: 'Story Bible', icon: Layers },
    { id: 'timeline', label: 'Timeline', icon: Compass },
    { id: 'script', label: 'Screenplay', icon: Film },
    { id: 'graph', label: 'Relations', icon: Share2 },
  ];

  const handleGoalUpdate = (newGoal: number) => {
    updateGoal(newGoal);
    if (onUpdateProject) {
      onUpdateProject(prev => ({
        ...prev,
        dailyWordGoal: newGoal,
      }));
    }
  };

  return (
    <header className="h-12 bg-neutral-950 border-b border-neutral-800/80 px-3 flex items-center justify-between text-neutral-200 select-none z-30 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenDashboard}
          title="Open Project Backstage & Library"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-lime-500/10 border border-lime-500/30 flex items-center justify-center text-lime-400 font-black text-sm group-hover:scale-105 transition-transform">
            L
          </div>
          <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">
            Liime Words
          </span>
        </button>

        <nav className="flex items-center gap-1 ml-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-lime-400" />
          <span className="hidden sm:inline">Search (Ctrl+K)</span>
        </button>

        <div className="hidden lg:flex items-center gap-2 px-2 py-0.5 rounded bg-neutral-900/60 border border-neutral-800 text-xs font-mono text-neutral-400">
          <span className="text-lime-400 font-bold">{totalWords.toLocaleString()}</span>
          <span>words</span>
        </div>

        <button
          onClick={() => setIsGoalModalOpen(true)}
          title="Daily Writing Goal Tracker"
          className="flex items-center gap-1 px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-300 transition-colors cursor-pointer"
        >
          <Target className="w-3.5 h-3.5 text-lime-400" />
          <span className="hidden sm:inline font-mono">{dailyGoal}w</span>
        </button>

        <button
          onClick={onExport}
          title="Export Manuscript"
          className="flex items-center gap-1 px-2.5 py-1 bg-lime-500 hover:bg-lime-400 text-neutral-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      <ConnectivityModal
        isOpen={isConnectivityModalOpen}
        onClose={() => setIsConnectivityModalOpen(false)}
      />

      <DailyGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        currentGoal={dailyGoal}
        sessionWords={sessionWords}
        onUpdateGoal={handleGoalUpdate}
      />
    </header>
  );
};

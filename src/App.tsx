import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, ProjectSettings, StoryView, Character, Location, StoryEvent, StoryObject } from './types/story';
import { StorageService } from './services/storage';
import { DEFAULT_PROJECT } from './data/defaultProject';
import { Header } from './components/Header';
import { WriteView } from './components/WriteView';
import { StoryBibleView } from './components/StoryBibleView';
import { TimelineView } from './components/TimelineView';
import { ScenesBoardView } from './components/ScenesBoardView';
import { ScriptView } from './components/ScriptView';
import { StoryGraphView } from './components/StoryGraphView';
import { AnimationBreakdownView } from './components/AnimationBreakdownView';
import { ContinuityView } from './components/ContinuityView';
import { ProjectDashboardModal } from './components/ProjectDashboardModal';
import { SearchModal } from './components/SearchModal';
import { ExportModal } from './components/ExportModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LoadingScreen } from './components/LoadingScreen';
import { HomeView } from './components/HomeView';
import { LiimeSuitePopup } from './components/LiimeSuitePopup';

export default function App() {
  // Initialize project from local storage
  const [project, setProject] = useState<Project>(() => {
    const currentId = StorageService.getCurrentProjectId();
    return StorageService.loadProject(currentId);
  });

  const [currentView, setCurrentView] = useState<StoryView>('home');
  const [isLoading, setIsLoading] = useState(true);
  const [showSuitePopup, setShowSuitePopup] = useState(true);
  const [activeSceneId, setActiveSceneId] = useState<string>(() => {
    return project.scenes[0]?.id || '';
  });

  const [isAutosaving, setIsAutosaving] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Debounced autosave ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update theme class on HTML element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-grey', 'theme-sepia');
    if (project.settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (project.settings.theme === 'grey') {
      root.classList.add('theme-grey');
    } else if (project.settings.theme === 'sepia') {
      root.classList.add('theme-sepia');
    }
  }, [project.settings.theme]);

  // Save project when updated, supporting both direct objects and functional updaters
  const handleUpdateProject = useCallback((updater: Project | ((prev: Project) => Project)) => {
    setProject(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      
      const normalizedBible = {
        characters: updated.storyBible?.characters || [],
        locations: updated.storyBible?.locations || [],
        events: updated.storyBible?.events || [],
        objects: updated.storyBible?.objects || [],
        relationships: updated.storyBible?.relationships || [],
      };

      const normalized: Project = {
        ...updated,
        storyBible: normalizedBible,
        screenplay: updated.screenplay || [],
      };

      setIsAutosaving(true);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        StorageService.saveProject(normalized);
        setIsAutosaving(false);
      }, 400);

      return normalized;
    });
  }, []);

  // Keyboard shortcuts (Cmd+K for search, Escape for modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsDashboardOpen(false);
        setIsSearchOpen(false);
        setIsExportOpen(false);
        if (project.settings.focusMode) {
          handleUpdateProject(prev => ({
            ...prev,
            settings: { ...prev.settings, focusMode: false },
          }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project.settings.focusMode, handleUpdateProject]);

  // Navigate to scene in writer
  const handleNavigateToScene = (sceneId: string) => {
    setActiveSceneId(sceneId);
    setCurrentView('write');
  };

  // Add entity to Story Bible
  const handleAddBibleEntity = (
    type: 'character' | 'location' | 'event' | 'object',
    item: any
  ) => {
    handleUpdateProject(prev => {
      const bible = prev.storyBible || {
        characters: [],
        locations: [],
        events: [],
        objects: [],
        relationships: [],
      };
      const updatedBible = {
        ...bible,
        characters: type === 'character' ? [...(bible.characters || []), item as Character] : (bible.characters || []),
        locations: type === 'location' ? [...(bible.locations || []), item as Location] : (bible.locations || []),
        events: type === 'event' ? [...(bible.events || []), item as StoryEvent] : (bible.events || []),
        objects: type === 'object' ? [...(bible.objects || []), item as StoryObject] : (bible.objects || []),
        relationships: bible.relationships || [],
      };
      return {
        ...prev,
        storyBible: updatedBible,
      };
    });
  };

  // Switch project
  const handleSelectProject = (projectId: string) => {
    const loaded = StorageService.loadProject(projectId);
    setProject(loaded);
    setActiveSceneId(loaded.scenes[0]?.id || '');
    StorageService.setCurrentProjectId(projectId);
  };

  // Create project
  const handleCreateProject = (
    title: string,
    author: string,
    type: Project['type'],
    genre: string
  ) => {
    const created = StorageService.createProject(title, author, type, genre);
    setProject(created);
    setActiveSceneId(created.scenes[0]?.id || '');
    if (type === 'screenplay') {
      setCurrentView('script');
    } else {
      setCurrentView('write');
    }
  };

  // Import project
  const handleImportProject = (imported: Project) => {
    setProject(imported);
    setActiveSceneId(imported.scenes[0]?.id || '');
    setCurrentView('write');
  };

  // Toggle Theme (cycles: light -> grey -> dark -> light)
  const handleToggleTheme = () => {
    const cycle: Record<ProjectSettings['theme'], ProjectSettings['theme']> = {
      light: 'grey',
      grey: 'dark',
      dark: 'light',
      sepia: 'light',
    };
    const nextTheme = cycle[project.settings.theme] || 'grey';
    handleUpdateProject(prev => ({
      ...prev,
      settings: { ...prev.settings, theme: nextTheme },
    }));
  };

  // Direct Theme Setter
  const handleSetTheme = (theme: ProjectSettings['theme']) => {
    handleUpdateProject(prev => ({
      ...prev,
      settings: { ...prev.settings, theme },
    }));
  };

  const activeScene = project.scenes.find(s => s.id === activeSceneId) || project.scenes[0];
  const activeChapter = project.chapters.find(c => c.id === activeScene?.chapterId) || project.chapters[0];

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden font-sans antialiased select-none ${
      project.settings.theme === 'dark'
        ? 'dark bg-neutral-950 text-neutral-100'
        : project.settings.theme === 'grey'
        ? 'theme-grey bg-[#e2e8f0] text-slate-900'
        : project.settings.theme === 'sepia'
        ? 'theme-sepia bg-[#f4ecd8] text-[#433422]'
        : 'bg-neutral-100 text-neutral-900'
    }`}>
      {/* Top Bar Header (Hidden in focus mode if desired) */}
      {!project.settings.focusMode && (
        <Header
          currentView={currentView}
          setCurrentView={setCurrentView}
          project={project}
          onOpenDashboard={() => setIsDashboardOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onExport={() => setIsExportOpen(true)}
          onToggleTheme={handleToggleTheme}
          onSetTheme={handleSetTheme}
          isAutosaving={isAutosaving}
          activeSceneTitle={activeScene?.title}
          activeChapterTitle={activeChapter?.title}
          onUpdateProject={handleUpdateProject}
        />
      )}

      {/* Main View Port */}
      <div className="flex-1 flex overflow-hidden relative">
        {currentView === 'home' && (
          <HomeView
            currentProject={project}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
            onImportProject={handleImportProject}
            onNavigateToWrite={() => setCurrentView('write')}
          />
        )}

        {currentView === 'write' && (
          <WriteView
            project={project}
            onUpdateProject={handleUpdateProject}
            activeSceneId={activeSceneId}
            setActiveSceneId={setActiveSceneId}
            onAddBibleEntity={handleAddBibleEntity}
          />
        )}

        {currentView === 'bible' && (
          <StoryBibleView
            project={project}
            onUpdateProject={handleUpdateProject}
            onNavigateToScene={handleNavigateToScene}
          />
        )}

        {currentView === 'timeline' && (
          <TimelineView
            project={project}
            onUpdateProject={handleUpdateProject}
            onNavigateToScene={handleNavigateToScene}
          />
        )}

        {currentView === 'scenes' && (
          <ScenesBoardView
            project={project}
            onUpdateProject={handleUpdateProject}
            onNavigateToScene={handleNavigateToScene}
          />
        )}

        {currentView === 'script' && (
          <ScriptView
            project={project}
            onUpdateProject={handleUpdateProject}
            activeSceneId={activeSceneId}
          />
        )}

        {currentView === 'graph' && (
          <StoryGraphView
            project={project}
            onNavigateToScene={handleNavigateToScene}
          />
        )}

        {currentView === 'animation' && (
          <AnimationBreakdownView
            project={project}
            onUpdateProject={handleUpdateProject}
          />
        )}

        {currentView === 'continuity' && (
          <ContinuityView
            project={project}
            onUpdateProject={handleUpdateProject}
            onNavigateToScene={handleNavigateToScene}
          />
        )}
      </div>

      {/* Modals */}
      <ProjectDashboardModal
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        currentProject={project}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onImportProject={handleImportProject}
        onSetTheme={handleSetTheme}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        project={project}
        onNavigateToScene={handleNavigateToScene}
        onNavigateToBible={tab => setCurrentView('bible')}
        onNavigateToScript={() => setCurrentView('script')}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={project}
      />

      {/* PWA Offline Network Toast */}
      <OfflineIndicator />

      {/* First Loading Screen: LOGO + "Developed by LIIME" */}
      {isLoading && <LoadingScreen onFinish={() => setIsLoading(false)} />}

      {/* 4-Second Startup Popup Window for Liime Suite */}
      {showSuitePopup && (
        <LiimeSuitePopup
          onClose={() => setShowSuitePopup(false)}
          durationSeconds={4}
        />
      )}

    </div>
  );
}

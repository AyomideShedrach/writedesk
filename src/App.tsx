import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, StoryView } from './types/story';
import { StorageService } from './services/storage';
import { Header } from './components/Header';
import { WriteView } from './components/WriteView';
import { StoryBibleView } from './components/StoryBibleView';
import { TimelineView } from './components/TimelineView';
import { ScreenplayView } from './components/ScreenplayView';
import { RelationshipGraphView } from './components/RelationshipGraphView';
import { SearchModal } from './components/SearchModal';
import { ExportModal } from './components/ExportModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LoadingScreen } from './components/LoadingScreen';
import { HomeView } from './components/HomeView';
import { LiimeSuitePopup } from './components/LiimeSuitePopup';

export default function App() {
  const [project, setProject] = useState<Project>(() => {
    const currentId = StorageService.getCurrentProjectId();
    return StorageService.loadProject(currentId);
  });

  const [currentView, setCurrentView] = useState<StoryView>('home');
  const [isLoading, setIsLoading] = useState(true);
  const [showSuitePopup, setShowSuitePopup] = useState(true);
  const [activeSceneId, setActiveSceneId] = useState<string>(() => {
    return project.scenes?.[0]?.id || '';
  });

  const [isAutosaving, setIsAutosaving] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-grey', 'theme-sepia');
    if (project.settings?.theme === 'dark') {
      root.classList.add('dark');
    } else if (project.settings?.theme === 'grey') {
      root.classList.add('theme-grey');
    } else if (project.settings?.theme === 'sepia') {
      root.classList.add('theme-sepia');
    }
  }, [project.settings?.theme]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsDashboardOpen(false);
        setIsSearchOpen(false);
        setIsExportOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigateToScene = (sceneId: string) => {
    setActiveSceneId(sceneId);
    setCurrentView('write');
  };

  const handleSelectProject = (id: string) => {
    StorageService.setCurrentProjectId(id);
    const loaded = StorageService.loadProject(id);
    setProject(loaded);
    setActiveSceneId(loaded.scenes?.[0]?.id || '');
    setIsDashboardOpen(false);
  };

  const handleCreateProject = (title: string) => {
    const created = StorageService.createProject(title);
    setProject(created);
    setActiveSceneId(created.scenes?.[0]?.id || '');
    setIsDashboardOpen(false);
    setCurrentView('write');
  };

  const handleImportProject = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.title) {
        StorageService.saveProject(parsed);
        handleSelectProject(parsed.id);
      }
    } catch (e) {
      alert('Invalid project JSON file');
    }
  };

  const activeScene = project.scenes?.find(s => s.id === activeSceneId) || project.scenes?.[0];
  const activeChapter = project.chapters?.find(c => c.id === activeScene?.chapterId) || project.chapters?.[0];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0c1610] text-neutral-100">
      {!project.settings?.focusMode && (
        <Header
          currentView={currentView}
          setCurrentView={setCurrentView}
          project={project}
          onOpenDashboard={() => setCurrentView('home')}
          onOpenSearch={() => setIsSearchOpen(true)}
          onExport={() => setIsExportOpen(true)}
          onToggleTheme={() => {}}
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
          />
        )}

        {currentView === 'script' && (
          <ScreenplayView
            project={project}
            onUpdateProject={handleUpdateProject}
          />
        )}

        {currentView === 'graph' && (
          <RelationshipGraphView
            project={project}
            onUpdateProject={handleUpdateProject}
          />
        )}
      </div>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        project={project}
        onNavigateToScene={handleNavigateToScene}
        onNavigateToBible={() => setCurrentView('bible')}
        onNavigateToScript={() => setCurrentView('script')}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={project}
      />

      <OfflineIndicator />

      {isLoading && <LoadingScreen onFinish={() => setIsLoading(false)} />}

      {showSuitePopup && (
        <LiimeSuitePopup
          onClose={() => setShowSuitePopup(false)}
          durationSeconds={4}
        />
      )}
    </div>
  );
}

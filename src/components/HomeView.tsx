import React, { useState, useEffect, useMemo } from 'react';
import { Project } from '../types/story';
import { StorageService, ProjectMetadata, calculateProjectWordCount } from '../services/storage';
import { 
  BookOpen, 
  Film, 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  Copy, 
  Search, 
  Clock, 
  PenLine, 
  Users, 
  MapPin, 
  Sparkles,
  ArrowRight,
  Check,
  FileText,
  BarChart3,
  Timer,
  Layers,
  Zap,
  Globe
} from 'lucide-react';

interface HomeViewProps {
  currentProject: Project;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (title: string, author: string, type: Project['type'], genre: string) => void;
  onImportProject: (project: Project) => void;
  onNavigateToWrite: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentProject,
  onSelectProject,
  onCreateProject,
  onImportProject,
  onNavigateToWrite,
}) => {
  const [projectsList, setProjectsList] = useState<ProjectMetadata[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'novel' | 'screenplay'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newType, setNewType] = useState<Project['type']>('novel');
  const [newGenre, setNewGenre] = useState('Sci-Fi / Cyberpunk');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refreshList = () => {
    const list = StorageService.getProjectsList();
    setProjectsList(list);
  };

  useEffect(() => {
    refreshList();
  }, [currentProject]);

  // Aggregate stats across all projects
  const totalWords = useMemo(() => {
    return projectsList.reduce((acc, p) => acc + (p.wordCount || 0), 0);
  }, [projectsList]);

  const totalCharacters = useMemo(() => {
    return projectsList.reduce((acc, p) => acc + (p.characterCount || 0), 0);
  }, [projectsList]);

  // Statistics for Currently Selected Project
  const selectedWordCount = useMemo(() => {
    return calculateProjectWordCount(currentProject);
  }, [currentProject]);

  const selectedSceneCount = currentProject.scenes.length;
  const selectedChapterCount = currentProject.chapters.length;

  const estimatedReadingTime = useMemo(() => {
    if (selectedWordCount <= 0) return '< 1 min';
    const minutes = Math.ceil(selectedWordCount / 225);
    if (minutes < 60) {
      return `${minutes} min${minutes === 1 ? '' : 's'}`;
    }
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
  }, [selectedWordCount]);

  const estimatedPages = useMemo(() => {
    return Math.max(1, Math.ceil(selectedWordCount / 250));
  }, [selectedWordCount]);

  const avgWordsPerScene = useMemo(() => {
    if (selectedSceneCount === 0) return 0;
    return Math.round(selectedWordCount / selectedSceneCount);
  }, [selectedWordCount, selectedSceneCount]);

  const targetWords = currentProject.targetWordCount || 50000;
  const targetPct = Math.min(Math.round((selectedWordCount / targetWords) * 100), 100);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projectsList.filter((p) => {
      const matchesType = filterType === 'all' || p.type === filterType;
      const matchesQuery =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.genre && p.genre.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesQuery;
    });
  }, [projectsList, filterType, searchQuery]);

  const handleOpenProject = (id: string) => {
    onSelectProject(id);
    onNavigateToWrite();
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateProject(newTitle.trim(), newAuthor.trim() || 'Studio Writer', newType, newGenre);
    setShowNewModal(false);
    setNewTitle('');
    refreshList();
    onNavigateToWrite();
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.duplicateProject(id);
    refreshList();
  };

  const handleDelete = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      StorageService.deleteProject(id);
      refreshList();
    }
  };

  const handleExportLiw = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const proj = StorageService.loadProject(id);
    StorageService.exportProjectAsLiw(proj);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = StorageService.importProjectFromJson(content);
        onImportProject(imported);
        refreshList();
        onNavigateToWrite();
      } catch (err: any) {
        alert(err.message || 'Failed to import .liw project file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Genre aesthetic theme colors for manuscript covers
  const getCoverTheme = (type: string, genre: string = '') => {
    const g = genre.toLowerCase();
    if (type === 'screenplay') {
      return {
        bg: 'from-amber-900/90 via-amber-950 to-neutral-950',
        border: 'border-amber-700/50',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        accent: '#f59e0b',
      };
    }
    if (g.includes('cyber') || g.includes('sci')) {
      return {
        bg: 'from-[#0e2918] via-[#08170e] to-neutral-950',
        border: 'border-lime-500/40',
        badge: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
        accent: '#84cc16',
      };
    }
    if (g.includes('fantasy') || g.includes('magic')) {
      return {
        bg: 'from-indigo-950 via-purple-950/70 to-neutral-950',
        border: 'border-indigo-500/40',
        badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        accent: '#818cf8',
      };
    }
    if (g.includes('thrill') || g.includes('crime') || g.includes('mystery')) {
      return {
        bg: 'from-red-950/80 via-neutral-900 to-neutral-950',
        border: 'border-red-600/40',
        badge: 'bg-red-500/20 text-red-300 border-red-500/30',
        accent: '#ef4444',
      };
    }
    return {
      bg: 'from-blue-950 via-slate-900 to-neutral-950',
      border: 'border-blue-500/40',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      accent: '#3b82f6',
    };
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-950 text-neutral-100 p-6 md:p-10 select-none">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Studio Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0c2415] via-[#07130b] to-[#040805] border border-lime-500/30 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-neutral-900/80 border border-lime-500/40 flex items-center justify-center shrink-0 shadow-lg p-2.5">
                <img
                  src="./logo-64.png"
                  alt="Liime Words Logo"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(14,168,40,0.6)]"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                    <span className="text-lime-400 font-extrabold">Liime</span>
                    <span>Words</span>
                  </h1>
                  <span className="text-[10px] font-mono uppercase bg-lime-500/20 text-lime-300 px-2 py-0.5 rounded border border-lime-500/30 font-semibold tracking-wider">
                    Studio Edition
                  </span>
                </div>
                <p className="text-xs md:text-sm text-lime-200/80 font-medium">
                  Dedicated to Studio Writers · <span className="text-white font-semibold">Developed by LIIME</span>
                </p>
                <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                  Desktop-grade novel writing, dual-layer screenplay adaptation, automatic Story Bible extraction, and chronology timeline.
                </p>
                <div className="flex items-center gap-2 mt-2.5 text-[11px] flex-wrap">
                  <span className="inline-flex items-center gap-1 text-lime-400 font-semibold bg-lime-500/10 px-2 py-0.5 rounded border border-lime-500/30">
                    <Zap className="w-3 h-3" />
                    <span>100% Offline-Capable Studio</span>
                  </span>
                  <span className="text-neutral-500">·</span>
                  <span className="inline-flex items-center gap-1 text-blue-300 font-medium bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                    <Globe className="w-3 h-3" />
                    <span>Optional Cloud Features</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-lime-500/50 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-sm">
                <Upload className="w-4 h-4 text-lime-400" />
                <span>Open .liw File</span>
                <input
                  type="file"
                  accept=".liw,.json"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-neutral-950 rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lime-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Project</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 pt-6 border-t border-lime-500/20 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-black/30 rounded-xl p-3 border border-white/5">
              <span className="text-[11px] text-neutral-400 block mb-0.5">Total Works</span>
              <span className="text-lg font-bold text-white font-mono">{projectsList.length}</span>
            </div>
            <div className="bg-black/30 rounded-xl p-3 border border-white/5">
              <span className="text-[11px] text-neutral-400 block mb-0.5">Total Words Penned</span>
              <span className="text-lg font-bold text-lime-400 font-mono">{totalWords.toLocaleString()}</span>
            </div>
            <div className="bg-black/30 rounded-xl p-3 border border-white/5">
              <span className="text-[11px] text-neutral-400 block mb-0.5">Characters in Bible</span>
              <span className="text-lg font-bold text-white font-mono">{totalCharacters}</span>
            </div>
            <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-neutral-400 block mb-0.5">Active Project</span>
                <span className="text-xs font-semibold text-lime-300 truncate max-w-[120px] block" title={currentProject.title}>
                  {currentProject.title}
                </span>
              </div>
              <button
                onClick={onNavigateToWrite}
                className="px-2.5 py-1 bg-lime-500/20 hover:bg-lime-500/30 text-lime-300 text-[11px] rounded font-medium flex items-center gap-1 transition-colors"
                title="Continue Writing"
              >
                <span>Write</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Project Statistics Widget for Currently Selected Project */}
        <div className="relative overflow-hidden rounded-2xl bg-neutral-900/90 border border-neutral-800 p-5 md:p-6 shadow-xl">
          {/* Subtle top accent glowing line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-lime-500 via-lime-400/50 to-transparent" />

          {/* Widget Header: Title, Active Manuscript Tag, and Project Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-neutral-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center text-lime-400 shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-lime-400">
                    Project Statistics
                  </span>
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded font-mono">
                    Currently Selected
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                  <span>{currentProject.title}</span>
                  <span className="text-xs font-normal text-neutral-400">
                    by {currentProject.author} · {currentProject.genre || 'Fiction'}
                  </span>
                </h3>
              </div>
            </div>

            {/* Quick Actions & Project Switcher Dropdown */}
            <div className="flex items-center gap-2.5 shrink-0">
              {projectsList.length > 1 && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <span className="hidden md:inline text-[11px]">Select:</span>
                  <select
                    value={currentProject.id}
                    onChange={(e) => onSelectProject(e.target.value)}
                    className="bg-neutral-800 border border-neutral-700 hover:border-neutral-600 focus:border-lime-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-hidden cursor-pointer max-w-[170px] truncate"
                    title="Switch inspected project"
                  >
                    {projectsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={onNavigateToWrite}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-lime-500 hover:bg-lime-400 text-neutral-950 font-bold rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
              >
                <PenLine className="w-3.5 h-3.5" />
                <span>Open in Editor</span>
              </button>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
            {/* Metric 1: Total Word Count */}
            <div className="rounded-xl bg-black/40 border border-white/5 p-4 flex flex-col justify-between hover:border-lime-500/30 transition-colors">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
                <span className="font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-lime-400" />
                  Total Word Count
                </span>
                <span className="text-[10px] font-mono text-lime-300 bg-lime-500/10 px-1.5 py-0.5 rounded">
                  {targetPct}% Goal
                </span>
              </div>
              <div className="text-2xl md:text-3xl font-bold font-mono text-white tracking-tight">
                {selectedWordCount.toLocaleString()}
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Target: {targetWords.toLocaleString()}</span>
                  <span>{Math.max(0, targetWords - selectedWordCount).toLocaleString()} words remaining</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-lime-500 to-lime-300 rounded-full transition-all duration-300"
                    style={{ width: `${targetPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Metric 2: Number of Scenes */}
            <div className="rounded-xl bg-black/40 border border-white/5 p-4 flex flex-col justify-between hover:border-lime-500/30 transition-colors">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
                <span className="font-medium flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-lime-400" />
                  Number of Scenes
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {selectedChapterCount} Chapters
                </span>
              </div>
              <div className="text-2xl md:text-3xl font-bold font-mono text-white tracking-tight">
                {selectedSceneCount}
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-800">
                <span>Avg. words per scene</span>
                <span className="font-mono text-neutral-200 font-semibold">{avgWordsPerScene.toLocaleString()} words</span>
              </div>
            </div>

            {/* Metric 3: Estimated Reading Time */}
            <div className="rounded-xl bg-black/40 border border-white/5 p-4 flex flex-col justify-between hover:border-lime-500/30 transition-colors">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
                <span className="font-medium flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-lime-400" />
                  Estimated Reading Time
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  @ 225 wpm
                </span>
              </div>
              <div className="text-2xl md:text-3xl font-bold font-mono text-lime-300 tracking-tight">
                {estimatedReadingTime}
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-800">
                <span>Standard Book Pages</span>
                <span className="font-mono text-neutral-200 font-semibold">~{estimatedPages} pages</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Heading with Search & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>My Manuscripts & Works</span>
              <span className="text-xs font-mono text-neutral-400 font-normal">
                ({filteredProjects.length})
              </span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Visual preview thumbnails of all stories stored on this device.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter Pills */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filterType === 'all'
                    ? 'bg-lime-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('novel')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filterType === 'novel'
                    ? 'bg-lime-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Novels
              </button>
              <button
                onClick={() => setFilterType('screenplay')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filterType === 'screenplay'
                    ? 'bg-lime-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Screenplays
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search works..."
                className="pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 focus:border-lime-500 rounded-lg text-xs text-white placeholder-neutral-500 outline-hidden w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Projects Grid with Rich Manuscript Thumbnails */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30">
            <BookOpen className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-neutral-300">No works found</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              {searchQuery ? 'Try adjusting your search query or filters.' : 'Create a new project or import an existing .liw file to start.'}
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="mt-4 px-4 py-2 bg-lime-500 hover:bg-lime-400 text-neutral-950 rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((proj) => {
              const theme = getCoverTheme(proj.type, proj.genre);
              const isActive = proj.id === currentProject.id;
              const target = proj.targetWordCount || 50000;
              const progressPct = Math.min(Math.round(((proj.wordCount || 0) / target) * 100), 100);

              return (
                <div
                  key={proj.id}
                  onClick={() => handleOpenProject(proj.id)}
                  className={`group relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer bg-neutral-900/80 hover:bg-neutral-900 hover:shadow-2xl hover:scale-[1.01] ${
                    isActive
                      ? 'border-lime-500/80 ring-2 ring-lime-500/20'
                      : 'border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {/* Visual Manuscript Thumbnail Header / Cover Preview */}
                  <div className={`relative h-48 p-4 bg-gradient-to-br ${theme.bg} border-b ${theme.border} overflow-hidden flex flex-col justify-between`}>
                    {/* Spine ribbon on left */}
                    <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-lime-500/40 shadow-inner" />

                    {/* Top Row: Type Badge & Active Status */}
                    <div className="flex items-center justify-between pl-2 relative z-10">
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-bold ${theme.badge}`}>
                        {proj.type === 'screenplay' ? 'Screenplay' : 'Novel Manuscript'}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-medium bg-lime-500 text-neutral-950 px-2 py-0.5 rounded-full font-bold shadow-xs flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Active
                        </span>
                      )}
                    </div>

                    {/* Realistic Manuscript Page Cutout Thumbnail */}
                    <div className="ml-2 bg-[#fdfbf7] dark:bg-[#1a1f1b] rounded-lg p-3 shadow-md border border-neutral-300/40 dark:border-neutral-800/80 transition-transform group-hover:-translate-y-1 duration-300">
                      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-1 mb-1.5">
                        <span className="text-[10px] font-serif font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-[180px]">
                          {proj.title}
                        </span>
                        <span className="text-[9px] font-mono text-neutral-500">
                          {proj.wordCount.toLocaleString()} w
                        </span>
                      </div>
                      
                      {/* Realistic Manuscript Excerpt Preview */}
                      <p className="text-[10px] font-serif italic text-neutral-700 dark:text-neutral-300 line-clamp-3 leading-relaxed opacity-90 select-none">
                        "{proj.previewExcerpt || 'Open this manuscript to begin writing chapter one...'}"
                      </p>
                    </div>

                    {/* Word Progress Bar along bottom of thumbnail */}
                    <div className="pl-2 relative z-10">
                      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-300 mb-1">
                        <span>Progress: {progressPct}%</span>
                        <span>{proj.wordCount.toLocaleString()} / {target.toLocaleString()} words</span>
                      </div>
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-lime-400 rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Content & Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-lime-300 transition-colors line-clamp-1">
                        {proj.title}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        By {proj.author} · <span className="text-lime-400/90">{proj.genre || 'Fiction'}</span>
                      </p>
                    </div>

                    {/* Metadata Badges */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-neutral-400 pt-2 border-t border-neutral-800">
                      <div className="flex items-center gap-1" title="Chapters & Scenes">
                        <FileText className="w-3 h-3 text-neutral-500" />
                        <span>{proj.chapterCount} ch · {proj.sceneCount} sc</span>
                      </div>
                      <div className="flex items-center gap-1" title="Characters in Story Bible">
                        <Users className="w-3 h-3 text-neutral-500" />
                        <span>{proj.characterCount} chars</span>
                      </div>
                      <div className="flex items-center gap-1 justify-end text-neutral-500 text-[10px]" title="Last Updated">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(proj.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Action Bar on Card */}
                    <div className="pt-2 flex items-center justify-between gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProject(proj.id);
                        }}
                        className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-lime-500 hover:text-neutral-950 text-neutral-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 group/btn"
                      >
                        <PenLine className="w-3.5 h-3.5" />
                        <span>Open & Write</span>
                      </button>

                      <button
                        onClick={(e) => handleExportLiw(proj.id, e)}
                        title="Download .liw Project File"
                        className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-lime-300 rounded-xl transition-colors"
                      >
                        {copiedId === proj.id ? (
                          <Check className="w-3.5 h-3.5 text-lime-400" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={(e) => handleDuplicate(proj.id, e)}
                        title="Duplicate Manuscript"
                        className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(proj.id, proj.title, e)}
                        title="Delete Manuscript"
                        className="p-2 bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* New Project Dialog Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-left">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-lime-500/20 border border-lime-500/30 flex items-center justify-center text-lime-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Create New Studio Project</h3>
                <p className="text-xs text-neutral-400">Set up your next novel manuscript or screenplay</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Neon Citadel"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 focus:border-lime-500 rounded-xl text-xs text-white placeholder-neutral-500 outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Author Name
                </label>
                <input
                  type="text"
                  placeholder="Your Name or Pen Name"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 focus:border-lime-500 rounded-xl text-xs text-white placeholder-neutral-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Project Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as Project['type'])}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 focus:border-lime-500 rounded-xl text-xs text-white outline-hidden cursor-pointer"
                  >
                    <option value="novel">Novel Manuscript</option>
                    <option value="screenplay">Screenplay / Script</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Genre
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sci-Fi, Thriller"
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 focus:border-lime-500 rounded-xl text-xs text-white placeholder-neutral-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-neutral-950 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

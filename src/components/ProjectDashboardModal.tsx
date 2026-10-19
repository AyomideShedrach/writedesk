import React, { useState, useEffect } from 'react';
import { Project } from '../types/story';
import { StorageService, ProjectMetadata } from '../services/storage';
import { 
  FolderGit2, 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  X, 
  BookOpen, 
  Film, 
  FileText, 
  Clock, 
  Calendar,
  Sparkles,
  CheckCircle2,
  FileCode,
  Sun,
  Moon,
  Palette
} from 'lucide-react';

interface ProjectDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: Project;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (title: string, author: string, type: Project['type'], genre: string) => void;
  onImportProject: (imported: Project) => void;
  onSetTheme?: (theme: Project['settings']['theme']) => void;
  onOpenTopUp?: () => void;
  balanceText?: string;
}

export const ProjectDashboardModal: React.FC<ProjectDashboardModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onSelectProject,
  onCreateProject,
  onImportProject,
  onSetTheme,
  onOpenTopUp,
  balanceText,
}) => {
  const [projectsList, setProjectsList] = useState<ProjectMetadata[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newType, setNewType] = useState<Project['type']>('novel');
  const [newGenre, setNewGenre] = useState('Mystery / Noir');

  const refreshList = () => {
    const list = StorageService.getProjectsList();
    setProjectsList(list);
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle file import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = StorageService.importProjectFromJson(text);
        onImportProject(imported);
        refreshList();
      } catch (err: any) {
        alert('Failed to import project: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateProject(newTitle, newAuthor, newType, newGenre);
    setShowNewModal(false);
    setNewTitle('');
    setNewAuthor('');
    refreshList();
  };

  const handleCreateTemplate = (title: string, type: Project['type'], genre: string) => {
    onCreateProject(title, currentProject.author || 'Author', type, genre);
    refreshList();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]">
        {/* Left Microsoft Word Styled Sidebar */}
        <div className="w-full md:w-64 bg-[#185abd] text-white p-6 flex flex-col justify-between shrink-0">
          <div>
            {/* Liime Words Logo & Title */}
            <div className="flex items-center gap-2.5 mb-8">
              <img
                src="./logo-64.png"
                alt="Liime Words"
                className="w-8 h-8 object-contain shrink-0 filter drop-shadow"
              />
              <div>
                <h1 className="font-bold text-lg leading-tight tracking-tight">
                  <span className="text-lime-300 font-bold">Liime</span> Words
                </h1>
                <p className="text-[11px] text-lime-200/90 font-medium">Dedicated to Studio Writers · LIIME</p>
              </div>
            </div>

            {/* Backstage Navigation Actions */}
            <div className="space-y-1.5 text-xs font-medium">
              <button
                onClick={() => setShowNewModal(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-md transition-colors text-left"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>New Project</span>
              </button>

              <label className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/15 rounded-md transition-colors cursor-pointer text-left">
                <Upload className="w-4 h-4 text-lime-300" />
                <span>Open / Import .liw Project</span>
                <input
                  type="file"
                  accept=".liw,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => StorageService.exportProjectAsLiw(currentProject)}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/15 rounded-md transition-colors text-left cursor-pointer"
              >
                <Download className="w-4 h-4 text-lime-300" />
                <span>Save Project (.liw)</span>
              </button>

              {/* Theme Switcher in Backstage Rail */}
              <div className="pt-3 border-t border-white/20 mt-3">
                <div className="text-[10px] font-semibold text-lime-200 uppercase tracking-wider px-1 mb-1.5 flex items-center gap-1">
                  <Palette className="w-3 h-3 text-lime-300" />
                  <span>Studio Theme</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => onSetTheme && onSetTheme('light')}
                    className={`px-2 py-1.5 rounded text-[11px] font-medium text-left flex items-center gap-1.5 transition-colors cursor-pointer ${
                      currentProject.settings.theme === 'light'
                        ? 'bg-white text-blue-900 font-bold shadow-xs'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-300" />
                    <span>White</span>
                  </button>
                  <button
                    onClick={() => onSetTheme && onSetTheme('grey')}
                    className={`px-2 py-1.5 rounded text-[11px] font-medium text-left flex items-center gap-1.5 transition-colors cursor-pointer ${
                      currentProject.settings.theme === 'grey'
                        ? 'bg-lime-400 text-slate-950 font-bold shadow-xs'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5 text-lime-300" />
                    <span>Grey Mix</span>
                  </button>
                  <button
                    onClick={() => onSetTheme && onSetTheme('dark')}
                    className={`px-2 py-1.5 rounded text-[11px] font-medium text-left flex items-center gap-1.5 transition-colors cursor-pointer ${
                      currentProject.settings.theme === 'dark'
                        ? 'bg-white text-blue-900 font-bold shadow-xs'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-blue-200" />
                    <span>Dark</span>
                  </button>
                  <button
                    onClick={() => onSetTheme && onSetTheme('sepia')}
                    className={`px-2 py-1.5 rounded text-[11px] font-medium text-left flex items-center gap-1.5 transition-colors cursor-pointer ${
                      currentProject.settings.theme === 'sepia'
                        ? 'bg-amber-300 text-amber-950 font-bold shadow-xs'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-200" />
                    <span>Sepia</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-blue-400/30 text-[11px] text-blue-100 space-y-1">
            <div className="font-semibold text-white">Offline Workspace</div>
            <p className="text-blue-100/80 leading-relaxed">
              Liime Words saves all story files directly inside your browser storage. No account or internet required.
            </p>
          </div>
        </div>

        {/* Right Content Area: Templates & Recent Documents */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] dark:bg-[#151921] overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Story Documents
              </h2>
              <p className="text-xs text-neutral-500">
                Select a recent novel project or start from a new draft.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Templates */}
            <div>
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                New Document Templates
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => setShowNewModal(true)}
                  className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-[#185abd] dark:hover:border-blue-400 rounded-lg text-left transition-all group shadow-xs"
                >
                  <div className="w-8 h-8 rounded bg-[#eef5fc] dark:bg-blue-950 text-[#185abd] dark:text-blue-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Blank Novel</div>
                  <div className="text-[10px] text-neutral-400">Custom settings</div>
                </button>

                <button
                  onClick={() => handleCreateTemplate('The Vanishing Echo', 'novel', 'Mystery / Thriller')}
                  className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-[#185abd] dark:hover:border-blue-400 rounded-lg text-left transition-all group shadow-xs"
                >
                  <div className="w-8 h-8 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Mystery / Noir</div>
                  <div className="text-[10px] text-neutral-400">Chapters & scenes</div>
                </button>

                <button
                  onClick={() => handleCreateTemplate('Shadow Protocol', 'screenplay', 'Action / Sci-Fi')}
                  className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-[#185abd] dark:hover:border-blue-400 rounded-lg text-left transition-all group shadow-xs"
                >
                  <div className="w-8 h-8 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Film className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Screenplay</div>
                  <div className="text-[10px] text-neutral-400">Courier formatting</div>
                </button>

                <button
                  onClick={() => handleCreateTemplate('Night Travelers', 'short_story', 'Literary Fiction')}
                  className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-[#185abd] dark:hover:border-blue-400 rounded-lg text-left transition-all group shadow-xs"
                >
                  <div className="w-8 h-8 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Short Story</div>
                  <div className="text-[10px] text-neutral-400">Compact single arc</div>
                </button>
              </div>
            </div>

            {/* Recent Documents */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Recent Story Projects ({projectsList.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projectsList.map((proj) => {
                  const isCurrent = proj.id === currentProject.id;

                  return (
                    <div
                      key={proj.id}
                      onClick={() => {
                        onSelectProject(proj.id);
                        onClose();
                      }}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'border-[#185abd] bg-[#eef5fc] dark:bg-blue-950/30 ring-1 ring-[#185abd]/30 shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-semibold font-mono tracking-wider px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                            {proj.type}
                          </span>
                          {isCurrent && (
                            <span className="text-[11px] font-semibold text-[#185abd] dark:text-blue-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-0.5 truncate">
                          {proj.title}
                        </h4>
                        <p className="text-xs text-neutral-500 mb-3 truncate">
                          By {proj.author}
                        </p>

                        {/* Word count & Scene stats */}
                        <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded bg-neutral-100/70 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-300 text-xs mb-3">
                          <div>
                            <span className="block font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                              {proj.wordCount.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-neutral-400">Words</span>
                          </div>
                          <div>
                            <span className="block font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                              {proj.chapterCount}
                            </span>
                            <span className="text-[10px] text-neutral-400">Chapters</span>
                          </div>
                          <div>
                            <span className="block font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                              {proj.sceneCount}
                            </span>
                            <span className="text-[10px] text-neutral-400">Scenes</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400">
                        <span className="text-[11px] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(proj.updatedAt).toLocaleDateString()}
                        </span>

                        <div className="flex items-center gap-2">
                          {isCurrent && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                StorageService.exportProjectAsJson(currentProject);
                              }}
                              className="p-1 text-neutral-400 hover:text-[#185abd]"
                              title="Download JSON file"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {projectsList.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete project "${proj.title}"?`)) {
                                  StorageService.deleteProject(proj.id);
                                  refreshList();
                                }
                              }}
                              className="p-1 text-neutral-400 hover:text-red-500"
                              title="Delete project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE NEW PROJECT MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-60">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-[#185abd] text-white font-bold text-xs flex items-center justify-center">
                W
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                New Story Document
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              Create a new novel, novella, or screenplay project in Liime Words.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. The Silver Key"
                  className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#185abd]"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                  Author Name
                </label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={e => setNewAuthor(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#185abd]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                    Project Type
                  </label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as any)}
                    className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#185abd]"
                  >
                    <option value="novel">Novel</option>
                    <option value="novella">Novella</option>
                    <option value="short_story">Short Story</option>
                    <option value="screenplay">Screenplay</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                    Genre
                  </label>
                  <input
                    type="text"
                    value={newGenre}
                    onChange={e => setNewGenre(e.target.value)}
                    placeholder="e.g. Sci-Fi / Noir"
                    className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#185abd]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-4">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#185abd] hover:bg-[#134896] text-white font-semibold rounded shadow-xs transition-colors"
                >
                  Create Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

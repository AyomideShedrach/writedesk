import React, { useState } from 'react';
import { Project } from '../types/story';
import { StorageService, ProjectMetadata } from '../services/storage';
import { Plus, BookOpen, Trash2, Calendar, FileText, ArrowRight, Upload } from 'lucide-react';

interface HomeViewProps {
  currentProject: Project;
  onSelectProject: (id: string) => void;
  onCreateProject: (title: string) => void;
  onImportProject: (jsonString: string) => void;
  onNavigateToWrite: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentProject,
  onSelectProject,
  onCreateProject,
  onImportProject,
  onNavigateToWrite,
}) => {
  const [projects, setProjects] = useState<ProjectMetadata[]>(() => StorageService.getProjectsList());
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    onCreateProject(newTitle.trim());
    setProjects(StorageService.getProjectsList());
    setNewTitle('');
    setIsCreating(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      StorageService.deleteProject(id);
      setProjects(StorageService.getProjectsList());
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0c1610] text-neutral-100 flex justify-center">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header Hero */}
        <div className="flex items-center justify-between pb-6 border-b border-neutral-800">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Studio</span>
              <span className="text-lime-400">Library</span>
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Manuscripts, story development bibles, and dual-layer screenplays.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-neutral-950 font-bold text-xs transition-all shadow-lg shadow-lime-500/20 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Manuscript</span>
            </button>
          </div>
        </div>

        {/* Create Input Modal / Drawer */}
        {isCreating && (
          <div className="p-4 rounded-xl bg-neutral-900 border border-lime-500/40 flex items-center gap-3">
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Enter manuscript title..."
              className="flex-1 px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-sm text-white focus:outline-hidden"
            />
            <button
              onClick={handleCreate}
              className="px-4 py-2 rounded-lg bg-lime-500 hover:bg-lime-400 text-neutral-950 font-bold text-xs"
            >
              Create
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="px-3 py-2 rounded-lg text-neutral-400 hover:text-white text-xs"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const isCurrent = proj.id === currentProject.id;
            return (
              <div
                key={proj.id}
                onClick={() => {
                  onSelectProject(proj.id);
                  onNavigateToWrite();
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                  isCurrent
                    ? 'bg-neutral-900/90 border-lime-500/50 shadow-xl shadow-lime-950/20'
                    : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-lime-400 px-2 py-0.5 rounded bg-lime-500/10 border border-lime-500/20">
                      {proj.type || 'Novel'}
                    </span>
                    {projects.length > 1 && (
                      <button
                        onClick={(e) => handleDelete(proj.id, e)}
                        className="opacity-0 group-hover:opacity-60 hover:opacity-100 text-red-400 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-lime-300 transition-colors">
                    {proj.title}
                  </h3>

                  <p className="text-neutral-400 text-xs mt-1 line-clamp-2">
                    {proj.logline || proj.previewExcerpt || 'No manuscript excerpt yet.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="font-mono text-lime-400 font-semibold">
                    {proj.wordCount?.toLocaleString() || 0} words
                  </span>
                  <div className="flex items-center gap-1 text-neutral-500 group-hover:text-lime-400 transition-colors">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

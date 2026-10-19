import React, { useState } from 'react';
import { Project, Scene } from '../types/story';
import { 
  LayoutGrid, 
  List, 
  MapPin, 
  Users, 
  Clock, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink, 
  Plus, 
  FileText, 
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

interface ScenesBoardViewProps {
  project: Project;
  onUpdateProject: (updater: Project | ((prev: Project) => Project)) => void;
  onNavigateToScene: (sceneId: string) => void;
}

export const ScenesBoardView: React.FC<ScenesBoardViewProps> = ({
  project,
  onUpdateProject,
  onNavigateToScene,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [chapterFilter, setChapterFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const characters = project.storyBible?.characters || [];
  const locations = project.storyBible?.locations || [];

  // Filter scenes
  const filteredScenes = [...project.scenes]
    .sort((a, b) => a.order - b.order)
    .filter(scene => {
      if (chapterFilter !== 'all' && scene.chapterId !== chapterFilter) return false;
      if (statusFilter !== 'all' && scene.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = scene.title.toLowerCase().includes(q);
        const matchesContent = scene.content.toLowerCase().includes(q);
        const matchesNotes = scene.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent && !matchesNotes) return false;
      }
      return true;
    });

  // Reorder scene
  const handleMoveScene = (sceneId: string, direction: 'up' | 'down') => {
    onUpdateProject((prev: Project) => {
      const currentIdx = prev.scenes.findIndex(s => s.id === sceneId);
      if (currentIdx === -1) return prev;
      const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
      if (targetIdx < 0 || targetIdx >= prev.scenes.length) return prev;

      const reordered = [...prev.scenes];
      const [moved] = reordered.splice(currentIdx, 1);
      reordered.splice(targetIdx, 0, moved);

      const updated = reordered.map((s, idx) => ({ ...s, order: idx + 1 }));
      return { ...prev, scenes: updated };
    });
  };

  const getStatusColor = (status: Scene['status']) => {
    switch (status) {
      case 'outline': return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
      case 'draft': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      case 'revision': return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
      case 'polished': return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
      case 'final': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 select-none">
      {/* Top Controls Bar */}
      <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          {/* Chapter Filter */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={chapterFilter}
              onChange={e => setChapterFilter(e.target.value)}
              className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="all">All Chapters ({project.chapters.length})</option>
              {project.chapters.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="outline">Outline</option>
            <option value="draft">Draft</option>
            <option value="revision">Revision</option>
            <option value="polished">Polished</option>
            <option value="final">Final</option>
          </select>
        </div>

        {/* Search & Layout toggle */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search scene content..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 w-44 focus:outline-none"
            />
          </div>

          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-500'
              }`}
              title="Index Cards Matrix"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-500'
              }`}
              title="Structured Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {viewMode === 'cards' ? (
            /* Corkboard / Index Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredScenes.map(scene => {
                const chap = project.chapters.find(c => c.id === scene.chapterId);
                const loc = locations.find(l => l.id === scene.locationId);
                const pov = characters.find(c => c.id === scene.povCharacterId);
                const sceneChars = characters.filter(c => scene.characterIds.includes(c.id));
                const hasScreenplay = project.screenplay.some(sp => sp.sourceSceneId === scene.id);

                return (
                  <div
                    key={scene.id}
                    className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-xs group"
                  >
                    <div>
                      {/* Top Metadata */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-mono text-neutral-400 font-medium">
                          {chap?.title.split(':')[0] || 'Ch ?'} · Seq #{scene.order}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${getStatusColor(scene.status)}`}>
                            {scene.status}
                          </span>
                          {hasScreenplay && (
                            <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                              Script Ready
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Scene Title */}
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 mb-2">
                        {scene.title}
                      </h3>

                      {/* Prose Preview */}
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed mb-3">
                        {scene.content || 'Empty scene manuscript...'}
                      </p>

                      {/* Emotional Beat Note */}
                      {scene.emotionalBeat && (
                        <div className="text-xs italic text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded mb-3">
                          <span className="font-medium not-italic">Beat: </span>
                          "{scene.emotionalBeat}"
                        </div>
                      )}
                    </div>

                    <div>
                      {/* Context metadata: POV, Location, Time */}
                      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5 text-xs text-neutral-500 mb-3">
                        {pov && (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-blue-500" />
                            <span>POV: </span>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">{pov.name}</span>
                          </div>
                        )}
                        {loc && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-emerald-500" />
                            <span className="truncate">{loc.name}</span>
                          </div>
                        )}
                        {scene.time && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            <span>{scene.time}</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Footer Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveScene(scene.id, 'up')}
                            title="Move earlier in manuscript"
                            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveScene(scene.id, 'down')}
                            title="Move later in manuscript"
                            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[11px] font-mono text-neutral-400 ml-1">
                            {scene.wordCount} words
                          </span>
                        </div>

                        <button
                          onClick={() => onNavigateToScene(scene.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Structured Table View */
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800/80 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="p-3 w-14">#</th>
                    <th className="p-3">Scene Title</th>
                    <th className="p-3">Chapter</th>
                    <th className="p-3">POV</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Words</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredScenes.map(scene => {
                    const chap = project.chapters.find(c => c.id === scene.chapterId);
                    const loc = locations.find(l => l.id === scene.locationId);
                    const pov = characters.find(c => c.id === scene.povCharacterId);

                    return (
                      <tr key={scene.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="p-3 font-mono font-medium text-neutral-400">{scene.order}</td>
                        <td className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">{scene.title}</td>
                        <td className="p-3 text-neutral-500">{chap?.title.split(':')[0]}</td>
                        <td className="p-3 text-neutral-600 dark:text-neutral-300">{pov?.name || '—'}</td>
                        <td className="p-3 text-neutral-600 dark:text-neutral-300">{loc?.name || '—'}</td>
                        <td className="p-3 text-neutral-500">{scene.time || '—'}</td>
                        <td className="p-3">
                          <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${getStatusColor(scene.status)}`}>
                            {scene.status}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-neutral-500">{scene.wordCount}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onNavigateToScene(scene.id)}
                            className="px-2 py-1 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

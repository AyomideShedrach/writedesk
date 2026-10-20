import React, { useState, useMemo } from 'react';
import { Search, X, BookOpen, Users, MapPin, Calendar, FileText } from 'lucide-react';
import { Project } from '../types/story';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onNavigateToScene: (sceneId: string) => void;
  onNavigateToBible: (tab: string) => void;
  onNavigateToScript: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  project,
  onNavigateToScene,
  onNavigateToBible,
  onNavigateToScript,
}) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const hits: Array<{ id: string; type: string; title: string; subtitle: string; action: () => void }> = [];

    // Scenes
    project.scenes?.forEach(scene => {
      if (scene.title.toLowerCase().includes(q) || scene.content.toLowerCase().includes(q)) {
        hits.push({
          id: scene.id,
          type: 'scene',
          title: scene.title,
          subtitle: `Scene in ${project.chapters.find(c => c.id === scene.chapterId)?.title || 'Manuscript'}`,
          action: () => {
            onNavigateToScene(scene.id);
            onClose();
          },
        });
      }
    });

    // Characters
    project.storyBible?.characters?.forEach(char => {
      if (char.name.toLowerCase().includes(q) || (char.bio && char.bio.toLowerCase().includes(q))) {
        hits.push({
          id: char.id,
          type: 'character',
          title: char.name,
          subtitle: `Character · ${char.role || ''}`,
          action: () => {
            onNavigateToBible('characters');
            onClose();
          },
        });
      }
    });

    return hits.slice(0, 15);
  }, [query, project, onNavigateToScene, onNavigateToBible, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-3.5 border-b border-neutral-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-lime-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search scenes, characters, locations, or story lore (Esc to close)..."
            className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-hidden"
          />
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="p-4 text-center text-xs text-neutral-500">
              {query ? 'No matching story elements found.' : 'Type to search the entire manuscript and story bible.'}
            </p>
          ) : (
            results.map((res) => (
              <button
                key={res.id}
                onClick={res.action}
                className="w-full text-left p-2.5 rounded-lg hover:bg-neutral-800 flex items-center justify-between text-xs transition-colors"
              >
                <div>
                  <p className="font-semibold text-white">{res.title}</p>
                  <p className="text-neutral-400 text-[11px]">{res.subtitle}</p>
                </div>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-lime-400">
                  {res.type}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

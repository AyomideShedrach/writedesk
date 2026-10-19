import React, { useState, useEffect, useRef } from 'react';
import { Project, StoryView } from '../types/story';
import { 
  Search, 
  X, 
  BookOpen, 
  Users, 
  MapPin, 
  Flag, 
  Box, 
  Film, 
  FileText, 
  ArrowRight 
} from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onNavigateToScene: (sceneId: string) => void;
  onNavigateToBible: (tab: 'characters' | 'locations' | 'events' | 'objects') => void;
  onNavigateToScript?: () => void;
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Search Results aggregation with complete null-safety
  const characterMatches = q
    ? (project.storyBible?.characters || []).filter(
        c => (c.name || '').toLowerCase().includes(q) || (c.occupation || '').toLowerCase().includes(q)
      )
    : [];

  const locationMatches = q
    ? (project.storyBible?.locations || []).filter(
        l => (l.name || '').toLowerCase().includes(q) || (l.description || '').toLowerCase().includes(q)
      )
    : [];

  const eventMatches = q
    ? (project.storyBible?.events || []).filter(
        e => (e.name || '').toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q)
      )
    : [];

  const sceneMatches = q
    ? (project.scenes || []).filter(
        s => (s.title || '').toLowerCase().includes(q) || (s.content || '').toLowerCase().includes(q)
      )
    : [];

  const screenplayMatches = q
    ? (project.screenplay || []).filter(sp =>
        (sp.slugline || '').toLowerCase().includes(q) ||
        (sp.elements || []).some(el => (el.content || '').toLowerCase().includes(q))
      )
    : [];

  const totalMatches =
    characterMatches.length +
    locationMatches.length +
    eventMatches.length +
    sceneMatches.length +
    screenplayMatches.length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-start justify-center p-4 pt-16 z-50 select-none">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Bar Input */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3 bg-neutral-50/50 dark:bg-neutral-900/50">
          <Search className="w-5 h-5 text-lime-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search manuscript, characters, locations, events, script..."
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!q ? (
            <div className="text-center py-10 text-neutral-400 text-xs">
              Type to search across the entire Liime Words project workspace...
            </div>
          ) : totalMatches === 0 ? (
            <div className="text-center py-10 text-neutral-400 text-xs">
              No matching records found for "{query}".
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Character Results */}
              {characterMatches.length > 0 && (
                <div>
                  <h4 className="font-semibold text-neutral-400 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#185abd]" />
                    <span>Story Bible Characters ({characterMatches.length})</span>
                  </h4>
                  <div className="space-y-1">
                    {characterMatches.map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onNavigateToBible('characters');
                          onClose();
                        }}
                        className="p-2 rounded-lg hover:bg-[#eef5fc] dark:hover:bg-blue-950/30 cursor-pointer flex items-center justify-between text-neutral-800 dark:text-neutral-200 transition-colors"
                      >
                        <div>
                          <span className="font-semibold text-[#185abd] dark:text-blue-300">{c.name}</span>
                          <span className="text-neutral-400 ml-2">({c.role} · {c.occupation || 'No title'})</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manuscript Scene Results */}
              {sceneMatches.length > 0 && (
                <div>
                  <h4 className="font-semibold text-neutral-400 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#185abd]" />
                    <span>Manuscript Scenes ({sceneMatches.length})</span>
                  </h4>
                  <div className="space-y-1">
                    {sceneMatches.map(s => {
                      const chap = project.chapters.find(c => c.id === s.chapterId);
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            onNavigateToScene(s.id);
                            onClose();
                          }}
                          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer flex items-start justify-between text-neutral-800 dark:text-neutral-200 transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {s.title}
                              <span className="text-[11px] font-mono text-neutral-400 font-normal ml-2">
                                {chap?.title.split(':')[0]}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                              {s.content}
                            </p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 opacity-40 shrink-0 mt-1" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Location Results */}
              {locationMatches.length > 0 && (
                <div>
                  <h4 className="font-semibold text-neutral-400 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Locations ({locationMatches.length})</span>
                  </h4>
                  <div className="space-y-1">
                    {locationMatches.map(l => (
                      <div
                        key={l.id}
                        onClick={() => {
                          onNavigateToBible('locations');
                          onClose();
                        }}
                        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer flex items-center justify-between text-neutral-800 dark:text-neutral-200 transition-colors"
                      >
                        <span className="font-semibold">{l.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Event Results */}
              {eventMatches.length > 0 && (
                <div>
                  <h4 className="font-semibold text-neutral-400 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-amber-500" />
                    <span>Events ({eventMatches.length})</span>
                  </h4>
                  <div className="space-y-1">
                    {eventMatches.map(e => (
                      <div
                        key={e.id}
                        onClick={() => {
                          onNavigateToBible('events');
                          onClose();
                        }}
                        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer flex items-center justify-between text-neutral-800 dark:text-neutral-200 transition-colors"
                      >
                        <span className="font-semibold">{e.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Screenplay Results */}
              {screenplayMatches.length > 0 && (
                <div>
                  <h4 className="font-semibold text-neutral-400 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-purple-500" />
                    <span>Screenplay ({screenplayMatches.length})</span>
                  </h4>
                  <div className="space-y-1">
                    {screenplayMatches.map(sp => (
                      <div
                        key={sp.id}
                        onClick={() => {
                          if (onNavigateToScript) {
                            onNavigateToScript();
                          } else if (sp.sourceSceneId) {
                            onNavigateToScene(sp.sourceSceneId);
                          }
                          onClose();
                        }}
                        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer flex items-center justify-between text-neutral-800 dark:text-neutral-200 font-screenplay text-xs transition-colors"
                      >
                        <span className="font-bold">{sp.slugline}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Press ESC to close</span>
          <span><span className="text-lime-500 font-medium">Liime</span> Words Global Index</span>
        </div>
      </div>
    </div>
  );
};

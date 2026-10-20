import React, { useState, useEffect, useRef } from 'react';
import { 
  Project, 
  Scene, 
  Chapter,
  CharacterEntity 
} from '../types/story';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  AlignLeft, 
  Eye, 
  Clock, 
  FileText,
  Search,
  Maximize2,
  Minimize2,
  BookOpen
} from 'lucide-react';
import { StoryEngine } from '../services/storyEngine';

interface WriteViewProps {
  project: Project;
  onUpdateProject: (updater: Project | ((prev: Project) => Project)) => void;
  activeSceneId: string;
  setActiveSceneId: (id: string) => void;
  onAddBibleEntity?: (type: 'character' | 'location' | 'event' | 'object', item: any) => void;
}

export const WriteView: React.FC<WriteViewProps> = ({
  project,
  onUpdateProject,
  activeSceneId,
  setActiveSceneId,
  onAddBibleEntity,
}) => {
  const activeScene = project.scenes?.find(s => s.id === activeSceneId) || project.scenes?.[0];
  const activeChapter = project.chapters?.find(c => c.id === activeScene?.chapterId) || project.chapters?.[0];

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = (activeScene?.content || '').trim().split(/\s+/).filter(Boolean).length;

  const handleContentChange = (newContent: string) => {
    if (!activeScene) return;
    onUpdateProject((prev: Project) => ({
      ...prev,
      scenes: prev.scenes.map(s => {
        if (s.id === activeScene.id) {
          return { ...s, content: newContent };
        }
        return s;
      }),
    }));
  };

  const handleTitleChange = (newTitle: string) => {
    if (!activeScene) return;
    onUpdateProject((prev: Project) => ({
      ...prev,
      scenes: prev.scenes.map(s => {
        if (s.id === activeScene.id) {
          return { ...s, title: newTitle };
        }
        return s;
      }),
    }));
  };

  const handleCreateScene = (chapterId: string) => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      chapterId,
      title: 'New Scene',
      content: '',
      order: (project.scenes?.filter(s => s.chapterId === chapterId).length || 0) + 1,
      status: 'draft',
    };
    onUpdateProject(prev => ({
      ...prev,
      scenes: [...prev.scenes, newScene],
    }));
    setActiveSceneId(newScene.id);
  };

  const handleRunExtraction = async () => {
    if (!activeScene) return;
    setIsExtracting(true);

    try {
      let aiWorked = false;
      try {
        const res = await fetch('/api/ai/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: activeScene.content,
            sceneTitle: activeScene.title,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.characters && data.characters.length > 0) {
            aiWorked = true;
            onUpdateProject(prev => {
              const newChars = data.characters.map((c: any, i: number) => ({
                id: `char-ai-${Date.now()}-${i}`,
                name: c.name,
                role: c.role || 'Character',
                bio: c.context || '',
              }));
              return {
                ...prev,
                storyBible: {
                  ...prev.storyBible,
                  characters: [...prev.storyBible.characters, ...newChars],
                },
              };
            });
          }
        }
      } catch (err) {
        console.warn('AI extraction service notice, falling back to heuristics:', err);
      }

      if (!aiWorked) {
        const extracted = StoryEngine.extractEntities(activeScene.content);
        if (extracted.characters.length > 0) {
          onUpdateProject(prev => ({
            ...prev,
            storyBible: {
              ...prev.storyBible,
              characters: [...prev.storyBible.characters, ...extracted.characters as any],
            },
          }));
        }
      }
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#0c1610] text-neutral-100">
      {/* Left Sidebar: Outline / Chapters & Scenes */}
      <div className={`w-64 border-r border-neutral-800/80 bg-neutral-950 flex flex-col transition-all duration-200 shrink-0 ${leftSidebarOpen ? '' : '-ml-64'}`}>
        <div className="p-3 border-b border-neutral-800/80 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Manuscript Outline</span>
          <button
            onClick={() => handleCreateScene(activeChapter?.id || project.chapters[0]?.id)}
            title="Add Scene"
            className="p-1 hover:bg-neutral-800 rounded text-lime-400 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {project.chapters?.map((chap) => {
            const scenes = project.scenes?.filter(s => s.chapterId === chap.id) || [];
            return (
              <div key={chap.id} className="space-y-1">
                <div className="px-2 py-1 text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span className="truncate">{chap.title}</span>
                  <button
                    onClick={() => handleCreateScene(chap.id)}
                    className="opacity-60 hover:opacity-100 text-lime-400 p-0.5"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-0.5 pl-2 border-l border-neutral-800/60 ml-2">
                  {scenes.map((scene) => {
                    const isSelected = scene.id === activeScene?.id;
                    const sceneWords = (scene.content || '').trim().split(/\s+/).filter(Boolean).length;
                    return (
                      <button
                        key={scene.id}
                        onClick={() => setActiveSceneId(scene.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-lime-500/15 text-lime-300 border border-lime-500/30'
                            : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                        }`}
                      >
                        <span className="truncate">{scene.title || 'Untitled'}</span>
                        <span className="text-[10px] font-mono opacity-50 shrink-0">{sceneWords}w</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center: Main Writing Desk */}
      <div className="flex-1 flex flex-col h-full bg-[#0c1610] overflow-hidden">
        {/* Top Scene Bar */}
        <div className="px-6 py-2.5 border-b border-neutral-800/60 flex items-center justify-between bg-neutral-950/40">
          <input
            type="text"
            value={activeScene?.title || ''}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-lg font-bold text-white bg-transparent border-none focus:outline-hidden max-w-md"
            placeholder="Scene Title..."
          />

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-neutral-400">
              <span className="text-lime-400 font-bold">{wordCount}</span> words
            </span>

            <button
              onClick={handleRunExtraction}
              disabled={isExtracting}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-lime-500/15 border border-lime-500/30 hover:bg-lime-500/25 text-lime-300 text-xs font-semibold transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-lime-400" />
              <span>{isExtracting ? 'Extracting...' : 'Scan Story Bible'}</span>
            </button>
          </div>
        </div>

        {/* Textarea Paper */}
        <div className="flex-1 overflow-y-auto px-6 py-8 flex justify-center">
          <textarea
            ref={textareaRef}
            value={activeScene?.content || ''}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Begin writing your novel prose..."
            className="w-full max-w-3xl h-full resize-none bg-transparent font-serif text-lg leading-relaxed text-neutral-100 placeholder-neutral-600 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Right Sidebar: Scene Metadata & Inspector */}
      <div className={`w-72 border-l border-neutral-800/80 bg-neutral-950 p-4 flex flex-col gap-4 transition-all duration-200 shrink-0 ${rightSidebarOpen ? '' : '-mr-72'}`}>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Scene Details</h4>
          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[10px] text-neutral-500 uppercase block mb-1">POV Character</label>
              <input
                type="text"
                value={activeScene?.pov || ''}
                onChange={(e) => {
                  if (!activeScene) return;
                  onUpdateProject(prev => ({
                    ...prev,
                    scenes: prev.scenes.map(s => s.id === activeScene.id ? { ...s, pov: e.target.value } : s),
                  }));
                }}
                className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-white"
                placeholder="Point of view..."
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 uppercase block mb-1">Time of Day</label>
              <input
                type="text"
                value={activeScene?.timeOfDay || ''}
                onChange={(e) => {
                  if (!activeScene) return;
                  onUpdateProject(prev => ({
                    ...prev,
                    scenes: prev.scenes.map(s => s.id === activeScene.id ? { ...s, timeOfDay: e.target.value } : s),
                  }));
                }}
                className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-white"
                placeholder="NIGHT / DAY / DUSK..."
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Tracked Characters</h4>
          <div className="space-y-1">
            {project.storyBible?.characters?.slice(0, 5).map((char) => (
              <div key={char.id} className="p-2 rounded bg-neutral-900/60 border border-neutral-800/80 text-xs">
                <span className="font-semibold text-white">{char.name}</span>
                <span className="text-[11px] text-neutral-400 block truncate">{char.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

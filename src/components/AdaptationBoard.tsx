import React, { useState } from 'react';
import { Project, Scene, ScreenplayScene, ScreenplayElement, ScreenplayElementType } from '../types/story';
import { 
  Sparkles, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Columns, 
  Check, 
  Wand2, 
  Maximize2,
  Film,
  Zap,
  Globe
} from 'lucide-react';
import { StoryEngine } from '../services/storyEngine';

interface AdaptationBoardProps {
  project: Project;
  onUpdateProject: (updater: Project | ((prev: Project) => Project)) => void;
  selectedSceneId: string;
  onSelectSceneId: (id: string) => void;
}

export const AdaptationBoard: React.FC<AdaptationBoardProps> = ({
  project,
  onUpdateProject,
  selectedSceneId,
  onSelectSceneId,
}) => {
  const scenesList = project.scenes || [];
  const screenplayList = project.screenplay || [];
  const currentScene = scenesList.find(s => s.id === selectedSceneId) || scenesList[0];
  const currentScreenplay = currentScene?.id ? screenplayList.find(sp => sp.sourceSceneId === currentScene.id) : undefined;

  const [isAdapting, setIsAdapting] = useState(false);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);

  // Adapt novel scene into screenplay
  const handleAdaptScene = async () => {
    if (!currentScene) return;
    setIsAdapting(true);

    try {
      let aiScreenplay: ScreenplayScene | null = null;

      // 1. Try server-side Gemini adaptation if available
      try {
        const locations = project.storyBible?.locations || [];
        const loc = locations.find(l => l.id === currentScene.locationId);
        const res = await fetch('/api/ai/adapt-screenplay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sceneTitle: currentScene.title,
            prose: currentScene.content,
            locationName: loc?.name || 'SCENE LOCATION',
            timeOfDay: currentScene.time || 'DAY',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.elements && data.elements.length > 0) {
            aiScreenplay = {
              id: `sc-script-${Date.now()}`,
              sourceSceneId: currentScene.id,
              sceneNumber: screenplayList.length + 1,
              slugline: data.slugline || 'INT. LOCATION - DAY',
              elements: data.elements.map((el: any, idx: number) => ({
                id: `el-ai-${Date.now()}-${idx}`,
                type: el.type as ScreenplayElementType,
                content: el.content || '',
              })),
              shots: [],
            };
          }
        }
      } catch (e) {
        // Fall back to local heuristic adaptation
      }

      // 2. Fall back to local rule-based heuristic adaptation engine
      if (!aiScreenplay) {
        aiScreenplay = StoryEngine.adaptProseToScreenplay(
          currentScene,
          project,
          screenplayList.length + 1
        );
      }

      // Add or replace screenplay scene using functional updater
      onUpdateProject((prev: Project) => {
        const currentList = prev.screenplay || [];
        const existingIdx = currentList.findIndex(sp => sp.sourceSceneId === currentScene.id);
        const updatedScreenplay = [...currentList];
        if (existingIdx >= 0) {
          aiScreenplay!.sceneNumber = currentList[existingIdx].sceneNumber;
          updatedScreenplay[existingIdx] = aiScreenplay!;
        } else {
          updatedScreenplay.push(aiScreenplay!);
        }
        return { ...prev, screenplay: updatedScreenplay };
      });
    } finally {
      setIsAdapting(false);
    }
  };

  // Update screenplay element
  const handleUpdateElement = (elementId: string, updates: Partial<ScreenplayElement>) => {
    if (!currentScreenplay) return;
    onUpdateProject((prev: Project) => {
      const currentList = prev.screenplay || [];
      const updatedScreenplay = currentList.map(sp => {
        if (sp.id === currentScreenplay.id) {
          const updatedElements = (sp.elements || []).map(el =>
            el.id === elementId ? { ...el, ...updates } : el
          );
          let slugline = sp.slugline;
          if (updates.content !== undefined) {
            const target = (sp.elements || []).find(el => el.id === elementId);
            if (target?.type === 'scene_heading' || updates.type === 'scene_heading') {
              slugline = updates.content;
            }
          }
          return { ...sp, slugline, elements: updatedElements };
        }
        return sp;
      });
      return { ...prev, screenplay: updatedScreenplay };
    });
  };

  // Add new element below
  const handleAddElement = (index: number, type: ScreenplayElementType = 'action') => {
    if (!currentScreenplay) return;
    const newEl: ScreenplayElement = {
      id: `el-${Date.now()}`,
      type,
      content: '',
    };
    onUpdateProject((prev: Project) => {
      const currentList = prev.screenplay || [];
      const updatedScreenplay = currentList.map(sp => {
        if (sp.id === currentScreenplay.id) {
          const updatedElements = [...(sp.elements || [])];
          const targetIdx = index < 0 ? 0 : index + 1;
          updatedElements.splice(targetIdx, 0, newEl);
          return { ...sp, elements: updatedElements };
        }
        return sp;
      });
      return { ...prev, screenplay: updatedScreenplay };
    });
    setActiveElementId(newEl.id);
  };

  // Remove element
  const handleRemoveElement = (elementId: string) => {
    if (!currentScreenplay) return;
    onUpdateProject((prev: Project) => {
      const currentList = prev.screenplay || [];
      const updatedScreenplay = currentList.map(sp => {
        if (sp.id === currentScreenplay.id) {
          const updatedElements = (sp.elements || []).filter(el => el.id !== elementId);
          return { ...sp, elements: updatedElements };
        }
        return sp;
      });
      return { ...prev, screenplay: updatedScreenplay };
    });
  };

  // Keyboard navigation for standard screenplay TAB / ENTER cycling
  const handleKeyDown = (e: React.KeyboardEvent, elIndex: number, currentType: ScreenplayElementType) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      // Cycle: scene_heading -> action -> character -> dialogue -> parenthetical -> transition -> action
      const cycle: Record<ScreenplayElementType, ScreenplayElementType> = {
        scene_heading: 'action',
        action: 'character',
        character: 'dialogue',
        dialogue: 'action',
        parenthetical: 'dialogue',
        transition: 'scene_heading',
        shot: 'action',
        title: 'scene_heading',
        general: 'action',
        note: 'action',
      };
      const nextType = cycle[currentType] || 'action';
      if (currentScreenplay && currentScreenplay.elements?.[elIndex]) {
        handleUpdateElement(currentScreenplay.elements[elIndex].id, { type: nextType });
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      let nextType: ScreenplayElementType = 'action';
      if (currentType === 'scene_heading') nextType = 'action';
      else if (currentType === 'character') nextType = 'dialogue';
      else if (currentType === 'parenthetical') nextType = 'dialogue';
      else if (currentType === 'dialogue') nextType = 'action';

      handleAddElement(elIndex, nextType);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 select-none">
      {/* Adaptation Board Header & Scene Selector */}
      <div className="h-12 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            <Columns className="w-4 h-4 text-[#185abd]" />
            <span>Dual-Pane Adaptation Board</span>
          </div>

          <select
            value={selectedSceneId}
            onChange={e => onSelectSceneId(e.target.value)}
            className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none font-medium"
          >
            {(project.scenes || []).map(s => {
              const chap = (project.chapters || []).find(c => c.id === s.chapterId);
              const chapLabel = chap?.title ? chap.title.split(':')[0] : 'Chapter';
              return (
                <option key={s.id} value={s.id}>
                  {chapLabel} · {s.title || 'Untitled Scene'}
                </option>
              );
            })}
          </select>
        </div>

        {/* Adapt Action & Online/Offline Indicators */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700">
            <span className="flex items-center gap-1 text-lime-600 dark:text-lime-400 font-semibold" title="Standard rule converter runs 100% offline">
              <Zap className="w-3 h-3" />
              <span>Standard: 100% Offline</span>
            </span>
            <span className="opacity-40">·</span>
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400" title="Deep AI screenplay adaptation requires internet">
              <Globe className="w-3 h-3" />
              <span>AI Polish: Online</span>
            </span>
          </div>

          <button
            onClick={handleAdaptScene}
            disabled={isAdapting}
            title="Automatically converts prose into standard screenplay format using Cloud AI if online, or local on-device adapter if offline"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#185abd] hover:bg-[#124896] text-white rounded transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Wand2 className={`w-3.5 h-3.5 ${isAdapting ? 'animate-spin' : ''}`} />
            <span>{isAdapting ? 'Adapting Prose...' : 'Adapt Scene to Screenplay'}</span>
          </button>
        </div>
      </div>

      {/* Split Dual-Pane Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: NOVEL SCENE PROSE (REFERENCE) */}
        <div className="w-1/2 border-r border-neutral-200 bg-white flex flex-col overflow-hidden text-black">
          <div className="p-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-neutral-500">
              Original Novel Prose
            </span>
            <span className="font-mono text-neutral-400">
              {currentScene?.wordCount || 0} words
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 select-text bg-white">
            <h2 className="text-xl font-bold font-serif mb-2 text-black">
              {currentScene?.title || 'Untitled Scene'}
            </h2>
            <div className="text-xs text-neutral-400 font-mono mb-4 pb-2 border-b border-neutral-200">
              Setting: {(project.storyBible?.locations || []).find(l => l.id === currentScene?.locationId)?.name || 'Unassigned'} · Time: {currentScene?.time || 'Unassigned'}
            </div>

            <div className="font-prose-serif text-base leading-relaxed text-black whitespace-pre-wrap">
              {currentScene?.content}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: SCREENPLAY ADAPTATION (INTERACTIVE EDITOR) */}
        <div className="w-1/2 bg-white flex flex-col overflow-hidden text-black">
          <div className="p-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold uppercase tracking-wider text-[#185abd]">
                Screenplay Layer
              </span>
              <span className="text-neutral-400 text-[11px]">
                (TAB to cycle block type · ENTER for next line)
              </span>
            </div>

            {currentScreenplay && (
              <span className="font-mono text-neutral-400">
                Scene #{currentScreenplay.sceneNumber}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 font-screenplay select-text bg-white">
            {currentScreenplay && (currentScreenplay.elements || []).length > 0 ? (
              <div className="max-w-xl mx-auto space-y-3">
                {(currentScreenplay.elements || []).map((el, idx) => {
                  return (
                    <div
                      key={el.id}
                      className="group relative flex items-start gap-2 hover:bg-neutral-50 p-1 rounded"
                    >
                      {/* Block Type Tag & Selector */}
                      <select
                        value={el.type}
                        onChange={e => handleUpdateElement(el.id, { type: e.target.value as ScreenplayElementType })}
                        className="text-[9px] uppercase font-mono px-1 py-0.5 bg-neutral-100 text-neutral-400 rounded opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 shrink-0 mt-1 cursor-pointer"
                      >
                        <option value="scene_heading">Heading</option>
                        <option value="action">Action</option>
                        <option value="character">Character</option>
                        <option value="dialogue">Dialogue</option>
                        <option value="parenthetical">Parenthetical</option>
                        <option value="transition">Transition</option>
                        <option value="shot">Shot</option>
                      </select>

                      {/* Screenplay Content Input */}
                      <div className="flex-1">
                        <textarea
                          rows={el.type === 'action' ? 2 : 1}
                          value={el.content}
                          onChange={e => handleUpdateElement(el.id, { content: e.target.value })}
                          onKeyDown={e => handleKeyDown(e, idx, el.type)}
                          placeholder={
                            el.type === 'character'
                              ? 'CHARACTER NAME'
                              : el.type === 'scene_heading'
                              ? 'INT. LOCATION - DAY'
                              : el.type === 'dialogue'
                              ? 'Dialogue lines...'
                              : el.type === 'parenthetical'
                              ? '(emotion / direction)'
                              : 'Action beats...'
                          }
                          className={`w-full bg-transparent resize-none focus:outline-none text-black text-sm ${
                            el.type === 'scene_heading'
                              ? 'font-bold uppercase tracking-wider'
                              : el.type === 'character'
                              ? 'screenplay-character'
                              : el.type === 'parenthetical'
                              ? 'screenplay-parenthetical text-neutral-600'
                              : el.type === 'dialogue'
                              ? 'screenplay-dialogue'
                              : el.type === 'transition'
                              ? 'screenplay-transition'
                              : 'leading-normal'
                          }`}
                        />
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemoveElement(el.id)}
                        className="p-1 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete block"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                {/* Add new element button */}
                <div className="pt-4 flex items-center justify-center">
                  <button
                    onClick={() => handleAddElement((currentScreenplay.elements || []).length - 1, 'action')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-md hover:border-neutral-400 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Screenplay Block</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-400">
                <Film className="w-10 h-10 mb-3 text-neutral-300 dark:text-neutral-700" />
                <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  No Screenplay Layer Yet
                </h4>
                <p className="text-xs max-w-sm mb-4 leading-relaxed">
                  Transform this novel scene into standard screenplay format. Your original novel text will remain 100% untouched.
                </p>
                <button
                  onClick={handleAdaptScene}
                  disabled={isAdapting}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#185abd] hover:bg-[#124896] text-white rounded-md shadow-xs transition-colors"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Adapt Scene to Screenplay</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

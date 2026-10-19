import React, { useState } from 'react';
import { 
  Project, 
  ScreenplayScene, 
  ScreenplayElement, 
  ScreenplayElementType 
} from '../types/story';
import { AdaptationBoard } from './AdaptationBoard';
import { 
  Film, 
  Columns, 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  Wand2, 
  ArrowUp, 
  ArrowDown,
  Printer
} from 'lucide-react';
import { StorageService } from '../services/storage';

interface ScriptViewProps {
  project: Project;
  onUpdateProject: (updater: Project | ((prev: Project) => Project)) => void;
  activeSceneId: string;
}

export const ScriptView: React.FC<ScriptViewProps> = ({
  project,
  onUpdateProject,
  activeSceneId,
}) => {
  const [subView, setSubView] = useState<'editor' | 'adaptation'>('editor');
  const [selectedSceneId, setSelectedSceneId] = useState<string>(activeSceneId || project.scenes?.[0]?.id || '');

  const screenplayScenes = project.screenplay || [];

  // Add new blank screenplay scene
  const handleAddScene = () => {
    onUpdateProject((prev: Project) => {
      const currentList = prev.screenplay || [];
      const newScene: ScreenplayScene = {
        id: `sc-script-${Date.now()}`,
        sceneNumber: currentList.length + 1,
        slugline: 'INT. NEW LOCATION - DAY',
        elements: [
          {
            id: `el-${Date.now()}-heading`,
            type: 'scene_heading',
            content: 'INT. NEW LOCATION - DAY',
          },
          {
            id: `el-${Date.now()}-action`,
            type: 'action',
            content: 'Action description goes here...',
          },
        ],
        shots: [],
      };
      return {
        ...prev,
        screenplay: [...currentList, newScene],
      };
    });
  };

  // Add block to a scene
  const handleAddElementToScene = (sceneId: string, index: number, type: ScreenplayElementType = 'action') => {
    const newEl: ScreenplayElement = {
      id: `el-${Date.now()}`,
      type,
      content: '',
    };
    onUpdateProject((prev: Project) => {
      const currentList = prev.screenplay || [];
      const updatedScreenplay = currentList.map(sc => {
        if (sc.id === sceneId) {
          const elements = [...(sc.elements || [])];
          const targetIdx = index < 0 ? 0 : index + 1;
          elements.splice(targetIdx, 0, newEl);
          return { ...sc, elements };
        }
        return sc;
      });
      return { ...prev, screenplay: updatedScreenplay };
    });
  };

  // Delete screenplay scene
  const handleDeleteScene = (sceneId: string) => {
    onUpdateProject((prev: Project) => {
      const currentList = prev.screenplay || [];
      const filtered = currentList.filter(s => s.id !== sceneId).map((s, idx) => ({
        ...s,
        sceneNumber: idx + 1,
      }));
      return {
        ...prev,
        screenplay: filtered,
      };
    });
  };

  // Update element content or type
  const handleUpdateElement = (sceneId: string, elementId: string, updates: Partial<ScreenplayElement>) => {
    onUpdateProject((prev: Project) => {
      const currentList = prev.screenplay || [];
      const updatedScreenplay = currentList.map(sc => {
        if (sc.id === sceneId) {
          const elements = (sc.elements || []).map(el => (el.id === elementId ? { ...el, ...updates } : el));
          let slugline = sc.slugline;
          if (updates.content !== undefined) {
            const target = (sc.elements || []).find(el => el.id === elementId);
            if (target?.type === 'scene_heading' || updates.type === 'scene_heading') {
              slugline = updates.content;
            }
          }
          return {
            ...sc,
            slugline,
            elements,
          };
        }
        return sc;
      });
      return { ...prev, screenplay: updatedScreenplay };
    });
  };

  // Keyboard navigation for standard screenplay TAB / ENTER cycling in Master view
  const handleEditorKeyDown = (e: React.KeyboardEvent, sceneId: string, elIndex: number, currentType: ScreenplayElementType) => {
    if (e.key === 'Tab') {
      e.preventDefault();
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
      const scene = screenplayScenes.find(s => s.id === sceneId);
      if (scene && scene.elements?.[elIndex]) {
        handleUpdateElement(sceneId, scene.elements[elIndex].id, { type: nextType });
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      let nextType: ScreenplayElementType = 'action';
      if (currentType === 'scene_heading') nextType = 'action';
      else if (currentType === 'character') nextType = 'dialogue';
      else if (currentType === 'parenthetical') nextType = 'dialogue';
      else if (currentType === 'dialogue') nextType = 'action';

      handleAddElementToScene(sceneId, elIndex, nextType);
    }
  };

  // Export Fountain
  const handleExportFountain = () => {
    StorageService.exportScreenplay(project, screenplayScenes);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* Script Header Tabs */}
      <div className="h-12 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
          <button
            onClick={() => setSubView('editor')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              subView === 'editor'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-[#185abd]" />
            <span>Master Screenplay ({screenplayScenes.length} scenes)</span>
          </button>
          <button
            onClick={() => setSubView('adaptation')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              subView === 'adaptation'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-blue-500" />
            <span>Adaptation Board (Side-by-Side)</span>
          </button>
        </div>

        {/* Export / Add Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportFountain}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
            title="Download Fountain formatted screenplay file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Fountain</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded"
            title="Print Screenplay"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={handleAddScene}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Script Scene</span>
          </button>
        </div>
      </div>

      {/* Main View Display */}
      {subView === 'adaptation' ? (
        <AdaptationBoard
          project={project}
          onUpdateProject={onUpdateProject}
          selectedSceneId={selectedSceneId}
          onSelectSceneId={setSelectedSceneId}
        />
      ) : (
        /* Master Screenplay Editor View */
        <div className={`flex-1 overflow-y-auto p-6 md:p-12 font-screenplay select-text flex justify-center ${
          project.settings.theme === 'grey' ? 'bg-[#cbd5e1]' : 'bg-neutral-200/50 dark:bg-neutral-950'
        }`}>
          {/* Simulated 8.5x11 Courier Page */}
          <div className="w-full max-w-[850px] bg-white text-black border border-neutral-300 shadow-lg min-h-[900px] p-10 md:p-16 rounded-sm">
            {/* Screenplay Title Block */}
            <div className="text-center mb-16 pb-12 border-b border-neutral-200">
              <h1 className="text-2xl font-bold uppercase tracking-widest text-black mb-2">
                {project.title}
              </h1>
              <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
                Written by
              </div>
              <div className="text-sm font-semibold text-neutral-800">
                {project.author}
              </div>
              <div className="text-[11px] text-neutral-400 mt-4">
                Based on the novel by {project.author}
              </div>
            </div>

            {/* Screenplay Scenes List */}
            {screenplayScenes.length > 0 ? (
              <div className="space-y-12">
                {screenplayScenes.map((sc, scIdx) => {
                  return (
                    <div key={sc.id} className="relative group/scene">
                      <div className="absolute -left-10 top-0 text-[11px] font-mono text-neutral-400 opacity-60">
                        #{sc.sceneNumber}
                      </div>

                      <div className="space-y-3">
                        {(sc.elements || []).map((el, elIdx) => {
                          return (
                            <div key={el.id} className="group/el relative flex items-start gap-2 hover:bg-neutral-50/70 p-1 rounded transition-colors">
                              {/* Element Type Selector */}
                              <select
                                value={el.type}
                                onChange={e => handleUpdateElement(sc.id, el.id, { type: e.target.value as ScreenplayElementType })}
                                className="text-[9px] uppercase font-mono px-1 py-0.5 bg-neutral-100 text-neutral-500 rounded opacity-0 group-hover/el:opacity-100 transition-opacity focus:opacity-100 shrink-0 mt-1 cursor-pointer border border-neutral-200"
                                title="Change screenplay element type"
                              >
                                <option value="scene_heading">Heading</option>
                                <option value="action">Action</option>
                                <option value="character">Character</option>
                                <option value="dialogue">Dialogue</option>
                                <option value="parenthetical">Parenthetical</option>
                                <option value="transition">Transition</option>
                                <option value="shot">Shot</option>
                              </select>

                              <div className="flex-1">
                                <textarea
                                  rows={el.type === 'action' ? 2 : 1}
                                  value={el.content}
                                  onChange={e =>
                                    handleUpdateElement(sc.id, el.id, { content: e.target.value })
                                  }
                                  onKeyDown={e => handleEditorKeyDown(e, sc.id, elIdx, el.type)}
                                  placeholder={
                                    el.type === 'character'
                                      ? 'CHARACTER NAME'
                                      : el.type === 'scene_heading'
                                      ? 'INT. LOCATION - DAY'
                                      : el.type === 'dialogue'
                                      ? 'Dialogue lines...'
                                      : el.type === 'parenthetical'
                                      ? '(emotion / direction)'
                                      : 'Action description...'
                                  }
                                  className={`w-full bg-transparent resize-none focus:outline-hidden text-black text-sm ${
                                    el.type === 'scene_heading'
                                      ? 'font-bold uppercase tracking-wider text-base'
                                      : el.type === 'character'
                                      ? 'screenplay-character font-bold'
                                      : el.type === 'parenthetical'
                                      ? 'screenplay-parenthetical text-neutral-600'
                                      : el.type === 'dialogue'
                                      ? 'screenplay-dialogue'
                                      : el.type === 'transition'
                                      ? 'screenplay-transition font-bold'
                                      : 'leading-relaxed'
                                  }`}
                                />
                              </div>

                              <button
                                onClick={() => {
                                  onUpdateProject((prev: Project) => {
                                    const currentList = prev.screenplay || [];
                                    const updatedScreenplay = currentList.map(s =>
                                      s.id === sc.id
                                        ? { ...s, elements: (s.elements || []).filter(e => e.id !== el.id) }
                                        : s
                                    );
                                    return { ...prev, screenplay: updatedScreenplay };
                                  });
                                }}
                                className="p-1 text-neutral-300 hover:text-red-500 opacity-0 group-hover/el:opacity-100 transition-opacity"
                                title="Delete element"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Scene actions bar */}
                      <div className="mt-3 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                        <button
                          onClick={() => handleAddElementToScene(sc.id, (sc.elements || []).length - 1, 'action')}
                          className="flex items-center gap-1 text-[11px] text-[#185abd] dark:text-blue-400 hover:underline font-medium cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Block to Scene #{sc.sceneNumber}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteScene(sc.id)}
                          className="text-red-400 hover:text-red-600 flex items-center gap-1 text-[11px] opacity-0 group-hover/scene:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete Scene #{sc.sceneNumber}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-neutral-400">
                <Film className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-semibold mb-2">No Screenplay Scenes Adapted Yet</p>
                <p className="text-xs max-w-md mx-auto mb-4">
                  Open the Adaptation Board to convert chapters or scenes from your novel into screenplay format.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleAddScene}
                    className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Start Writing Script (Add Scene #1)</span>
                  </button>
                  <button
                    onClick={() => setSubView('adaptation')}
                    className="px-4 py-2 bg-[#185abd] hover:bg-[#124896] text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Adapt from Novel Manuscript</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

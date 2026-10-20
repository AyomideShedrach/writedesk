import React, { useState } from 'react';
import { Project, ScreenplayScene } from '../types/story';
import { Film, Sparkles, FileDown, Plus } from 'lucide-react';
import { StoryEngine } from '../services/storyEngine';

interface ScreenplayViewProps {
  project: Project;
  onUpdateProject: (updater: Project | ((prev: Project) => Project)) => void;
}

export const ScreenplayView: React.FC<ScreenplayViewProps> = ({ project, onUpdateProject }) => {
  const [selectedSceneId, setSelectedSceneId] = useState<string>(project.scenes?.[0]?.id || '');
  const [isAdapting, setIsAdapting] = useState(false);

  const activeScene = project.scenes?.find(s => s.id === selectedSceneId) || project.scenes?.[0];
  const activeScript = project.screenplay?.find(sp => sp.sceneId === activeScene?.id) || project.screenplay?.[0];

  const handleAdapt = async () => {
    if (!activeScene) return;
    setIsAdapting(true);

    try {
      let aiWorked = false;
      try {
        const res = await fetch('/api/ai/adapt-screenplay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sceneTitle: activeScene.title,
            prose: activeScene.content,
            locationName: activeScene.location,
            timeOfDay: activeScene.timeOfDay,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.elements) {
            aiWorked = true;
            const newScript: ScreenplayScene = {
              sceneId: activeScene.id,
              slugline: data.slugline || 'INT. UNKNOWN - NIGHT',
              elements: data.elements,
            };
            onUpdateProject(prev => ({
              ...prev,
              screenplay: [
                ...(prev.screenplay || []).filter(sp => sp.sceneId !== activeScene.id),
                newScript,
              ],
            }));
          }
        }
      } catch (err) {
        console.warn('AI adaptation notice, falling back to heuristic engine:', err);
      }

      if (!aiWorked) {
        const adapted = StoryEngine.adaptToScreenplay(
          activeScene.title,
          activeScene.content,
          activeScene.location,
          activeScene.timeOfDay
        );
        adapted.sceneId = activeScene.id;
        onUpdateProject(prev => ({
          ...prev,
          screenplay: [
            ...(prev.screenplay || []).filter(sp => sp.sceneId !== activeScene.id),
            adapted,
          ],
        }));
      }
    } finally {
      setIsAdapting(false);
    }
  };

  return (
    <div className="flex-1 flex h-full bg-[#0c1610] text-neutral-100 overflow-hidden">
      {/* Scenes List */}
      <div className="w-64 border-r border-neutral-800 bg-neutral-950 p-3 flex flex-col gap-2 shrink-0">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Scenes for Adaptation</span>
        <div className="flex-1 overflow-y-auto space-y-1">
          {project.scenes?.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSceneId(s.id)}
              className={`w-full text-left p-2 rounded-lg text-xs truncate transition-colors cursor-pointer ${
                s.id === activeScene?.id
                  ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Screenplay Desk */}
      <div className="flex-1 flex flex-col h-full bg-[#0a0f0c] overflow-hidden">
        <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-lime-400" />
            <h3 className="font-bold text-sm text-white">
              {activeScript?.slugline || 'INT. SCENE - DAY'}
            </h3>
          </div>

          <button
            onClick={handleAdapt}
            disabled={isAdapting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lime-500 hover:bg-lime-400 text-neutral-950 font-bold text-xs shadow-md shadow-lime-500/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAdapting ? 'Adapting...' : 'Adapt Novel Prose'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 flex justify-center font-mono text-sm leading-relaxed text-neutral-200">
          <div className="w-full max-w-2xl bg-neutral-950 p-10 rounded-xl border border-neutral-800 shadow-2xl space-y-4">
            {activeScript?.elements?.map((el, i) => {
              if (el.type === 'scene_heading') {
                return <p key={i} className="font-bold uppercase text-lime-400 mt-6">{el.content}</p>;
              }
              if (el.type === 'character') {
                return <p key={i} className="font-bold text-center uppercase tracking-wider text-white mt-4">{el.content}</p>;
              }
              if (el.type === 'parenthetical') {
                return <p key={i} className="text-center italic text-neutral-400 text-xs">{el.content}</p>;
              }
              if (el.type === 'dialogue') {
                return <p key={i} className="max-w-md mx-auto text-left text-neutral-200 mb-2">{el.content}</p>;
              }
              return <p key={i} className="text-neutral-300">{el.content}</p>;
            }) || (
              <p className="text-neutral-500 text-center py-12">Click "Adapt Novel Prose" to generate Hollywood standard script format from your novel draft.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

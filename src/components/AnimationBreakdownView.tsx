import React, { useState } from 'react';
import { Project, ScreenplayScene, AnimationShot } from '../types/story';
import { 
  Camera, 
  Film, 
  Plus, 
  Trash2, 
  Clock, 
  Video, 
  Music2, 
  Users, 
  SlidersHorizontal 
} from 'lucide-react';

interface AnimationBreakdownViewProps {
  project: Project;
  onUpdateProject: (updater: Project | ((prev: Project) => Project)) => void;
}

export const AnimationBreakdownView: React.FC<AnimationBreakdownViewProps> = ({
  project,
  onUpdateProject,
}) => {
  const screenplayScenes = project.screenplay || [];
  const [selectedScriptSceneId, setSelectedScriptSceneId] = useState<string>(
    screenplayScenes[0]?.id || ''
  );

  const currentScene = screenplayScenes.find(s => s.id === selectedScriptSceneId) || screenplayScenes[0];
  const shots = currentScene?.shots || [];

  // Add new shot to current screenplay scene, creating starter scene if none exists
  const handleAddShot = () => {
    onUpdateProject((prev: Project) => {
      let scenes = [...(prev.screenplay || [])];
      let targetScene = scenes.find(s => s.id === selectedScriptSceneId) || scenes[0];

      if (!targetScene) {
        targetScene = {
          id: `sc-script-${Date.now()}`,
          sceneNumber: 1,
          slugline: 'INT. SCENE 1 - DAY',
          elements: [
            {
              id: `el-${Date.now()}-heading`,
              type: 'scene_heading',
              content: 'INT. SCENE 1 - DAY',
            },
          ],
          shots: [],
        };
        scenes = [targetScene];
        setSelectedScriptSceneId(targetScene.id);
      }

      const currentShots = targetScene.shots || [];
      const newShot: AnimationShot = {
        id: `shot-${Date.now()}`,
        shotNumber: currentShots.length + 1,
        shotType: 'Medium Shot',
        camera: 'Static eye level',
        action: 'Character performs action beat...',
        characters: [],
        timing: '3.0s',
        audioCue: 'Ambient sound',
      };

      const updatedScreenplay = scenes.map(sc =>
        sc.id === targetScene!.id ? { ...sc, shots: [...(sc.shots || []), newShot] } : sc
      );
      return { ...prev, screenplay: updatedScreenplay };
    });
  };

  // Update shot
  const handleUpdateShot = (shotId: string, updates: Partial<AnimationShot>) => {
    if (!currentScene) return;
    onUpdateProject((prev: Project) => {
      const scenes = prev.screenplay || [];
      const updatedScreenplay = scenes.map(sc => {
        if (sc.id === currentScene.id) {
          const updatedShots = (sc.shots || []).map(s => (s.id === shotId ? { ...s, ...updates } : s));
          return { ...sc, shots: updatedShots };
        }
        return sc;
      });
      return { ...prev, screenplay: updatedScreenplay };
    });
  };

  // Delete shot
  const handleDeleteShot = (shotId: string) => {
    if (!currentScene) return;
    onUpdateProject((prev: Project) => {
      const scenes = prev.screenplay || [];
      const updatedScreenplay = scenes.map(sc => {
        if (sc.id === currentScene.id) {
          const filteredShots = (sc.shots || []).filter(s => s.id !== shotId).map((s, idx) => ({ ...s, shotNumber: idx + 1 }));
          return { ...sc, shots: filteredShots };
        }
        return sc;
      });
      return { ...prev, screenplay: updatedScreenplay };
    });
  };

  // Calculate total scene runtime
  const totalSeconds = shots.reduce((acc, s) => {
    const parsed = parseFloat(s.timing.replace(/[^0-9.]/g, '')) || 0;
    return acc + parsed;
  }, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 select-none">
      {/* Top Header & Scene Selector */}
      <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            <Camera className="w-4 h-4 text-purple-500" />
            <span>Animation & Cinematic Breakdown</span>
          </div>

          <select
            value={currentScene?.id || ''}
            onChange={e => setSelectedScriptSceneId(e.target.value)}
            className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none font-medium"
          >
            {screenplayScenes.map(sc => (
              <option key={sc.id} value={sc.id}>
                Scene #{sc.sceneNumber}: {sc.slugline}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-neutral-500 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Estimated Duration: {totalSeconds.toFixed(1)}s</span>
          </div>

          <button
            onClick={handleAddShot}
            disabled={!currentScene}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-xs disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Cinematic Shot</span>
          </button>
        </div>
      </div>

      {/* Main Shots Board */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 select-text">
        <div className="max-w-5xl mx-auto space-y-4">
          {shots.length > 0 ? (
            shots.map((shot, idx) => {
              return (
                <div
                  key={shot.id}
                  className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col md:flex-row gap-5 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
                >
                  {/* Shot Index & Type */}
                  <div className="w-full md:w-44 shrink-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-neutral-800 dark:text-neutral-200">
                        SHOT #{String(shot.shotNumber).padStart(2, '0')}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                        {shot.timing}
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                        Framing
                      </label>
                      <select
                        value={shot.shotType}
                        onChange={e => handleUpdateShot(shot.id, { shotType: e.target.value as any })}
                        className="w-full text-xs p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                      >
                        <option value="Extreme Wide">Extreme Wide</option>
                        <option value="Wide Shot">Wide Shot</option>
                        <option value="Medium Shot">Medium Shot</option>
                        <option value="Medium Close-up">Medium Close-up</option>
                        <option value="Close-up">Close-up</option>
                        <option value="Extreme Close-up">Extreme Close-up</option>
                        <option value="Over-the-Shoulder">Over-the-Shoulder</option>
                        <option value="Point of View">Point of View</option>
                        <option value="Reverse Shot">Reverse Shot</option>
                        <option value="Low Angle">Low Angle</option>
                        <option value="Bird Eye">Bird Eye</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                        Timing
                      </label>
                      <input
                        type="text"
                        value={shot.timing}
                        onChange={e => handleUpdateShot(shot.id, { timing: e.target.value })}
                        placeholder="e.g. 3.5s"
                        className="w-full text-xs p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                      />
                    </div>
                  </div>

                  {/* Shot Visual Action & Camera Movement */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                        Camera Movement / Angle
                      </label>
                      <input
                        type="text"
                        value={shot.camera}
                        onChange={e => handleUpdateShot(shot.id, { camera: e.target.value })}
                        placeholder="e.g. Slow push-in tracking shot, handheld shake..."
                        className="w-full text-xs p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                        Visual Action Beat
                      </label>
                      <textarea
                        rows={2}
                        value={shot.action}
                        onChange={e => handleUpdateShot(shot.id, { action: e.target.value })}
                        placeholder="Describe what occurs visually within this shot's frame..."
                        className="w-full text-xs p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 leading-relaxed resize-none"
                      />
                    </div>

                    {/* Audio & Sound Cue */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                          Audio & Foley Cue
                        </label>
                        <input
                          type="text"
                          value={shot.audioCue || ''}
                          onChange={e => handleUpdateShot(shot.id, { audioCue: e.target.value })}
                          placeholder="e.g. Heavy rain tapping on glass canopy..."
                          className="w-full text-xs p-1.5 bg-neutral-50 dark:bg-neutral-800/50 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                          Characters on Screen
                        </label>
                        <input
                          type="text"
                          value={shot.characters?.join(', ') || ''}
                          onChange={e =>
                            handleUpdateShot(shot.id, {
                              characters: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                            })
                          }
                          placeholder="e.g. Marcus, Elena"
                          className="w-full text-xs p-1.5 bg-neutral-50 dark:bg-neutral-800/50 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col justify-end items-center gap-2">
                    <button
                      onClick={() => handleDeleteShot(shot.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 rounded"
                      title="Delete shot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 text-neutral-400">
              <Camera className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <h4 className="text-sm font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                No Cinematic Shots Created for this Scene
              </h4>
              <p className="text-xs max-w-sm mx-auto mb-4">
                Break this screenplay scene down into camera setups, framing types, action timing, and sound cues.
              </p>
              <button
                onClick={handleAddShot}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold"
              >
                Add First Shot
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

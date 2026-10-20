import React from 'react';
import { Project } from '../types/story';
import { Calendar, Compass, ArrowRight } from 'lucide-react';

interface TimelineViewProps {
  project: Project;
  onUpdateProject: (updater: Project | ((prev: Project) => Project)) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ project }) => {
  const scenes = project.scenes || [];
  const events = project.storyBible?.events || [];

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0c1610] text-neutral-100 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-lime-400" />
            <span>Chronological Narrative Timeline</span>
          </h2>
          <p className="text-neutral-400 text-xs mt-1">
            Visual pacing, scene progression, and story event sequence.
          </p>
        </div>

        <div className="relative border-l-2 border-neutral-800 ml-4 pl-6 space-y-6">
          {scenes.map((scene, index) => {
            const chap = project.chapters?.find(c => c.id === scene.chapterId);
            return (
              <div key={scene.id} className="relative group">
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-lime-500/20 border-2 border-lime-400 group-hover:scale-125 transition-transform" />
                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-lime-400 font-bold uppercase">
                      Act {index + 1} · {chap?.title || 'Chapter'}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {scene.timeOfDay || 'DAY'}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm">{scene.title}</h3>
                  <p className="text-xs text-neutral-400 line-clamp-2">
                    {scene.synopsis || scene.content.slice(0, 160) || 'Scene draft in progress.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Project } from '../types/story';
import { Share2, Users, HeartHandshake, Swords } from 'lucide-react';

interface RelationshipGraphViewProps {
  project: Project;
  onUpdateProject: (updater: Project | ((prev: Project) => Project)) => void;
}

export const RelationshipGraphView: React.FC<RelationshipGraphViewProps> = ({ project }) => {
  const characters = project.storyBible?.characters || [];
  const relationships = project.storyBible?.relationships || [];

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0c1610] text-neutral-100 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-lime-400" />
            <span>Character Dynamics & Relationship Graph</span>
          </h2>
          <p className="text-neutral-400 text-xs mt-1">
            Interpersonal conflict, alliances, and dramatic tension between characters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relationships.map((rel) => {
            const charA = characters.find(c => c.id === rel.sourceCharacterId);
            const charB = characters.find(c => c.id === rel.targetCharacterId);
            return (
              <div key={rel.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{charA?.name || 'Character A'}</span>
                    <span className="text-lime-400 font-bold">⇄</span>
                    <span className="font-bold text-white text-sm">{charB?.name || 'Character B'}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-neutral-800 px-2 py-0.5 rounded text-lime-400">
                    {rel.type}
                  </span>
                </div>
                <p className="text-xs text-neutral-400">{rel.dynamic}</p>
                {rel.tensionLevel !== undefined && (
                  <div className="pt-2 flex items-center justify-between text-xs text-neutral-400">
                    <span>Dramatic Tension</span>
                    <span className="font-mono text-lime-400 font-bold">{rel.tensionLevel}/10</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {relationships.length === 0 && (
          <div className="p-12 text-center border border-dashed border-neutral-800 rounded-2xl text-neutral-500 text-xs">
            No character relationships added yet. Use the Story Bible to map connections between characters.
          </div>
        )}
      </div>
    </div>
  );
};

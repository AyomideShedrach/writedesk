import React, { useState } from 'react';
import { Project, CharacterEntity, LocationEntity, EventEntity, ObjectEntity } from '../types/story';
import { Users, MapPin, Calendar, Box, Plus, Trash2, Edit3 } from 'lucide-react';

interface StoryBibleViewProps {
  project: Project;
  onUpdateProject: (updater: Project | ((prev: Project) => Project)) => void;
  onNavigateToScene: (sceneId: string) => void;
}

export const StoryBibleView: React.FC<StoryBibleViewProps> = ({
  project,
  onUpdateProject,
  onNavigateToScene,
}) => {
  const [activeTab, setActiveTab] = useState<'characters' | 'locations' | 'events' | 'objects'>('characters');

  const characters = project.storyBible?.characters || [];
  const locations = project.storyBible?.locations || [];
  const events = project.storyBible?.events || [];
  const objects = project.storyBible?.objects || [];

  const handleAddCharacter = () => {
    const newChar: CharacterEntity = {
      id: `char-${Date.now()}`,
      name: 'New Character',
      role: 'Supporting Role',
      bio: 'Character backstory and narrative role.',
    };
    onUpdateProject(prev => ({
      ...prev,
      storyBible: {
        ...prev.storyBible,
        characters: [...prev.storyBible.characters, newChar],
      },
    }));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c1610] text-neutral-100 overflow-hidden">
      {/* Tab Navigation */}
      <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('characters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'characters'
                ? 'bg-lime-500/20 text-lime-400 border border-lime-500/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Characters ({characters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('locations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'locations'
                ? 'bg-lime-500/20 text-lime-400 border border-lime-500/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Locations ({locations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'events'
                ? 'bg-lime-500/20 text-lime-400 border border-lime-500/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Plot Events ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('objects')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'objects'
                ? 'bg-lime-500/20 text-lime-400 border border-lime-500/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Key Objects ({objects.length})</span>
          </button>
        </div>

        <button
          onClick={handleAddCharacter}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lime-500 hover:bg-lime-400 text-neutral-950 font-bold text-xs shadow-md shadow-lime-500/20 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Character</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'characters' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((char) => (
              <div key={char.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">{char.name}</h3>
                    <span className="text-[11px] font-mono text-lime-400">{char.role}</span>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">{char.bio}</p>
                {char.goals && (
                  <div className="pt-2 border-t border-neutral-800 text-[11px] text-neutral-300">
                    <span className="text-neutral-500">Goal: </span>
                    {char.goals}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map((loc) => (
              <div key={loc.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                <h3 className="font-bold text-white text-sm">{loc.name}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{loc.description}</p>
                {loc.atmosphere && (
                  <p className="text-[11px] text-lime-300/80">Atmosphere: {loc.atmosphere}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-3 max-w-2xl">
            {events.map((evt) => (
              <div key={evt.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">{evt.name}</h3>
                  <span className="text-[11px] font-mono text-lime-400">{evt.dateOrMarker}</span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">{evt.description}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'objects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {objects.map((obj) => (
              <div key={obj.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                <h3 className="font-bold text-white text-sm">{obj.name}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{obj.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

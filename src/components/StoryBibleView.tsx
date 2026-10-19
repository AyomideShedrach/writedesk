import React, { useState } from 'react';
import { 
  Project, 
  BibleTab, 
  Character, 
  Location, 
  StoryEvent, 
  StoryObject, 
  Relationship 
} from '../types/story';
import { 
  Users, 
  MapPin, 
  Flag, 
  Box, 
  HeartHandshake, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  BookOpen, 
  Clock, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<BibleTab>('characters');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotificationMessage(msg);
    setTimeout(() => setNotificationMessage(null), 3500);
  };

  // Edit / Add modal states
  const [isEditingCharacter, setIsEditingCharacter] = useState<Character | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState<Location | null>(null);
  const [isEditingEvent, setIsEditingEvent] = useState<StoryEvent | null>(null);
  const [isEditingObject, setIsEditingObject] = useState<StoryObject | null>(null);
  const [isEditingRelationship, setIsEditingRelationship] = useState<Relationship | null>(null);

  const bible = project.storyBible || {
    characters: [],
    locations: [],
    events: [],
    objects: [],
    relationships: [],
  };
  const characters = bible.characters || [];
  const locations = bible.locations || [];
  const events = bible.events || [];
  const objects = bible.objects || [];
  const relationships = bible.relationships || [];

  const query = (searchQuery || '').trim().toLowerCase();

  // Filtered lists with null-safe guards
  const filteredCharacters = characters.filter(c => 
    !query ||
    (c.name || '').toLowerCase().includes(query) || 
    (c.occupation && c.occupation.toLowerCase().includes(query)) ||
    (c.personality && c.personality.toLowerCase().includes(query))
  );

  const filteredLocations = locations.filter(l => 
    !query ||
    (l.name || '').toLowerCase().includes(query) || 
    ((l.description || '').toLowerCase().includes(query))
  );

  const filteredEvents = [...events].sort((a, b) => (a.chronologicalOrder || 0) - (b.chronologicalOrder || 0)).filter(e => 
    !query ||
    (e.name || '').toLowerCase().includes(query) || 
    ((e.description || '').toLowerCase().includes(query))
  );

  const filteredObjects = objects.filter(o => 
    !query ||
    (o.name || '').toLowerCase().includes(query) || 
    ((o.description || '').toLowerCase().includes(query))
  );

  // Helper to find all scenes a character appears in
  const getScenesForCharacter = (charId: string) => {
    const char = characters.find(c => c.id === charId);
    if (!char) return [];
    return (project.scenes || []).filter(s => 
      (s.characterIds || []).includes(charId) || 
      s.povCharacterId === charId || 
      (s.content || '').toLowerCase().includes(char.name.toLowerCase())
    );
  };

  // Helper to find all scenes for a location
  const getScenesForLocation = (locId: string) => {
    const loc = locations.find(l => l.id === locId);
    if (!loc) return [];
    return (project.scenes || []).filter(s => 
      s.locationId === locId || 
      (s.content || '').toLowerCase().includes(loc.name.toLowerCase())
    );
  };

  // Helper to find relationships for a character
  const getRelationshipsForCharacter = (charId: string) => {
    return relationships.filter(r => r.character1Id === charId || r.character2Id === charId);
  };

  // Delete handlers
  const handleDeleteCharacter = (id: string) => {
    onUpdateProject((prev: Project) => {
      const curBible = prev.storyBible || { characters: [], locations: [], events: [], objects: [], relationships: [] };
      const updated = (curBible.characters || []).filter(c => c.id !== id);
      const updatedRels = (curBible.relationships || []).filter(r => r.character1Id !== id && r.character2Id !== id);
      return {
        ...prev,
        storyBible: {
          ...curBible,
          characters: updated,
          relationships: updatedRels,
        },
      };
    });
    if (selectedEntityId === id) setSelectedEntityId(null);
  };

  const handleDeleteLocation = (id: string) => {
    onUpdateProject((prev: Project) => {
      const curBible = prev.storyBible || { characters: [], locations: [], events: [], objects: [], relationships: [] };
      const updated = (curBible.locations || []).filter(l => l.id !== id);
      return {
        ...prev,
        storyBible: {
          ...curBible,
          locations: updated,
        },
      };
    });
    if (selectedEntityId === id) setSelectedEntityId(null);
  };

  const handleDeleteEvent = (id: string) => {
    onUpdateProject((prev: Project) => {
      const curBible = prev.storyBible || { characters: [], locations: [], events: [], objects: [], relationships: [] };
      const updated = (curBible.events || []).filter(e => e.id !== id);
      return {
        ...prev,
        storyBible: {
          ...curBible,
          events: updated,
        },
      };
    });
    if (selectedEntityId === id) setSelectedEntityId(null);
  };

  const handleDeleteObject = (id: string) => {
    onUpdateProject((prev: Project) => {
      const curBible = prev.storyBible || { characters: [], locations: [], events: [], objects: [], relationships: [] };
      const updated = (curBible.objects || []).filter(o => o.id !== id);
      return {
        ...prev,
        storyBible: {
          ...curBible,
          objects: updated,
        },
      };
    });
    if (selectedEntityId === id) setSelectedEntityId(null);
  };

  const handleDeleteRelationship = (id: string) => {
    onUpdateProject((prev: Project) => {
      const curBible = prev.storyBible || { characters: [], locations: [], events: [], objects: [], relationships: [] };
      const updated = (curBible.relationships || []).filter(r => r.id !== id);
      return {
        ...prev,
        storyBible: {
          ...curBible,
          relationships: updated,
        },
      };
    });
  };

  // Save Character
  const handleSaveCharacter = (char: Character) => {
    if (!char.name.trim()) return;
    onUpdateProject((prev: Project) => {
      const curBible = prev.storyBible || { characters: [], locations: [], events: [], objects: [], relationships: [] };
      const chars = curBible.characters || [];
      const existingIndex = chars.findIndex(c => c.id === char.id);
      let updated: Character[];
      if (existingIndex >= 0) {
        updated = [...chars];
        updated[existingIndex] = char;
      } else {
        updated = [...chars, char];
      }
      return {
        ...prev,
        storyBible: {
          ...curBible,
          characters: updated,
        },
      };
    });
    setSearchQuery('');
    setIsEditingCharacter(null);
    setSelectedEntityId(char.id);
    showNotification(`✓ Character "${char.name}" saved to Story Bible`);
  };

  // Save Location
  const handleSaveLocation = (loc: Location) => {
    if (!loc.name.trim()) return;
    onUpdateProject((prev: Project) => {
      const curBible = prev.storyBible || { characters: [], locations: [], events: [], objects: [], relationships: [] };
      const locs = curBible.locations || [];
      const existingIndex = locs.findIndex(l => l.id === loc.id);
      let updated: Location[];
      if (existingIndex >= 0) {
        updated = [...locs];
        updated[existingIndex] = loc;
      } else {
        updated = [...locs, loc];
      }
      return {
        ...prev,
        storyBible: {
          ...curBible,
          locations: updated,
        },
      };
    });
    setSearchQuery('');
    setIsEditingLocation(null);
    setSelectedEntityId(loc.id);
    showNotification(`✓ Location "${loc.name}" saved to Story Bible`);
  };

  // Save Event
  const handleSaveEvent = (evt: StoryEvent) => {
    if (!evt.name.trim()) return;
    onUpdateProject((prev: Project) => {
      const curBible = prev.storyBible || { characters: [], locations: [], events: [], objects: [], relationships: [] };
      const evts = curBible.events || [];
      const existingIndex = evts.findIndex(e => e.id === evt.id);
      let updated: StoryEvent[];
      if (existingIndex >= 0) {
        updated = [...evts];
        updated[existingIndex] = evt;
      } else {
        updated = [...evts, evt];
      }
      return {
        ...prev,
        storyBible: {
          ...curBible,
          events: updated,
        },
      };
    });
    setSearchQuery('');
    setIsEditingEvent(null);
    setSelectedEntityId(evt.id);
    showNotification(`✓ Event "${evt.name}" saved to Story Bible`);
  };

  // Save Object
  const handleSaveObject = (obj: StoryObject) => {
    if (!obj.name.trim()) return;
    onUpdateProject((prev: Project) => {
      const curBible = prev.storyBible || { characters: [], locations: [], events: [], objects: [], relationships: [] };
      const objs = curBible.objects || [];
      const existingIndex = objs.findIndex(o => o.id === obj.id);
      let updated: StoryObject[];
      if (existingIndex >= 0) {
        updated = [...objs];
        updated[existingIndex] = obj;
      } else {
        updated = [...objs, obj];
      }
      return {
        ...prev,
        storyBible: {
          ...curBible,
          objects: updated,
        },
      };
    });
    setSearchQuery('');
    setIsEditingObject(null);
    setSelectedEntityId(obj.id);
    showNotification(`✓ Object "${obj.name}" saved to Story Bible`);
  };

  // Save Relationship
  const handleSaveRelationship = (rel: Relationship) => {
    onUpdateProject((prev: Project) => {
      const curBible = prev.storyBible || { characters: [], locations: [], events: [], objects: [], relationships: [] };
      const rels = curBible.relationships || [];
      const existingIndex = rels.findIndex(r => r.id === rel.id);
      let updated: Relationship[];
      if (existingIndex >= 0) {
        updated = [...rels];
        updated[existingIndex] = rel;
      } else {
        updated = [...rels, rel];
      }
      return {
        ...prev,
        storyBible: {
          ...curBible,
          relationships: updated,
        },
      };
    });
    setSearchQuery('');
    setIsEditingRelationship(null);
    showNotification('✓ Relationship saved to Story Bible');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* Bible Sub-Navigation & Search Bar (Microsoft Word style) */}
      <div className="h-12 border-b border-neutral-200 dark:border-neutral-800 bg-[#f8fafc] dark:bg-[#151921] px-6 flex items-center justify-between shrink-0 select-none shadow-xs">
        <div className="flex items-center gap-1 bg-neutral-200/70 dark:bg-neutral-800/80 p-1 rounded-lg">
          <button
            onClick={() => { setActiveTab('characters'); setSelectedEntityId(null); }}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'characters'
                ? 'bg-white dark:bg-neutral-900 text-[#185abd] dark:text-blue-300 font-semibold shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#185abd]" />
            <span>Characters ({characters.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('locations'); setSelectedEntityId(null); }}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'locations'
                ? 'bg-white dark:bg-neutral-900 text-[#185abd] dark:text-blue-300 font-semibold shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Locations ({locations.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('events'); setSelectedEntityId(null); }}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'events'
                ? 'bg-white dark:bg-neutral-900 text-[#185abd] dark:text-blue-300 font-semibold shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Flag className="w-3.5 h-3.5 text-amber-600" />
            <span>Events Database ({events.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('objects'); setSelectedEntityId(null); }}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'objects'
                ? 'bg-white dark:bg-neutral-900 text-[#185abd] dark:text-blue-300 font-semibold shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-purple-600" />
            <span>Objects ({objects.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('relationships'); setSelectedEntityId(null); }}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'relationships'
                ? 'bg-white dark:bg-neutral-900 text-[#185abd] dark:text-blue-300 font-semibold shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-rose-600" />
            <span>Relationships ({relationships.length})</span>
          </button>
        </div>

        {/* Right Search & Add Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-neutral-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-3 py-1 bg-white dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 w-48 focus:outline-none focus:border-[#185abd]"
            />
          </div>

          <button
            onClick={() => {
              if (activeTab === 'characters') {
                setIsEditingCharacter({
                  id: `char-${Date.now()}`,
                  name: '',
                  role: 'supporting',
                  appearance: '',
                  personality: '',
                  goals: '',
                  fears: '',
                  characterArc: '',
                  color: '#3b82f6',
                });
              } else if (activeTab === 'locations') {
                setIsEditingLocation({
                  id: `loc-${Date.now()}`,
                  name: '',
                  description: '',
                  atmosphere: '',
                });
              } else if (activeTab === 'events') {
                setIsEditingEvent({
                  id: `evt-${Date.now()}`,
                  name: '',
                  description: '',
                  chronologicalOrder: events.length + 1,
                  charactersInvolved: [],
                });
              } else if (activeTab === 'objects') {
                setIsEditingObject({
                  id: `obj-${Date.now()}`,
                  name: '',
                  description: '',
                  significance: '',
                });
              } else if (activeTab === 'relationships') {
                if (characters.length >= 2) {
                  setIsEditingRelationship({
                    id: `rel-${Date.now()}`,
                    character1Id: characters[0].id,
                    character2Id: characters[1].id,
                    type: 'Allies',
                    description: '',
                  });
                } else {
                  showNotification('⚠️ Add at least 2 characters to the Story Bible before creating relationships.');
                }
              }
            }}
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New</span>
          </button>
        </div>
      </div>

      {/* Floating Notification Banner */}
      {notificationMessage && (
        <div className="bg-emerald-700 dark:bg-emerald-800 text-white text-xs font-medium py-2 px-6 flex items-center justify-between shrink-0 shadow-sm animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <span>{notificationMessage}</span>
          </div>
          <button
            onClick={() => setNotificationMessage(null)}
            className="text-emerald-200 hover:text-white p-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* TAB 1: CHARACTERS */}
          {activeTab === 'characters' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCharacters.map(char => {
                const appearances = getScenesForCharacter(char.id);
                const rels = getRelationshipsForCharacter(char.id);

                return (
                  <div
                    key={char.id}
                    className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-xs"
                  >
                    <div>
                      {/* Character Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white uppercase shrink-0"
                            style={{ backgroundColor: char.color || '#3b82f6' }}
                          >
                            {char.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 leading-tight">
                              {char.name}
                            </h3>
                            <div className="text-[11px] text-neutral-500 capitalize">
                              {char.role} {char.occupation ? `· ${char.occupation}` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setIsEditingCharacter(char)}
                            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                            title="Edit character profile"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCharacter(char.id)}
                            className="p-1 text-neutral-400 hover:text-red-500 rounded"
                            title="Delete character"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Bio Details */}
                      <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400 mb-4">
                        {char.appearance && (
                          <div>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">Appearance: </span>
                            <span>{char.appearance}</span>
                          </div>
                        )}
                        {char.goals && (
                          <div>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">Goal: </span>
                            <span>{char.goals}</span>
                          </div>
                        )}
                        {char.characterArc && (
                          <div>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">Arc: </span>
                            <span>{char.characterArc}</span>
                          </div>
                        )}
                      </div>

                      {/* Connected Relationships */}
                      {rels.length > 0 && (
                        <div className="mb-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                            Relationships
                          </div>
                          <div className="space-y-1">
                            {rels.map(r => {
                              const otherCharId = r.character1Id === char.id ? r.character2Id : r.character1Id;
                              const otherChar = characters.find(c => c.id === otherCharId);
                              return (
                                <div key={r.id} className="text-xs flex items-center justify-between text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/50 px-2 py-1 rounded">
                                  <span>→ {otherChar?.name || 'Unknown'}:</span>
                                  <span className="font-medium text-amber-600 dark:text-amber-400">{r.type}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Scene Appearances with click-to-jump */}
                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                      <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Appears in ({appearances.length} scenes)</span>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {appearances.map(s => {
                          const chap = project.chapters.find(c => c.id === s.chapterId);
                          return (
                            <button
                              key={s.id}
                              onClick={() => onNavigateToScene(s.id)}
                              className="text-[11px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded flex items-center gap-1 transition-colors"
                            >
                              <span>Ch {chap?.number || '?'}: {s.title.split('—')[1] || s.title}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: LOCATIONS */}
          {activeTab === 'locations' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLocations.map(loc => {
                const appearances = getScenesForLocation(loc.id);
                const locEvents = events.filter(e => e.locationId === loc.id);

                return (
                  <div
                    key={loc.id}
                    className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-emerald-500 shrink-0" />
                          <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                            {loc.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setIsEditingLocation(loc)}
                            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLocation(loc.id)}
                            className="p-1 text-neutral-400 hover:text-red-500 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3 leading-relaxed">
                        {loc.description}
                      </p>

                      {loc.atmosphere && (
                        <div className="text-xs text-neutral-500 italic mb-4">
                          <span className="font-medium text-neutral-700 dark:text-neutral-300 not-italic">Atmosphere: </span>
                          "{loc.atmosphere}"
                        </div>
                      )}

                      {/* Events occurred here */}
                      {locEvents.length > 0 && (
                        <div className="mb-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                            Events At This Location
                          </div>
                          <ul className="text-xs space-y-1 text-neutral-600 dark:text-neutral-300 list-disc list-inside">
                            {locEvents.map(e => (
                              <li key={e.id} className="truncate">{e.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Scene appearances */}
                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                      <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                        Scenes Featured ({appearances.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {appearances.map(s => (
                          <button
                            key={s.id}
                            onClick={() => onNavigateToScene(s.id)}
                            className="text-[11px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded flex items-center gap-1 transition-colors"
                          >
                            <span>{s.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: EVENTS DATABASE */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs text-neutral-500">
                Events recorded in Story Chronological Order. Drag or reorder to maintain your in-universe narrative causality.
              </div>

              <div className="space-y-3">
                {filteredEvents.map((evt, idx) => {
                  const location = locations.find(l => l.id === evt.locationId);
                  const involvedChars = characters.filter(c => evt.charactersInvolved?.includes(c.id));

                  return (
                    <div
                      key={evt.id}
                      className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {String(evt.chronologicalOrder).padStart(2, '0')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                              {evt.name}
                            </h3>
                            {evt.isMilestone && (
                              <span className="text-[10px] font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                                Milestone
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                            {evt.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-neutral-500">
                            {location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-emerald-500" />
                                {location.name}
                              </span>
                            )}
                            {evt.timeLabel && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-neutral-400" />
                                {evt.timeLabel}
                              </span>
                            )}
                            {involvedChars.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-blue-500" />
                                {involvedChars.map(c => c.name).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        {evt.manuscriptSceneId && (
                          <button
                            onClick={() => onNavigateToScene(evt.manuscriptSceneId!)}
                            className="px-2.5 py-1 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors flex items-center gap-1"
                          >
                            <span>Jump to scene</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => setIsEditingEvent(evt)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: OBJECTS */}
          {activeTab === 'objects' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredObjects.map(obj => {
                const owner = characters.find(c => c.id === obj.currentOwnerId);
                return (
                  <div
                    key={obj.id}
                    className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Box className="w-5 h-5 text-purple-500 shrink-0" />
                          <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                            {obj.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setIsEditingObject(obj)}
                            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteObject(obj.id)}
                            className="p-1 text-neutral-400 hover:text-red-500 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3 leading-relaxed">
                        {obj.description}
                      </p>

                      {obj.significance && (
                        <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded mb-3">
                          <span className="font-medium">Significance: </span>
                          {obj.significance}
                        </div>
                      )}
                    </div>

                    {owner && (
                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500">
                        <span>Current Possessor: </span>
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">{owner.name}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 5: RELATIONSHIPS */}
          {activeTab === 'relationships' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relationships.map(rel => {
                  const c1 = characters.find(c => c.id === rel.character1Id);
                  const c2 = characters.find(c => c.id === rel.character2Id);

                  return (
                    <div
                      key={rel.id}
                      className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            <span>{c1?.name || 'Character A'}</span>
                            <span className="text-neutral-400 font-normal">↔</span>
                            <span>{c2?.name || 'Character B'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs px-2 py-0.5 rounded font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                              {rel.type}
                            </span>
                            <button
                              onClick={() => setIsEditingRelationship(rel)}
                              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRelationship(rel.id)}
                              className="p-1 text-neutral-400 hover:text-red-500 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {rel.description || 'No detailed dynamics described yet.'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EDIT CHARACTER MODAL */}
      {isEditingCharacter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 max-w-xl w-full shadow-2xl my-8">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {characters.some(c => c.id === isEditingCharacter.id) ? 'Edit Character Profile' : 'Add New Character'}
            </h3>

            <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={isEditingCharacter.name}
                    onChange={e => setIsEditingCharacter({ ...isEditingCharacter, name: e.target.value })}
                    className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium"
                    placeholder="e.g. Character name"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Story Role</label>
                  <select
                    value={isEditingCharacter.role}
                    onChange={e => setIsEditingCharacter({ ...isEditingCharacter, role: e.target.value as any })}
                    className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="protagonist">Protagonist</option>
                    <option value="antagonist">Antagonist</option>
                    <option value="supporting">Supporting</option>
                    <option value="minor">Minor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 mb-1">Age</label>
                  <input
                    type="text"
                    value={isEditingCharacter.age || ''}
                    onChange={e => setIsEditingCharacter({ ...isEditingCharacter, age: e.target.value })}
                    className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                    placeholder="e.g. 38"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={isEditingCharacter.occupation || ''}
                    onChange={e => setIsEditingCharacter({ ...isEditingCharacter, occupation: e.target.value })}
                    className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                    placeholder="e.g. Archivist / Investigator"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Physical Appearance</label>
                <textarea
                  value={isEditingCharacter.appearance || ''}
                  onChange={e => setIsEditingCharacter({ ...isEditingCharacter, appearance: e.target.value })}
                  className="w-full h-16 p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  placeholder="Height, eye color, distinguishing scars, attire style..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 mb-1">Primary Goal / Want</label>
                  <input
                    type="text"
                    value={isEditingCharacter.goals || ''}
                    onChange={e => setIsEditingCharacter({ ...isEditingCharacter, goals: e.target.value })}
                    className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Deepest Fear / Flaw</label>
                  <input
                    type="text"
                    value={isEditingCharacter.fears || ''}
                    onChange={e => setIsEditingCharacter({ ...isEditingCharacter, fears: e.target.value })}
                    className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Character Arc Progression</label>
                <textarea
                  value={isEditingCharacter.characterArc || ''}
                  onChange={e => setIsEditingCharacter({ ...isEditingCharacter, characterArc: e.target.value })}
                  className="w-full h-16 p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  placeholder="How does this character transform between Chapter 1 and the climax?"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setIsEditingCharacter(null)}
                className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (isEditingCharacter.name.trim()) {
                    handleSaveCharacter(isEditingCharacter);
                  }
                }}
                className="px-4 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded"
              >
                Save Character
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT LOCATION MODAL */}
      {isEditingLocation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {locations.some(l => l.id === isEditingLocation.id) ? 'Edit Location' : 'Add New Location'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-500 mb-1">Location Name *</label>
                <input
                  type="text"
                  value={isEditingLocation.name}
                  onChange={e => setIsEditingLocation({ ...isEditingLocation, name: e.target.value })}
                  className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  placeholder="e.g. Castle Archives"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Description</label>
                <textarea
                  value={isEditingLocation.description}
                  onChange={e => setIsEditingLocation({ ...isEditingLocation, description: e.target.value })}
                  className="w-full h-20 p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  placeholder="Sensory details, architecture, geography..."
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Atmosphere / Mood</label>
                <input
                  type="text"
                  value={isEditingLocation.atmosphere || ''}
                  onChange={e => setIsEditingLocation({ ...isEditingLocation, atmosphere: e.target.value })}
                  className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  placeholder="e.g. Cold river fog, smelling of coal ash and rusted iron"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setIsEditingLocation(null)}
                className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (isEditingLocation.name.trim()) {
                    handleSaveLocation(isEditingLocation);
                  }
                }}
                className="px-4 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded"
              >
                Save Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT EVENT MODAL */}
      {isEditingEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {events.some(e => e.id === isEditingEvent.id) ? 'Edit Event' : 'Add Story Event'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-500 mb-1">Event Name *</label>
                <input
                  type="text"
                  value={isEditingEvent.name}
                  onChange={e => setIsEditingEvent({ ...isEditingEvent, name: e.target.value })}
                  className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  placeholder="e.g. Discovery of the missing letter"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Description</label>
                <textarea
                  value={isEditingEvent.description}
                  onChange={e => setIsEditingEvent({ ...isEditingEvent, description: e.target.value })}
                  className="w-full h-16 p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 mb-1">Story Chronological Order #</label>
                  <input
                    type="number"
                    value={isEditingEvent.chronologicalOrder}
                    onChange={e => setIsEditingEvent({ ...isEditingEvent, chronologicalOrder: parseInt(e.target.value) || 1 })}
                    className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Location</label>
                  <select
                    value={isEditingEvent.locationId || ''}
                    onChange={e => setIsEditingEvent({ ...isEditingEvent, locationId: e.target.value || undefined })}
                    className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="">Unassigned</option>
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Consequences / Fallout</label>
                <input
                  type="text"
                  value={isEditingEvent.consequences || ''}
                  onChange={e => setIsEditingEvent({ ...isEditingEvent, consequences: e.target.value })}
                  className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  placeholder="e.g. Proves the ministry cover-up is active"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setIsEditingEvent(null)}
                className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (isEditingEvent.name.trim()) {
                    handleSaveEvent(isEditingEvent);
                  }
                }}
                className="px-4 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded"
              >
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT OBJECT MODAL */}
      {isEditingObject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {objects.some(o => o.id === isEditingObject.id) ? 'Edit Object' : 'Add Story Object'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-500 mb-1">Object Name *</label>
                <input
                  type="text"
                  value={isEditingObject.name}
                  onChange={e => setIsEditingObject({ ...isEditingObject, name: e.target.value })}
                  className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  placeholder="e.g. Stamped Brass Key 1938"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Description</label>
                <textarea
                  value={isEditingObject.description}
                  onChange={e => setIsEditingObject({ ...isEditingObject, description: e.target.value })}
                  className="w-full h-16 p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Significance / Lore</label>
                <input
                  type="text"
                  value={isEditingObject.significance || ''}
                  onChange={e => setIsEditingObject({ ...isEditingObject, significance: e.target.value })}
                  className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Current Owner / Possessor</label>
                <select
                  value={isEditingObject.currentOwnerId || ''}
                  onChange={e => setIsEditingObject({ ...isEditingObject, currentOwnerId: e.target.value || undefined })}
                  className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="">Unassigned</option>
                  {characters.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setIsEditingObject(null)}
                className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (isEditingObject.name.trim()) {
                    handleSaveObject(isEditingObject);
                  }
                }}
                className="px-4 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded"
              >
                Save Object
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT RELATIONSHIP MODAL */}
      {isEditingRelationship && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Edit Character Relationship
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 mb-1">Character 1</label>
                  <select
                    value={isEditingRelationship.character1Id}
                    onChange={e => setIsEditingRelationship({ ...isEditingRelationship, character1Id: e.target.value })}
                    className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  >
                    {characters.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Character 2</label>
                  <select
                    value={isEditingRelationship.character2Id}
                    onChange={e => setIsEditingRelationship({ ...isEditingRelationship, character2Id: e.target.value })}
                    className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  >
                    {characters.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Relationship Type</label>
                <input
                  type="text"
                  value={isEditingRelationship.type}
                  onChange={e => setIsEditingRelationship({ ...isEditingRelationship, type: e.target.value })}
                  className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  placeholder="e.g. Romantic / Complicated, Estranged Brothers, Rivals"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Dynamic Description</label>
                <textarea
                  value={isEditingRelationship.description}
                  onChange={e => setIsEditingRelationship({ ...isEditingRelationship, description: e.target.value })}
                  className="w-full h-20 p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  placeholder="What is their history? What tension or bond exists between them?"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setIsEditingRelationship(null)}
                className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveRelationship(isEditingRelationship)}
                className="px-4 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded"
              >
                Save Relationship
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export type StoryView = 'home' | 'write' | 'bible' | 'timeline' | 'script' | 'graph';

export interface Chapter {
  id: string;
  title: string;
  order: number;
  synopsis?: string;
}

export interface Scene {
  id: string;
  chapterId: string;
  title: string;
  content: string;
  order: number;
  synopsis?: string;
  status?: 'draft' | 'revised' | 'final';
  pov?: string;
  timeOfDay?: string;
  location?: string;
  targetWordCount?: number;
}

export interface CharacterEntity {
  id: string;
  name: string;
  role: string;
  aliases?: string[];
  bio?: string;
  appearance?: string;
  goals?: string;
  conflicts?: string;
  arc?: string;
  tags?: string[];
}

export interface LocationEntity {
  id: string;
  name: string;
  description?: string;
  atmosphere?: string;
  significance?: string;
  scenes?: string[];
  tags?: string[];
}

export interface EventEntity {
  id: string;
  name: string;
  timelineOrder?: number;
  dateOrMarker?: string;
  description?: string;
  consequences?: string;
  participatingCharacters?: string[];
}

export interface ObjectEntity {
  id: string;
  name: string;
  description?: string;
  significance?: string;
  owner?: string;
  location?: string;
}

export interface RelationshipEntity {
  id: string;
  sourceCharacterId: string;
  targetCharacterId: string;
  type: string;
  dynamic: string;
  tensionLevel?: number;
  description?: string;
}

export interface StoryBible {
  characters: CharacterEntity[];
  locations: LocationEntity[];
  events: EventEntity[];
  objects: ObjectEntity[];
  relationships: RelationshipEntity[];
}

export interface ScreenplayElement {
  type: 'scene_heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'shot';
  content: string;
}

export interface ScreenplayScene {
  sceneId: string;
  slugline: string;
  elements: ScreenplayElement[];
}

export interface ProjectSettings {
  theme: 'classic' | 'grey' | 'sepia' | 'dark';
  focusMode: boolean;
  fontSize: number;
  fontFamily: string;
  spellCheck: boolean;
  autoSaveInterval: number;
}

export interface Project {
  id: string;
  title: string;
  author: string;
  type: string;
  genre?: string;
  logline?: string;
  targetWordCount?: number;
  dailyWordGoal?: number;
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
  scenes: Scene[];
  storyBible: StoryBible;
  screenplay: ScreenplayScene[];
  settings: ProjectSettings;
}

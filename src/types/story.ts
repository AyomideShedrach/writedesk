export type StoryView = 
  | 'home'
  | 'write' 
  | 'bible' 
  | 'timeline' 
  | 'scenes' 
  | 'script' 
  | 'adaptation' 
  | 'graph' 
  | 'animation' 
  | 'continuity' 
  | 'search';

export type BibleTab = 'characters' | 'locations' | 'events' | 'objects' | 'relationships';

export type ScreenplayElementType =
  | 'scene_heading'
  | 'action'
  | 'character'
  | 'dialogue'
  | 'parenthetical'
  | 'transition'
  | 'shot'
  | 'title'
  | 'general'
  | 'note';

export interface ScreenplayElement {
  id: string;
  type: ScreenplayElementType;
  content: string;
}

export interface AnimationShot {
  id: string;
  shotNumber: number;
  shotType: 'Extreme Wide' | 'Wide Shot' | 'Medium Shot' | 'Medium Close-up' | 'Close-up' | 'Extreme Close-up' | 'Over-the-Shoulder' | 'Point of View' | 'Reverse Shot' | 'Low Angle' | 'Bird Eye';
  camera: string;
  action: string;
  characters: string[];
  timing: string; // e.g. "3.5s"
  audioCue?: string;
  notes?: string;
}

export interface ScreenplayScene {
  id: string;
  sourceSceneId?: string; // Optional link to novel scene
  sceneNumber: number;
  slugline: string; // e.g., "INT. ABANDONED TRAIN STATION - NIGHT"
  elements: ScreenplayElement[];
  shots?: AnimationShot[];
}

export interface DetectedEntity {
  id: string;
  type: 'character' | 'location' | 'event' | 'object' | 'time';
  name: string;
  context: string;
  sceneId: string;
  status: 'pending' | 'added' | 'ignored';
  details?: Record<string, string>;
}

export interface Scene {
  id: string;
  chapterId: string;
  order: number; // Manuscript order
  storyOrder: number; // Story chronological order (flashbacks can be lower number than chapter 1)
  title: string;
  content: string; // Manuscript prose text
  status: 'outline' | 'draft' | 'revision' | 'polished' | 'final';
  povCharacterId?: string;
  locationId?: string;
  time?: string; // e.g. "Midnight", "The following morning", "Three days later"
  wordCount: number;
  notes?: string;
  emotionalBeat?: string;
  characterIds: string[];
  eventIds: string[];
  objectIds?: string[];
  detectedItems: DetectedEntity[];
  updatedAt: string;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  summary?: string;
  notes?: string;
  sceneIds: string[];
}

export interface Character {
  id: string;
  name: string;
  aliases?: string[];
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  age?: string;
  occupation?: string;
  appearance?: string; // e.g., "Tall, hazel eyes, faded wool overcoat"
  personality?: string;
  goals?: string;
  fears?: string;
  characterArc?: string;
  firstAppearanceSceneId?: string;
  notes?: string;
  color?: string; // for graph & timeline tags
}

export interface Location {
  id: string;
  name: string;
  description: string;
  atmosphere?: string;
  firstAppearanceSceneId?: string;
  notes?: string;
}

export interface StoryObject {
  id: string;
  name: string;
  description: string;
  significance?: string;
  currentOwnerId?: string;
  notes?: string;
}

export interface Relationship {
  id: string;
  character1Id: string;
  character2Id: string;
  type: string; // "Romantic", "Allies", "Rivals", "Family", "Complicated", "Estranged"
  description: string;
}

export interface StoryEvent {
  id: string;
  name: string;
  description: string;
  chronologicalOrder: number; // Story Chronological order
  manuscriptChapterId?: string;
  manuscriptSceneId?: string;
  locationId?: string;
  timeLabel?: string;
  charactersInvolved: string[];
  consequences?: string;
  previousEventId?: string;
  followingEventId?: string;
  isMilestone?: boolean;
}

export interface ContinuityIssue {
  id: string;
  title: string;
  type: 'character_trait' | 'timeline_jump' | 'location_anomaly' | 'unresolved_thread';
  description: string;
  sceneIds: string[];
  characterIds: string[];
  severity: 'low' | 'medium' | 'high';
  dismissed: boolean;
}

export interface ProjectSettings {
  fontFamily: 'serif' | 'sans' | 'mono';
  fontSize: number; // in pt/px (16 standard)
  theme: 'dark' | 'light' | 'grey' | 'sepia';
  lineHeight: 'normal' | 'relaxed' | 'loose';
  focusMode: boolean;
  typewriterMode: boolean;
  autoExtract: boolean;
  dailyWordGoal?: number;
}

export interface Project {
  id: string;
  title: string;
  author: string;
  type: 'novel' | 'novella' | 'short_story' | 'screenplay' | 'other';
  logline?: string;
  genre?: string;
  targetWordCount?: number;
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
  scenes: Scene[];
  storyBible: {
    characters: Character[];
    locations: Location[];
    events: StoryEvent[];
    objects: StoryObject[];
    relationships: Relationship[];
  };
  screenplay: ScreenplayScene[];
  continuityIssues: ContinuityIssue[];
  settings: ProjectSettings;
}

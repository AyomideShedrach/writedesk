import { Project, Scene } from '../types/story';
import { DEFAULT_PROJECT } from '../data/defaultProject';

const STORAGE_KEY_PREFIX = 'liimewords_proj_';
const LEGACY_STORAGE_KEY_PREFIX = 'storyforge_proj_';
const INDEX_KEY = 'liimewords_projects_index';
const LEGACY_INDEX_KEY = 'storyforge_projects_index';
const CURRENT_PROJECT_ID_KEY = 'liimewords_current_project_id';
const LEGACY_CURRENT_PROJECT_ID_KEY = 'storyforge_current_project_id';

export interface ProjectMetadata {
  id: string;
  title: string;
  author: string;
  type: string;
  genre?: string;
  logline?: string;
  updatedAt: string;
  wordCount: number;
  chapterCount: number;
  sceneCount: number;
  characterCount: number;
  locationCount?: number;
  targetWordCount?: number;
  previewExcerpt?: string;
}

// Calculate total words in manuscript
export function calculateProjectWordCount(project: Project): number {
  if (!project || !project.scenes) return 0;
  return project.scenes.reduce((acc, scene) => {
    const words = (scene.content || '').trim().split(/\s+/).filter(Boolean).length;
    return acc + words;
  }, 0);
}

export const StorageService = {
  getProjectsList(): ProjectMetadata[] {
    try {
      let raw = localStorage.getItem(INDEX_KEY);
      if (!raw) {
        raw = localStorage.getItem(LEGACY_INDEX_KEY);
      }
      if (raw) {
        const list: ProjectMetadata[] = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch (e) {
      console.warn('StorageService index load error:', e);
    }

    // Default project metadata
    const defaultMeta: ProjectMetadata = {
      id: DEFAULT_PROJECT.id,
      title: DEFAULT_PROJECT.title,
      author: DEFAULT_PROJECT.author,
      type: DEFAULT_PROJECT.type,
      genre: DEFAULT_PROJECT.genre,
      logline: DEFAULT_PROJECT.logline,
      updatedAt: DEFAULT_PROJECT.updatedAt,
      wordCount: calculateProjectWordCount(DEFAULT_PROJECT),
      chapterCount: DEFAULT_PROJECT.chapters.length,
      sceneCount: DEFAULT_PROJECT.scenes.length,
      characterCount: DEFAULT_PROJECT.storyBible.characters.length,
      targetWordCount: DEFAULT_PROJECT.targetWordCount,
      previewExcerpt: DEFAULT_PROJECT.scenes[0]?.content.slice(0, 150),
    };
    try {
      localStorage.setItem(INDEX_KEY, JSON.stringify([defaultMeta]));
    } catch {}
    return [defaultMeta];
  },

  getCurrentProjectId(): string {
    return localStorage.getItem(CURRENT_PROJECT_ID_KEY) || localStorage.getItem(LEGACY_CURRENT_PROJECT_ID_KEY) || DEFAULT_PROJECT.id;
  },

  setCurrentProjectId(id: string): void {
    try {
      localStorage.setItem(CURRENT_PROJECT_ID_KEY, id);
    } catch {}
  },

  loadProject(id: string): Project {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`) || localStorage.getItem(`${LEGACY_STORAGE_KEY_PREFIX}${id}`);
      if (raw) {
        const parsed: Project = JSON.parse(raw);
        if (parsed && parsed.id) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error loading project from localStorage:', e);
    }

    // Save and return default project
    this.saveProject(DEFAULT_PROJECT);
    return DEFAULT_PROJECT;
  },

  saveProject(project: Project): void {
    if (!project || !project.id) return;
    try {
      const updated = {
        ...project,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${project.id}`, JSON.stringify(updated));

      // Update index
      const list = this.getProjectsList();
      const wordCount = calculateProjectWordCount(updated);
      const meta: ProjectMetadata = {
        id: updated.id,
        title: updated.title,
        author: updated.author,
        type: updated.type,
        genre: updated.genre,
        logline: updated.logline,
        updatedAt: updated.updatedAt,
        wordCount,
        chapterCount: updated.chapters?.length || 0,
        sceneCount: updated.scenes?.length || 0,
        characterCount: updated.storyBible?.characters?.length || 0,
        targetWordCount: updated.targetWordCount,
        previewExcerpt: updated.scenes?.[0]?.content?.slice(0, 150) || '',
      };

      const existingIndex = list.findIndex(p => p.id === updated.id);
      if (existingIndex >= 0) {
        list[existingIndex] = meta;
      } else {
        list.unshift(meta);
      }
      localStorage.setItem(INDEX_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('StorageService save error:', e);
    }
  },

  createProject(title: string, author?: string): Project {
    const id = `project-${Date.now()}`;
    const newProj: Project = {
      ...DEFAULT_PROJECT,
      id,
      title: title || 'Untitled Novel',
      author: author || 'Studio Writer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapters: [
        {
          id: `chap-${Date.now()}-1`,
          title: 'Chapter 1: The Beginning',
          order: 1,
        },
      ],
      scenes: [
        {
          id: `scene-${Date.now()}-1`,
          chapterId: `chap-${Date.now()}-1`,
          title: 'Opening Scene',
          order: 1,
          status: 'draft',
          content: '',
        },
      ],
      storyBible: {
        characters: [],
        locations: [],
        events: [],
        objects: [],
        relationships: [],
      },
      screenplay: [],
    };
    this.saveProject(newProj);
    this.setCurrentProjectId(id);
    return newProj;
  },

  deleteProject(id: string): void {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
      const list = this.getProjectsList().filter(p => p.id !== id);
      localStorage.setItem(INDEX_KEY, JSON.stringify(list));
      if (this.getCurrentProjectId() === id) {
        const next = list[0]?.id || DEFAULT_PROJECT.id;
        this.setCurrentProjectId(next);
      }
    } catch (e) {
      console.warn('Error deleting project:', e);
    }
  },
};

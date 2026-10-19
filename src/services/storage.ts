import { Project, ScreenplayScene } from '../types/story';
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
  return project.scenes.reduce((acc, scene) => {
    const words = scene.content.trim().split(/\s+/).filter(Boolean).length;
    return acc + words;
  }, 0);
}

const DUMMY_PROJECT_IDS = ['project-the-last-station'];

export const StorageService = {
  // Get index of all available projects
  getProjectsList(): ProjectMetadata[] {
    try {
      // Purge any legacy dummy manuscripts from local storage
      for (const dummyId of DUMMY_PROJECT_IDS) {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${dummyId}`);
        localStorage.removeItem(`${LEGACY_STORAGE_KEY_PREFIX}${dummyId}`);
      }

      let raw = localStorage.getItem(INDEX_KEY);
      if (!raw) {
        raw = localStorage.getItem(LEGACY_INDEX_KEY);
      }
      
      let list: ProjectMetadata[] = [];
      if (raw) {
        try {
          const parsed: ProjectMetadata[] = JSON.parse(raw);
          // Filter out any dummy manuscripts
          list = parsed.filter(p => !DUMMY_PROJECT_IDS.includes(p.id) && p.title !== 'The Last Station');
          localStorage.setItem(INDEX_KEY, JSON.stringify(list));
        } catch {
          list = [];
        }
      }

      if (list.length === 0) {
        // Initialize with pristine clean default manuscript
        this.saveProject(DEFAULT_PROJECT);
        return [this.getMetadata(DEFAULT_PROJECT)];
      }

      return list;
    } catch (e) {
      console.error('Error reading projects index from localStorage:', e);
      return [this.getMetadata(DEFAULT_PROJECT)];
    }
  },

  getCurrentProjectId(): string {
    const stored = localStorage.getItem(CURRENT_PROJECT_ID_KEY) || localStorage.getItem(LEGACY_CURRENT_PROJECT_ID_KEY);
    if (!stored || DUMMY_PROJECT_IDS.includes(stored)) {
      const list = this.getProjectsList();
      const nextId = list[0]?.id || DEFAULT_PROJECT.id;
      localStorage.setItem(CURRENT_PROJECT_ID_KEY, nextId);
      return nextId;
    }
    return stored;
  },

  setCurrentProjectId(id: string): void {
    localStorage.setItem(CURRENT_PROJECT_ID_KEY, id);
  },

  loadProject(id: string): Project {
    try {
      if (DUMMY_PROJECT_IDS.includes(id)) {
        const list = this.getProjectsList();
        const validId = list[0]?.id || DEFAULT_PROJECT.id;
        return this.loadProject(validId);
      }

      let raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
      if (!raw) {
        raw = localStorage.getItem(`${LEGACY_STORAGE_KEY_PREFIX}${id}`);
      }
      if (!raw) {
        if (id === DEFAULT_PROJECT.id) {
          this.saveProject(DEFAULT_PROJECT);
          return DEFAULT_PROJECT;
        }
        return DEFAULT_PROJECT;
      }
      const project: Project = JSON.parse(raw);
      // Normalize storyBible and screenplay to guarantee safe access
      if (!project.storyBible) {
        project.storyBible = { characters: [], locations: [], events: [], objects: [], relationships: [] };
      } else {
        project.storyBible.characters = project.storyBible.characters || [];
        project.storyBible.locations = project.storyBible.locations || [];
        project.storyBible.events = project.storyBible.events || [];
        project.storyBible.objects = project.storyBible.objects || [];
        project.storyBible.relationships = project.storyBible.relationships || [];
      }
      if (!project.screenplay) {
        project.screenplay = [];
      }
      return project;
    } catch (e) {
      console.error(`Error loading project ${id}:`, e);
      return DEFAULT_PROJECT;
    }
  },

  saveProject(project: Project): void {
    try {
      const updatedProject = {
        ...project,
        updatedAt: new Date().toISOString(),
      };

      // Save full project payload
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${project.id}`, JSON.stringify(updatedProject));

      // Update index
      const meta = this.getMetadata(updatedProject);
      const raw = localStorage.getItem(INDEX_KEY);
      let list: ProjectMetadata[] = raw ? JSON.parse(raw) : [];

      const existingIndex = list.findIndex(p => p.id === project.id);
      if (existingIndex >= 0) {
        list[existingIndex] = meta;
      } else {
        list.unshift(meta);
      }

      localStorage.setItem(INDEX_KEY, JSON.stringify(list));
      localStorage.setItem(CURRENT_PROJECT_ID_KEY, project.id);
    } catch (e) {
      console.error('Error saving project to local storage:', e);
    }
  },

  createProject(title: string, author: string, type: Project['type'], genre = 'Fiction'): Project {
    const newId = `project-${Date.now()}`;
    const firstChapId = `chap-${Date.now()}-1`;
    const firstSceneId = `scene-${Date.now()}-1`;

    const newProject: Project = {
      id: newId,
      title: title.trim() || 'Untitled Novel',
      author: author.trim() || 'Anonymous Writer',
      type,
      genre,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        fontFamily: 'serif',
        fontSize: 17,
        theme: 'light',
        lineHeight: 'relaxed',
        focusMode: false,
        typewriterMode: false,
        autoExtract: true,
        dailyWordGoal: 1000,
      },
      chapters: [
        {
          id: firstChapId,
          number: 1,
          title: 'Chapter 1',
          summary: '',
          sceneIds: [firstSceneId],
        },
      ],
      scenes: [
        {
          id: firstSceneId,
          chapterId: firstChapId,
          order: 1,
          storyOrder: 1,
          title: 'Scene 1',
          status: 'draft',
          wordCount: 0,
          content: '',
          characterIds: [],
          eventIds: [],
          detectedItems: [],
          updatedAt: new Date().toISOString(),
        },
      ],
      storyBible: {
        characters: [],
        locations: [],
        events: [],
        objects: [],
        relationships: [],
      },
      screenplay: type === 'screenplay' ? [
        {
          id: `sc-script-${Date.now()}`,
          sceneNumber: 1,
          slugline: 'INT. SCENE LOCATION - DAY',
          elements: [
            {
              id: `el-${Date.now()}-1`,
              type: 'scene_heading',
              content: 'INT. SCENE LOCATION - DAY',
            },
            {
              id: `el-${Date.now()}-2`,
              type: 'action',
              content: 'Action description goes here...',
            },
          ],
          shots: [],
        },
      ] : [],
      continuityIssues: [],
    };

    this.saveProject(newProject);
    return newProject;
  },

  deleteProject(id: string): void {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
      const raw = localStorage.getItem(INDEX_KEY);
      if (raw) {
        const list: ProjectMetadata[] = JSON.parse(raw);
        const filtered = list.filter(p => p.id !== id);
        localStorage.setItem(INDEX_KEY, JSON.stringify(filtered));
        if (filtered.length > 0) {
          localStorage.setItem(CURRENT_PROJECT_ID_KEY, filtered[0].id);
        } else {
          this.saveProject(DEFAULT_PROJECT);
        }
      }
    } catch (e) {
      console.error(`Error deleting project ${id}:`, e);
    }
  },

  duplicateProject(id: string): Project {
    const original = this.loadProject(id);
    const newId = `proj_${Date.now()}`;
    const duplicated: Project = {
      ...original,
      id: newId,
      title: `${original.title} (Copy)`,
      updatedAt: new Date().toISOString(),
    };
    this.saveProject(duplicated);
    return duplicated;
  },

  getMetadata(project: Project): ProjectMetadata {
    const firstScene = project.scenes[0];
    const previewExcerpt = firstScene?.content 
      ? firstScene.content.trim().slice(0, 240)
      : '';

    return {
      id: project.id,
      title: project.title,
      author: project.author,
      type: project.type,
      genre: project.genre || (project.type === 'screenplay' ? 'Drama' : 'Fiction'),
      logline: project.logline || '',
      updatedAt: project.updatedAt,
      wordCount: calculateProjectWordCount(project),
      chapterCount: project.chapters.length,
      sceneCount: project.scenes.length,
      characterCount: project.storyBible?.characters?.length || 0,
      locationCount: project.storyBible?.locations?.length || 0,
      targetWordCount: project.targetWordCount || 50000,
      previewExcerpt,
    };
  },

  // Export full project as dedicated .liw file (Liime Words Dedicated Studio Writer Project)
  exportProjectAsJson(project: Project): void {
    this.exportProjectAsLiw(project);
  },

  exportProjectAsLiw(project: Project): void {
    const dataStr = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const sanitizedTitle = project.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadAnchor.setAttribute('download', `${sanitizedTitle}.liw`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  // Import project JSON or .liw
  importProjectFromJson(jsonString: string): Project {
    const parsed = JSON.parse(jsonString);
    if (!parsed.id || !parsed.title || !parsed.chapters || !parsed.scenes) {
      throw new Error('Invalid Liime Words project file format (.liw).');
    }
    // ensure unique ID or keep existing
    this.saveProject(parsed);
    return parsed;
  },

  // Export manuscript to Markdown or Plain Text
  exportManuscript(project: Project, format: 'txt' | 'markdown'): void {
    let output = '';
    output += `${project.title.toUpperCase()}\n`;
    output += `By ${project.author}\n\n`;
    output += `Genre: ${project.genre || 'General Fiction'}\n`;
    output += `Total Word Count: ${calculateProjectWordCount(project)} words\n`;
    output += `${'='.repeat(40)}\n\n`;

    project.chapters.forEach(chap => {
      output += format === 'markdown' ? `## ${chap.title}\n\n` : `${chap.title}\n\n`;
      const chapScenes = project.scenes.filter(s => s.chapterId === chap.id).sort((a, b) => a.order - b.order);
      chapScenes.forEach(scene => {
        if (format === 'markdown') {
          output += `### ${scene.title}\n\n`;
          output += `${scene.content}\n\n* * *\n\n`;
        } else {
          output += `--- ${scene.title} ---\n\n`;
          output += `${scene.content}\n\n\n`;
        }
      });
    });

    const mime = format === 'markdown' ? 'text/markdown' : 'text/plain';
    const ext = format === 'markdown' ? 'md' : 'txt';
    const blob = new Blob([output], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_manuscript.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  // Export Screenplay as Fountain format
  exportScreenplay(project: Project, scenes: ScreenplayScene[] = []): void {
    const list = scenes || [];
    let fountain = `Title: ${project.title || 'Untitled Screenplay'}\nCredit: Written by\nAuthor: ${project.author || 'Anonymous'}\nDraft date: ${new Date().toLocaleDateString()}\n\n`;

    list.forEach(sc => {
      (sc.elements || []).forEach(el => {
        const content = el.content || '';
        switch (el.type) {
          case 'scene_heading':
            fountain += `\n${content.toUpperCase()}\n\n`;
            break;
          case 'action':
            fountain += `${content}\n\n`;
            break;
          case 'character':
            fountain += `\n${content.toUpperCase()}\n`;
            break;
          case 'parenthetical':
            fountain += `(${content.replace(/^\(|\)$/g, '')})\n`;
            break;
          case 'dialogue':
            fountain += `${content}\n\n`;
            break;
          case 'transition':
            fountain += `\n> ${content.toUpperCase()}:\n\n`;
            break;
          case 'shot':
            fountain += `\n${content.toUpperCase()}\n\n`;
            break;
          default:
            fountain += `${content}\n\n`;
        }
      });
    });

    const blob = new Blob([fountain], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_screenplay.fountain`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

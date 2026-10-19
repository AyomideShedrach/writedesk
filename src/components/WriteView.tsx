import React, { useState, useRef, useEffect } from 'react';
import { 
  Project, 
  Scene, 
  Chapter, 
  DetectedEntity, 
  Character, 
  Location, 
  StoryEvent, 
  StoryObject 
} from '../types/story';
import { EditorToolbar } from './EditorToolbar';
import { 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Sparkles, 
  UserPlus, 
  MapPin, 
  Flag, 
  Clock, 
  Box, 
  Check, 
  X, 
  Edit3, 
  Search, 
  ArrowUp, 
  ArrowDown, 
  PanelLeftClose, 
  PanelLeft, 
  PanelRightClose, 
  PanelRight, 
  StickyNote,
  HeartHandshake,
  Layers,
  Wand2,
  Trash2,
  AlertCircle,
  Zap,
  Globe,
  BookOpen,
  Users
} from 'lucide-react';
import { StoryEngine } from '../services/storyEngine';

interface WriteViewProps {
  project: Project;
  onUpdateProject: (updater: Project | ((prev: Project) => Project)) => void;
  activeSceneId: string;
  setActiveSceneId: (id: string) => void;
  onAddBibleEntity?: (type: 'character' | 'location' | 'event' | 'object', item: any) => void;
}

export const WriteView: React.FC<WriteViewProps> = ({
  project,
  onUpdateProject,
  activeSceneId,
  setActiveSceneId,
  onAddBibleEntity,
}) => {
  const activeScene = project.scenes.find(s => s.id === activeSceneId) || project.scenes[0];
  const activeChapter = project.chapters.find(c => c.id === activeScene?.chapterId) || project.chapters[0];

  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [activeBottomTab, setActiveBottomTab] = useState<'scene_notes' | 'chapter_notes' | 'meta' | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [editingDetectedItem, setEditingDetectedItem] = useState<DetectedEntity | null>(null);
  const [autoExtractStatus, setAutoExtractStatus] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const autoExtractTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep fresh ref to project to avoid stale closures in debounced/async extractions
  const projectRef = useRef(project);
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  // Right sidebar view mode and feedback toast
  const [rightSidebarTab, setRightSidebarTab] = useState<'detected' | 'bible'>('detected');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quickAddType, setQuickAddType] = useState<'character' | 'location' | null>(null);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddDetail, setQuickAddDetail] = useState('');
  const [sidebarBibleSearch, setSidebarBibleSearch] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleSceneCharacter = (charId: string) => {
    if (!activeScene) return;
    onUpdateProject((prev: Project) => ({
      ...prev,
      scenes: prev.scenes.map(s => {
        if (s.id === activeScene.id) {
          const current = s.characterIds || [];
          const exists = current.includes(charId);
          const next = exists ? current.filter(id => id !== charId) : [...current, charId];
          return { ...s, characterIds: next };
        }
        return s;
      }),
    }));
  };

  const handleSetSceneLocation = (locId: string) => {
    if (!activeScene) return;
    onUpdateProject((prev: Project) => ({
      ...prev,
      scenes: prev.scenes.map(s => {
        if (s.id === activeScene.id) {
          return { ...s, locationId: s.locationId === locId ? undefined : locId };
        }
        return s;
      }),
    }));
  };

  const handleQuickAddEntity = () => {
    if (!quickAddName.trim() || !quickAddType) return;
    const name = quickAddName.trim();
    if (quickAddType === 'character') {
      const newChar: Character = {
        id: `char-${Date.now()}`,
        name,
        role: (quickAddDetail as any) || 'supporting',
        appearance: '',
        firstAppearanceSceneId: activeScene?.id,
        notes: `Created from writing desk in "${activeScene?.title || 'Manuscript'}"`,
        color: '#3b82f6',
      };
      onUpdateProject((prev: Project) => {
        const curBible = prev.storyBible || { characters: [], locations: [], events: [], objects: [], relationships: [] };
        const updatedChars = [...(curBible.characters || []), newChar];
        const updatedScenes = prev.scenes.map(s =>
          s.id === activeScene?.id
            ? { ...s, characterIds: Array.from(new Set([...(s.characterIds || []), newChar.id])) }
            : s
        );
        return {
          ...prev,
          storyBible: {
            ...curBible,
            characters: updatedChars,
          },
          scenes: updatedScenes,
        };
      });
      showToast(`✓ Character "${name}" added to Story Bible!`);
    } else if (quickAddType === 'location') {
      const newLoc: Location = {
        id: `loc-${Date.now()}`,
        name,
        description: quickAddDetail || 'Location created from writing desk',
        firstAppearanceSceneId: activeScene?.id,
      };
      onUpdateProject((prev: Project) => {
        const curBible = prev.storyBible || { characters: [], locations: [], events: [], objects: [], relationships: [] };
        const updatedLocs = [...(curBible.locations || []), newLoc];
        const updatedScenes = prev.scenes.map(s =>
          s.id === activeScene?.id ? { ...s, locationId: newLoc.id } : s
        );
        return {
          ...prev,
          storyBible: {
            ...curBible,
            locations: updatedLocs,
          },
          scenes: updatedScenes,
        };
      });
      showToast(`✓ Location "${name}" added to Story Bible!`);
    }
    setQuickAddName('');
    setQuickAddDetail('');
    setQuickAddType(null);
  };

  // Undo/Redo stack for scene text
  const [history, setHistory] = useState<string[]>([activeScene?.content || '']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Automated background story analysis running after writing
  const runAutoAnalysis = async (contentToAnalyze?: string, sceneIdToAnalyze?: string) => {
    const scId = sceneIdToAnalyze || activeSceneId;
    const currentSc = project.scenes.find(s => s.id === scId);
    if (!currentSc) return;
    const text = contentToAnalyze !== undefined ? contentToAnalyze : currentSc.content;
    if (!text || text.trim().length < 20) return;

    setAutoExtractStatus('analyzing');

    try {
      // 1. Run offline heuristic story engine
      const updatedSc: Scene = { ...currentSc, content: text };
      const localDetected = StoryEngine.extractEntitiesFromScene(updatedSc, project);

      // 2. Automatically sync mentioned Bible characters into scene cast
      const autoCastIds = StoryEngine.syncSceneCharacters(updatedSc, project);

      // Merge detected items without losing user's added/ignored statuses
      const existingItems = currentSc.detectedItems || [];
      const existingNames = new Set(existingItems.map(i => i.name.toLowerCase()));
      const newlyFound = localDetected.filter(d => !existingNames.has(d.name.toLowerCase()));
      const mergedDetected = [...existingItems, ...newlyFound];

      // 3. Run continuity audit and update project state safely without overwriting concurrent Bible additions
      onUpdateProject(prev => {
        const scenesWithAnalysis = prev.scenes.map(s => {
          if (s.id === scId) {
            const statusMap = new Map((s.detectedItems || []).map(d => [d.name.toLowerCase(), d.status]));
            const existingNames = new Set((s.detectedItems || []).map(i => i.name.toLowerCase()));
            const newlyFoundClean = localDetected.filter(d => !existingNames.has(d.name.toLowerCase()));
            const merged = [
              ...(s.detectedItems || []).map(d => ({ ...d, status: statusMap.get(d.name.toLowerCase()) || d.status })),
              ...newlyFoundClean,
            ];

            return {
              ...s,
              content: text,
              detectedItems: merged,
              characterIds: Array.from(new Set([...(s.characterIds || []), ...autoCastIds])),
              updatedAt: new Date().toISOString(),
            };
          }
          return s;
        });

        const nextProj: Project = {
          ...prev,
          scenes: scenesWithAnalysis,
        };

        const auditedContinuity = StoryEngine.auditContinuity(nextProj);
        return {
          ...nextProj,
          continuityIssues: auditedContinuity,
        };
      });

      setAutoExtractStatus('done');
      setTimeout(() => setAutoExtractStatus('idle'), 3000);

      // 4. Enrich with server-side AI if available in the background
      try {
        const res = await fetch('/api/ai/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, sceneTitle: currentSc.title }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && (data.characters || data.locations || data.events || data.objects)) {
            const aiItems: DetectedEntity[] = [];
            const currentNames = new Set(mergedDetected.map(i => i.name.toLowerCase()));

            if (Array.isArray(data.characters)) {
              data.characters.forEach((c: any) => {
                if (c.name && !currentNames.has(c.name.toLowerCase())) {
                  currentNames.add(c.name.toLowerCase());
                  aiItems.push({
                    id: `det-ai-char-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    type: 'character',
                    name: c.name,
                    context: c.context || c.role || 'Character detected by AI',
                    sceneId: scId,
                    status: 'pending',
                    details: { role: c.role || 'Character' },
                  });
                }
              });
            }
            if (Array.isArray(data.locations)) {
              data.locations.forEach((l: any) => {
                if (l.name && !currentNames.has(l.name.toLowerCase())) {
                  currentNames.add(l.name.toLowerCase());
                  aiItems.push({
                    id: `det-ai-loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    type: 'location',
                    name: l.name,
                    context: l.description || 'Setting detected by AI',
                    sceneId: scId,
                    status: 'pending',
                    details: { description: l.description },
                  });
                }
              });
            }
            if (Array.isArray(data.events)) {
              data.events.forEach((e: any) => {
                if (e.name && !currentNames.has(e.name.toLowerCase())) {
                  currentNames.add(e.name.toLowerCase());
                  aiItems.push({
                    id: `det-ai-evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    type: 'event',
                    name: e.name,
                    context: e.consequences || 'Key story event beat',
                    sceneId: scId,
                    status: 'pending',
                    details: { consequences: e.consequences },
                  });
                }
              });
            }
            if (Array.isArray(data.objects)) {
              data.objects.forEach((o: any) => {
                if (o.name && !currentNames.has(o.name.toLowerCase())) {
                  currentNames.add(o.name.toLowerCase());
                  aiItems.push({
                    id: `det-ai-obj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    type: 'object',
                    name: o.name,
                    context: o.significance || 'Story object detected by AI',
                    sceneId: scId,
                    status: 'pending',
                    details: { significance: o.significance },
                  });
                }
              });
            }

            if (aiItems.length > 0) {
              onUpdateProject(prev => {
                const enrichedScenes = prev.scenes.map(s => {
                  if (s.id === scId) {
                    const existingNames = new Set((s.detectedItems || []).map(d => d.name.toLowerCase()));
                    const cleanAiItems = aiItems.filter(item => !existingNames.has(item.name.toLowerCase()));
                    return { ...s, detectedItems: [...(s.detectedItems || []), ...cleanAiItems] };
                  }
                  return s;
                });
                return { ...prev, scenes: enrichedScenes };
              });
            }
          }
        }
      } catch (err) {
        // Backend not configured or offline; local extraction already succeeded!
      }
    } catch (e) {
      console.error('Auto analysis error:', e);
      setAutoExtractStatus('idle');
    }
  };

  // Reset history and cleanup timer when switching scene
  useEffect(() => {
    if (activeScene) {
      setHistory([activeScene.content]);
      setHistoryIndex(0);
    }
    return () => {
      if (autoExtractTimeoutRef.current) {
        clearTimeout(autoExtractTimeoutRef.current);
      }
    };
  }, [activeSceneId]);

  // Handle scene content changes
  const handleContentChange = (newContent: string) => {
    if (!activeScene) return;

    // Count words
    const words = newContent.trim().split(/\s+/).filter(Boolean).length;

    // Update scene with functional updater to avoid wiping out concurrent Story Bible additions
    onUpdateProject((prev: Project) => ({
      ...prev,
      scenes: prev.scenes.map(s => {
        if (s.id === activeScene.id) {
          return {
            ...s,
            content: newContent,
            wordCount: words,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      }),
    }));

    // Update undo history (debounce slightly in real typing, simple push here)
    if (newContent !== history[historyIndex]) {
      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(newContent);
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
    }

    // Trigger automated analysis after writing (1200ms debounce after user pauses typing)
    if (project.settings.autoExtract !== false) {
      if (autoExtractTimeoutRef.current) {
        clearTimeout(autoExtractTimeoutRef.current);
      }
      setAutoExtractStatus('analyzing');
      autoExtractTimeoutRef.current = setTimeout(() => {
        runAutoAnalysis(newContent, activeScene.id);
      }, 1200);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      handleContentChange(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      handleContentChange(next);
    }
  };

  // Text formatting insertion (markdown-style tags)
  const handleFormat = (command: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = activeScene.content.substring(start, end);
    let replacement = selected;

    switch (command) {
      case 'bold':
        replacement = `**${selected || 'bold text'}**`;
        break;
      case 'italic':
        replacement = `*${selected || 'italic text'}*`;
        break;
      case 'heading-1':
        replacement = `\n# ${selected || 'Chapter Heading'}\n`;
        break;
      case 'heading-2':
        replacement = `\n## ${selected || 'Subheading'}\n`;
        break;
      case 'quote':
        replacement = `\n> "${selected || 'Spoken quote or thought...'}"\n`;
        break;
      case 'bullet-list':
        replacement = `\n- ${selected || 'List item'}\n`;
        break;
      case 'ordered-list':
        replacement = `\n1. ${selected || 'First item'}\n`;
        break;
      default:
        break;
    }

    const updated = activeScene.content.substring(0, start) + replacement + activeScene.content.substring(end);
    handleContentChange(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 10);
  };

  // Find & Replace
  const handleReplaceOne = () => {
    if (!findText) return;
    const index = activeScene.content.indexOf(findText);
    if (index !== -1) {
      const updated = activeScene.content.substring(0, index) + replaceText + activeScene.content.substring(index + findText.length);
      handleContentChange(updated);
    }
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const updated = activeScene.content.replace(regex, replaceText);
    handleContentChange(updated);
  };

  // Scene reordering
  const handleMoveScene = (sceneId: string, direction: 'up' | 'down') => {
    onUpdateProject((prev: Project) => {
      const currentSceneIndex = prev.scenes.findIndex(s => s.id === sceneId);
      if (currentSceneIndex === -1) return prev;

      const targetIndex = direction === 'up' ? currentSceneIndex - 1 : currentSceneIndex + 1;
      if (targetIndex < 0 || targetIndex >= prev.scenes.length) return prev;

      const reordered = [...prev.scenes];
      const [moved] = reordered.splice(currentSceneIndex, 1);
      reordered.splice(targetIndex, 0, moved);

      const updated = reordered.map((s, idx) => ({ ...s, order: idx + 1 }));
      return { ...prev, scenes: updated };
    });
  };

  // Add Chapter
  const handleAddChapter = () => {
    const newChapId = `chap-${Date.now()}`;
    const newSceneId = `scene-${Date.now()}`;

    onUpdateProject((prev: Project) => {
      const chapNum = prev.chapters.length + 1;
      const newChapter: Chapter = {
        id: newChapId,
        number: chapNum,
        title: `Chapter ${chapNum < 10 ? '0' + chapNum : chapNum}: New Chapter`,
        sceneIds: [newSceneId],
      };

      const newScene: Scene = {
        id: newSceneId,
        chapterId: newChapId,
        order: prev.scenes.length + 1,
        storyOrder: prev.scenes.length + 1,
        title: 'Scene 01 — Opening',
        status: 'draft',
        wordCount: 0,
        content: '',
        characterIds: [],
        eventIds: [],
        detectedItems: [],
        updatedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        chapters: [...prev.chapters, newChapter],
        scenes: [...prev.scenes, newScene],
      };
    });
    setActiveSceneId(newSceneId);
  };

  // Add Scene to Chapter
  const handleAddSceneToChapter = (chapterId: string) => {
    const newSceneId = `scene-${Date.now()}`;

    onUpdateProject((prev: Project) => {
      const chap = prev.chapters.find(c => c.id === chapterId);
      if (!chap) return prev;

      const sceneCountInChap = prev.scenes.filter(s => s.chapterId === chapterId).length + 1;

      const newScene: Scene = {
        id: newSceneId,
        chapterId,
        order: prev.scenes.length + 1,
        storyOrder: prev.scenes.length + 1,
        title: `Scene ${sceneCountInChap < 10 ? '0' + sceneCountInChap : sceneCountInChap} — New Scene`,
        status: 'draft',
        wordCount: 0,
        content: '',
        characterIds: [],
        eventIds: [],
        detectedItems: [],
        updatedAt: new Date().toISOString(),
      };

      const updatedChapters = prev.chapters.map(c => {
        if (c.id === chapterId) {
          return { ...c, sceneIds: [...c.sceneIds, newSceneId] };
        }
        return c;
      });

      return {
        ...prev,
        chapters: updatedChapters,
        scenes: [...prev.scenes, newScene],
      };
    });
    setActiveSceneId(newSceneId);
  };

  // Delete Scene
  const handleDeleteScene = (sceneId: string) => {
    if (project.scenes.length <= 1) return; // Keep at least one scene
    onUpdateProject((prev: Project) => {
      const filteredScenes = prev.scenes.filter(s => s.id !== sceneId);
      const updatedChapters = prev.chapters.map(c => ({
        ...c,
        sceneIds: c.sceneIds.filter(id => id !== sceneId),
      }));

      return {
        ...prev,
        scenes: filteredScenes,
        chapters: updatedChapters,
      };
    });

    if (activeSceneId === sceneId) {
      const remaining = project.scenes.filter(s => s.id !== sceneId);
      if (remaining[0]) setActiveSceneId(remaining[0].id);
    }
  };

  // Automatic Story Extraction (Trigger)
  const handleRunExtraction = async () => {
    if (!activeScene) return;

    setIsExtracting(true);

    try {
      // 1. Try server-side Gemini if available
      let aiWorked = false;
      try {
        const res = await fetch('/api/ai/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: activeScene.content,
            sceneTitle: activeScene.title,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const detectedFromAI: DetectedEntity[] = [];

          if (data.characters) {
            data.characters.forEach((c: any) => {
              detectedFromAI.push({
                id: `det-ai-char-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                type: 'character',
                name: c.name,
                context: c.context || c.role || 'Character detected by AI',
                sceneId: activeScene.id,
                status: 'pending',
                details: { role: c.role || 'Character' },
              });
            });
          }

          if (data.locations) {
            data.locations.forEach((l: any) => {
              detectedFromAI.push({
                id: `det-ai-loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                type: 'location',
                name: l.name,
                context: l.description || 'Location detected by AI',
                sceneId: activeScene.id,
                status: 'pending',
                details: { description: l.description },
              });
            });
          }

          if (data.events) {
            data.events.forEach((e: any) => {
              detectedFromAI.push({
                id: `det-ai-evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                type: 'event',
                name: e.name,
                context: e.consequences || 'Event beat detected by AI',
                sceneId: activeScene.id,
                status: 'pending',
                details: { consequences: e.consequences },
              });
            });
          }

          if (data.objects) {
            data.objects.forEach((o: any) => {
              detectedFromAI.push({
                id: `det-ai-obj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                type: 'object',
                name: o.name,
                context: o.significance || 'Object detected by AI',
                sceneId: activeScene.id,
                status: 'pending',
                details: { significance: o.significance },
              });
            });
          }

          if (detectedFromAI.length > 0) {
            aiWorked = true;
            // Merge with existing scene detected items
            onUpdateProject((prev: Project) => ({
              ...prev,
              scenes: prev.scenes.map(s => {
                if (s.id === activeScene.id) {
                  return { ...s, detectedItems: detectedFromAI };
                }
                return s;
              }),
            }));
          }
        }
      } catch (e) {
        // AI call failed or offline; fall through to local heuristic
      }

      // 2. If AI wasn't available or returned empty, run robust local heuristic engine!
      if (!aiWorked) {
        const localDetected = StoryEngine.extractEntitiesFromScene(activeScene, project);
        onUpdateProject((prev: Project) => ({
          ...prev,
          scenes: prev.scenes.map(s => {
            if (s.id === activeScene.id) {
              return { ...s, detectedItems: localDetected };
            }
            return s;
          }),
        }));
      }
    } finally {
      setIsExtracting(false);
    }
  };

  // Accept detected item -> add to Story Bible
  const handleConfirmDetectedItem = (item: DetectedEntity) => {
    if (!activeScene) return;

    onUpdateProject(prev => {
      const bible = prev.storyBible || {
        characters: [],
        locations: [],
        events: [],
        objects: [],
        relationships: [],
      };

      const updatedBible = {
        ...bible,
        characters: [...(bible.characters || [])],
        locations: [...(bible.locations || [])],
        events: [...(bible.events || [])],
        objects: [...(bible.objects || [])],
        relationships: [...(bible.relationships || [])],
      };

      let newCharId: string | undefined;
      let newLocId: string | undefined;

      if (item.type === 'character') {
        const existing = updatedBible.characters.find(c => c.name.toLowerCase() === item.name.toLowerCase());
        if (existing) {
          newCharId = existing.id;
        } else {
          newCharId = `char-${Date.now()}`;
          const newChar: Character = {
            id: newCharId,
            name: item.name,
            role: 'supporting',
            appearance: item.details?.role || '',
            firstAppearanceSceneId: activeScene.id,
            notes: `Extracted from "${activeScene.title}": ${item.context}`,
            color: '#3b82f6',
          };
          updatedBible.characters.push(newChar);
        }
      } else if (item.type === 'location') {
        const existing = updatedBible.locations.find(l => l.name.toLowerCase() === item.name.toLowerCase());
        if (existing) {
          newLocId = existing.id;
        } else {
          newLocId = `loc-${Date.now()}`;
          const newLoc: Location = {
            id: newLocId,
            name: item.name,
            description: item.details?.description || item.context,
            firstAppearanceSceneId: activeScene.id,
          };
          updatedBible.locations.push(newLoc);
        }
      } else if (item.type === 'event') {
        const newEvt: StoryEvent = {
          id: `evt-${Date.now()}`,
          name: item.name,
          description: item.context,
          chronologicalOrder: (updatedBible.events?.length || 0) + 1,
          manuscriptChapterId: activeChapter?.id,
          manuscriptSceneId: activeScene.id,
          charactersInvolved: activeScene.characterIds || [],
          consequences: item.details?.consequences || '',
        };
        updatedBible.events.push(newEvt);
      } else if (item.type === 'object') {
        const newObj: StoryObject = {
          id: `obj-${Date.now()}`,
          name: item.name,
          description: item.context,
          significance: item.details?.significance || '',
        };
        updatedBible.objects.push(newObj);
      }

      // Mark as added in scene and auto-link character or location
      const updatedScenes = prev.scenes.map(s => {
        if (s.id === activeScene.id) {
          const charIds = [...(s.characterIds || [])];
          if (newCharId && !charIds.includes(newCharId)) {
            charIds.push(newCharId);
          }
          return {
            ...s,
            characterIds: charIds,
            locationId: newLocId || s.locationId,
            detectedItems: (s.detectedItems || []).map(d => (d.id === item.id ? { ...d, status: 'added' as const } : d)),
          };
        }
        return s;
      });

      return {
        ...prev,
        storyBible: updatedBible,
        scenes: updatedScenes,
      };
    });

    showToast(`✓ Added "${item.name}" to Story Bible!`);
  };

  // Accept all pending detected items into Story Bible with one click
  const handleConfirmAllDetectedItems = () => {
    if (!activeScene || !activeScene.detectedItems) return;
    const pendingItems = activeScene.detectedItems.filter(i => i.status === 'pending');
    if (pendingItems.length === 0) return;

    onUpdateProject(prev => {
      const bible = prev.storyBible || {
        characters: [],
        locations: [],
        events: [],
        objects: [],
        relationships: [],
      };

      const updatedBible = {
        ...bible,
        characters: [...(bible.characters || [])],
        locations: [...(bible.locations || [])],
        events: [...(bible.events || [])],
        objects: [...(bible.objects || [])],
        relationships: [...(bible.relationships || [])],
      };

      const newlyAddedCharIds: string[] = [];

      pendingItems.forEach((item, idx) => {
        const uniqueSuffix = `${Date.now()}-${idx}`;
        if (item.type === 'character') {
          const existing = updatedBible.characters.find(c => c.name.toLowerCase() === item.name.toLowerCase());
          if (existing) {
            newlyAddedCharIds.push(existing.id);
          } else {
            const newCharId = `char-${uniqueSuffix}`;
            const newChar: Character = {
              id: newCharId,
              name: item.name,
              role: 'supporting',
              appearance: item.details?.role || '',
              firstAppearanceSceneId: activeScene.id,
              notes: `Auto-extracted from "${activeScene.title}": ${item.context}`,
              color: '#3b82f6',
            };
            updatedBible.characters.push(newChar);
            newlyAddedCharIds.push(newCharId);
          }
        } else if (item.type === 'location') {
          const existing = updatedBible.locations.find(l => l.name.toLowerCase() === item.name.toLowerCase());
          if (!existing) {
            const newLoc: Location = {
              id: `loc-${uniqueSuffix}`,
              name: item.name,
              description: item.details?.description || item.context,
              firstAppearanceSceneId: activeScene.id,
            };
            updatedBible.locations.push(newLoc);
          }
        } else if (item.type === 'event') {
          const newEvt: StoryEvent = {
            id: `evt-${uniqueSuffix}`,
            name: item.name,
            description: item.context,
            chronologicalOrder: (updatedBible.events?.length || 0) + 1,
            manuscriptChapterId: activeChapter?.id,
            manuscriptSceneId: activeScene.id,
            charactersInvolved: activeScene.characterIds || [],
            consequences: item.details?.consequences || '',
          };
          updatedBible.events.push(newEvt);
        } else if (item.type === 'object') {
          const newObj: StoryObject = {
            id: `obj-${uniqueSuffix}`,
            name: item.name,
            description: item.context,
            significance: item.details?.significance || '',
          };
          updatedBible.objects.push(newObj);
        }
      });

      const updatedScenes = prev.scenes.map(s => {
        if (s.id === activeScene.id) {
          const combinedChars = Array.from(new Set([...(s.characterIds || []), ...newlyAddedCharIds]));
          return {
            ...s,
            characterIds: combinedChars,
            detectedItems: (s.detectedItems || []).map(d => ({ ...d, status: 'added' as const })),
          };
        }
        return s;
      });

      return {
        ...prev,
        storyBible: updatedBible,
        scenes: updatedScenes,
      };
    });

    showToast(`✓ Added ${pendingItems.length} entities to Story Bible!`);
  };

  // Ignore detected item
  const handleIgnoreDetectedItem = (itemId: string) => {
    if (!activeScene) return;
    onUpdateProject((prev: Project) => ({
      ...prev,
      scenes: prev.scenes.map(s => {
        if (s.id === activeScene.id) {
          return {
            ...s,
            detectedItems: (s.detectedItems || []).filter(d => d.id !== itemId),
          };
        }
        return s;
      }),
    }));
  };

  // Save edited detected item
  const handleSaveEditedDetected = () => {
    if (!editingDetectedItem || !activeScene) return;
    onUpdateProject((prev: Project) => ({
      ...prev,
      scenes: prev.scenes.map(s => {
        if (s.id === activeScene.id) {
          return {
            ...s,
            detectedItems: (s.detectedItems || []).map(d => (d.id === editingDetectedItem.id ? editingDetectedItem : d)),
          };
        }
        return s;
      }),
    }));
    setEditingDetectedItem(null);
  };

  // Filtered chapters for left sidebar
  const filteredChapters = project.chapters.filter(chap => {
    if (!sidebarSearch) return true;
    const q = sidebarSearch.toLowerCase();
    const chapMatches = chap.title.toLowerCase().includes(q);
    const sceneMatches = project.scenes
      .filter(s => s.chapterId === chap.id)
      .some(s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q));
    return chapMatches || sceneMatches;
  });

  return (
    <div className="flex-1 flex overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 relative">
      {/* LEFT SIDEBAR: Chapters & Scenes Navigation */}
      {leftSidebarOpen ? (
        <aside className={`w-72 border-r flex flex-col shrink-0 select-none z-10 transition-all ${
          project.settings.theme === 'grey'
            ? 'border-slate-300 bg-[#f1f5f9] text-slate-800'
            : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900'
        }`}>
          {/* Project Title & Collapse */}
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Manuscript Tree
              </h2>
              <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                {project.title}
              </div>
            </div>
            <button
              onClick={() => setLeftSidebarOpen(false)}
              title="Collapse sidebar"
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Search */}
          <div className="px-3 pt-2.5 pb-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
                placeholder="Filter scenes & chapters..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-neutral-200/50 dark:bg-neutral-800/60 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-[#185abd]"
              />
            </div>
          </div>

          {/* Chapters & Scenes List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredChapters.map(chap => {
              const chapScenes = project.scenes
                .filter(s => s.chapterId === chap.id)
                .sort((a, b) => a.order - b.order);
              const isCollapsed = collapsedChapters[chap.id];

              return (
                <div key={chap.id} className="rounded-lg border border-neutral-200/80 dark:border-neutral-800/80 overflow-hidden bg-white/70 dark:bg-neutral-900/50">
                  {/* Chapter Header */}
                  <div className="flex items-center justify-between p-2 bg-neutral-100/80 dark:bg-neutral-800/40 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/70 transition-colors">
                    <button
                      onClick={() => setCollapsedChapters({ ...collapsedChapters, [chap.id]: !isCollapsed })}
                      className="flex items-center gap-1.5 text-left text-xs font-semibold text-neutral-800 dark:text-neutral-200 min-w-0 flex-1"
                    >
                      {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
                      <span className="truncate">{chap.title}</span>
                    </button>
                    <button
                      onClick={() => handleAddSceneToChapter(chap.id)}
                      title="Add scene to this chapter"
                      className="p-1 text-neutral-400 hover:text-[#185abd] dark:hover:text-blue-400 rounded"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Scenes inside Chapter */}
                  {!isCollapsed && (
                    <div className="p-1 space-y-0.5">
                      {chapScenes.map(scene => {
                        const isSelected = scene.id === activeSceneId;
                        return (
                          <div
                            key={scene.id}
                            className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#eef5fc] dark:bg-blue-950/40 text-[#185abd] dark:text-blue-300 font-semibold border-l-3 border-[#185abd]'
                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/50'
                            }`}
                            onClick={() => setActiveSceneId(scene.id)}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#185abd] dark:text-blue-400' : 'text-neutral-400'}`} />
                              <span className="truncate">{scene.title}</span>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleMoveScene(scene.id, 'up');
                                }}
                                title="Move up"
                                className="p-0.5 hover:text-neutral-900 dark:hover:text-neutral-100"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleMoveScene(scene.id, 'down');
                                }}
                                title="Move down"
                                className="p-0.5 hover:text-neutral-900 dark:hover:text-neutral-100"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDeleteScene(scene.id);
                                }}
                                title="Delete scene"
                                className="p-0.5 text-red-400 hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="text-[10px] font-mono text-neutral-400 ml-2 shrink-0 group-hover:hidden">
                              {scene.wordCount}w
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Chapter Button */}
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
            <button
              onClick={handleAddChapter}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-200/60 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Chapter</span>
            </button>
          </div>
        </aside>
      ) : (
        <button
          onClick={() => setLeftSidebarOpen(true)}
          title="Open manuscript sidebar"
          className="absolute left-2 top-14 z-10 p-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      )}

      {/* CENTER: Main Rich Writing Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-900 overflow-hidden relative">
        {/* Editor Top Toolbar */}
        <EditorToolbar
          onFormat={handleFormat}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          showFindReplace={showFindReplace}
          setShowFindReplace={setShowFindReplace}
          settings={project.settings}
          onUpdateSettings={s => onUpdateProject((prev: Project) => ({ ...prev, settings: { ...prev.settings, ...s } }))}
          sceneStatus={activeScene?.status || 'draft'}
          onChangeStatus={status => {
            if (!activeScene) return;
            onUpdateProject((prev: Project) => ({
              ...prev,
              scenes: prev.scenes.map(s => (s.id === activeScene.id ? { ...s, status } : s)),
            }));
          }}
          wordCount={activeScene?.wordCount || 0}
          autoExtractStatus={autoExtractStatus}
          detectedCount={activeScene?.detectedItems?.length || 0}
        />

        {/* Find & Replace Bar */}
        {showFindReplace && (
          <div className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex flex-wrap items-center gap-2 text-xs">
            <input
              type="text"
              placeholder="Find in scene..."
              value={findText}
              onChange={e => setFindText(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100"
            />
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceText}
              onChange={e => setReplaceText(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100"
            />
            <button
              onClick={handleReplaceOne}
              className="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded"
            >
              Replace
            </button>
            <button
              onClick={handleReplaceAll}
              className="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded"
            >
              Replace All
            </button>
            <button
              onClick={() => setShowFindReplace(false)}
              className="p-1 text-neutral-400 hover:text-neutral-600 ml-auto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Writing Paper Canvas (Microsoft Word Document Canvas) */}
        <div className={`flex-1 overflow-y-auto flex justify-center p-4 md:p-8 select-text ${
          project.settings.theme === 'grey'
            ? 'bg-[#cbd5e1]'
            : project.settings.theme === 'sepia'
            ? 'bg-[#eaddc5]'
            : 'bg-[#edf2f7] dark:bg-[#202530]'
        }`}>
          <div className={`w-full max-w-[840px] rounded-xs px-10 md:px-16 py-12 md:py-14 min-h-[960px] flex flex-col my-2 transition-shadow ${
            project.settings.theme === 'grey'
              ? 'bg-white text-slate-900 border border-slate-300 shadow-[0_12px_40px_rgba(15,23,42,0.14)]'
              : project.settings.theme === 'sepia'
              ? 'bg-[#fcf8ed] text-[#3d2e1e] border border-[#e2d5be] shadow-word-page'
              : 'bg-white text-black border border-neutral-300 shadow-word-page'
          }`}>
            {/* Word Page Header / Margin Guide */}
            <div className="flex items-center justify-between text-[11px] font-sans text-neutral-400 mb-6 pb-2 border-b border-neutral-200 select-none">
              <span className="tracking-wide uppercase font-semibold text-neutral-500">
                {project.title} — Manuscript
              </span>
              <span>Page 1</span>
            </div>

            {/* Chapter & Scene Title Header */}
            <div className="mb-4 pb-3 border-b border-neutral-200">
              <input
                type="text"
                value={activeChapter?.title || ''}
                onChange={e => {
                  const val = e.target.value;
                  onUpdateProject((prev: Project) => ({
                    ...prev,
                    chapters: prev.chapters.map(c =>
                      c.id === activeChapter?.id ? { ...c, title: val } : c
                    ),
                  }));
                }}
                placeholder="Chapter Title..."
                className="w-full text-xs font-semibold tracking-wider uppercase text-neutral-600 bg-transparent focus:outline-none mb-1.5 placeholder-neutral-400"
              />
              <input
                type="text"
                value={activeScene?.title || ''}
                onChange={e => {
                  const val = e.target.value;
                  onUpdateProject((prev: Project) => ({
                    ...prev,
                    scenes: prev.scenes.map(s =>
                      s.id === activeScene?.id ? { ...s, title: val } : s
                    ),
                  }));
                }}
                placeholder="Scene Title..."
                className="w-full text-2xl font-bold tracking-tight text-black bg-transparent focus:outline-none placeholder-neutral-400"
              />
            </div>

            {/* Active Scene Context Bar: Setting & Cast */}
            <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 px-3 mb-4 rounded-md bg-neutral-100/90 border border-neutral-200 text-xs select-none">
              <div className="flex flex-wrap items-center gap-2">
                {/* Location indicator */}
                <button
                  onClick={() => {
                    setRightSidebarOpen(true);
                    setRightSidebarTab('bible');
                  }}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white border border-neutral-300 hover:border-[#185abd] text-neutral-800 text-[11px] font-medium transition-colors cursor-pointer"
                  title="Click to view/change setting in Story Bible"
                >
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>
                    {(project.storyBible?.locations || []).find(l => l.id === activeScene?.locationId)?.name || 'Setting: Unassigned'}
                  </span>
                </button>

                {/* Cast tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-neutral-500 text-[11px] flex items-center gap-1">
                    <Users className="w-3 h-3 text-neutral-400" />
                    <span>Cast:</span>
                  </span>
                  {(project.storyBible?.characters || [])
                    .filter(c => (activeScene?.characterIds || []).includes(c.id))
                    .map(char => (
                      <span
                        key={char.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-50 border border-blue-200 text-blue-900 font-medium"
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: char.color || '#3b82f6' }} />
                        <span>{char.name}</span>
                      </span>
                    ))}
                  {(project.storyBible?.characters || []).filter(c => (activeScene?.characterIds || []).includes(c.id)).length === 0 && (
                    <span className="text-neutral-400 text-[11px] italic">No characters assigned</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setRightSidebarOpen(true);
                  setRightSidebarTab('bible');
                }}
                className="flex items-center gap-1 text-[11px] text-[#185abd] hover:underline font-semibold cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Story Bible ({(project.storyBible?.characters || []).length} characters)</span>
              </button>
            </div>

            {/* Manuscript Writing Area */}
            <textarea
              ref={textareaRef}
              value={activeScene?.content || ''}
              onChange={e => handleContentChange(e.target.value)}
              placeholder="Begin writing your novel scene here... Liime Words automatically detects characters, locations, and narrative beats as you craft your prose."
              style={{
                fontSize: `${project.settings.fontSize}px`,
                lineHeight: project.settings.lineHeight === 'loose' ? '2' : project.settings.lineHeight === 'relaxed' ? '1.8' : '1.5',
              }}
              className={`flex-1 w-full bg-white resize-none focus:outline-none text-black placeholder-neutral-400 min-h-[580px] selection:bg-[#185abd]/20 selection:text-black ${
                project.settings.fontFamily === 'serif'
                  ? 'font-prose-serif'
                  : project.settings.fontFamily === 'sans'
                  ? 'font-prose-sans'
                  : 'font-screenplay'
              }`}
            />
          </div>
        </div>

        {/* Collapsible Bottom Drawer for Scene / Chapter Notes */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/90 text-xs shrink-0 select-none">
          <div className="flex items-center justify-between px-4 py-1.5 border-b border-neutral-200 dark:border-neutral-800/80">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveBottomTab(activeBottomTab === 'scene_notes' ? null : 'scene_notes')}
                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                  activeBottomTab === 'scene_notes'
                    ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <StickyNote className="w-3.5 h-3.5" />
                <span>Scene Notes</span>
              </button>
              <button
                onClick={() => setActiveBottomTab(activeBottomTab === 'chapter_notes' ? null : 'chapter_notes')}
                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                  activeBottomTab === 'chapter_notes'
                    ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Chapter Notes</span>
              </button>
              <button
                onClick={() => setActiveBottomTab(activeBottomTab === 'meta' ? null : 'meta')}
                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                  activeBottomTab === 'meta'
                    ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Emotional Beat & POV</span>
              </button>
            </div>

            <div className="text-neutral-400 text-[11px]">
              Manuscript Order: #{activeScene?.order} · Story Chronological: #{activeScene?.storyOrder}
            </div>
          </div>

          {/* Drawer Body */}
          {activeBottomTab === 'scene_notes' && (
            <div className="p-3 bg-white dark:bg-neutral-900">
              <textarea
                value={activeScene?.notes || ''}
                onChange={e => {
                  const val = e.target.value;
                  onUpdateProject((prev: Project) => ({
                    ...prev,
                    scenes: prev.scenes.map(s =>
                      s.id === activeScene.id ? { ...s, notes: val } : s
                    ),
                  }));
                }}
                placeholder="Add private creative notes, reminders, or sensory references for this specific scene..."
                className="w-full h-20 p-2 bg-neutral-100 dark:bg-neutral-800/50 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none"
              />
            </div>
          )}

          {activeBottomTab === 'chapter_notes' && (
            <div className="p-3 bg-white dark:bg-neutral-900">
              <textarea
                value={activeChapter?.notes || ''}
                onChange={e => {
                  const val = e.target.value;
                  onUpdateProject((prev: Project) => ({
                    ...prev,
                    chapters: prev.chapters.map(c =>
                      c.id === activeChapter.id ? { ...c, notes: val } : c
                    ),
                  }));
                }}
                placeholder="Add pacing goals, thematic motifs, or notes for this chapter..."
                className="w-full h-20 p-2 bg-neutral-100 dark:bg-neutral-800/50 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none"
              />
            </div>
          )}

          {activeBottomTab === 'meta' && (
            <div className="p-3 bg-white dark:bg-neutral-900 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">POV Character</label>
                <select
                  value={activeScene?.povCharacterId || ''}
                  onChange={e => {
                    const povId = e.target.value || undefined;
                    onUpdateProject((prev: Project) => ({
                      ...prev,
                      scenes: prev.scenes.map(s =>
                        s.id === activeScene.id ? { ...s, povCharacterId: povId } : s
                      ),
                    }));
                  }}
                  className="w-full p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                >
                  <option value="">Unassigned</option>
                  {(project.storyBible?.characters || []).map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">Setting / Location</label>
                <select
                  value={activeScene?.locationId || ''}
                  onChange={e => {
                    const locId = e.target.value || undefined;
                    onUpdateProject((prev: Project) => ({
                      ...prev,
                      scenes: prev.scenes.map(s =>
                        s.id === activeScene.id ? { ...s, locationId: locId } : s
                      ),
                    }));
                  }}
                  className="w-full p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                >
                  <option value="">Unassigned Location</option>
                  {(project.storyBible?.locations || []).map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">Emotional Beat / Core Conflict</label>
                <input
                  type="text"
                  value={activeScene?.emotionalBeat || ''}
                  onChange={e => {
                    const val = e.target.value;
                    onUpdateProject((prev: Project) => ({
                      ...prev,
                      scenes: prev.scenes.map(s =>
                        s.id === activeScene.id ? { ...s, emotionalBeat: val } : s
                      ),
                    }));
                  }}
                  placeholder="e.g. Hesitation turning to betrayal"
                  className="w-full p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                />
              </div>
            </div>
          )}
        </div>

        {/* Microsoft Word Signature Status Bar */}
        <div className={`h-6 text-white text-[11px] px-3 flex items-center justify-between select-none shrink-0 border-t ${
          project.settings.theme === 'grey'
            ? 'bg-[#334155] border-[#475569]'
            : 'bg-[#185abd] border-[#124896]'
        }`}>
          <div className="flex items-center gap-3">
            <span className="font-normal">Page 1 of 1</span>
            <span className="opacity-40">|</span>
            <span className="tabular-nums font-mono">{activeScene?.wordCount || 0} words</span>
            <span className="opacity-40">|</span>
            <span className="tabular-nums font-mono">~{Math.max(1, Math.ceil((activeScene?.wordCount || 0) / 225))} min read</span>
            <span className="opacity-40 hidden sm:inline">|</span>
            
            {/* Automatic Story Extraction Status Button */}
            <button
              onClick={() => setRightSidebarOpen(true)}
              title="Open Story Extraction sidebar"
              className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors text-blue-100 hover:text-white cursor-pointer"
            >
              <Sparkles className={`w-3 h-3 ${autoExtractStatus === 'analyzing' ? 'animate-spin text-lime-300' : 'text-lime-400'}`} />
              <span>
                {autoExtractStatus === 'analyzing'
                  ? 'Auto-Analyzing scene...'
                  : `${(activeScene?.detectedItems || []).length} Detected Entities`}
              </span>
            </button>

            <span className="opacity-40 hidden md:inline">|</span>

            {/* Live Continuity Status */}
            {(project.continuityIssues || []).filter(i => i.sceneIds.includes(activeScene?.id || '') && !i.dismissed).length > 0 ? (
              <span className="flex items-center gap-1 text-amber-300 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>
                  {(project.continuityIssues || []).filter(i => i.sceneIds.includes(activeScene?.id || '') && !i.dismissed).length} Continuity Issue(s)
                </span>
              </span>
            ) : (
              <span className="hidden lg:flex items-center gap-1 text-blue-100">
                <Check className="w-3 h-3 text-emerald-300" />
                <span>Continuity Clean</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[10px] text-blue-200 hidden sm:inline">
              Manuscript #{activeScene?.order || 1}
            </span>
            <span className="opacity-40 hidden sm:inline">|</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-blue-100 font-mono">100%</span>
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR: Automatic Story Extraction & Scene Context */}
      {rightSidebarOpen ? (
        <aside className={`w-80 border-l flex flex-col shrink-0 select-none z-10 transition-all ${
          project.settings.theme === 'grey'
            ? 'border-slate-300 bg-[#f8fafc] text-slate-800'
            : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900'
        }`}>
          {/* Header & Tabs */}
          <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <div className="p-3 pb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                Story Intelligence
              </span>
              <button
                onClick={() => setRightSidebarOpen(false)}
                title="Collapse sidebar"
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded cursor-pointer"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar Tab Switcher */}
            <div className="grid grid-cols-2 p-1 gap-1 mx-3 mb-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setRightSidebarTab('detected')}
                className={`py-1 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  rightSidebarTab === 'detected'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-lime-500" />
                <span>Detected ({(activeScene?.detectedItems || []).filter(i => i.status === 'pending').length})</span>
              </button>

              <button
                onClick={() => setRightSidebarTab('bible')}
                className={`py-1 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  rightSidebarTab === 'bible'
                    ? 'bg-white dark:bg-neutral-900 text-[#185abd] dark:text-blue-300 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#185abd] dark:text-blue-400" />
                <span>Story Bible ({(project.storyBible?.characters || []).length + (project.storyBible?.locations || []).length})</span>
              </button>
            </div>
          </div>

          {rightSidebarTab === 'detected' ? (
            <>
              {/* Analyze / Refresh Button & Quick Add All */}
              <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${autoExtractStatus === 'analyzing' ? 'bg-lime-400 animate-ping' : 'bg-lime-500'}`} />
                    {autoExtractStatus === 'analyzing' ? 'Auto-Analyzing...' : 'Auto-Extract Active'}
                  </span>
                  <button
                    onClick={() => runAutoAnalysis()}
                    disabled={isExtracting || autoExtractStatus === 'analyzing'}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#185abd] dark:text-blue-300 bg-[#eef5fc] dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-[#c2daf5] dark:border-blue-800 rounded transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Wand2 className={`w-3 h-3 ${isExtracting || autoExtractStatus === 'analyzing' ? 'animate-spin' : ''}`} />
                    <span>{isExtracting || autoExtractStatus === 'analyzing' ? 'Scanning...' : 'Re-Scan Scene'}</span>
                  </button>
                </div>
                
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight mb-2">
                  Automatically scans prose as you write for characters, locations, events, and objects.
                </p>

                {/* Online vs Offline Capability Strip */}
                <div className="flex items-center justify-between text-[10px] py-1.5 px-2.5 rounded-lg bg-neutral-200/70 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700/80 mb-2.5">
                  <span className="flex items-center gap-1 text-lime-700 dark:text-lime-400 font-semibold" title="Runs on-device without internet">
                    <Zap className="w-3 h-3" />
                    <span>Local Engine: 100% Offline</span>
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-600">|</span>
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400" title="Enriches subtle context when internet is available">
                    <Globe className="w-3 h-3" />
                    <span>Optional Cloud AI: Online</span>
                  </span>
                </div>

                {/* Quick Add All Button */}
                {(activeScene?.detectedItems || []).filter(i => i.status === 'pending').length > 0 && (
                  <button
                    onClick={handleConfirmAllDetectedItems}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-bold text-neutral-950 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-300 hover:to-lime-400 rounded-lg transition-all shadow-xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add All to Story Bible ({(activeScene?.detectedItems || []).filter(i => i.status === 'pending').length})</span>
                  </button>
                )}

                {/* Scene-specific continuity alerts */}
                {(project.continuityIssues || []).filter(i => i.sceneIds.includes(activeScene?.id || '') && !i.dismissed).map(issue => (
                  <div key={issue.id} className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-[11px]">
                    <div className="flex items-center gap-1 font-semibold mb-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>{issue.title}</span>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-300 text-[10px] leading-relaxed">
                      {issue.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Detected Items List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {activeScene?.detectedItems && activeScene.detectedItems.length > 0 ? (
                  activeScene.detectedItems.map(item => {
                    const isAdded = item.status === 'added';
                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-lg border transition-all text-xs ${
                          isAdded
                            ? 'border-emerald-500/40 bg-emerald-500/5'
                            : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/80 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {item.type === 'character' && <UserPlus className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                            {item.type === 'location' && <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                            {item.type === 'event' && <Flag className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                            {item.type === 'object' && <Box className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                            {item.type === 'time' && <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
                            <span className="font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-[10px] uppercase font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-700/60 px-1 rounded">
                            {item.type}
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic mb-2 line-clamp-2">
                          "{item.context}"
                        </p>

                        {/* Actions: [ADD] [IGNORE] [EDIT] */}
                        {isAdded ? (
                          <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-1 border-t border-emerald-500/20">
                            <span className="flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Added to Story Bible</span>
                            </span>
                            <button
                              onClick={() => setRightSidebarTab('bible')}
                              className="text-blue-600 dark:text-blue-400 hover:underline text-[10px] font-semibold cursor-pointer flex items-center gap-0.5"
                            >
                              <span>View in Bible</span> →
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-100 dark:border-neutral-700/50">
                            <button
                              onClick={() => handleConfirmDetectedItem(item)}
                              className="flex items-center gap-1 px-2.5 py-0.5 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded font-medium text-[11px] transition-colors cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Add to Bible</span>
                            </button>
                            <button
                              onClick={() => setEditingDetectedItem(item)}
                              className="flex items-center gap-1 px-2 py-0.5 bg-neutral-200/60 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded text-[11px] transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleIgnoreDetectedItem(item.id)}
                              className="flex items-center gap-1 px-2 py-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded text-[11px] transition-colors ml-auto cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                              <span>Ignore</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-neutral-400">
                    <Sparkles className="w-7 h-7 mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
                    <p className="text-xs mb-1 font-medium">No pending story entities detected.</p>
                    <p className="text-[11px] text-neutral-400 mb-3">Entities are detected automatically as you write prose.</p>
                    <button
                      onClick={handleRunExtraction}
                      className="px-3 py-1 bg-[#185abd] text-white rounded text-xs font-semibold hover:bg-[#124896] transition-colors cursor-pointer"
                    >
                      Scan Current Scene
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* STORY BIBLE TAB IN RIGHT SIDEBAR */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 space-y-2 bg-neutral-50 dark:bg-neutral-900/40">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3 h-3 absolute left-2.5 top-2 text-neutral-400" />
                    <input
                      type="text"
                      value={sidebarBibleSearch}
                      onChange={e => setSidebarBibleSearch(e.target.value)}
                      placeholder="Filter Story Bible..."
                      className="w-full text-xs pl-7 pr-2 py-1 bg-white dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-[#185abd]"
                    />
                  </div>

                  <button
                    onClick={() => setQuickAddType(quickAddType ? null : 'character')}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Quick Add</span>
                  </button>
                </div>

                {/* Quick Add Form Drawer */}
                {quickAddType && (
                  <div className="p-2.5 rounded-lg border border-[#185abd]/30 bg-[#f0f6fe] dark:bg-blue-950/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-[11px]">
                        Add to Story Bible:
                      </span>
                      <div className="flex items-center gap-1 bg-neutral-200/70 dark:bg-neutral-800 p-0.5 rounded text-[10px]">
                        <button
                          onClick={() => setQuickAddType('character')}
                          className={`px-1.5 py-0.5 rounded ${quickAddType === 'character' ? 'bg-white dark:bg-neutral-900 font-bold text-blue-600 shadow-xs' : 'text-neutral-500'}`}
                        >
                          Character
                        </button>
                        <button
                          onClick={() => setQuickAddType('location')}
                          className={`px-1.5 py-0.5 rounded ${quickAddType === 'location' ? 'bg-white dark:bg-neutral-900 font-bold text-emerald-600 shadow-xs' : 'text-neutral-500'}`}
                        >
                          Location
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={quickAddName}
                      onChange={e => setQuickAddName(e.target.value)}
                      placeholder={quickAddType === 'character' ? 'Character Name...' : 'Location Name...'}
                      className="w-full p-1.5 bg-white dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                    />

                    <input
                      type="text"
                      value={quickAddDetail}
                      onChange={e => setQuickAddDetail(e.target.value)}
                      placeholder={quickAddType === 'character' ? 'Role (protagonist, supporting...)' : 'Description / atmosphere...'}
                      className="w-full p-1.5 bg-white dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none text-[11px]"
                    />

                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => setQuickAddType(null)}
                        className="px-2 py-0.5 text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleQuickAddEntity}
                        disabled={!quickAddName.trim()}
                        className="px-3 py-1 text-[11px] font-semibold bg-[#185abd] text-white rounded hover:bg-[#124896] transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Save & Link to Scene
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Story Bible Lists */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* CHARACTERS SECTION */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-500" />
                      <span>Characters ({(project.storyBible?.characters || []).length})</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {(project.storyBible?.characters || [])
                      .filter(c => !sidebarBibleSearch || c.name.toLowerCase().includes(sidebarBibleSearch.toLowerCase()))
                      .map(char => {
                        const inScene = (activeScene?.characterIds || []).includes(char.id);
                        return (
                          <div
                            key={char.id}
                            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/80 flex items-center justify-between gap-2 shadow-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0 uppercase"
                                style={{ backgroundColor: char.color || '#3b82f6' }}
                              >
                                {char.name.charAt(0)}
                              </span>
                              <div className="min-w-0">
                                <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs truncate">
                                  {char.name}
                                </div>
                                <div className="text-[10px] text-neutral-400 capitalize truncate">
                                  {char.role}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleToggleSceneCharacter(char.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors shrink-0 cursor-pointer ${
                                inScene
                                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                  : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300'
                              }`}
                            >
                              {inScene ? '✓ In Scene' : '+ Add to Scene'}
                            </button>
                          </div>
                        );
                      })}
                    {(project.storyBible?.characters || []).length === 0 && (
                      <p className="text-xs text-neutral-400 italic">No characters in Story Bible yet.</p>
                    )}
                  </div>
                </div>

                {/* LOCATIONS SECTION */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      <span>Locations ({(project.storyBible?.locations || []).length})</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {(project.storyBible?.locations || [])
                      .filter(l => !sidebarBibleSearch || l.name.toLowerCase().includes(sidebarBibleSearch.toLowerCase()))
                      .map(loc => {
                        const isSetting = activeScene?.locationId === loc.id;
                        return (
                          <div
                            key={loc.id}
                            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/80 flex items-center justify-between gap-2 shadow-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs truncate">
                                {loc.name}
                              </div>
                              <div className="text-[10px] text-neutral-400 truncate">
                                {loc.description || 'No description'}
                              </div>
                            </div>

                            <button
                              onClick={() => handleSetSceneLocation(loc.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors shrink-0 cursor-pointer ${
                                isSetting
                                  ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300'
                              }`}
                            >
                              {isSetting ? '✓ Setting' : 'Set Setting'}
                            </button>
                          </div>
                        );
                      })}
                    {(project.storyBible?.locations || []).length === 0 && (
                      <p className="text-xs text-neutral-400 italic">No locations in Story Bible yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Scene Info Footnote */}
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 text-xs">
            <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
              Scene Quick Info
            </div>
            <div className="space-y-1 text-neutral-600 dark:text-neutral-400 text-[11px]">
              <div className="flex justify-between">
                <span>Time:</span>
                <span className="font-medium text-neutral-800 dark:text-neutral-200">{activeScene?.time || 'Unset'}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium capitalize text-neutral-800 dark:text-neutral-200">{activeScene?.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Words:</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200">{activeScene?.wordCount || 0}</span>
              </div>
            </div>
          </div>
        </aside>
      ) : (
        <button
          onClick={() => setRightSidebarOpen(true)}
          title="Open story extraction panel"
          className="absolute right-2 top-14 z-10 p-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900"
        >
          <PanelRight className="w-4 h-4" />
        </button>
      )}

      {/* Edit Detected Item Modal */}
      {editingDetectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 max-w-md w-full shadow-xl">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              Edit Detected {editingDetectedItem.type}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-500 mb-1">Entity Name</label>
                <input
                  type="text"
                  value={editingDetectedItem.name}
                  onChange={e => setEditingDetectedItem({ ...editingDetectedItem, name: e.target.value })}
                  className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Category</label>
                <select
                  value={editingDetectedItem.type}
                  onChange={e => setEditingDetectedItem({ ...editingDetectedItem, type: e.target.value as any })}
                  className="w-full p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="character">Character</option>
                  <option value="location">Location</option>
                  <option value="event">Event</option>
                  <option value="object">Object</option>
                  <option value="time">Time Marker</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Context Excerpt</label>
                <textarea
                  value={editingDetectedItem.context}
                  onChange={e => setEditingDetectedItem({ ...editingDetectedItem, context: e.target.value })}
                  className="w-full h-16 p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setEditingDetectedItem(null)}
                className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedDetected}
                className="px-3 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating Feedback Toast for Story Bible Additions */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 border border-neutral-700/50">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

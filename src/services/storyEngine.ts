import { DetectedEntity, ScreenplayElement, ScreenplayScene, Scene, Project } from '../types/story';

// Clean punctuation from word
function cleanWord(w: string): string {
  return w.replace(/^[“"‘'(\[]+|[”"’)\].,!?:;]+$/g, '').trim();
}

// Common non-character capitalized English words to ignore
const COMMON_STOP_WORDS = new Set([
  'The', 'A', 'An', 'It', 'He', 'She', 'They', 'We', 'I', 'You', 'There', 'This', 'That',
  'These', 'Those', 'His', 'Her', 'Their', 'My', 'Our', 'Your', 'Its', 'Then', 'When',
  'Where', 'Why', 'How', 'What', 'Who', 'Whom', 'Which', 'Suddenly', 'Meanwhile',
  'After', 'Before', 'During', 'Although', 'Even', 'Though', 'Instead', 'Moreover',
  'Furthermore', 'However', 'Nevertheless', 'Therefore', 'Thus', 'So', 'Because',
  'Since', 'Far', 'Near', 'Under', 'Over', 'Between', 'Among', 'Behind', 'Beside',
  'Beyond', 'Inside', 'Outside', 'Through', 'Across', 'Along', 'Around', 'Without',
  'Within', 'Against', 'Beside', 'Chapter', 'Scene', 'Part', 'Book', 'One', 'Two',
  'Three', 'First', 'Second', 'Third', 'Someone', 'Anyone', 'Everyone', 'No one', 'Nobody',
  'Yesterday', 'Tomorrow', 'Today', 'Tonight', 'Morning', 'Afternoon', 'Evening', 'Night',
  'Twelve', 'Five', 'Ten', 'Twenty', 'Half',
]);

const LOCATION_KEYWORDS = [
  'station', 'platform', 'apartment', 'studio', 'tower', 'street', 'alley',
  'bridge', 'tunnel', 'terminal', 'hall', 'room', 'vault', 'office', 'house',
  'corridor', 'hotel', 'hospital', 'docks', 'harbor', 'wharf', 'café', 'cafe',
  'bar', 'cellar', 'attic', 'church', 'cathedral', 'library', 'archive', 'yard',
  'chamber', 'gate', 'parlor', 'drawing room', 'warehouse', 'train', 'coach',
];

const OBJECT_KEYWORDS = [
  'letter', 'envelope', 'key', 'watch', 'knife', 'lantern', 'dossier', 'ledger',
  'book', 'telegram', 'coat', 'ring', 'necklace', 'locket', 'gun', 'revolver',
  'pistol', 'map', 'bottle', 'glass', 'box', 'crate', 'telephone', 'phone',
  'car', 'cigarette case', 'journal', 'notebook', 'twine', 'seal', 'parchment',
  'safe', 'locket', 'ticket', 'photograph', 'photo', 'compass', 'torch',
];

const TIME_PATTERNS = [
  /\b(midnight|noon|dawn|dusk|twilight|sunrise|sunset)\b/i,
  /\b([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm|o'clock))\b/i,
  /\b(the following morning|the next day|three days later|years later|hours later|a moment later|that evening)\b/i,
  /\b(autumn|winter|spring|summer)\b/i,
];

export const StoryEngine = {
  // Extract entities from scene text (runs locally and offline!)
  extractEntitiesFromScene(scene: Scene, project: Project): DetectedEntity[] {
    const text = scene.content;
    if (!text || text.trim().length < 20) return [];

    const detected: DetectedEntity[] = [];
    const existingBibleCharNames = new Set((project.storyBible?.characters || []).map(c => c.name.toLowerCase()));
    const existingBibleLocNames = new Set((project.storyBible?.locations || []).map(l => l.name.toLowerCase()));
    const existingBibleObjNames = new Set((project.storyBible?.objects || []).map(o => o.name.toLowerCase()));
    const currentSceneDetectedNames = new Set((scene.detectedItems || []).map(d => d.name.toLowerCase()));

    const sentences = text.split(/(?<=[.!?])\s+/);

    // 1. Detect Character Candidates:
    // Pattern A: "..." said Elena OR Elena said "..."
    const namePattern = '([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)';
    const speechVerbs = 'said|asked|whispered|shouted|murmured|replied|called|interrupted|snapped|echoed|thought|cried|muttered|sighed|demanded|hissed|insisted|confessed|exclaimed|gasped';
    
    // Elena said ...
    const speakerBeforeRegex = new RegExp(`\\b${namePattern}\\s+(?:${speechVerbs})\\b`, 'g');
    let match: RegExpExecArray | null;
    while ((match = speakerBeforeRegex.exec(text)) !== null) {
      const name = match[1].trim();
      const lower = name.toLowerCase();
      if (!COMMON_STOP_WORDS.has(name) && !existingBibleCharNames.has(lower) && !currentSceneDetectedNames.has(lower)) {
        currentSceneDetectedNames.add(lower);
        detected.push({
          id: `det-char-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'character',
          name,
          context: match[0],
          sceneId: scene.id,
          status: 'pending',
          details: { role: 'speaking character in dialogue' },
        });
      }
    }

    // ... said Elena
    const speakerAfterRegex = new RegExp(`\\b(?:${speechVerbs})\\s+${namePattern}\\b`, 'g');
    while ((match = speakerAfterRegex.exec(text)) !== null) {
      const name = match[1].trim();
      const lower = name.toLowerCase();
      if (!COMMON_STOP_WORDS.has(name) && !existingBibleCharNames.has(lower) && !currentSceneDetectedNames.has(lower)) {
        currentSceneDetectedNames.add(lower);
        detected.push({
          id: `det-char-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'character',
          name,
          context: match[0],
          sceneId: scene.id,
          status: 'pending',
          details: { role: 'speaking character in dialogue' },
        });
      }
    }

    // Pattern B: Active Character Actions (e.g. Kaelen drew his sword / Elena stepped forward)
    const actionVerbs = 'turned|stepped|froze|looked|entered|smiled|frowned|nodded|glanced|reached|held|walked|drew|pulled|stood|sat|pointed|grabbed|watched|shook|took|gave|placed|leaned|ran|escaped|stared|hesitated';
    const actionRegex = new RegExp(`\\b${namePattern}\\s+(?:${actionVerbs})\\b`, 'g');
    while ((match = actionRegex.exec(text)) !== null) {
      const name = match[1].trim();
      const lower = name.toLowerCase();
      if (!COMMON_STOP_WORDS.has(name) && !existingBibleCharNames.has(lower) && !currentSceneDetectedNames.has(lower)) {
        currentSceneDetectedNames.add(lower);
        detected.push({
          id: `det-char-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'character',
          name,
          context: match[0],
          sceneId: scene.id,
          status: 'pending',
          details: { role: 'active character in narrative' },
        });
      }
    }

    // Pattern C: Mid-sentence proper nouns occurring 2+ times
    const midSentenceCapitalRegex = /(?:[a-z,;]\s+)([A-Z][a-z]{2,15})\b/g;
    const midSentenceCounts: Record<string, { count: number; sample: string }> = {};
    while ((match = midSentenceCapitalRegex.exec(text)) !== null) {
      const word = match[1].trim();
      if (!COMMON_STOP_WORDS.has(word) && !LOCATION_KEYWORDS.includes(word.toLowerCase())) {
        if (!midSentenceCounts[word]) {
          midSentenceCounts[word] = { count: 0, sample: match[0] };
        }
        midSentenceCounts[word].count += 1;
      }
    }
    Object.entries(midSentenceCounts).forEach(([word, info]) => {
      const lower = word.toLowerCase();
      if (info.count >= 2 && !existingBibleCharNames.has(lower) && !currentSceneDetectedNames.has(lower)) {
        currentSceneDetectedNames.add(lower);
        detected.push({
          id: `det-char-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'character',
          name: word,
          context: `Mentioned ${info.count} times (e.g. "${info.sample.trim()}")`,
          sceneId: scene.id,
          status: 'pending',
          details: { role: 'recurring named person' },
        });
      }
    });

    // 2. Detect Locations
    LOCATION_KEYWORDS.forEach(kw => {
      const locRegex = new RegExp(`(?:the|an|a)\\s+([A-Za-z0-9'\\-\\s]{0,25}\\b${kw}\\b[A-Za-z0-9'\\-\\s]{0,15})`, 'gi');
      let locMatch: RegExpExecArray | null;
      while ((locMatch = locRegex.exec(text)) !== null) {
        const rawPhrase = cleanWord(locMatch[1]);
        // Capitalize words
        const formatted = rawPhrase
          .split(' ')
          .filter(Boolean)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');

        const lower = formatted.toLowerCase();
        if (formatted.length > 3 && !existingBibleLocNames.has(lower) && !currentSceneDetectedNames.has(lower)) {
          currentSceneDetectedNames.add(lower);
          detected.push({
            id: `det-loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'location',
            name: formatted,
            context: locMatch[0],
            sceneId: scene.id,
            status: 'pending',
            details: { description: `Setting mentioned in ${scene.title}` },
          });
        }
      }
    });

    // 3. Detect Significant Objects
    OBJECT_KEYWORDS.forEach(kw => {
      const objRegex = new RegExp(`(?:his|her|the|a|an)\\s+([A-Za-z0-9'\\-\\s]{0,20}\\b${kw}\\b)`, 'gi');
      let objMatch: RegExpExecArray | null;
      while ((objMatch = objRegex.exec(text)) !== null) {
        const rawObj = cleanWord(objMatch[1]);
        const formatted = rawObj
          .split(' ')
          .filter(Boolean)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        const lower = formatted.toLowerCase();
        if (formatted.length > 2 && !existingBibleObjNames.has(lower) && !currentSceneDetectedNames.has(lower)) {
          currentSceneDetectedNames.add(lower);
          detected.push({
            id: `det-obj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'object',
            name: formatted,
            context: objMatch[0],
            sceneId: scene.id,
            status: 'pending',
            details: { significance: 'Physical object referenced in scene' },
          });
        }
      }
    });

    // 4. Detect Time markers
    TIME_PATTERNS.forEach(pattern => {
      const timeMatch = pattern.exec(text);
      if (timeMatch) {
        const timeName = timeMatch[0].charAt(0).toUpperCase() + timeMatch[0].slice(1);
        const lower = timeName.toLowerCase();
        if (!currentSceneDetectedNames.has(lower)) {
          currentSceneDetectedNames.add(lower);
          detected.push({
            id: `det-time-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'time',
            name: timeName,
            context: timeMatch[0],
            sceneId: scene.id,
            status: 'pending',
            details: { time: timeName },
          });
        }
      }
    });

    // 5. Detect Major Action Events from Key Sentences
    // Sentences with strong narrative verbs
    const actionSentences = sentences.filter(s => {
      const lower = s.toLowerCase();
      return (
        (lower.includes(' entered ') ||
          lower.includes(' confronted ') ||
          lower.includes(' discovered ') ||
          lower.includes(' pulled ') ||
          lower.includes(' revealed ') ||
          lower.includes(' opened ') ||
          lower.includes(' burns ') ||
          lower.includes(' leaves ') ||
          lower.includes(' stepped from ') ||
          lower.includes(' arrested ')) &&
        s.length < 120
      );
    });

    actionSentences.slice(0, 3).forEach(sent => {
      const summary = sent.trim().replace(/\n+/g, ' ');
      const lower = summary.toLowerCase();
      if (!currentSceneDetectedNames.has(lower)) {
        currentSceneDetectedNames.add(lower);
        detected.push({
          id: `det-evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'event',
          name: summary,
          context: summary,
          sceneId: scene.id,
          status: 'pending',
          details: { consequences: 'Key story action event' },
        });
      }
    });

    return detected.slice(0, 8); // Keep top 8 concise items
  },

  // Adapt novel scene prose into professional screenplay structure
  adaptProseToScreenplay(scene: Scene, project: Project, sceneNumber: number): ScreenplayScene {
    const elements: ScreenplayElement[] = [];

    // Determine slugline
    const location = (project.storyBible?.locations || []).find(l => l.id === scene.locationId);
    const locName = location ? location.name.toUpperCase() : 'INTERIOR / UNKNOWN LOCATION';
    const timeOfDay = scene.time ? scene.time.toUpperCase() : 'NIGHT';
    const isExterior = locName.includes('EXT.') || locName.includes('STREET') || locName.includes('PLATFORM') || locName.includes('TOWER');
    const prefix = isExterior ? 'EXT.' : 'INT.';
    const slugline = `${prefix} ${locName.replace(/^(INT\.|EXT\.)\s*/i, '')} - ${timeOfDay}`;

    // 1. Scene Heading element
    elements.push({
      id: `el-${Date.now()}-heading`,
      type: 'scene_heading',
      content: slugline,
    });

    // Split prose into paragraphs
    const paragraphs = (scene.content || '')
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(Boolean);

    // If prose is empty, add a starting action line
    if (paragraphs.length === 0) {
      elements.push({
        id: `el-${Date.now()}-act-init`,
        type: 'action',
        content: scene.title ? `The scene begins for ${scene.title}.` : 'Action begins here.',
      });
    }

    // Track active characters
    const knownCharacters = project.storyBible?.characters || [];

    paragraphs.forEach((para, paraIndex) => {
      // Check if paragraph contains dialogue quotes: "..." or “...”
      const quoteMatch = para.match(/[“"]([^”"]+)[”"]/);

      if (quoteMatch) {
        // We have dialogue in this paragraph!
        const dialogueText = quoteMatch[1].trim();

        // Extract action before quote if any
        const beforeQuote = para.substring(0, quoteMatch.index).trim();
        if (beforeQuote.length > 5) {
          elements.push({
            id: `el-${Date.now()}-act-${paraIndex}-pre`,
            type: 'action',
            content: this.convertToScreenplayAction(beforeQuote),
          });
        }

        // Determine speaker name
        let speakerName = 'SPEAKER';
        const speakerCandidates = knownCharacters.filter(c => 
          para.toLowerCase().includes(c.name.toLowerCase()) || 
          (c.aliases && c.aliases.some(a => para.toLowerCase().includes(a.toLowerCase())))
        );

        if (speakerCandidates.length > 0) {
          speakerName = speakerCandidates[0].name.toUpperCase();
        } else {
          // Attempt heuristic speaker detection: "Elena said" -> ELENA
          const match = para.match(/([A-Z][a-z]+)\s+(?:said|asked|whispered|murmured|replied|shouted|interrupted)/);
          if (match) {
            speakerName = match[1].toUpperCase();
          } else if (scene.povCharacterId) {
            const pov = knownCharacters.find(c => c.id === scene.povCharacterId);
            if (pov) speakerName = pov.name.toUpperCase();
          }
        }

        // Check for parenthetical emotion/direction (e.g. whispering, quiet but sharp)
        let parentheticalText = '';
        if (para.toLowerCase().includes('whispered')) parentheticalText = 'whispering';
        else if (para.toLowerCase().includes('firmly')) parentheticalText = 'firmly';
        else if (para.toLowerCase().includes('quietly')) parentheticalText = 'quietly';
        else if (para.toLowerCase().includes('laugh')) parentheticalText = 'laughing';

        elements.push({
          id: `el-${Date.now()}-char-${paraIndex}`,
          type: 'character',
          content: speakerName,
        });

        if (parentheticalText) {
          elements.push({
            id: `el-${Date.now()}-paren-${paraIndex}`,
            type: 'parenthetical',
            content: `(${parentheticalText})`,
          });
        }

        elements.push({
          id: `el-${Date.now()}-dial-${paraIndex}`,
          type: 'dialogue',
          content: dialogueText,
        });

        // Extract action after quote if any
        const afterQuote = para.substring((quoteMatch.index || 0) + quoteMatch[0].length).trim();
        if (afterQuote.length > 5) {
          elements.push({
            id: `el-${Date.now()}-act-${paraIndex}-post`,
            type: 'action',
            content: this.convertToScreenplayAction(afterQuote),
          });
        }
      } else {
        // Pure action/description paragraph
        elements.push({
          id: `el-${Date.now()}-act-${paraIndex}`,
          type: 'action',
          content: this.convertToScreenplayAction(para),
        });
      }
    });

    return {
      id: `screenplay-sc-${Date.now()}`,
      sourceSceneId: scene.id,
      sceneNumber,
      slugline,
      elements,
      shots: [],
    };
  },

  // Convert descriptive prose into screen action (present tense, vivid beats)
  convertToScreenplayAction(prose: string): string {
    // Break very long prose paragraphs into 1-2 punchy action sentences
    let text = prose.replace(/\s+/g, ' ').trim();
    // Convert past tense verbs to present tense where common
    text = text
      .replace(/\bentered\b/gi, 'enters')
      .replace(/\bwalked\b/gi, 'walks')
      .replace(/\bstepped\b/gi, 'steps')
      .replace(/\blooked\b/gi, 'looks')
      .replace(/\bpulled\b/gi, 'pulls')
      .replace(/\breached\b/gi, 'reaches')
      .replace(/\bstopped\b/gi, 'stops')
      .replace(/\blistened\b/gi, 'listens')
      .replace(/\bdripped\b/gi, 'drips')
      .replace(/\bhesitated\b/gi, 'hesitates')
      .replace(/\bturned\b/gi, 'turns');
    return text;
  },

  // Automatically identify which Bible characters appear in this scene text
  syncSceneCharacters(scene: Scene, project: Project): string[] {
    const textLower = scene.content.toLowerCase();
    const activeIds = new Set(scene.characterIds || []);

    (project.storyBible?.characters || []).forEach(char => {
      const nameLower = char.name.toLowerCase();
      const inText = textLower.includes(nameLower) || (char.aliases && char.aliases.some(a => textLower.includes(a.toLowerCase())));
      if (inText) {
        activeIds.add(char.id);
      }
    });

    return Array.from(activeIds);
  },

  // Continuity validation checker (runs offline!)
  auditContinuity(project: Project) {
    const issues = [...(project.continuityIssues || [])];
    
    // 1. Check character eye color consistency
    const eyeColors = ['blue', 'brown', 'hazel', 'green', 'gray', 'grey', 'amber', 'black', 'violet', 'golden'];
    const hairColors = ['blonde', 'blond', 'brunette', 'black', 'dark', 'brown', 'red', 'auburn', 'silver', 'white', 'gray', 'grey'];

    (project.storyBible?.characters || []).forEach(char => {
      const eyeMentions: { sceneId: string; color: string }[] = [];
      const hairMentions: { sceneId: string; color: string }[] = [];

      (project.scenes || []).forEach(sc => {
        const text = sc.content.toLowerCase();
        const charName = char.name.toLowerCase();
        const isPresent = (sc.characterIds || []).includes(char.id) || text.includes(charName);
        if (isPresent) {
          // Eyes
          eyeColors.forEach(color => {
            const pattern = new RegExp(`\\b${color}\\s+eyes\\b`, 'i');
            if (pattern.test(sc.content)) {
              eyeMentions.push({ sceneId: sc.id, color });
            }
          });
          // Hair
          hairColors.forEach(color => {
            const pattern = new RegExp(`\\b${color}\\s+hair\\b`, 'i');
            if (pattern.test(sc.content)) {
              hairMentions.push({ sceneId: sc.id, color });
            }
          });
        }
      });

      // Conflicting eye colors
      const uniqueEyes = Array.from(new Set(eyeMentions.map(m => m.color.toLowerCase())));
      if (uniqueEyes.length > 1) {
        const existing = issues.find(i => i.title.includes(char.name) && i.title.includes('Eye Color'));
        if (!existing) {
          issues.push({
            id: `ci-eye-${char.id}-${Date.now()}`,
            title: `Contradicting Eye Color for ${char.name}`,
            type: 'character_trait',
            description: `${char.name} is described with ${uniqueEyes[0]} eyes in one scene, but with ${uniqueEyes[1]} eyes in another.`,
            sceneIds: eyeMentions.map(m => m.sceneId),
            characterIds: [char.id],
            severity: 'medium',
            dismissed: false,
          });
        }
      }

      // Conflicting hair colors
      const uniqueHair = Array.from(new Set(hairMentions.map(m => m.color.toLowerCase())));
      if (uniqueHair.length > 1) {
        const existing = issues.find(i => i.title.includes(char.name) && i.title.includes('Hair Color'));
        if (!existing) {
          issues.push({
            id: `ci-hair-${char.id}-${Date.now()}`,
            title: `Contradicting Hair Color for ${char.name}`,
            type: 'character_trait',
            description: `${char.name} is described with ${uniqueHair[0]} hair in one scene, but with ${uniqueHair[1]} hair in another.`,
            sceneIds: hairMentions.map(m => m.sceneId),
            characterIds: [char.id],
            severity: 'medium',
            dismissed: false,
          });
        }
      }
    });

    return issues;
  },
};

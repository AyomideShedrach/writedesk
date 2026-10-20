import { ScreenplayScene, ScreenplayElement } from '../types/story';

export const StoryEngine = {
  // Heuristic offline entity extraction from prose
  extractEntities(text: string) {
    const lines = text.split('\n').filter(Boolean);
    const capitalizedWords = text.match(/\b[A-Z][a-z]{2,}\b/g) || [];
    
    // Simple frequency counter
    const freq: Record<string, number> = {};
    for (const word of capitalizedWords) {
      if (['The', 'And', 'Then', 'When', 'After', 'Before', 'This', 'That', 'There'].includes(word)) continue;
      freq[word] = (freq[word] || 0) + 1;
    }

    const characters = Object.keys(freq)
      .filter(w => freq[w] >= 2)
      .slice(0, 5)
      .map((name, i) => ({
        id: `char-extracted-${Date.now()}-${i}`,
        name,
        role: 'Extracted Entity',
        context: `Appears ${freq[name]} times in scene.`,
      }));

    return {
      characters,
      locations: [],
      events: [],
      objects: [],
      time: [],
    };
  },

  // Adapt novel prose to standard screenplay structure
  adaptToScreenplay(sceneTitle: string, prose: string, location?: string, timeOfDay?: string): ScreenplayScene {
    const slugline = `INT. ${(location || 'SCENE LOCATION').toUpperCase()} - ${(timeOfDay || 'DAY').toUpperCase()}`;
    const paragraphs = prose.split('\n\n').filter(Boolean);
    const elements: ScreenplayElement[] = [
      {
        type: 'scene_heading',
        content: slugline,
      },
    ];

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      // Check if it's dialogue (quotes)
      const quoteMatch = trimmed.match(/^["“](.*?)["”](.*)$/s);
      if (quoteMatch) {
        elements.push({
          type: 'dialogue',
          content: trimmed,
        });
      } else {
        elements.push({
          type: 'action',
          content: trimmed,
        });
      }
    }

    return {
      sceneId: '',
      slugline,
      elements,
    };
  },
};

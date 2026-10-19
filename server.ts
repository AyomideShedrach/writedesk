import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI client if key is set
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ---------------------------------------------------------------------------
// AI Studio Endpoints
// ---------------------------------------------------------------------------

// AI status endpoint
app.get('/api/ai/status', (req, res) => {
  res.json({
    available: !!ai,
    model: 'gemini-3.8-flash',
  });
});

// AI extraction endpoint
app.post('/api/ai/extract', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({ error: 'AI key not configured; using offline heuristic engine.' });
    }
    const { text, sceneTitle } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const prompt = `Analyze this novel scene manuscript text. Extract any key story entities that should be tracked in a novelist's Story Bible.
Scene Title: ${sceneTitle || 'Untitled Scene'}

Text:
"""
${text}
"""

Identify:
1. Characters (name, brief role/context)
2. Locations (name, atmosphere/description)
3. Significant Events (concise summary of major actions or revelations)
4. Key Story Objects (e.g. letters, weapons, keepsakes, keys)
5. Time markers (e.g. Midnight, Autumn 3 years earlier)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            characters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  role: { type: Type.STRING },
                  context: { type: Type.STRING },
                },
                required: ['name', 'context'],
              },
            },
            locations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ['name'],
              },
            },
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  consequences: { type: Type.STRING },
                },
                required: ['name'],
              },
            },
            objects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  significance: { type: Type.STRING },
                },
                required: ['name'],
              },
            },
            time: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
            },
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in AI extraction endpoint:', error);
    res.status(500).json({ error: error.message || 'AI extraction failed' });
  }
});

// AI screenplay adaptation endpoint
app.post('/api/ai/adapt-screenplay', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({ error: 'AI key not configured; using offline adaptation engine.' });
    }
    const { sceneTitle, prose, locationName, timeOfDay } = req.body;

    const prompt = `You are a master Hollywood script adapter. Adapt the following novel prose into standard screenplay format.
Do NOT simply paraphrase. Preserve the characters, dramatic tension, actions, dialogue, and emotional beats.
Scene title: ${sceneTitle}
Setting: ${locationName || 'Unknown Location'} (${timeOfDay || 'NIGHT'})

Novel Manuscript:
"""
${prose}
"""

Return a list of standard screenplay elements. Each element must have a 'type' and 'content'.
Types must be one of: "scene_heading", "action", "character", "dialogue", "parenthetical", "transition", "shot".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            slugline: { type: Type.STRING },
            elements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: 'One of scene_heading, action, character, dialogue, parenthetical, transition, shot',
                  },
                  content: { type: Type.STRING },
                },
                required: ['type', 'content'],
              },
            },
          },
          required: ['slugline', 'elements'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in AI adaptation endpoint:', error);
    res.status(500).json({ error: error.message || 'Screenplay adaptation failed' });
  }
});

// ---------------------------------------------------------------------------
// Server setup for dev and production
// ---------------------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Liime Words Studio server listening at http://localhost:${PORT}`);
  });
}

startServer();

import { Project } from '../types/story';

export const DEFAULT_PROJECT: Project = {
  id: 'project-manuscript-prime',
  title: 'The Silent Meridian',
  author: 'Studio Writer',
  type: 'Novel',
  genre: 'Sci-Fi / Noir Drama',
  logline: 'An orbital archivist uncovers a suppressed frequency that synchronizes the memories of seven strangers on the eve of atmospheric decay.',
  targetWordCount: 80000,
  dailyWordGoal: 1500,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  chapters: [
    {
      id: 'chap-1',
      title: 'Chapter 1: The Static Corridor',
      order: 1,
      synopsis: 'Kael monitors the atmospheric relay when a phantom signal breaches the perimeter.',
    },
    {
      id: 'chap-2',
      title: 'Chapter 2: Sub-Level Seven',
      order: 2,
      synopsis: 'A deep descent beneath the relay station reveals the subterranean telemetry cache.',
    },
  ],
  scenes: [
    {
      id: 'scene-1-1',
      chapterId: 'chap-1',
      title: 'Echoes at 0300 Hours',
      order: 1,
      status: 'draft',
      pov: 'Kaelen Vance',
      timeOfDay: 'NIGHT',
      location: 'Relay Observation Dome',
      targetWordCount: 2500,
      content: `The atmospheric pressure gauges in Sector 9 had stopped registering three minutes past midnight.

Kael adjusted the cathode tuner, his gloved fingers tracing the knurled brass dials. The observation dome hummed with the slow, resonant breath of aging turbines. Outside, the sky was a bruised indigo, scarred by the faint geometric lattice of the planetary shield.

"Telemetry is drifting again," he murmured into the desk recorder.

A sharp frequency burst cut through the audio feed—not white noise, but cadence. Three descending pulses, followed by the faint imprint of human speech.

Across the partition, Dr. Elara Chen did not look up from her spectrum plates. "You're listening to sensor ghosting, Kael. The ionosphere has been churning since Tuesday."

"It isn't noise, Elara. Listen."

He patched the audio directly into the station monitors. The room fell into absolute stillness as the rhythmic oscillation filled the glass rotunda.`,
    },
    {
      id: 'scene-1-2',
      chapterId: 'chap-1',
      title: 'The Frequency Decryption',
      order: 2,
      status: 'draft',
      pov: 'Dr. Elara Chen',
      timeOfDay: 'DAWN',
      location: 'Sub-Relay Laboratory',
      targetWordCount: 2000,
      content: `The waveform displayed on the terminal was unlike any atmospheric distortion Elara had cataloged in twenty years at the facility.

It was fractal, repeating at intervals of thirty-seven milliseconds. When laid against the biometric logs of the colony's original transit manifest, the harmonics aligned precisely with seven passenger identifiers—all officially declared lost in the 2182 re-entry disaster.

"Someone kept these transmissions alive for forty years," she whispered, locking the terminal vault. "And they're broadcasting directly into our relay."`,
    },
  ],
  storyBible: {
    characters: [
      {
        id: 'char-1',
        name: 'Kaelen Vance',
        role: 'Protagonist / Orbital Archivist',
        aliases: ['Kael'],
        bio: 'Chief signal archivist on the Meridian Relay Station. Methodical, observant, haunted by an unresolved signal loss five years ago.',
        appearance: 'Tall, lean, dark rumpled coat, brass-framed ocular loupe.',
        goals: 'Decode the phantom harmonic and uncover the truth behind Sector 9.',
        conflicts: 'Divided loyalty between station security protocols and the revelation of the signal.',
      },
      {
        id: 'char-2',
        name: 'Dr. Elara Chen',
        role: 'Lead Spectral Analyst',
        aliases: ['Elara'],
        bio: 'Senior researcher with three decades on planetary harmonics. Cynical outwardly, fiercely protective of historical truth.',
        appearance: 'Silver-streaked hair pulled back, crisp grey lab smock, stern posture.',
        goals: 'Ensure telemetry integrity without triggering station shutdown.',
        conflicts: 'Discovered the original transit suppression thirty years earlier and buried it.',
      },
    ],
    locations: [
      {
        id: 'loc-1',
        name: 'Relay Observation Dome',
        description: 'A 40-meter glass rotunda perched atop the high mountain ridge, looking out over the ionized planetary rim.',
        atmosphere: 'Cold, resonant with turbine hum, smells of ozone and old paper.',
        significance: 'Primary listening station for the atmospheric perimeter.',
      },
      {
        id: 'loc-2',
        name: 'Sub-Level Seven',
        description: 'Decommissioned storage vaults beneath the granite foundation of Sector 9.',
        atmosphere: 'Damp, silent, illuminated by amber standby strips.',
        significance: 'Holds original magnetic core tape archives from the planetary migration.',
      },
    ],
    events: [
      {
        id: 'evt-1',
        name: 'The 0300 Harmonic Breach',
        timelineOrder: 1,
        dateOrMarker: 'Day 1 · 03:03 Hours',
        description: 'First detection of the repeating seven-person biometric harmonic on the atmospheric relay.',
        consequences: 'Forces Kael and Elara to bypass official station telemetry logging.',
      },
    ],
    objects: [
      {
        id: 'obj-1',
        name: 'Cathode Audio Tuner #4',
        description: 'Hand-calibrated analog receiver modified with vacuum-tube preamp to capture ultra-low frequencies.',
        significance: 'The only receiver on the station sensitive enough to isolate the harmonic.',
      },
    ],
    relationships: [
      {
        id: 'rel-1',
        sourceCharacterId: 'char-1',
        targetCharacterId: 'char-2',
        type: 'Colleague / Mentor',
        dynamic: 'Professional tension underpinned by mutual respect and unshared secrets.',
        tensionLevel: 6,
      },
    ],
  },
  screenplay: [
    {
      sceneId: 'scene-1-1',
      slugline: 'INT. RELAY OBSERVATION DOME - NIGHT',
      elements: [
        {
          type: 'scene_heading',
          content: 'INT. RELAY OBSERVATION DOME - NIGHT',
        },
        {
          type: 'action',
          content: 'A cavernous glass rotunda. Outside: deep indigo atmosphere, fractured by glowing planetary shield lines. Massive brass-cased telemetry consoles hum in rhythm.',
        },
        {
          type: 'character',
          content: 'KAELEN VANCE (30s)',
        },
        {
          type: 'action',
          content: 'Tall, haggard, wears a rumpled technician trench. His fingers work a pair of knurled dials on a custom cathode receiver.',
        },
        {
          type: 'character',
          content: 'KAELEN',
        },
        {
          type: 'parenthetical',
          content: '(into audio recorder)',
        },
        {
          type: 'dialogue',
          content: 'Atmospheric telemetry is drifting again. Three pulses. Constant cadence.',
        },
        {
          type: 'character',
          content: 'DR. ELARA CHEN (50s)',
        },
        {
          type: 'dialogue',
          content: 'Sensor ghosting. The ionosphere has been churning since Tuesday.',
        },
        {
          type: 'character',
          content: 'KAELEN',
        },
        {
          type: 'dialogue',
          content: 'It isn\'t noise, Elara. Listen.',
        },
      ],
    },
  ],
  settings: {
    theme: 'classic',
    focusMode: false,
    fontSize: 16,
    fontFamily: 'serif',
    spellCheck: true,
    autoSaveInterval: 400,
  },
};

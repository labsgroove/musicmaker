import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface MelodyPattern {
  scale: 'minor' | 'phrygian' | 'pentatonic';
  key: number; // 0-11 (semitones from A)
  bpm: number;
  bassPattern: Array<{
    step: number;
    note: number;
    slide: boolean;
    accent: boolean;
  }>;
  synthPattern: Array<{
    step: number;
    note: number;
    velocity: number;
  }>;
  kickPattern: Array<{
    step: number;
    velocity: number;
    offset: number;
  }>;
  snarePattern: Array<{
    step: number;
    velocity: number;
  }>;
  hihatPattern: Array<{
    step: number;
    open: boolean;
    velocity: number;
  }>;
  trackName: string;
  mood: string;
}

export class GeminiService {
  private model: GenerativeModel | null = null;
  private apiKey: string = '';

  constructor() {
    this.loadApiKey();
  }

  private loadApiKey() {
    // Try to load from environment or localStorage
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey) {
      this.apiKey = envKey;
      this.initModel();
    }
  }

  private initModel() {
    if (!this.apiKey) return;
    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      });
      console.log('Gemini model initialized');
    } catch (error) {
      console.error('Failed to initialize Gemini:', error);
    }
  }

  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('gemini_api_key', key);
    this.initModel();
  }

  getApiKey(): string {
    if (!this.apiKey) {
      const saved = localStorage.getItem('gemini_api_key');
      if (saved) {
        this.apiKey = saved;
        this.initModel();
      }
    }
    return this.apiKey;
  }

  isConfigured(): boolean {
    return !!this.getApiKey() && !!this.model;
  }

  async generateMelody(
    style: string,
    bpm: number,
    mood: string = 'energetic'
  ): Promise<MelodyPattern> {
    if (!this.model) {
      console.log('No API model available, using local fallback generation');
      return this.generateLocalPattern(style, bpm, mood);
    }

    const prompt = `Generate a ${style} electronic music pattern at ${bpm} BPM with a ${mood} mood.

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "scale": "minor" | "phrygian" | "pentatonic",
  "key": number (0-11, root note semitones from A),
  "bpm": ${bpm},
  "trackName": "creative name for this track",
  "mood": "${mood}",
  "bassPattern": [
    {"step": 0-15, "note": 0-7, "slide": boolean, "accent": boolean}
  ],
  "synthPattern": [
    {"step": 0-15, "note": 0-7, "velocity": 0.0-1.0}
  ],
  "kickPattern": [
    {"step": 0-15, "velocity": 0.0-1.0, "offset": 0.0-0.05}
  ],
  "snarePattern": [
    {"step": 0-15, "velocity": 0.0-1.0}
  ],
  "hihatPattern": [
    {"step": 0-15, "open": boolean, "velocity": 0.0-1.0}
  ]
}

Guidelines:
- Use 16 steps (one bar)
- Kick usually on steps 0, 4, 8, 12
- Snare usually on steps 4, 12
- Hi-hats on off-beats
- Bass notes reference scale degrees 0-7
- Synth notes can be higher scale degrees
- Make it sound like ${style} music
- Track name should be creative and match the style`;

    try {
      console.log('Calling Gemini API...');
      const result = await this.model.generateContent(prompt);
      console.log('Got response from Gemini');
      const response = await result.response;
      const text = response.text();
      console.log('Response text length:', text.length);

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', text.substring(0, 200));
        throw new Error('No valid JSON found in response');
      }

      console.log('Parsing JSON...');
      const pattern: MelodyPattern = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!pattern.bassPattern || !pattern.synthPattern) {
        console.error('Invalid pattern structure:', pattern);
        throw new Error('Invalid pattern structure - missing bass or synth pattern');
      }

      return pattern;
    } catch (error: any) {
      console.error('Failed to generate melody:', error);
      console.error('Error details:', error?.message, error?.stack);
      
      if (error?.message?.includes('API key not valid')) {
        throw new Error('API key inválida. Verifique sua chave no Google AI Studio.');
      }
      if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.name === 'GoogleGenerativeAIFetchError') {
        console.log('Network error, falling back to local generation');
        return this.generateLocalPattern(style, bpm, mood);
      }
      if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        throw new Error('Quota excedida. Aguarde um momento e tente novamente.');
      }
      throw new Error(`Falha na geração: ${error?.message || 'Erro desconhecido'}`);
    }
  }

  async regenerateVariation(
    currentPattern: MelodyPattern,
    variationType: 'subtle' | 'dramatic' = 'subtle'
  ): Promise<MelodyPattern> {
    if (!this.model) {
      throw new Error('API key not configured');
    }

    const prompt = `Take this electronic music pattern and create a ${variationType} variation:
${JSON.stringify(currentPattern, null, 2)}

Return ONLY a valid JSON object with the same structure. ${
      variationType === 'subtle' 
        ? 'Keep most elements similar but change 20-30% of the notes and add small variations.' 
        : 'Create a completely new section that contrasts with the original while keeping the same scale and key.'
    }

Same JSON structure as input.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to regenerate:', error);
      throw error;
    }
  }

  // Local fallback pattern generation when API fails
  private generateLocalPattern(
    style: string,
    bpm: number,
    mood: string
  ): MelodyPattern {
    console.log('Generating local pattern for:', style, mood);
    
    const scales: Array<'minor' | 'phrygian' | 'pentatonic'> = ['minor', 'phrygian', 'pentatonic'];
    const scale = scales[Math.floor(Math.random() * scales.length)];
    const key = Math.floor(Math.random() * 12);
    
    // Style-based pattern variations
    const isTechno = style === 'techno' || style === 'acid' || style === 'minimal';
    const isTrance = style === 'trance' || style === 'progressive';
    const isHouse = style === 'house';
    
    // Generate kick pattern
    const kickPattern: Array<{step: number, velocity: number, offset: number}> = [];
    for (let i = 0; i < 16; i++) {
      if (i % 4 === 0 || (isTechno && i === 10 && Math.random() > 0.5)) {
        kickPattern.push({
          step: i,
          velocity: i % 4 === 0 ? 1 : 0.7 + Math.random() * 0.2,
          offset: i % 2 !== 0 ? 0.02 : 0
        });
      }
    }
    
    // Generate snare pattern
    const snarePattern: Array<{step: number, velocity: number}> = [];
    for (let i = 0; i < 16; i++) {
      if (i === 4 || i === 12 || (i === 6 && Math.random() > 0.7)) {
        snarePattern.push({
          step: i,
          velocity: i === 4 || i === 12 ? 0.9 : 0.4
        });
      }
    }
    
    // Generate hi-hat pattern
    const hihatPattern: Array<{step: number, open: boolean, velocity: number}> = [];
    for (let i = 0; i < 16; i++) {
      if (i % 2 !== 0 || (i % 4 === 2 && Math.random() > 0.3)) {
        hihatPattern.push({
          step: i,
          open: i === 14 || (i === 6 && Math.random() > 0.7),
          velocity: 0.5 + Math.random() * 0.4
        });
      }
    }
    
    // Generate bass pattern
    const bassPattern: Array<{step: number, note: number, slide: boolean, accent: boolean}> = [];
    const bassNotes = isTechno ? [0, 3, 7, 5] : isTrance ? [0, 4, 7, 3] : [0, 3, 5, 7];
    for (let i = 0; i < 16; i += isTechno ? 2 : 1) {
      if (Math.random() > 0.3) {
        const note = bassNotes[Math.floor(Math.random() * bassNotes.length)];
        bassPattern.push({
          step: i,
          note: note,
          slide: Math.random() > 0.6 && i < 15,
          accent: i % 4 === 0
        });
      }
    }
    
    // Generate synth pattern
    const synthPattern: Array<{step: number, note: number, velocity: number}> = [];
    const synthNotes = isTrance ? [2, 4, 7, 9] : isHouse ? [0, 2, 4, 5] : [0, 3, 5, 7, 10];
    for (let i = 0; i < 16; i++) {
      if (i % 4 === 0 || (i % 4 === 2 && Math.random() > 0.4) || (i === 15 && Math.random() > 0.5)) {
        synthPattern.push({
          step: i,
          note: synthNotes[Math.floor(Math.random() * synthNotes.length)],
          velocity: 0.4 + Math.random() * 0.4
        });
      }
    }
    
    // Generate creative track name
    const trackNames = {
      techno: ['Neon Pulse', 'Acid Dreams', 'Steel Factory', 'Dark Matter', 'Cyber Funk'],
      trance: ['Ethereal Waves', 'Starlight Journey', 'Cosmic Gate', 'Dreamscape', 'Aurora'],
      house: ['Summer Vibes', 'Groove City', 'Midnight Dance', 'Deep House', 'Chicago Style'],
      acid: ['TB-303 Dreams', 'Resonance', 'Silver Box', 'Acid Rain', 'Squawk Box'],
      minimal: ['Less is More', 'Micro House', 'Click Cut', 'Silent Drums', 'Digital Zen'],
      progressive: ['Building Up', 'The Journey', 'Layer Cake', 'Evolution', 'Progress']
    };
    
    const names = trackNames[style as keyof typeof trackNames] || trackNames.techno;
    const trackName = `${names[Math.floor(Math.random() * names.length)]} (${mood})`;
    
    return {
      scale,
      key,
      bpm,
      trackName,
      mood,
      bassPattern,
      synthPattern,
      kickPattern,
      snarePattern,
      hihatPattern
    };
  }
}

export const geminiService = new GeminiService();

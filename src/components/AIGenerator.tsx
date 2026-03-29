import { useState } from 'react';
import { geminiService, MelodyPattern } from '../services/GeminiService';

interface AIGeneratorProps {
  currentBpm: number;
  onPatternGenerated: (pattern: MelodyPattern) => void;
  disabled?: boolean;
}

const styles = [
  { value: 'techno', label: 'Techno', icon: '🔥' },
  { value: 'trance', label: 'Trance', icon: '✨' },
  { value: 'house', label: 'House', icon: '🏠' },
  { value: 'acid', label: 'Acid', icon: '🧪' },
  { value: 'minimal', label: 'Minimal', icon: '◾' },
  { value: 'progressive', label: 'Progressive', icon: '🌊' },
];

const moods = [
  { value: 'energetic', label: 'Energético', icon: '⚡' },
  { value: 'dark', label: 'Sombrio', icon: '🌑' },
  { value: 'melodic', label: 'Melódico', icon: '🎵' },
  { value: 'hypnotic', label: 'Hipnótico', icon: '🌀' },
  { value: 'aggressive', label: 'Agressivo', icon: '💢' },
  { value: 'euphoric', label: 'Eufórico', icon: '🌟' },
];

export function AIGenerator({ currentBpm, onPatternGenerated, disabled }: AIGeneratorProps) {
  const [apiKey, setApiKey] = useState(geminiService.getApiKey());
  const [selectedStyle, setSelectedStyle] = useState('techno');
  const [selectedMood, setSelectedMood] = useState('energetic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfig, setShowConfig] = useState(!geminiService.isConfigured());
  const [lastTrackName, setLastTrackName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingLocalMode, setUsingLocalMode] = useState(false);

  const handleSaveApiKey = () => {
    geminiService.setApiKey(apiKey);
    setShowConfig(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      console.log('Starting generation with style:', selectedStyle, 'bpm:', currentBpm, 'mood:', selectedMood);
      console.log('API Key configured:', geminiService.isConfigured());
      
      const pattern = await geminiService.generateMelody(
        selectedStyle,
        currentBpm,
        selectedMood
      );
      
      console.log('Pattern generated successfully:', pattern);
      setLastTrackName(pattern.trackName);
      setUsingLocalMode(!geminiService.isConfigured());
      onPatternGenerated(pattern);
    } catch (error: any) {
      console.error('Generation failed:', error);
      const errorMsg = error?.message || 'Erro desconhecido';
      setError(errorMsg);
      setUsingLocalMode(true);
      alert(`Falha: ${errorMsg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (showConfig) {
    return (
      <div className="bg-dj-panel/60 backdrop-blur-sm rounded-xl p-4 border border-dj-accent/20">
        <h3 className="text-dj-accent font-['Orbitron'] text-sm mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Configurar Google AI Studio
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Obtenha sua API key gratuita em{' '}
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-dj-accent hover:underline"
          >
            aistudio.google.com/app/apikey
          </a>
        </p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Cole sua API key aqui..."
          className="w-full bg-dj-dark/50 border border-dj-accent/30 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-dj-accent mb-3"
        />
        <button
          onClick={handleSaveApiKey}
          disabled={!apiKey.trim()}
          className="w-full bg-dj-accent/20 hover:bg-dj-accent/30 disabled:opacity-50 disabled:cursor-not-allowed text-dj-accent border border-dj-accent/50 rounded-lg py-2 text-sm font-medium transition-colors"
        >
          Salvar API Key
        </button>
      </div>
    );
  }

  return (
    <div className="bg-dj-panel/60 backdrop-blur-sm rounded-xl p-4 border border-dj-accent/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-dj-accent font-['Orbitron'] text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 111.772 1.054l-1.676 3.139 1.676 3.14a1 1 0 01-1.772 1.053l-1.699-3.18L11 10.677V17a1 1 0 11-2 0v-6.323l-3.954-1.582-1.699 3.181a1 1 0 11-1.772-1.054l1.676-3.139-1.676-3.14a1 1 0 111.772-1.053l1.699 3.18L9 4.323V3a1 1 0 011-1z" />
          </svg>
          Gerador IA Gemini
          {usingLocalMode && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-400 rounded">LOCAL</span>
          )}
        </h3>
        <button
          onClick={() => setShowConfig(true)}
          className="text-xs text-gray-500 hover:text-dj-accent transition-colors"
          title="Reconfigurar API Key"
        >
          ⚙️
        </button>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-500/20 rounded-lg border border-red-500/30">
          <span className="text-xs text-red-400">Erro:</span>
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}
      
      {lastTrackName && !error && (
        <div className="mb-4 p-2 bg-dj-accent/10 rounded-lg border border-dj-accent/20">
          <span className="text-xs text-gray-400">Última faixa:</span>
          <p className="text-sm text-dj-accent font-medium truncate">{lastTrackName}</p>
        </div>
      )}

      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Estilo</label>
          <div className="grid grid-cols-3 gap-2">
            {styles.map((style) => (
              <button
                key={style.value}
                onClick={() => setSelectedStyle(style.value)}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedStyle === style.value
                    ? 'bg-dj-accent text-white'
                    : 'bg-dj-dark/50 text-gray-400 hover:text-white hover:bg-dj-dark'
                }`}
              >
                <span className="mr-1">{style.icon}</span>
                {style.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Mood</label>
          <div className="grid grid-cols-3 gap-2">
            {moods.map((mood) => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedMood === mood.value
                    ? 'bg-dj-secondary text-white'
                    : 'bg-dj-dark/50 text-gray-400 hover:text-white hover:bg-dj-dark'
                }`}
              >
                <span className="mr-1">{mood.icon}</span>
                {mood.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating || disabled}
        className="w-full bg-gradient-to-r from-dj-accent to-dj-secondary hover:from-dj-accent/90 hover:to-dj-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-3 text-sm font-bold transition-all flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Gerando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            Gerar Nova Melodia
          </>
        )}
      </button>
    </div>
  );
}

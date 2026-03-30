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
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 h-full">
        <h2 className="text-blue-400 font-semibold text-sm mb-4">AI CONFIGURATION</h2>
        <div className="space-y-4">
          <div>
            <p className="text-gray-400 text-xs mb-3">
              Get API key at{' '}
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Google AI Studio
              </a>
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 mb-3"
            />
            <button
              onClick={handleSaveApiKey}
              disabled={!apiKey.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-xs font-medium py-2 rounded-lg transition-colors"
            >
              Save API Key
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 h-full flex flex-col">
      <h2 className="text-blue-400 font-semibold text-sm mb-4">AI GENERATOR</h2>
      
      <div className="flex-1 flex flex-col space-y-4">
        <div>
          <label className="text-xs text-gray-400 block mb-2">Style</label>
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            disabled={disabled || isGenerating}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
          >
            {styles.map(style => (
              <option key={style.value} value={style.value}>
                {style.icon} {style.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-2">Mood</label>
          <select
            value={selectedMood}
            onChange={(e) => setSelectedMood(e.target.value)}
            disabled={disabled || isGenerating}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
          >
            {moods.map(mood => (
              <option key={mood.value} value={mood.value}>
                {mood.icon} {mood.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1"></div>

        <button
          onClick={handleGenerate}
          disabled={disabled || isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-xs font-medium py-3 rounded-lg transition-colors"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin"></div>
              Generating...
            </span>
          ) : (
            'Generate Track'
          )}
        </button>

        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {error}
          </div>
        )}

        {usingLocalMode && (
          <div className="text-xs text-gray-400 bg-gray-800 rounded-lg p-3">
            Using local generation mode
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useCallback, useEffect, useRef } from 'react'
import DJDeck from './components/DJDeck'
import Visualizer from './components/Visualizer'
import Controls from './components/Controls'
import { AIGenerator } from './components/AIGenerator'
import { MelodyPattern } from './services/GeminiService'
import TrackInfo from './components/TrackInfo'
import { AudioEngine } from './audio/AudioEngine'

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [audioEngine] = useState(() => new AudioEngine())
  const [currentTrack, setCurrentTrack] = useState<string>('Initializing...')
  const [nextTrack, setNextTrack] = useState<string>('Preparing...')
  const [bpm, setBpm] = useState(128)
  const [masterVolume, setMasterVolume] = useState(80)
  const [arrangementPhase, setArrangementPhase] = useState<'intro' | 'build' | 'drop' | 'break'>('intro')
  const startTimeRef = useRef<number>(0)

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      audioEngine.stop()
      setIsPlaying(false)
      setCurrentTrack('Paused')
    } else {
      setIsInitializing(true)
      try {
        await audioEngine.start()
        setIsPlaying(true)
        startTimeRef.current = Date.now()
        setCurrentTrack('Playing')
        setNextTrack('Ready')
      } catch (error) {
        console.error('Failed to start audio:', error)
        setCurrentTrack('Error - Click Start again')
      } finally {
        setIsInitializing(false)
      }
    }
  }, [isPlaying, audioEngine])

  // Keyboard shortcut: Space to play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault()
        handlePlayPause()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePlayPause])

  const handleBpmChange = useCallback((newBpm: number) => {
    setBpm(newBpm)
    audioEngine.setBpm(newBpm)
  }, [audioEngine])

  const handleVolumeChange = useCallback((volume: number) => {
    setMasterVolume(volume)
    audioEngine.setMasterVolume(volume / 100)
  }, [audioEngine])

  // Update arrangement phase periodically
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setArrangementPhase(audioEngine.getArrangementPhase())
    }, 500)

    return () => clearInterval(interval)
  }, [isPlaying, audioEngine])

  const handlePatternGenerated = useCallback((pattern: MelodyPattern) => {
    audioEngine.applyAIPattern(pattern)
    setCurrentTrack(pattern.trackName || 'AI Generated')
    setBpm(pattern.bpm)
  }, [audioEngine])

  return (
    <div className="min-h-screen bg-gradient-to-br from-dj-dark via-[#1a1a2e] to-dj-dark text-white overflow-hidden">
      <header className="px-6 py-4 border-b border-dj-accent/20 bg-dj-panel/50 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dj-accent to-dj-secondary flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold font-['Orbitron'] neon-text">MELODIC BOT</h1>
              <p className="text-xs text-dj-accent/70">AI-Powered Producer • Modern Electronic Music</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-3xl font-mono font-bold text-dj-accent">{bpm}</div>
              <div className="text-xs text-gray-400">BPM</div>
            </div>
            <div className={`px-4 py-2 rounded-lg font-mono text-sm transition-all duration-300 ${
              isInitializing 
                ? 'bg-yellow-500/20 text-yellow-400 animate-pulse' 
                : isPlaying 
                  ? 'bg-dj-success/20 text-dj-success' 
                  : 'bg-dj-secondary/20 text-dj-secondary'
            }`}>
              {isInitializing ? '◉ INIT...' : isPlaying ? '● LIVE' : '○ STANDBY'}
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <AIGenerator 
              currentBpm={bpm}
              onPatternGenerated={handlePatternGenerated}
              disabled={isInitializing}
            />
            <TrackInfo 
              title={currentTrack} 
              label="NOW PLAYING" 
              isActive={isPlaying}
              bpm={bpm}
            />
            <TrackInfo 
              title={nextTrack} 
              label="UP NEXT" 
              isActive={false}
              bpm={bpm}
            />
            <Controls
              isPlaying={isPlaying}
              bpm={bpm}
              volume={masterVolume}
              arrangementPhase={arrangementPhase}
              onPlayPause={handlePlayPause}
              onBpmChange={handleBpmChange}
              onVolumeChange={handleVolumeChange}
              disabled={isInitializing}
            />
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <DJDeck 
                deckNumber={1} 
                isPlaying={isPlaying}
                isActive={true}
                bpm={bpm}
                onTrackChange={(track) => setCurrentTrack(track)}
                audioEngine={audioEngine}
              />
              <DJDeck 
                deckNumber={2} 
                isPlaying={isPlaying}
                isActive={false}
                bpm={bpm}
                onTrackChange={(track) => setNextTrack(track)}
                audioEngine={audioEngine}
              />
            </div>
            <Visualizer audioEngine={audioEngine} isPlaying={isPlaying} />
          </div>

          <div className="lg:col-span-3">
            <div className="bg-dj-panel/60 backdrop-blur-sm rounded-xl p-4 border border-dj-accent/20 h-full">
              <h3 className="text-dj-accent font-['Orbitron'] text-sm mb-4">GENERATOR STATUS</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Melody Engine</span>
                  <span className="text-dj-success">● Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Drum Synthesis</span>
                  <span className="text-dj-success">● Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bass Generator</span>
                  <span className="text-dj-success">● Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">FX Processor</span>
                  <span className="text-dj-success">● Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mixer</span>
                  <span className="text-dj-success">● Active</span>
                </div>
                <hr className="border-dj-accent/20" />
                <div className="text-xs text-gray-500 mt-4">
                  <p>Generating modern electronic music with acid basslines, supersaw leads, and dynamic FX.</p>
                  <p className="mt-2">Features: Sidechain compression, layered drums, arpeggios, risers & impacts.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

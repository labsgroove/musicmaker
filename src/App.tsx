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
    <div className="min-h-screen bg-gray-950 text-white flex flex-col overflow-hidden" style={{width: '100vw', height: '100vh'}}>
      {/* Header Profissional */}
      <header className="px-6 py-4 border-b border-gray-800 bg-gray-900" style={{width: '100%'}}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">MELODIC BOT</h1>
            <span className="text-sm text-gray-400">AI Music Producer</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-lg font-mono text-blue-400">{bpm} BPM</div>
            <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
              isInitializing 
                ? 'bg-yellow-500/20 text-yellow-400' 
                : isPlaying 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-gray-500/20 text-gray-400'
            }`}>
              {isInitializing ? 'INITIALIZING' : isPlaying ? 'LIVE' : 'READY'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout Profissional */}
      <main className="flex-1 p-6 overflow-hidden" style={{width: '100%'}}>
        <div className="h-full w-full grid grid-cols-12 gap-6" style={{width: '100%', height: '100%'}}>
          {/* Coluna Esquerda - AI Generator */}
          <div className="col-span-3" style={{width: '25%', height: '100%'}}>
            <AIGenerator 
              currentBpm={bpm}
              onPatternGenerated={handlePatternGenerated}
              disabled={isInitializing}
            />
          </div>

          {/* Coluna Central - Decks */}
          <div className="col-span-6" style={{width: '50%', height: '100%'}}>
            <div className="h-full grid grid-cols-2 gap-4">
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
          </div>

          {/* Coluna Direita - Controles e Info */}
          <div className="col-span-3 flex flex-col gap-4" style={{width: '25%', height: '100%'}}>
            {/* Track Info */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <h3 className="text-blue-400 font-semibold text-sm mb-3">NOW PLAYING</h3>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Current</div>
                  <div className={`text-sm font-medium ${isPlaying ? 'text-green-400' : 'text-gray-400'}`}>
                    {currentTrack}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Next</div>
                  <div className="text-sm font-medium text-gray-400">
                    {nextTrack}
                  </div>
                </div>
              </div>
            </div>

            {/* Controles */}
            <div className="flex-1">
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

            {/* System Status */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <h3 className="text-blue-400 font-semibold text-sm mb-3">SYSTEM STATUS</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Engine</span>
                  <span className="text-green-400">● Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Generator</span>
                  <span className="text-green-400">● Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mixer</span>
                  <span className="text-green-400">● Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Visualizer Footer */}
      <div className="h-24 border-t border-gray-800 bg-gray-900" style={{width: '100%'}}>
        <div className="w-full h-full p-4">
          <Visualizer audioEngine={audioEngine} isPlaying={isPlaying} />
        </div>
      </div>
    </div>
  )
}

export default App

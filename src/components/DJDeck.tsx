import { useState } from 'react'

interface DJDeckProps {
  deckNumber: number
  isPlaying: boolean
  isActive: boolean
  bpm: number
  onTrackChange?: (track: string) => void
  audioEngine: { getAnalyser?: () => AnalyserNode | null }
}

export default function DJDeck({ deckNumber, isPlaying, isActive, bpm }: DJDeckProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [cuePressed, setCuePressed] = useState(false)

  const getRotationStyle = () => ({
    animation: isPlaying ? `vinyl-spin ${60 / bpm * 2}s linear infinite` : 'none'
  })

  const handleCueClick = () => {
    setCuePressed(true)
    setTimeout(() => setCuePressed(false), 150)
  }

  return (
    <div 
      className={`bg-gray-900 rounded-xl p-4 border transition-all ${
        isActive ? 'border-blue-500' : 'border-gray-800'
      } ${isHovered ? 'transform scale-[1.02]' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-blue-400 font-bold text-sm">DECK {deckNumber}</h3>
        <div 
          className={`w-3 h-3 rounded-full transition-all ${
            isActive && isPlaying 
              ? 'bg-green-400 animate-pulse' 
              : 'bg-gray-600'
          }`}
          title={isActive && isPlaying ? 'Playing' : 'Stopped'}
        />
      </div>

      <div className="relative aspect-square mb-4">
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center"
          style={getRotationStyle()}
        >
          <div className="w-4/5 h-4/5 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-gray-600 flex items-center justify-center">
            <div className="w-1/3 h-1/3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
          </div>
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-6 bg-gray-500 rounded-full" />
        </div>
        
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 pointer-events-none" />
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-400">PITCH</span>
            <span className="text-blue-400 font-mono">±0%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-600 z-10 transform -translate-x-1/2" />
            <div className="h-full w-1/2 bg-blue-500 rounded-full" />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-400">GAIN</span>
            <span className="text-blue-400 font-mono">85%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full w-[85%] bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" />
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-3 mt-4">
        <button 
          onClick={handleCueClick}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            cuePressed 
              ? 'bg-blue-500 text-white transform scale-95' 
              : 'bg-gray-800 hover:bg-gray-700 text-blue-400'
          } focus:outline-none focus:ring-2 focus:ring-blue-400/50`}
          title="Cue"
          aria-label="Cue"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>
        <button 
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all transform active:scale-95 ${
            isPlaying 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } focus:outline-none focus:ring-2 focus:ring-blue-400/50`}
          title={isPlaying ? "Pause deck" : "Start deck"}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            {isPlaying ? (
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            ) : (
              <path d="M8 5v14l11-7z"/>
            )}
          </svg>
        </button>
        <button 
          className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          title="Sync"
          aria-label="Sync"
        >
          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

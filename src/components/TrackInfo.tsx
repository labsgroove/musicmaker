import { useState, useEffect } from 'react'

interface TrackInfoProps {
  title: string
  label: string
  isActive: boolean
  bpm: number
}

const modernPrefixes = ['Acid', 'Melodic', 'Deep', 'Progressive', 'Raw', 'Analog', 'Berlin', 'Detroit', 'Hypnotic', 'Resonant', 'Saw', 'FM', 'Granular', 'Wavetable']
const modernSuffixes = ['Sequence', 'Bassline', 'Arp', 'Pluck', 'Pad', 'Riser', 'Drop', 'Build', 'Texture', 'Sustain']
const genres = ['Melodic Techno', 'Acid House', 'Tech House', 'Progressive House', 'Deep Techno', 'Peak Time Techno']

const generateTrackName = () => {
  const prefix = modernPrefixes[Math.floor(Math.random() * modernPrefixes.length)]
  const suffix = modernSuffixes[Math.floor(Math.random() * modernSuffixes.length)]
  const number = String(Math.floor(Math.random() * 99)).padStart(2, '0')
  return `${prefix} ${suffix} ${number}`
}

export default function TrackInfo({ title, label, isActive, bpm }: TrackInfoProps) {
  const [displayTitle, setDisplayTitle] = useState(title)

  useEffect(() => {
    if (title === 'Initializing...' || title === 'Preparing...') {
      setDisplayTitle(title)
    } else {
      setDisplayTitle(generateTrackName())
    }
  }, [title])

  return (
    <div className={`bg-dj-panel/60 backdrop-blur-sm rounded-xl p-4 border transition-all duration-300 ${
      isActive ? 'border-dj-accent/50' : 'border-dj-accent/10'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-mono ${isActive ? 'text-dj-success' : 'text-gray-500'}`}>
          {label}
        </span>
        {isActive && (
          <div className="flex gap-0.5">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i}
                className="w-1 bg-dj-success rounded-full animate-equalizer"
                style={{ 
                  height: '12px',
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: `${0.4 + i * 0.1}s`
                }}
              />
            ))}
          </div>
        )}
      </div>
      <h3 className="font-['Orbitron'] text-lg font-semibold text-white truncate" title={displayTitle}>
        {displayTitle}
      </h3>
      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <span>{genres[Math.floor(Math.random() * genres.length)]}</span>
        <span className="font-mono">{bpm} BPM</span>
      </div>
      {isActive && (
        <div className="mt-3 flex gap-1">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className="h-1 flex-1 bg-dj-accent/30 rounded-full overflow-hidden"
            >
              <div 
                className="h-full bg-dj-accent rounded-full"
                style={{
                  width: `${Math.random() * 100}%`,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

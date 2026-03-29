interface ControlsProps {
  isPlaying: boolean
  bpm: number
  volume: number
  arrangementPhase?: 'intro' | 'build' | 'drop' | 'break'
  onPlayPause: () => void
  onBpmChange: (bpm: number) => void
  onVolumeChange: (volume: number) => void
  disabled?: boolean
}

export default function Controls({ 
  isPlaying, 
  bpm, 
  volume, 
  arrangementPhase = 'intro',
  onPlayPause, 
  onBpmChange, 
  onVolumeChange,
  disabled = false
}: ControlsProps) {
  return (
    <div className="bg-dj-panel/60 backdrop-blur-sm rounded-xl p-4 border border-dj-accent/20">
      <div className="space-y-4">
        <button
          onClick={onPlayPause}
          disabled={disabled}
          aria-label={isPlaying ? 'Parar reprodução' : 'Iniciar reprodução'}
          title={isPlaying ? 'Parar (Space)' : 'Iniciar (Space)'}
          className={`w-full py-4 rounded-lg font-['Orbitron'] font-bold text-lg transition-all duration-200 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-dj-accent/50 disabled:opacity-50 disabled:cursor-not-allowed ${
            isPlaying 
              ? 'bg-dj-secondary/20 border-2 border-dj-secondary text-dj-secondary hover:bg-dj-secondary/30 hover:shadow-[0_0_15px_rgba(255,0,110,0.3)]' 
              : 'bg-dj-success/20 border-2 border-dj-success text-dj-success hover:bg-dj-success/30 animate-glow'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            {isPlaying ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
                STOP
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                START
              </>
            )}
          </span>
        </button>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400 font-medium tracking-wide">TEMPO</span>
            <span className="text-dj-accent font-mono font-bold">{bpm} BPM</span>
          </div>
          <input
            type="range"
            min="100"
            max="180"
            value={bpm}
            onChange={(e) => onBpmChange(Number(e.target.value))}
            aria-label="Controle de velocidade BPM"
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-dj-accent hover:accent-dj-accent/80 transition-all slider-thumb"
            style={{
              background: `linear-gradient(to right, #00d4ff 0%, #00d4ff ${((bpm - 100) / 80) * 100}%, #1f2937 ${((bpm - 100) / 80) * 100}%, #1f2937 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>100</span>
            <span className="text-dj-accent/50">140</span>
            <span>180</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400 font-medium tracking-wide">MASTER</span>
            <span className="text-dj-accent font-mono font-bold">{volume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            aria-label="Controle de volume master"
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-dj-accent hover:accent-dj-accent/80 transition-all"
            style={{
              background: `linear-gradient(to right, #00d4ff 0%, #00d4ff ${volume}%, #1f2937 ${volume}%, #1f2937 100%)`
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            className="py-2 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-xs text-gray-300 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-dj-accent/30 disabled:opacity-50"
            title="Automix (em breve)"
            disabled
          >
            <span className="flex items-center justify-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              AUTO MIX
            </span>
          </button>
          <div
            className={`py-2 px-3 rounded-lg text-xs transition-all duration-150 flex items-center justify-center gap-1 ${
              arrangementPhase === 'drop'
                ? 'bg-dj-secondary/30 text-dj-secondary border border-dj-secondary/50'
                : arrangementPhase === 'build'
                  ? 'bg-dj-accent/30 text-dj-accent border border-dj-accent/50'
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
            title={`Phase: ${arrangementPhase.toUpperCase()}`}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>
            </svg>
            {arrangementPhase.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  )
}

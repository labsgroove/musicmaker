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
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 h-full flex flex-col">
      <h2 className="text-blue-400 font-semibold text-sm mb-4">CONTROLS</h2>
      
      <div className="flex-1 flex flex-col space-y-4">
        {/* Play/Pause Button */}
        <button
          onClick={onPlayPause}
          disabled={disabled}
          aria-label={isPlaying ? 'Stop playback' : 'Start playback'}
          title={isPlaying ? 'Stop (Space)' : 'Start (Space)'}
          className={`w-full py-4 rounded-xl font-bold text-sm transition-all transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed ${
            isPlaying 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
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

        {/* BPM Control */}
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-400">BPM</span>
            <span className="text-blue-400 font-mono font-bold">{bpm}</span>
          </div>
          <input
            type="range"
            min="100"
            max="180"
            value={bpm}
            onChange={(e) => onBpmChange(Number(e.target.value))}
            aria-label="BPM control"
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((bpm - 100) / 80) * 100}%, #374151 ${((bpm - 100) / 80) * 100}%, #374151 100%)`
            }}
          />
        </div>

        {/* Volume Control */}
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-400">VOLUME</span>
            <span className="text-blue-400 font-mono font-bold">{volume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            aria-label="Volume control"
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #374151 ${volume}%, #374151 100%)`
            }}
          />
        </div>

        {/* Phase Indicator */}
        <div className="flex-1 flex items-end">
          <div className="w-full">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-400">PHASE</span>
              <span className="text-blue-400 font-mono">{arrangementPhase.toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="py-2 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition-colors disabled:opacity-50"
                title="Automix (coming soon)"
                disabled
              >
                AUTO MIX
              </button>
              <div
                className={`py-2 px-3 rounded-lg text-xs flex items-center justify-center ${
                  arrangementPhase === 'drop'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : arrangementPhase === 'build'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}
                title={`Phase: ${arrangementPhase}`}
              >
                {arrangementPhase.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

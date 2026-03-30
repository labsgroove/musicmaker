import { useEffect, useRef, useCallback } from 'react'
// Visualizer component

interface VisualizerProps {
  audioEngine: { getAnalyser?: () => AnalyserNode | null }
  isPlaying: boolean
}

export default function Visualizer({ audioEngine, isPlaying }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const barsRef = useRef<number[]>(new Array(64).fill(0))

  const getAudioData = useCallback(() => {
    const analyser = audioEngine.getAnalyser?.()
    if (analyser && isPlaying) {
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(dataArray)
      return dataArray
    }
    return null
  }, [audioEngine, isPlaying])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2
      canvas.height = canvas.offsetHeight * 2
      ctx.scale(2, 2)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      
      ctx.fillStyle = 'rgba(17, 24, 39, 0.3)'
      ctx.fillRect(0, 0, width, height)

      const barCount = 32
      const barWidth = width / barCount
      const barGap = 1

      const audioData = getAudioData()

      for (let i = 0; i < barCount; i++) {
        let barHeight: number
        
        if (audioData && isPlaying) {
          const dataIndex = Math.floor((i / barCount) * (audioData.length / 2))
          const value = audioData[dataIndex] || 0
          barHeight = (value / 255) * height * 0.8
        } else {
          const targetHeight = isPlaying ? Math.random() * height * 0.3 : 0
          barsRef.current[i] += (targetHeight - barsRef.current[i]) * 0.1
          barHeight = barsRef.current[i]
        }

        const h = Math.max(1, barHeight)
        const x = i * barWidth + barGap / 2
        const y = (height - h) / 2

        const gradient = ctx.createLinearGradient(0, y, 0, y + h)
        gradient.addColorStop(0, '#3b82f6')
        gradient.addColorStop(1, '#60a5fa')

        ctx.fillStyle = gradient
        ctx.fillRect(x, y, barWidth - barGap, h)
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying])

  return (
    <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 h-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-blue-400 font-semibold text-xs">AUDIO VISUALIZER</span>
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className={`w-0.5 h-3 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
      <canvas 
        ref={canvasRef}
        className="w-full h-16 rounded-lg bg-gray-900"
      />
    </div>
  )
}

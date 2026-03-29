export class AudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private bpm = 128
  private isRunning = false
  private nextNoteTime = 0
  private beatCount = 0
  private barCount = 0
  private timerID: number | null = null
  private lookahead = 25
  private scheduleAheadTime = 0.1

  private drumGain: GainNode | null = null
  private bassGain: GainNode | null = null
  private synthGain: GainNode | null = null
  private fxGain: GainNode | null = null

  private currentPattern: number[] = []
  private bassPattern: number[] = []
  private synthPattern: number[] = []
  private scale: number[] = []

  constructor() {
    this.generateNewPattern()
  }

  private generateNewPattern() {
    this.currentPattern = Array(16).fill(0).map(() => Math.random() > 0.3 ? 1 : 0)
    this.bassPattern = Array(16).fill(0).map(() => Math.random() > 0.4 ? 1 : 0)
    this.synthPattern = Array(16).fill(0).map(() => Math.random() > 0.6 ? 1 : 0)
    
    const baseFreq = 55
    this.scale = [
      baseFreq,
      baseFreq * 1.125,
      baseFreq * 1.25,
      baseFreq * 1.333,
      baseFreq * 1.5,
      baseFreq * 1.667,
      baseFreq * 1.875,
      baseFreq * 2,
    ]
  }

  start() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.setupAudioGraph()
    }
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }

    this.isRunning = true
    this.nextNoteTime = this.ctx.currentTime
    this.beatCount = 0
    this.barCount = 0
    this.scheduler()
  }

  stop() {
    this.isRunning = false
    if (this.timerID) {
      clearTimeout(this.timerID)
      this.timerID = null
    }
  }

  private setupAudioGraph() {
    if (!this.ctx) return

    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.7

    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 256

    this.drumGain = this.ctx.createGain()
    this.drumGain.gain.value = 0.8
    
    this.bassGain = this.ctx.createGain()
    this.bassGain.gain.value = 0.7
    
    this.synthGain = this.ctx.createGain()
    this.synthGain.gain.value = 0.5
    
    this.fxGain = this.ctx.createGain()
    this.fxGain.gain.value = 0.3

    const drumCompressor = this.ctx.createDynamicsCompressor()
    drumCompressor.threshold.value = -12
    drumCompressor.ratio.value = 4

    const bassCompressor = this.ctx.createDynamicsCompressor()
    bassCompressor.threshold.value = -18
    bassCompressor.ratio.value = 3

    this.drumGain.connect(drumCompressor)
    drumCompressor.connect(this.masterGain)

    this.bassGain.connect(bassCompressor)
    bassCompressor.connect(this.masterGain)

    this.synthGain.connect(this.masterGain)
    this.fxGain.connect(this.masterGain)

    this.masterGain.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)

    this.generateNewPattern()
  }

  private scheduler() {
    while (this.nextNoteTime < this.ctx!.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.beatCount, this.nextNoteTime)
      this.nextNote()
    }
    
    if (this.isRunning) {
      this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead)
    }
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / this.bpm
    this.nextNoteTime += 0.25 * secondsPerBeat
    this.beatCount++
    
    if (this.beatCount === 16) {
      this.beatCount = 0
      this.barCount++
      
      if (this.barCount % 4 === 0) {
        this.generateNewPattern()
      }
    }
  }

  private scheduleNote(beatNumber: number, time: number) {
    const step = beatNumber % 16

    if (this.currentPattern[step]) {
      if (step % 4 === 0) {
        this.playKick(time)
      } else if (step % 2 === 0) {
        this.playSnare(time)
      } else {
        this.playHihat(time)
      }
    }

    if (this.bassPattern[step] && this.bassGain) {
      this.playBass(time, step)
    }

    if (this.synthPattern[step] && this.synthGain) {
      this.playSynth(time, step)
    }

    if (Math.random() > 0.9) {
      this.playFX(time)
    }
  }

  private playKick(time: number) {
    if (!this.ctx || !this.drumGain) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.connect(gain)
    gain.connect(this.drumGain!)

    osc.frequency.setValueAtTime(150, time)
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5)

    gain.gain.setValueAtTime(1, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5)

    osc.start(time)
    osc.stop(time + 0.5)
  }

  private playSnare(time: number) {
    if (!this.ctx || !this.drumGain) return

    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1
    }

    const noise = this.ctx.createBufferSource()
    noise.buffer = noiseBuffer

    const noiseFilter = this.ctx.createBiquadFilter()
    noiseFilter.type = 'highpass'
    noiseFilter.frequency.value = 1000

    const noiseGain = this.ctx.createGain()
    noiseGain.gain.setValueAtTime(0.7, time)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2)

    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(this.drumGain)

    const osc = this.ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(180, time)
    
    const oscGain = this.ctx.createGain()
    oscGain.gain.setValueAtTime(0.5, time)
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1)

    osc.connect(oscGain)
    oscGain.connect(this.drumGain)

    noise.start(time)
    noise.stop(time + 0.2)
    osc.start(time)
    osc.stop(time + 0.1)
  }

  private playHihat(time: number) {
    if (!this.ctx || !this.drumGain) return

    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate)
    const output = buffer.getChannelData(0)
    for (let i = 0; i < buffer.length; i++) {
      output[i] = Math.random() * 2 - 1
    }

    const noise = this.ctx.createBufferSource()
    noise.buffer = buffer

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 8000

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.3, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.drumGain)

    noise.start(time)
    noise.stop(time + 0.05)
  }

  private playBass(time: number, step: number) {
    if (!this.ctx || !this.bassGain) return

    const note = this.scale[step % this.scale.length]
    
    const osc = this.ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(note, time)

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(200, time)
    filter.frequency.linearRampToValueAtTime(800, time + 0.1)
    filter.frequency.exponentialRampToValueAtTime(200, time + 0.4)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.6, time)
    gain.gain.exponentialRampToValueAtTime(0.3, time + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.bassGain)

    osc.start(time)
    osc.stop(time + 0.5)
  }

  private playSynth(time: number, step: number) {
    if (!this.ctx || !this.synthGain) return

    const note = this.scale[(step * 2) % this.scale.length] * 2
    
    const osc = this.ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(note, time)

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = 5
    filter.frequency.setValueAtTime(1000, time)
    filter.frequency.linearRampToValueAtTime(2000, time + 0.2)
    filter.frequency.exponentialRampToValueAtTime(500, time + 0.6)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(0.3, time + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.6)

    const lfo = this.ctx.createOscillator()
    lfo.frequency.value = 8
    const lfoGain = this.ctx.createGain()
    lfoGain.gain.value = 500
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    lfo.start(time)
    lfo.stop(time + 0.6)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.synthGain)

    osc.start(time)
    osc.stop(time + 0.6)
  }

  private playFX(time: number) {
    if (!this.ctx || !this.fxGain) return

    const delay = this.ctx.createDelay()
    delay.delayTime.value = 0.375 * (60 / this.bpm)

    const feedback = this.ctx.createGain()
    feedback.gain.value = 0.4

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 2000

    const note = this.scale[Math.floor(Math.random() * this.scale.length)] * 4
    
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(note, time)
    osc.frequency.exponentialRampToValueAtTime(note * 0.5, time + 1)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.2, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 1.5)

    delay.connect(feedback)
    feedback.connect(filter)
    filter.connect(delay)

    osc.connect(gain)
    gain.connect(this.fxGain)
    gain.connect(delay)
    delay.connect(this.fxGain)

    osc.start(time)
    osc.stop(time + 1.5)
  }

  setBpm(newBpm: number) {
    this.bpm = newBpm
  }

  setMasterVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = volume
    }
  }

  getAnalyser() {
    return this.analyser
  }
}

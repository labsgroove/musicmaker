export interface FXChain {
  input: GainNode
  output: GainNode
}

export class AudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private masterLimiter: DynamicsCompressorNode | null = null
  private analyser: AnalyserNode | null = null
  private bpm = 128
  private isRunning = false
  private nextNoteTime = 0
  private beatCount = 0
  private barCount = 0
  private timerID: number | null = null
  private lookahead = 25
  private scheduleAheadTime = 0.1

  // Mix busses
  private drumBus: GainNode | null = null
  private bassBus: GainNode | null = null
  private synthBus: GainNode | null = null
  private fxBus: GainNode | null = null
  private padBus: GainNode | null = null
  private percBus: GainNode | null = null

  // Sidechain compression
  private sidechainGain: GainNode | null = null

  // Patterns with velocity and groove
  private kickPattern: Array<{ active: boolean; velocity: number; offset: number }> = []
  private snarePattern: Array<{ active: boolean; velocity: number }> = []
  private hihatPattern: Array<{ active: boolean; open: boolean; velocity: number }> = []
  private percPattern: Array<{ active: boolean; velocity: number; type: 'clap' | 'rim' | 'tom' }> = []
  private bassPattern: Array<{ active: boolean; note: number; slide: boolean; accent: boolean }> = []
  private synthPattern: Array<{ active: boolean; note: number; velocity: number }> = []
  private arpPattern: number[] = []

  // Musical scales
  private currentScale: number[] = []
  private currentKey = 0
  private progression = 0

  // Arrangement state
  private arrangementPhase: 'intro' | 'build' | 'drop' | 'break' = 'intro'
  private intensity = 0.3
  private filterCutoff = 200
  private targetFilterCutoff = 200

  // FX state
  private reverbNode: ConvolverNode | null = null
  private delayNode: DelayNode | null = null
  private delayFeedback: GainNode | null = null

  constructor() {
    this.generateNewPattern()
  }

  private generateScale(rootFreq: number, mode: 'minor' | 'phrygian' | 'pentatonic' = 'minor') {
    const ratios = {
      minor: [1, 1.125, 1.2, 1.25, 1.333, 1.5, 1.667, 2],
      phrygian: [1, 1.059, 1.2, 1.25, 1.414, 1.5, 1.667, 2],
      pentatonic: [1, 1.125, 1.25, 1.5, 1.667, 2, 2.25, 2.5],
    }
    return ratios[mode].map(r => rootFreq * r)
  }

  private generateNewPattern() {
    const baseFreq = 55 * Math.pow(2, this.currentKey / 12)

    // Rotate through musical modes for variety
    const modes: Array<'minor' | 'phrygian' | 'pentatonic'> = ['minor', 'phrygian', 'pentatonic']
    this.currentScale = this.generateScale(baseFreq, modes[this.barCount % 3])

    // Generate kick pattern with groove (techno-style)
    this.kickPattern = Array(16).fill(null).map((_, i) => ({
      active: i % 4 === 0 || (i === 10 && Math.random() > 0.5),
      velocity: i % 4 === 0 ? 1 : 0.6 + Math.random() * 0.3,
      offset: i % 2 !== 0 ? 0.02 : 0 // Swing on off-beats
    }))

    // Snare on 2 and 4 with ghost notes
    this.snarePattern = Array(16).fill(null).map((_, i) => ({
      active: i === 4 || i === 12 || (i === 6 && Math.random() > 0.7),
      velocity: i === 4 || i === 12 ? 0.9 : 0.4
    }))

    // Hi-hats with open/closed variation
    this.hihatPattern = Array(16).fill(null).map((_, i) => ({
      active: i % 2 !== 0 || (i % 4 === 2 && Math.random() > 0.3),
      open: i === 14 || (i === 6 && Math.random() > 0.7),
      velocity: 0.5 + Math.random() * 0.4
    }))

    // Percussion fills
    this.percPattern = Array(16).fill(null).map((_, i) => {
      const types: Array<'clap' | 'rim' | 'tom'> = ['clap', 'rim', 'tom']
      return {
        active: (i === 7 || i === 15 || (i === 3 && Math.random() > 0.6)),
        velocity: 0.5 + Math.random() * 0.3,
        type: types[Math.floor(Math.random() * types.length)]
      }
    })

    // Bass pattern - melodic with slides
    this.bassPattern = Array(16).fill(null).map((_, i) => {
      const noteIndex = Math.floor(Math.random() * 5)
      const prevNote = i > 0 ? this.bassPattern[i - 1]?.note : 0
      return {
        active: i % 2 === 0 && Math.random() > 0.2,
        note: noteIndex,
        slide: prevNote !== undefined && Math.random() > 0.6,
        accent: i % 4 === 0
      }
    })

    // Synth pattern - more melodic
    this.synthPattern = Array(16).fill(null).map((_, i) => ({
      active: i % 4 === 0 || (i % 4 === 2 && Math.random() > 0.4) || (i === 15 && Math.random() > 0.5),
      note: Math.floor(Math.random() * 7),
      velocity: 0.4 + Math.random() * 0.4
    }))

    // Arpeggio pattern
    this.arpPattern = [0, 2, 4, 7, 4, 2, 0, -2].map(n => ((n % 8) + 8) % 8)
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
    this.nextNoteTime = this.ctx!.currentTime
    this.beatCount = 0
    this.barCount = 0
    this.progression = 0
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

    // Master chain
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.75

    this.masterLimiter = this.ctx.createDynamicsCompressor()
    this.masterLimiter.threshold.value = -2
    this.masterLimiter.knee.value = 2
    this.masterLimiter.ratio.value = 20
    this.masterLimiter.attack.value = 0.003
    this.masterLimiter.release.value = 0.1

    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 512

    // Mix busses
    this.drumBus = this.ctx.createGain()
    this.drumBus.gain.value = 0.9

    this.percBus = this.ctx.createGain()
    this.percBus.gain.value = 0.6

    this.bassBus = this.ctx.createGain()
    this.bassBus.gain.value = 0.8

    this.synthBus = this.ctx.createGain()
    this.synthBus.gain.value = 0.55

    this.padBus = this.ctx.createGain()
    this.padBus.gain.value = 0.4

    this.fxBus = this.ctx.createGain()
    this.fxBus.gain.value = 0.5

    // Sidechain gain (modulated by kick)
    this.sidechainGain = this.ctx.createGain()
    this.sidechainGain.gain.value = 1

    // FX chain - Reverb
    this.createReverb()

    // FX chain - Delay
    this.delayNode = this.ctx.createDelay(2)
    this.delayNode.delayTime.value = 0.375 * (60 / this.bpm)
    this.delayFeedback = this.ctx.createGain()
    this.delayFeedback.gain.value = 0.35

    // Compressors for glue
    const drumComp = this.ctx.createDynamicsCompressor()
    drumComp.threshold.value = -8
    drumComp.ratio.value = 3
    drumComp.attack.value = 0.01
    drumComp.release.value = 0.1

    const bassComp = this.ctx.createDynamicsCompressor()
    bassComp.threshold.value = -12
    bassComp.ratio.value = 4
    bassComp.attack.value = 0.02
    bassComp.release.value = 0.2

    // Routing
    this.drumBus.connect(drumComp)
    drumComp.connect(this.sidechainGain)
    this.sidechainGain.connect(this.masterGain)

    this.percBus.connect(drumComp)

    this.bassBus.connect(bassComp)
    bassComp.connect(this.sidechainGain)

    this.synthBus.connect(this.sidechainGain)
    this.synthBus.connect(this.delayNode)

    this.padBus.connect(this.sidechainGain)
    this.padBus.connect(this.delayNode)

    this.delayNode.connect(this.delayFeedback)
    this.delayFeedback.connect(this.delayNode)
    this.delayNode.connect(this.masterGain)

    this.fxBus.connect(this.masterGain)

    this.masterGain.connect(this.masterLimiter)
    this.masterLimiter.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)

    this.generateNewPattern()
  }

  private createReverb() {
    if (!this.ctx) return

    // Create impulse response for reverb
    const rate = this.ctx.sampleRate
    const length = rate * 2.5
    const impulse = this.ctx.createBuffer(2, length, rate)

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 2)
        channelData[i] = (Math.random() * 2 - 1) * decay * 0.5
      }
    }

    this.reverbNode = this.ctx.createConvolver()
    this.reverbNode.buffer = impulse
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
      this.progression++

      // Update arrangement and intensity
      this.updateArrangement()

      if (this.barCount % 4 === 0) {
        this.generateNewPattern()
      }
    }
  }

  private updateArrangement() {
    // Progressive arrangement: intro(4) -> build(4) -> drop(8) -> break(4)
    const phase = this.progression % 20
    if (phase < 4) {
      this.arrangementPhase = 'intro'
      this.intensity = 0.3 + phase * 0.1
    } else if (phase < 8) {
      this.arrangementPhase = 'build'
      this.intensity = 0.5 + (phase - 4) * 0.1
      this.targetFilterCutoff = 800 + (phase - 4) * 300
    } else if (phase < 16) {
      this.arrangementPhase = 'drop'
      this.intensity = 1
      this.targetFilterCutoff = 200
    } else {
      this.arrangementPhase = 'break'
      this.intensity = 0.4
    }

    // Smooth filter transition
    if (this.filterCutoff < this.targetFilterCutoff) {
      this.filterCutoff += (this.targetFilterCutoff - this.filterCutoff) * 0.1
    }
  }

  private scheduleNote(beatNumber: number, time: number) {
    const step = beatNumber % 16

    // Drums
    const kick = this.kickPattern[step]
    if (kick?.active) {
      this.playModernKick(time + kick.offset, kick.velocity)
      // Trigger sidechain
      this.triggerSidechain(time)
    }

    const snare = this.snarePattern[step]
    if (snare?.active) {
      this.playModernSnare(time, snare.velocity)
    }

    const hihat = this.hihatPattern[step]
    if (hihat?.active) {
      this.playModernHihat(time, hihat.open, hihat.velocity)
    }

    const perc = this.percPattern[step]
    if (perc?.active && this.intensity > 0.5) {
      this.playPercussion(time, perc.type, perc.velocity)
    }

    // Bass
    const bass = this.bassPattern[step]
    if (bass?.active) {
      this.playAcidBass(time, bass.note, bass.slide, bass.accent)
    }

    // Synths
    if (this.intensity > 0.4) {
      const synth = this.synthPattern[step]
      if (synth?.active) {
        this.playSupersaw(time, synth.note, synth.velocity)
      }
    }

    // Arpeggio during build/drop
    if ((this.arrangementPhase === 'build' || this.arrangementPhase === 'drop') && step % 2 === 0) {
      const arpNote = this.arpPattern[(step / 2 + this.barCount) % this.arpPattern.length]
      this.playPluck(time, arpNote, 0.3 + this.intensity * 0.3)
    }

    // FX based on arrangement
    if (step === 0 && this.barCount % 8 === 0) {
      this.playImpact(time)
    }

    if (this.arrangementPhase === 'build' && step % 4 === 0) {
      this.playRiser(time, (8 - (this.progression % 8)) / 8)
    }

    if (this.arrangementPhase === 'break' && step % 8 === 0) {
      this.playTexture(time)
    }

    // Pad drone during drop
    if (this.arrangementPhase === 'drop' && step === 0 && this.barCount % 4 === 0) {
      this.playPad(time)
    }
  }

  private triggerSidechain(time: number) {
    if (!this.sidechainGain) return
    this.sidechainGain.gain.setValueAtTime(1, time)
    this.sidechainGain.gain.exponentialRampToValueAtTime(0.3, time + 0.02)
    this.sidechainGain.gain.exponentialRampToValueAtTime(1, time + 0.4)
  }

  // MODERN DRUM SOUNDS

  private playModernKick(time: number, velocity: number) {
    if (!this.ctx || !this.drumBus) return

    const duration = 0.6

    // Layer 1: Click/Transient (high freq snap)
    const clickOsc = this.ctx.createOscillator()
    const clickGain = this.ctx.createGain()
    const clickFilter = this.ctx.createBiquadFilter()

    clickFilter.type = 'highpass'
    clickFilter.frequency.value = 3000

    clickOsc.type = 'triangle'
    clickOsc.frequency.setValueAtTime(800, time)
    clickOsc.frequency.exponentialRampToValueAtTime(100, time + 0.01)

    clickGain.gain.setValueAtTime(velocity * 0.4, time)
    clickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.03)

    clickOsc.connect(clickFilter)
    clickFilter.connect(clickGain)
    clickGain.connect(this.drumBus)

    // Layer 2: Body (mid punch)
    const bodyOsc = this.ctx.createOscillator()
    const bodyGain = this.ctx.createGain()

    bodyOsc.type = 'sine'
    bodyOsc.frequency.setValueAtTime(80, time)
    bodyOsc.frequency.exponentialRampToValueAtTime(40, time + 0.1)

    bodyGain.gain.setValueAtTime(velocity * 0.8, time)
    bodyGain.gain.exponentialRampToValueAtTime(0.01, time + 0.3)

    bodyOsc.connect(bodyGain)
    bodyGain.connect(this.drumBus)

    // Layer 3: Sub (low end)
    const subOsc = this.ctx.createOscillator()
    const subGain = this.ctx.createGain()

    subOsc.type = 'sine'
    subOsc.frequency.setValueAtTime(50, time)
    subOsc.frequency.exponentialRampToValueAtTime(30, time + 0.15)

    subGain.gain.setValueAtTime(velocity, time)
    subGain.gain.exponentialRampToValueAtTime(0.01, time + duration)

    subOsc.connect(subGain)
    subGain.connect(this.drumBus)

    clickOsc.start(time)
    clickOsc.stop(time + 0.05)
    bodyOsc.start(time)
    bodyOsc.stop(time + 0.3)
    subOsc.start(time)
    subOsc.stop(time + duration)
  }

  private playModernSnare(time: number, velocity: number) {
    if (!this.ctx || !this.drumBus) return

    const duration = 0.25

    // Noise component
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = (Math.random() * 2 - 1) * (1 - i / noiseBuffer.length)
    }

    const noise = this.ctx.createBufferSource()
    noise.buffer = noiseBuffer

    const noiseFilter = this.ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 1500
    noiseFilter.Q.value = 1.5

    const noiseGain = this.ctx.createGain()
    noiseGain.gain.setValueAtTime(velocity * 0.7, time)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + duration)

    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(this.drumBus)

    // Tone component
    const toneOsc = this.ctx.createOscillator()
    toneOsc.type = 'triangle'
    toneOsc.frequency.setValueAtTime(200, time)
    toneOsc.frequency.exponentialRampToValueAtTime(150, time + 0.1)

    const toneGain = this.ctx.createGain()
    toneGain.gain.setValueAtTime(velocity * 0.4, time)
    toneGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15)

    toneOsc.connect(toneGain)
    toneGain.connect(this.drumBus)

    noise.start(time)
    noise.stop(time + duration)
    toneOsc.start(time)
    toneOsc.stop(time + 0.15)
  }

  private playModernHihat(time: number, open: boolean, velocity: number) {
    if (!this.ctx || !this.drumBus) return

    const duration = open ? 0.3 : 0.05

    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate)
    const output = buffer.getChannelData(0)
    for (let i = 0; i < buffer.length; i++) {
      output[i] = Math.random() * 2 - 1
    }

    const noise = this.ctx.createBufferSource()
    noise.buffer = buffer

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = open ? 6000 : 9000

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(velocity * (open ? 0.4 : 0.35), time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration)

    // Add metallic resonance
    const resonator = this.ctx.createBiquadFilter()
    resonator.type = 'peaking'
    resonator.frequency.value = 10000
    resonator.Q.value = 5
    resonator.gain.value = 8

    noise.connect(filter)
    filter.connect(resonator)
    resonator.connect(gain)
    gain.connect(this.drumBus)

    noise.start(time)
    noise.stop(time + duration)
  }

  private playPercussion(time: number, type: 'clap' | 'rim' | 'tom', velocity: number) {
    if (!this.ctx || !this.percBus) return

    if (type === 'clap') {
      // Clap - multiple noise bursts
      const burstTimes = [0, 0.015, 0.03]
      burstTimes.forEach((offset, burstIndex) => {
        const buffer = this.ctx!.createBuffer(1, this.ctx!.sampleRate * 0.1, this.ctx!.sampleRate)
        const output = buffer.getChannelData(0)
        for (let j = 0; j < buffer.length; j++) {
          output[j] = Math.random() * 2 - 1
        }

        const noise = this.ctx!.createBufferSource()
        noise.buffer = buffer

        const filter = this.ctx!.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.value = 2000
        filter.Q.value = 2

        const gain = this.ctx!.createGain()
        gain.gain.setValueAtTime(velocity * 0.3 * (1 - burstIndex * 0.2), time + offset)
        gain.gain.exponentialRampToValueAtTime(0.01, time + offset + 0.08)

        noise.connect(filter)
        filter.connect(gain)
        gain.connect(this.percBus!)

        noise.start(time + offset)
        noise.stop(time + offset + 0.1)
      })
    } else if (type === 'rim') {
      // Rimshot - tuned ping
      const osc = this.ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.setValueAtTime(1700, time)

      const filter = this.ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 1700

      const gain = this.ctx.createGain()
      gain.gain.setValueAtTime(velocity * 0.25, time)
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.percBus)

      osc.start(time)
      osc.stop(time + 0.08)
    }
  }

  // MODERN SYNTH SOUNDS

  private playAcidBass(time: number, noteIndex: number, slide: boolean, accent: boolean) {
    if (!this.ctx || !this.bassBus) return

    const freq = this.currentScale[noteIndex % this.currentScale.length]
    const duration = slide ? 0.25 : 0.18
    const vel = accent ? 0.9 : 0.6

    // Sawtooth oscillator for acid sound
    const osc = this.ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(freq, time)

    // Resonant lowpass filter (TB-303 style)
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = 15
    filter.frequency.setValueAtTime(200, time)

    // Filter envelope - the acid sound!
    const filterEnvAmount = accent ? 3000 : 2000
    filter.frequency.linearRampToValueAtTime(filterEnvAmount, time + 0.05)
    if (slide) {
      filter.frequency.linearRampToValueAtTime(400, time + duration)
    } else {
      filter.frequency.exponentialRampToValueAtTime(200, time + duration)
    }

    // Amplitude envelope
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(vel * 0.5, time + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration)

    // Sub oscillator for bass weight
    const subOsc = this.ctx.createOscillator()
    subOsc.type = 'sine'
    subOsc.frequency.setValueAtTime(freq * 0.5, time)

    const subGain = this.ctx.createGain()
    subGain.gain.setValueAtTime(vel * 0.4, time)
    subGain.gain.exponentialRampToValueAtTime(0.01, time + duration)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.bassBus)

    subOsc.connect(subGain)
    subGain.connect(this.bassBus)

    osc.start(time)
    osc.stop(time + duration)
    subOsc.start(time)
    subOsc.stop(time + duration)
  }

  private playSupersaw(time: number, noteIndex: number, velocity: number) {
    if (!this.ctx || !this.synthBus) return

    const freq = this.currentScale[noteIndex % this.currentScale.length] * 2
    const duration = 0.4

    // Create 3 detuned saws for supersaw effect
    const detunes = [-12, 0, 12]

    detunes.forEach((detune) => {
      const osc = this.ctx!.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, time)
      osc.detune.value = detune + (Math.random() * 4 - 2)

      const gain = this.ctx!.createGain()
      gain.gain.setValueAtTime(0, time)
      gain.gain.linearRampToValueAtTime(velocity * 0.15, time + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.01, time + duration)

      // Lowpass filter for warmth
      const filter = this.ctx!.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 4000
      filter.Q.value = 1

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.synthBus!)

      osc.start(time)
      osc.stop(time + duration)
    })
  }

  private playPluck(time: number, noteIndex: number, velocity: number) {
    if (!this.ctx || !this.synthBus) return

    const freq = this.currentScale[noteIndex % this.currentScale.length] * 4
    const duration = 0.25

    // Triangle wave for plucky sound
    const osc = this.ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, time)

    // Fast filter envelope
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = 3
    filter.frequency.setValueAtTime(200, time)
    filter.frequency.exponentialRampToValueAtTime(3000, time + 0.02)
    filter.frequency.exponentialRampToValueAtTime(500, time + duration)

    // Pluck envelope
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(velocity * 0.4, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.synthBus)

    osc.start(time)
    osc.stop(time + duration)
  }

  private playPad(time: number) {
    if (!this.ctx || !this.padBus) return

    const duration = 4 // Long pad
    const baseFreq = this.currentScale[0]

    // Multiple oscillators for rich pad
    const waveforms: OscillatorType[] = ['sawtooth', 'square']
    const intervals = [1, 1.5, 2, 2.5] // Root, fifth, octave, tenth

    waveforms.forEach((wave) => {
      intervals.forEach((interval) => {
        const osc = this.ctx!.createOscillator()
        osc.type = wave
        osc.frequency.setValueAtTime(baseFreq * interval, time)
        osc.detune.value = (Math.random() - 0.5) * 10

        // Slow filter sweep
        const filter = this.ctx!.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(400, time)
        filter.frequency.linearRampToValueAtTime(800, time + duration)
        filter.Q.value = 2

        const gain = this.ctx!.createGain()
        gain.gain.setValueAtTime(0, time)
        gain.gain.linearRampToValueAtTime(0.03, time + 0.5)
        gain.gain.linearRampToValueAtTime(0.01, time + duration)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(this.padBus!)

        osc.start(time)
        osc.stop(time + duration)
      })
    })
  }

  // MODERN FX

  private playRiser(time: number, intensity: number) {
    if (!this.ctx || !this.fxBus) return

    const duration = 2

    // White noise riser
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate)
    const output = buffer.getChannelData(0)
    for (let i = 0; i < buffer.length; i++) {
      output[i] = Math.random() * 2 - 1
    }

    const noise = this.ctx.createBufferSource()
    noise.buffer = buffer

    // Sweeping filter up
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(200, time)
    filter.frequency.exponentialRampToValueAtTime(8000, time + duration)
    filter.Q.value = 5

    // Rising gain
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.01, time)
    gain.gain.exponentialRampToValueAtTime(0.2 * intensity, time + duration * 0.8)
    gain.gain.linearRampToValueAtTime(0, time + duration)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.fxBus)

    noise.start(time)
    noise.stop(time + duration)
  }

  private playImpact(time: number) {
    if (!this.ctx || !this.fxBus) return

    // Sub drop
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(100, time)
    osc.frequency.exponentialRampToValueAtTime(20, time + 0.3)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.6, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5)

    osc.connect(gain)
    gain.connect(this.fxBus)

    // Noise impact
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.3, this.ctx.sampleRate)
    const noiseOut = noiseBuffer.getChannelData(0)
    for (let i = 0; i < noiseBuffer.length; i++) {
      noiseOut[i] = (Math.random() * 2 - 1) * (1 - i / noiseBuffer.length)
    }

    const noise = this.ctx.createBufferSource()
    noise.buffer = noiseBuffer

    const noiseFilter = this.ctx.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.frequency.value = 800

    const noiseGain = this.ctx.createGain()
    noiseGain.gain.setValueAtTime(0.4, time)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.3)

    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(this.fxBus)

    osc.start(time)
    osc.stop(time + 0.5)
    noise.start(time)
    noise.stop(time + 0.3)
  }

  private playTexture(time: number) {
    if (!this.ctx || !this.fxBus) return

    const grainDuration = 2

    // Granular-style texture
    const grainCount = 8
    for (let i = 0; i < grainCount; i++) {
      const grainTime = time + (i * grainDuration) / grainCount + Math.random() * 0.1
      const note = this.currentScale[Math.floor(Math.random() * this.currentScale.length)]

      const osc = this.ctx!.createOscillator()
      osc.type = Math.random() > 0.5 ? 'sine' : 'triangle'
      osc.frequency.setValueAtTime(note * (1 + Math.random()), grainTime)

      const grainGain = this.ctx!.createGain()
      grainGain.gain.setValueAtTime(0, grainTime)
      grainGain.gain.linearRampToValueAtTime(0.05, grainTime + 0.05)
      grainGain.gain.linearRampToValueAtTime(0, grainTime + 0.3)

      const filter = this.ctx!.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 1000 + Math.random() * 2000
      filter.Q.value = 10

      osc.connect(filter)
      filter.connect(grainGain)
      grainGain.connect(this.fxBus!)

      osc.start(grainTime)
      osc.stop(grainTime + 0.3)
    }
  }

  setBpm(newBpm: number) {
    this.bpm = newBpm
    if (this.delayNode) {
      this.delayNode.delayTime.value = 0.375 * (60 / this.bpm)
    }
  }

  setMasterVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = volume * 0.75
    }
  }

  getArrangementPhase(): 'intro' | 'build' | 'drop' | 'break' {
    return this.arrangementPhase
  }

  getIntensity(): number {
    return this.intensity
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  // Apply AI-generated pattern
  applyAIPattern(pattern: {
    scale: 'minor' | 'phrygian' | 'pentatonic'
    key: number
    bpm?: number
    bassPattern: Array<{ step: number; note: number; slide: boolean; accent: boolean }>
    synthPattern: Array<{ step: number; note: number; velocity: number }>
    kickPattern: Array<{ step: number; velocity: number; offset: number }>
    snarePattern: Array<{ step: number; velocity: number }>
    hihatPattern: Array<{ step: number; open: boolean; velocity: number }>
  }) {
    // Update scale and key
    this.currentKey = pattern.key
    const baseFreq = 55 * Math.pow(2, this.currentKey / 12)
    this.currentScale = this.generateScale(baseFreq, pattern.scale)

    // Update BPM if provided
    if (pattern.bpm && pattern.bpm !== this.bpm) {
      this.setBpm(pattern.bpm)
    }

    // Convert AI patterns to internal format (16 steps)
    this.bassPattern = Array(16).fill(null).map((_, i) => {
      const aiNote = pattern.bassPattern.find(p => p.step === i)
      return {
        active: !!aiNote,
        note: aiNote?.note ?? 0,
        slide: aiNote?.slide ?? false,
        accent: aiNote?.accent ?? false
      }
    })

    this.synthPattern = Array(16).fill(null).map((_, i) => {
      const aiNote = pattern.synthPattern.find(p => p.step === i)
      return {
        active: !!aiNote,
        note: aiNote?.note ?? 0,
        velocity: aiNote?.velocity ?? 0.5
      }
    })

    this.kickPattern = Array(16).fill(null).map((_, i) => {
      const aiHit = pattern.kickPattern.find(p => p.step === i)
      return {
        active: !!aiHit,
        velocity: aiHit?.velocity ?? (i % 4 === 0 ? 1 : 0.7),
        offset: aiHit?.offset ?? (i % 2 !== 0 ? 0.02 : 0)
      }
    })

    this.snarePattern = Array(16).fill(null).map((_, i) => {
      const aiHit = pattern.snarePattern.find(p => p.step === i)
      return {
        active: !!aiHit,
        velocity: aiHit?.velocity ?? (i === 4 || i === 12 ? 0.9 : 0.4)
      }
    })

    this.hihatPattern = Array(16).fill(null).map((_, i) => {
      const aiHit = pattern.hihatPattern.find(p => p.step === i)
      return {
        active: !!aiHit,
        open: aiHit?.open ?? false,
        velocity: aiHit?.velocity ?? 0.5
      }
    })

    // Regenerate percussion with random variations
    this.percPattern = Array(16).fill(null).map((_, i) => {
      const types: Array<'clap' | 'rim' | 'tom'> = ['clap', 'rim', 'tom']
      return {
        active: (i === 7 || i === 15 || (i === 3 && Math.random() > 0.6)),
        velocity: 0.5 + Math.random() * 0.3,
        type: types[Math.floor(Math.random() * types.length)]
      }
    })
  }

  getCurrentPatternInfo() {
    return {
      key: this.currentKey,
      scale: this.currentScale,
      bpm: this.bpm
    }
  }
}

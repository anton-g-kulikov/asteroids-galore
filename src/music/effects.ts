import * as Tone from 'tone'
import type { EffectsOut } from '../audio/player'
import { createSlots, type FxNote, type FxPlan } from '../audio/scored'
import { INSTRUMENTS } from './score'
import { useGameContext } from './toneContext'

// The sound effects, v2, played with Tone.js: separate copies of the
// soundtrack's instruments, with the music's settings and the sketch's levels,
// on the effects' own output. So a sound is the same whichever music layers
// are in, and with the music switched off. What each event plays is in
// src/audio/scored.ts. Loaded with the music, after the first tap.

/** `context` is the one the sound effects and the music share. */
export function createEffects(context: AudioContext): EffectsOut {
  useGameContext(context)
  const out = new Tone.Gain(0.5).toDestination()              // the game's sound level, apart from the music
  const verb = new Tone.Reverb({ decay: 2.2, preDelay: 0.02, wet: 1 }).connect(out)
  const wire = <T extends Tone.ToneAudioNode>(node: T, send = 0.2): T => { node.connect(out); node.connect(new Tone.Gain(send).connect(verb)); return node }

  const bell = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.35, sustain: 0.15, release: 0.4 }, volume: -16 }).connect(out)
  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'fatsawtooth', count: 3, spread: 26 } as Partial<Tone.OmniOscillatorOptions>,
    envelope: { attack: 0.03, decay: 0.5, sustain: 0.7, release: 1.2 }, volume: -17,
  }).connect(wire(new Tone.Filter({ frequency: 2400, type: 'lowpass', rolloff: -24, Q: 0.8 }), 0.35))
  const bass = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' }, filter: { Q: 3, type: 'lowpass', rolloff: -24 },
    envelope: { attack: 0.004, decay: 0.3, sustain: 0.35, release: 0.2 },
    filterEnvelope: { attack: 0.003, decay: 0.2, sustain: 0.15, release: 0.2, baseFrequency: 110, octaves: 3.2 }, volume: -5,
  } as Partial<Tone.MonoSynthOptions>).connect(wire(new Tone.Gain(1), 0.05))
  const kick = new Tone.MembraneSynth({ pitchDecay: 0.035, octaves: 7, envelope: { attack: 0.001, decay: 0.32, sustain: 0, release: 0.05 }, volume: -8 }).connect(wire(new Tone.Gain(1), 0.08))
  const snare = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.16, sustain: 0 }, volume: -15 }).connect(wire(new Tone.Filter(1200, 'highpass'), 0.15))
  const hat = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.045, sustain: 0 }, volume: -20 }).connect(wire(new Tone.Filter(7500, 'highpass'), 0.05))
  const arp = new Tone.Synth({ oscillator: { type: 'pulse', width: 0.28 } as Partial<Tone.OmniOscillatorOptions>, envelope: { attack: 0.004, decay: 0.22, sustain: 0.18, release: 0.15 }, volume: -15 })
    .connect(new Tone.Filter(3200, 'lowpass').connect(wire(new Tone.FeedbackDelay({ delayTime: 0.19, feedback: 0.3, wet: 0.25 }), 0.3)))
  const lead = new Tone.MonoSynth({
    portamento: 0.06,
    oscillator: { type: 'fatsawtooth', count: 2, spread: 14 },
    filter: { Q: 1, type: 'lowpass', rolloff: -12 },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.8, release: 0.4 },
    filterEnvelope: { attack: 0.08, decay: 0.4, sustain: 0.6, release: 0.8, baseFrequency: 600, octaves: 2.5 },
    volume: -6,
  } as Partial<Tone.MonoSynthOptions>).connect(new Tone.Filter({ frequency: 2600, type: 'lowpass', rolloff: -12 }).connect(wire(new Tone.Vibrato({ frequency: 5, depth: 0.08 }), 0.3)))

  // the lead's piano, as the effects' own instance: crew left behind (−3 dB, set by measurement; no echo)
  const pianoOut = wire(new Tone.Gain(Tone.dbToGain(-3)), 0.5)
  const piano = [
    new Tone.PolySynth(Tone.Synth, INSTRUMENTS.pianoBody as unknown as Partial<Tone.SynthOptions>).connect(pianoOut),
    new Tone.PolySynth(Tone.FMSynth, INSTRUMENTS.pianoHammer as unknown as Partial<Tone.FMSynthOptions>).connect(pianoOut),
  ]

  // Story screens. The Foreman's call: the piano again, thin and far, cut into dashes like his line of light.
  const farGate = new Tone.Gain(1)
  farGate.connect(new Tone.Filter({ frequency: 900, type: 'bandpass', Q: 0.9 }).connect(wire(new Tone.Gain(0.35), 0.6)))
  const far = [
    new Tone.PolySynth(Tone.Synth, INSTRUMENTS.pianoBody as unknown as Partial<Tone.SynthOptions>).connect(farGate),
    new Tone.PolySynth(Tone.FMSynth, INSTRUMENTS.pianoHammer as unknown as Partial<Tone.FMSynthOptions>).connect(farGate),
  ]
  // The open channel: a narrow band of pink noise while the lines are typed, dry into the effects' output.
  const channelGain = new Tone.Gain(0).connect(out)
  const channelNoise = new Tone.Noise('pink').connect(new Tone.Filter({ frequency: 2200, type: 'bandpass', Q: 1.4 }).connect(channelGain))
  // The ring filling: the pad's oscillator swelling through a low-pass that opens over the hold.
  const ringLP = wire(new Tone.Filter({ frequency: 300, type: 'lowpass', rolloff: -24, Q: 1 }), 0.3)
  const ringPad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'fatsawtooth', count: 3, spread: 26 } as Partial<Tone.OmniOscillatorOptions>,
    envelope: { attack: 0.2, decay: 0.3, sustain: 0.9, release: 0.18 }, volume: -17,
  }).connect(ringLP)
  let ringTimers: ReturnType<typeof setTimeout>[] = []

  const slots = createSlots()
  const hz = (m: number) => Tone.Frequency(m, 'midi').toFrequency()
  const mono = { bass, arp, lead } as const

  function play(n: FxNote, now: number) {
    const t = slots.start(n.voice, n.afterBell ? slots.afterBell(now, n.at) : now + n.at)
    switch (n.voice) {
      case 'piano':
        for (const p of piano) p.triggerAttackRelease(n.midi.map(hz), n.len, t, n.vel)
        break
      case 'far':
        for (const p of far) p.triggerAttackRelease(n.midi.map(hz), n.len, t, n.vel)
        if (n.at === 0) {                                          // the gate cuts to silence for 40 ms every 110 ms, for 1.4 s
          const g = farGate.gain
          g.cancelScheduledValues(t); g.setValueAtTime(1, t)
          for (let x = t + 0.07; x < t + 1.4; x += 0.11) { g.setValueAtTime(0, x); g.setValueAtTime(1, x + 0.04) }
        }
        break
      case 'bell': case 'pad':
        (n.voice === 'bell' ? bell : pad).triggerAttackRelease(n.midi.map(hz), n.len, t, n.vel); break
      case 'kick':
        kick.envelope.decay = n.decay ?? 0.32                     // set for every trigger, so a long kick never carries over
        kick.triggerAttackRelease(hz(n.midi[0]), n.len, t, n.vel); break
      case 'snare': case 'hat': {
        const syn = n.voice === 'snare' ? snare : hat
        if (n.voice === 'snare') snare.envelope.decay = n.decay ?? 0.16
        syn.triggerAttackRelease(n.len, t, n.vel); break
      }
      default: {
        const syn = mono[n.voice as keyof typeof mono]
        syn.triggerAttackRelease(hz(n.midi[0]), n.len, t, n.vel)
        if (n.slideTo !== undefined && n.slideTo !== n.midi[0]) syn.frequency.exponentialRampToValueAtTime(hz(n.slideTo), t + Tone.Time(n.len).toSeconds())
      }
    }
  }

  function stopAll() {
    const now = Tone.now()
    bell.releaseAll(now); pad.releaseAll(now); for (const p of piano) p.releaseAll(now)
    for (const syn of [bass, arp, lead, kick, snare, hat]) syn.triggerRelease(now)
  }

  function ringOff() {
    for (const x of ringTimers) clearTimeout(x)
    ringTimers = []
    const t = Tone.now()
    ringPad.releaseAll(t)
    ringLP.frequency.cancelScheduledValues(t); ringLP.frequency.rampTo(300, 0.15, t)
  }

  return {
    play(p: FxPlan) {
      const now = Tone.now() + 0.01
      if (p.cut) stopAll()
      for (const n of p.notes) play(n, now)
    },
    stopAll() { stopAll(); ringOff(); channelGain.gain.cancelScheduledValues(Tone.now()); channelGain.gain.rampTo(0, 0.05) },
    channel(open, faint) {
      if (channelNoise.state !== 'started') channelNoise.start()
      const g = channelGain.gain, t = Tone.now()
      g.cancelScheduledValues(t)
      if (!open) { g.rampTo(0, 0.05, t); return }
      const level = 0.3 * (faint ? 2 : 1)
      g.rampTo(level, 0.03, t)
      if (faint) for (let x = t + 0.1; x < t + 4; x += 0.06 + Math.random() * 0.22) g.setValueAtTime(Math.random() < 0.5 ? level * 0.25 : level, x)   // a faint signal breaks up
    },
    ring(start) {
      ringOff()
      if (!start) return
      const t = Tone.now() + 0.01
      ringPad.triggerAttack([start.root, start.root + 7].map(hz), t, 0.7)
      ringLP.frequency.cancelScheduledValues(t); ringLP.frequency.setValueAtTime(300, t); ringLP.frequency.exponentialRampToValueAtTime(2600, t + start.seconds)
      // the climbing notes wait on timers, so letting go early silences the ones not yet played
      ringTimers = start.steps.map(s => setTimeout(() => arp.triggerAttackRelease(hz(s.midi), 0.07, Tone.now() + 0.01, s.vel), s.share * start.seconds * 1000))
    },
  }
}

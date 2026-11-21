import * as Tone from 'tone'
import type { EffectsOut } from '../audio/player'
import { createSlots, type FxNote, type FxPlan } from '../audio/scored'
import { INSTRUMENTS } from './score'

// The sound effects, v2, played with Tone.js: separate copies of the
// soundtrack's instruments, with the music's settings and the sketch's levels,
// on the effects' own output. So a sound is the same whichever music layers
// are in, and with the music switched off. What each event plays is in
// src/audio/scored.ts. Loaded with the music, after the first tap.

/** `context` is the one the sound effects and the music share. */
export function createEffects(context: AudioContext): EffectsOut {
  Tone.setContext(context)
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

  const slots = createSlots()
  const hz = (m: number) => Tone.Frequency(m, 'midi').toFrequency()
  const mono = { bass, arp, lead } as const

  function play(n: FxNote, now: number) {
    const t = slots.start(n.voice, n.afterBell ? slots.afterBell(now, n.at) : now + n.at)
    switch (n.voice) {
      case 'piano':
        for (const p of piano) p.triggerAttackRelease(n.midi.map(hz), n.len, t, n.vel)
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
        const syn = mono[n.voice]
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

  return {
    play(p: FxPlan) {
      const now = Tone.now() + 0.01
      if (p.cut) stopAll()
      for (const n of p.notes) play(n, now)
    },
    stopAll,
  }
}

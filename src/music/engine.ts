import * as Tone from 'tone'
import type { MusicEngine } from './conductor'
import { useGameContext } from './toneContext'
import {
  INSTRUMENTS as I, LAYERS, MELODY_LENGTH, MUSIC, SEND, controlFor, createControlTracker, endBassStep, createSequencer,
  type LayerId, type LeadFx, type Mode, type Note, type Ramp, type Sequencer,
} from './score'

// The music, made by Tone.js. This is the only file that imports it, and it is
// loaded after the game is playable (see main.ts), so the game never waits for it.
// Everything musical comes from score.ts.

/** `context` is the sound effects' audio context: the tap that started them starts the music too. */
/** For checking the music by hand: is it playing, at what tempo, and how many tempo changes Tone.js is holding. */
export interface MusicInspector { transport: string; bpm: number; tempoEvents: number; context: string }

export function createMusicEngine(context: AudioContext): MusicEngine & { inspect(): MusicInspector } {
  useGameContext(context)
  const T = Tone.getTransport()

  // music → fade → low-pass (slow motion) → limiter → the music switch → speakers
  const out = new Tone.Gain(1).toDestination()
  const limiter = new Tone.Limiter(MUSIC.limiter).connect(out)
  const masterLP = new Tone.Filter(I.masterLowpass as Partial<Tone.FilterOptions>).connect(limiter)
  const fade = new Tone.Gain(1).connect(masterLP)
  const bus = new Tone.Volume(MUSIC.level).connect(fade)
  const reverb = new Tone.Reverb(I.reverb).connect(bus)

  const gate = {} as Record<LayerId, Tone.Gain>
  for (const { id } of LAYERS) {
    gate[id] = new Tone.Gain(0).connect(bus)
    gate[id].connect(new Tone.Gain(SEND[id]).connect(reverb))
  }

  // Pad: detuned saws, a slow chorus, and a filter that opens with speed.
  const padPump = new Tone.Gain(1).connect(gate.pad)
  const padFilter = new Tone.Filter(I.padFilter as Partial<Tone.FilterOptions>).connect(padPump)
  const chorus = new Tone.Chorus(I.chorus).connect(padFilter).start()
  const pad = new Tone.PolySynth(Tone.Synth, I.pad as Partial<Tone.SynthOptions>).connect(chorus)
  // Bass: a plucked saw on every eighth note.
  const bassPump = new Tone.Gain(1).connect(gate.bass)
  const bass = new Tone.MonoSynth(I.bass as Partial<Tone.MonoSynthOptions>).connect(bassPump)
  // Drums, all synthesized.
  const kick = new Tone.MembraneSynth(I.kick as Partial<Tone.MembraneSynthOptions>).connect(gate.drums)
  const snare = new Tone.NoiseSynth(I.snare as Partial<Tone.NoiseSynthOptions>).connect(new Tone.Filter(I.snareHighpass, 'highpass').connect(gate.drums))
  const snareBody = new Tone.MembraneSynth(I.snareBody as Partial<Tone.MembraneSynthOptions>).connect(gate.drums)
  const hat = new Tone.NoiseSynth(I.hat as Partial<Tone.NoiseSynthOptions>).connect(new Tone.Filter(I.hatHighpass, 'highpass').connect(gate.drums))
  // Arpeggio: a narrow pulse with a dotted-eighth echo.
  const arpDelay = new Tone.FeedbackDelay(I.arpDelay).connect(gate.arp)
  const arp = new Tone.Synth(I.arp as Partial<Tone.SynthOptions>).connect(new Tone.Filter(I.arpLowpass, 'lowpass').connect(arpDelay))
  // Lead: a slow melody on top, on a piano, through one of two sets of effects by turn. Both are built
  // now, as the music loads (their reverbs take a moment to build), and both stay up, so one turn's
  // tail rings on while the next plays.
  const piano = {} as Record<LeadFx, { body: Tone.PolySynth; hammer: Tone.PolySynth; delay: Tone.FeedbackDelay }>
  for (const fx of ['hall', 'echo'] as const) {
    const f = I.leadFx[fx]
    const verb = new Tone.Reverb(f.reverb).connect(new Tone.Gain(Tone.dbToGain(f.trim)).connect(gate.lead))
    const delay = new Tone.FeedbackDelay(f.delay).connect(verb)
    piano[fx] = {
      body: new Tone.PolySynth(Tone.Synth, I.pianoBody as unknown as Partial<Tone.SynthOptions>).connect(delay),
      hammer: new Tone.PolySynth(Tone.FMSynth, I.pianoHammer as unknown as Partial<Tone.FMSynthOptions>).connect(delay),
      delay,
    }
  }

  // The game-over screen's bass: its own voice and echo, after the fade, so it plays while the
  // loop is faded out; before the music switch, which governs it like the rest of the music.
  const endVerb = new Tone.Reverb(I.reverb).connect(limiter)
  const endBass = new Tone.MonoSynth(I.endBass as Partial<Tone.MonoSynthOptions>).connect(limiter)
  endBass.connect(new Tone.Gain(I.endBassSend).connect(endVerb))

  let seq: Sequencer = createSequencer(Math.random)   // the rests: Math.random, never the run's seeded numbers
  const tracker = createControlTracker()
  let at: { mode: Mode; speed: number; depth: number; level: number } = { mode: 'silent', speed: 1, depth: 0, level: 1 }
  let step = 0, playing = false
  let ending = false, overStep = 0               // the game-over bass, and its sixteenths since the ship was lost
  // the chord each recent sixteenth was scheduled with, for the sound effects: [audio time, chord]
  const chords: [number, number][] = []

  const fadeOf = (id: LayerId, on: boolean) => { const l = LAYERS.find(x => x.id === id)!; return on ? l.fadeIn : l.fadeOut }
  const rampGate = (id: LayerId, on: boolean, time: number, over = fadeOf(id, on)) => {
    const g = gate[id].gain
    g.cancelScheduledValues(time)
    g.rampTo(on ? 1 : 0, over, time)
  }
  const duck = (param: Tone.Param<'gain'>, time: number) => {
    param.cancelScheduledValues(time)
    param.setValueAtTime(I.duck.to, time)
    param.linearRampToValueAtTime(1, time + I.duck.back)
  }
  const hz = (n: string, semis: number) => Tone.Frequency(n).transpose(semis).toFrequency()

  function play(n: Note, time: number) {
    switch (n.voice) {
      case 'pad': pad.triggerAttackRelease(n.notes.map(x => hz(x, n.semis)), Tone.Time('2m').toSeconds() * I.padLength, time, n.vel); break
      case 'bass': bass.triggerAttackRelease(hz(n.notes[0], n.semis), n.dur, time, n.vel); break
      case 'kick': kick.triggerAttackRelease(hz(n.notes[0], n.semis), n.dur, time); break
      case 'snare': snare.triggerAttackRelease(n.dur, time, n.vel); break
      case 'snareBody': snareBody.triggerAttackRelease(hz(n.notes[0], n.semis), n.dur, time); break
      case 'hat': hat.triggerAttackRelease(n.dur, time, n.vel); break
      case 'arp': arp.triggerAttackRelease(hz(n.notes[0], n.semis), n.dur, time, n.vel); break
      case 'lead': {
        const p = piano[n.fx ?? 'hall'], f = hz(n.notes[0], n.semis), d = (n.len ?? 4) * 15 / T.bpm.value * MELODY_LENGTH
        p.body.triggerAttackRelease(f, d, time, n.vel); p.hammer.triggerAttackRelease(f, d, time, n.vel); break
      }
    }
  }

  // Counted here, not read back from the transport at every sixteenth.
  T.scheduleRepeat(time => {
    if (ending) {                                // the bass alone, from the counted steps
      const n = endBassStep(overStep++)
      if (n) {
        endBass.triggerAttackRelease(n.note, MUSIC.over.len, time, MUSIC.over.vel)
        chords.push([time, n.chord]); if (chords.length > 8) chords.shift()   // the sound effects follow its root
      }
      return
    }
    chords.push([time, Math.floor(step / 32) % 4]); if (chords.length > 8) chords.shift()
    const st = seq.step(step++, at)
    for (const g of st.gates) rampGate(g.id, g.on, time)
    for (const f of st.fades) rampGate(f.id, false, time, f.bars * 4 * 60 / T.bpm.value)   // bars at the current tempo
    for (const n of st.notes) play(n, time)
    if (st.duck) { duck(padPump.gain, time); duck(bassPump.gain, time) }
  }, '16n', 0)

  const apply = (ramps: Ramp[]) => {
    for (const r of ramps) {
      if (r.param === 'bpm') T.bpm.rampTo(r.to, r.over, r.at)
      else if (r.param === 'arpDelay') arpDelay.delayTime.rampTo(r.to, r.over, r.at)
      else if (r.param === 'leadHall') piano.hall.delay.delayTime.rampTo(r.to, r.over, r.at)
      else if (r.param === 'leadEcho') piano.echo.delay.delayTime.rampTo(r.to, r.over, r.at)
      else if (r.param === 'padCutoff') padFilter.frequency.rampTo(r.to, r.over, r.at)
      else masterLP.frequency.rampTo(r.to, r.over, r.at)
    }
  }

  return {
    start() {
      seq = createSequencer(Math.random)
      endBass.triggerRelease()                   // a new run cuts the game-over bass
      ending = at.mode === 'over'; overStep = 0  // music arriving on the game-over screen plays its bass
      for (const { id } of LAYERS) { gate[id].gain.cancelScheduledValues(0); gate[id].gain.value = 0 }
      fade.gain.cancelScheduledValues(0); fade.gain.value = 1
      masterLP.frequency.cancelScheduledValues(0); masterLP.frequency.value = 18000
      padPump.gain.value = 1; bassPump.gain.value = 1
      T.stop()
      T.bpm.cancelScheduledValues(0)
      T.bpm.value = controlFor(at.mode, at.speed, 0).bpm      // starting at the tempo of what it starts with, not ramping to it
      tracker.reset(at.speed, at.mode)
      const beat = 60 / T.bpm.value                // the echoes on the beat from the first bar
      arpDelay.delayTime.value = beat * 0.75
      for (const fx of ['hall', 'echo'] as const) piano[fx].delay.delayTime.value = beat * I.leadFx[fx].beats
      T.position = 0; step = 0
      T.start(Tone.now() + 0.08)
      playing = true
    },
    stop(over) {
      const t = Tone.now()
      fade.gain.cancelScheduledValues(t)
      fade.gain.rampTo(0, over, t)
      playing = false
      ending = false
      setTimeout(() => { if (!playing) { T.stop(); pad.releaseAll() } }, over * 1000 + 80)
    },
    gameOver() {
      if (!playing) return
      const t = Tone.now()
      fade.gain.cancelScheduledValues(t)
      fade.gain.rampTo(0, MUSIC.over.fade, t)     // the loop fades out under the destroyed sound...
      pad.releaseAll(t)
      apply(tracker.gameOver(t))                  // ...as the tempo ramps down: one ramp
      ending = true; overStep = 0
    },
    dropLayers(over) {
      const t = Tone.now(), ids = LAYERS.map(l => l.id).filter(id => id !== 'pad' && seq.gates[id])
      for (const id of ids) rampGate(id, false, t, over)
      seq.drop(ids)
    },
    setOn(on) { out.gain.rampTo(on ? 1 : 0, 0.05) },
    set(mode, speed, depth, level) {
      at = { mode, speed, depth, level }
      if (playing) apply(tracker.update(Tone.now(), mode, speed))
    },
    chord() {
      const now = Tone.now()
      for (let i = chords.length - 1; i >= 0; i--) if (chords[i][0] <= now) return chords[i][1]
      return chords.length ? chords[0][1] : 0
    },
    slowMotion() {
      if (playing) apply(tracker.slowMotion(Tone.now(), at.mode, at.speed))
    },
    inspect: () => ({
      transport: T.state,
      bpm: Math.round(T.bpm.value * 10) / 10,
      tempoEvents: (T.bpm as unknown as { _param?: { _events?: { length: number } } })._param?._events?.length ?? -1,
      context: Tone.getContext().state,
    }),
  }
}

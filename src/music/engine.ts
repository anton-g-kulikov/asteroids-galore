import * as Tone from 'tone'
import type { MusicEngine } from './conductor'
import {
  INSTRUMENTS as I, LAYERS, MELODY_LENGTH, MUSIC, SEND, bpmFor, createControlTracker, createSequencer,
  type LayerId, type Mode, type Note, type Ramp, type Sequencer,
} from './score'

// The music, made by Tone.js. This is the only file that imports it, and it is
// loaded after the game is playable (see main.ts), so the game never waits for it.
// Everything musical comes from score.ts.

/** `context` is the sound effects' audio context: the tap that started them starts the music too. */
/** For checking the music by hand: is it playing, at what tempo, and how many tempo changes Tone.js is holding. */
export interface MusicInspector { transport: string; bpm: number; tempoEvents: number; context: string }

export function createMusicEngine(context: AudioContext): MusicEngine & { inspect(): MusicInspector } {
  Tone.setContext(context)
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
  // Lead: a slow melody on top, with glide, vibrato and a quarter-note echo.
  const leadDelay = new Tone.FeedbackDelay(I.leadDelay).connect(gate.lead)
  const leadVibrato = new Tone.Vibrato(I.leadVibrato).connect(leadDelay)
  const leadFilter = new Tone.Filter(I.leadFilter as Partial<Tone.FilterOptions>).connect(leadVibrato)
  const lead = new Tone.MonoSynth(I.lead as Partial<Tone.MonoSynthOptions>).connect(leadFilter)

  let seq: Sequencer = createSequencer(Math.random)   // the rests: Math.random, never the run's seeded numbers
  const tracker = createControlTracker()
  let at: { mode: Mode; speed: number; depth: number; level: number } = { mode: 'silent', speed: 1, depth: 0, level: 1 }
  let step = 0, playing = false
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
      case 'lead': lead.triggerAttackRelease(hz(n.notes[0], n.semis), (n.len ?? 4) * 15 / T.bpm.value * MELODY_LENGTH, time, n.vel); break
    }
  }

  // Counted here, not read back from the transport at every sixteenth.
  T.scheduleRepeat(time => {
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
      else if (r.param === 'leadDelay') leadDelay.delayTime.rampTo(r.to, r.over, r.at)
      else if (r.param === 'padCutoff') padFilter.frequency.rampTo(r.to, r.over, r.at)
      else masterLP.frequency.rampTo(r.to, r.over, r.at)
    }
  }

  return {
    start() {
      seq = createSequencer(Math.random)
      for (const { id } of LAYERS) { gate[id].gain.cancelScheduledValues(0); gate[id].gain.value = 0 }
      fade.gain.cancelScheduledValues(0); fade.gain.value = 1
      masterLP.frequency.cancelScheduledValues(0); masterLP.frequency.value = 18000
      padPump.gain.value = 1; bassPump.gain.value = 1
      T.stop()
      T.bpm.cancelScheduledValues(0)
      T.bpm.value = bpmFor(at.speed)
      tracker.reset(at.speed)
      T.position = 0; step = 0
      T.start(Tone.now() + 0.08)
      playing = true
    },
    stop(over) {
      const t = Tone.now()
      fade.gain.cancelScheduledValues(t)
      fade.gain.rampTo(0, over, t)
      playing = false
      setTimeout(() => { if (!playing) { T.stop(); pad.releaseAll() } }, over * 1000 + 80)
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

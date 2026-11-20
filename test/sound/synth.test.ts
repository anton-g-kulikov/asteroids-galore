import { expect, test } from 'vitest'
import { SOUNDS } from '../../src/audio/sounds'
import { createSynth } from '../../src/audio/synth'

// A stand-in for the Web Audio API that records what is built.
function fakeAudio() {
  const made: { kind: string; freq: number[]; started?: number; stopped?: number; cut?: boolean; disconnected: boolean }[] = []
  const gains: number[] = []
  const filters: { type: string; freq: number[] }[] = []
  const param = (sink: number[] = []) => ({
    value: 0,
    setValueAtTime(v: number) { sink.push(v) }, linearRampToValueAtTime(v: number) { sink.push(v) },
    exponentialRampToValueAtTime(v: number) { sink.push(v) },
  })
  const node = (kind: string, freq: number[] = []) => {
    const n = {
      kind, type: '', freq, disconnected: false, frequency: param(freq), gain: param(gains), buffer: null as unknown,
      connect: () => n, disconnect: () => { n.disconnected = true },
      start: (t: number) => { (n as { started?: number }).started = t },
      stop: (t?: number) => { if (t === undefined) (n as { cut?: boolean }).cut = true; else (n as { stopped?: number }).stopped = t },
      onended: null as null | (() => void),
    }
    if (kind !== 'gain') made.push(n as never)
    return n
  }
  const ctx = {
    currentTime: 10, sampleRate: 8000, destination: node('destination'),
    createOscillator: () => node('osc', []), createGain: () => node('gain'),
    createBuffer: (_c: number, length: number) => ({ getChannelData: () => new Float32Array(length) }),
    createBufferSource: () => node('noise'),
    createBiquadFilter: () => { const f = node('gain'); filters.push(f); return f },
  }
  return { ctx, made, gains, filters }
}

test('AUD-08 a sound is built from its table entry, scaled by pitch and gain, and let go when it ends', () => {
  const { ctx, made, gains } = fakeAudio()
  const synth = createSynth(ctx as unknown as AudioContext, ctx.destination as unknown as AudioNode)
  synth.play('shield', { pitch: 0.5, gain: 0.5, delay: 0.1, stretch: 2 })
  const tones = SOUNDS.shield
  const voices = made.filter(m => m.kind === 'osc' || m.kind === 'noise')
  expect(voices).toHaveLength(tones.length)
  tones.forEach((t, i) => {
    if (t.wave !== 'noise') expect(voices[i].freq[0]).toBeCloseTo(t.from * 0.5)
    expect(voices[i].started).toBeCloseTo(10 + 0.1 + (t.at ?? 0) * 2)
    expect(voices[i].stopped).toBeCloseTo(voices[i].started! + t.length * 2 + 0.02)   // twice as long
  })
  expect(Math.max(...gains)).toBeLessThanOrEqual(0.5)
  for (const v of voices) (v as unknown as { onended: () => void }).onended()
  expect(voices.every(v => v.disconnected)).toBe(true)
  // stopAll cuts everything still playing
  const before = made.length
  synth.play('home', { pitch: 1, gain: 1, delay: 0, stretch: 1 })
  synth.stopAll()
  expect(made.slice(before).every(v => v.cut)).toBe(true)
  expect(voices.some(v => v.cut)).toBe(false)          // sounds that had ended are not touched
})

test('AUD-08 noise with a frequency goes through a low-pass that sweeps from it to its end', () => {
  const { ctx, filters } = fakeAudio()
  const synth = createSynth(ctx as unknown as AudioContext, ctx.destination as unknown as AudioNode)
  synth.play('destroyed', { pitch: 1, gain: 1, delay: 0 })
  const swept = SOUNDS.destroyed.filter(t => t.wave === 'noise' && t.from > 0)
  expect(filters).toHaveLength(swept.length)
  filters.forEach((f, i) => {
    expect(f.type).toBe('lowpass')
    expect(f.freq).toEqual([swept[i].from, swept[i].to ?? swept[i].from])
  })
  // plain noise (no frequency) is not filtered
  const plain = fakeAudio()
  createSynth(plain.ctx as unknown as AudioContext, plain.ctx.destination as unknown as AudioNode).play('impact', { pitch: 1, gain: 1, delay: 0 })
  expect(plain.filters).toHaveLength(0)
})

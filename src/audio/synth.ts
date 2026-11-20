import { SOUNDS, type SoundName } from './sounds'

/** `stretch` makes a sound longer (or shorter) without changing its pitch; 1 when left out. */
export interface PlayOptions { pitch: number; gain: number; delay: number; stretch?: number }

export interface Synth {
  play(sound: SoundName, o: PlayOptions): void
  /** Cuts everything still playing. */
  stopAll(): void
}

/** Builds each sound from its table entry when it is played: no audio files. */
export function createSynth(ctx: AudioContext, out: AudioNode): Synth {
  const playing = new Set<AudioScheduledSourceNode>()
  let noise: AudioBuffer | null = null
  const noiseBuffer = () => {
    if (noise) return noise
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1   // not the game's seeded numbers
    return noise
  }

  return {
    play(sound, { pitch, gain, delay, stretch = 1 }) {
      for (const t of SOUNDS[sound]) {
        const start = ctx.currentTime + delay + (t.at ?? 0) * stretch, end = start + t.length * stretch
        let source: AudioScheduledSourceNode
        let filter: BiquadFilterNode | null = null
        if (t.wave === 'noise') {
          const n = ctx.createBufferSource()
          n.buffer = noiseBuffer()
          source = n
          if (t.from > 0) {
            // a low-pass sweeping down: a crack that closes into a boom, a boom into a rumble
            filter = ctx.createBiquadFilter()
            filter.type = 'lowpass'
            filter.frequency.setValueAtTime(t.from, start)
            filter.frequency.exponentialRampToValueAtTime(t.to ?? t.from, end)
          }
        } else {
          const o = ctx.createOscillator()
          o.type = t.wave
          o.frequency.setValueAtTime(t.from * pitch, start)
          if (t.to) o.frequency.exponentialRampToValueAtTime(t.to * pitch, end)
          source = o
        }
        const env = ctx.createGain()
        env.gain.setValueAtTime(0, start)
        env.gain.linearRampToValueAtTime(t.gain * gain, start + Math.min(0.01, t.length * stretch / 4))
        env.gain.exponentialRampToValueAtTime(0.0001, end)
        if (filter) source.connect(filter).connect(env).connect(out)
        else source.connect(env).connect(out)
        source.onended = () => { source.disconnect(); filter?.disconnect(); env.disconnect(); playing.delete(source) }
        source.start(start)
        source.stop(end + 0.02)
        playing.add(source)
      }
    },
    stopAll() {
      for (const s of playing) { try { s.stop() } catch { /* already stopped */ } }
    },
  }
}

import type { Audio } from './player'
import { MASTER } from './sounds'
import { createSynth } from './synth'

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext }

const contextClass = (): typeof AudioContext | undefined =>
  typeof window === 'undefined' ? undefined : window.AudioContext ?? (window as AudioWindow).webkitAudioContext

/** True where the browser can play sound at all; elsewhere there is no mute control to show. */
export const hasWebAudio = (): boolean => !!contextClass()

/** The browser's audio output, with the overall loudness in front of it. */
export function createWebAudio(): Audio | null {
  const AC = contextClass()
  if (!AC) return null
  const ctx = new AC()
  const master = ctx.createGain()
  master.gain.value = MASTER
  master.connect(ctx.destination)
  return {
    synth: createSynth(ctx, master),
    resume: () => void ctx.resume().catch(() => {}),
    suspend: () => void ctx.suspend().catch(() => {}),
    context: ctx,
  }
}

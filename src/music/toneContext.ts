import * as Tone from 'tone'

/**
 * Has Tone.js play through the game's audio context, the one the first tap started. Tone.js opens a
 * context of its own as it loads; that one is closed here, or it would run beside the game's as a
 * second audio stream for the phone to keep fed. The music and the sound effects both call this, and
 * only the first call changes anything: wrapping the same context twice would give Tone.js two clocks.
 */
export function useGameContext(context: AudioContext): void {
  if (Tone.getContext().rawContext === context) return
  Tone.setContext(context, true)
}

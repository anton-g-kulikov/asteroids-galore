import type { Game } from './types'

/**
 * Things that happened, for the sound to follow. The simulation only appends
 * them: it never reads them back, and making one draws nothing from the seeded
 * numbers, so reporting events cannot change a run. Whoever plays the sound
 * empties the list each frame (src/audio/player.ts); in tests nobody does.
 */
export type SoundEvent =
  | { kind: 'save'; seat: number; seats: number }   // one per crew member taken aboard, with the seat it fills
  | { kind: 'full' }                                // the ship has just filled
  | { kind: 'missed'; count: number }               // crew left behind, or thrown off by a hit
  | { kind: 'hit'; size: number; shieldsLeft: number }   // a hit that burned a shield: the rock's radius (field units) and the shields left
  | { kind: 'shield' }                              // a shield arc taken
  | { kind: 'wormhole' }                            // a wormhole has appeared
  | { kind: 'enter' }                               // flown into a wormhole, on to the results
  | { kind: 'home' }                                // the last wormhole: the run is home
  | { kind: 'destroyed' }                           // the ship is lost
  | { kind: 'choice'; ship: number }                // a ship chosen between missions
  | { kind: 'mark'; ship: number }                  // the fleet's mark moved

export function emit(g: Game, e: SoundEvent): void {
  g.events.push(e)
}

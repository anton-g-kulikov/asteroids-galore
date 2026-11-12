// The numbers that shape the game. What each one does for the player is
// described in _meta/game-design.md.

export const MAX_FIELD_WIDTH = 560   // px; wider screens get a centred play field
export const SPEED_RAMP = 0.03       // speed multiplier gained per second
export const MAX_SPEED = 4.5
export const LEVEL_MIN_TIME = 20     // seconds of dodging before a level can end
export const LAST_LEVEL = 4          // finishing this level wins the game
export const WELL_TIME = 6           // seconds parked in one spot for the deepest gravity well
export const WELL_AHEAD = 3          // well centre sits this many ship radii above the ship's centre
export const DILEMMA_EVERY = 3       // every Nth rescue is a "save these or those" choice
export const LIVES = 3               // hits the ship survives per level, counting the last
export const GRACE = 2               // seconds the ship cannot be hit after losing a life
export const SLOW_TIME = 1.4         // real seconds of slow motion when a two-crew pair comes into view
export const SLOW_SCALE = 0.3        // game speed at the depth of the slow motion

/** Parsecs to fly within the level. */
export const levelTarget = (l: number): number => 350 + 100 * (l - 1)

/** Seats: 0, 4, 8, 16, 32. */
export const levelCapacity = (l: number): number => l < 2 ? 0 : Math.min(32, 4 * 2 ** (l - 2))

/** A bigger ship steers slower. */
export const levelHandling = (l: number): number => Math.max(0.5, 0.92 ** (l - 1))

/** The ship grows with its seat count. `unit` is the layout's base unit. */
export const shipRadius = (l: number, unit: number): number => [13, 15, 17, 20, 22][Math.min(l, 5) - 1] * unit

/**
 * Seconds between stranded crews, [min, max] per level. Kept sparse so the seats
 * fill over the whole level instead of in its first moments.
 */
export const rescueGap = (l: number): [number, number] => l <= 2 ? [11, 15] : l === 3 ? [9, 13] : [8, 11]

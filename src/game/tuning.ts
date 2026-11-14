// The numbers that shape the game. What each one does for the player is
// described in _meta/game-design.md.

export const MAX_FIELD_WIDTH = 560   // px; wider screens get a centred play field
export const TARGET_SPEED = 2.3      // speed multiplier on reaching a level's parsec target, whatever its length
export const MAX_SPEED = 4.5         // first gear tops out here
export const GEAR_AT = 2             // second gear unlocks once this many times the level's target is flown
export const GEAR_RAMP = 0.1         // speed multiplier gained per second in second gear
export const TOP_SPEED = 9           // second gear tops out here
export const MISS_PERCENT = 10       // per cent of a mission's score lost for each crew member left behind

/**
 * Speed multiplier for a level. First gear follows progress, not the clock:
 * `progress` is the share of the level's target flown, and speed rises in a
 * straight line from 1 to TARGET_SPEED at the target, then on at the same rate
 * up to MAX_SPEED. So a long level is no faster at its end than a short one.
 * A ship that stays on past GEAR_AT times the target is in second gear from
 * then on: `gearTime` seconds of it add speed on top, up to TOP_SPEED, so
 * farming parsecs on one level gets dangerous.
 */
export const speedAt = (progress: number, gearTime: number): number =>
  Math.min(TOP_SPEED, Math.min(MAX_SPEED, 1 + progress * (TARGET_SPEED - 1)) + gearTime * GEAR_RAMP)
export const LEVEL_MIN_TIME = 20     // seconds of dodging before a level can end
export const LAST_LEVEL = 4          // finishing this level wins the game
export const WELL_TIME = 6           // seconds parked in one spot for the deepest gravity well
export const WELL_AHEAD = 4          // well centre sits this many ship radii above the ship's centre
export const WELL_PULL = 780         // how hard a well pulls rocks in, before ship mass and speed
export const DILEMMA_EVERY = 3       // every Nth rescue is a "save these or those" choice
export const SHIELDS = 3             // hits the shields absorb per level; the next one destroys the ship
export const GRACE = 2               // seconds the ship cannot be hit after losing a life
export const SLOW_TIME = 1.4         // real seconds of slow motion when a two-crew pair comes into view
export const SLOW_SCALE = 0.3        // game speed at the depth of the slow motion

/** Parsecs to fly within the level. */
const TARGETS = [500, 750, 1250, 2000]
export const levelTarget = (l: number): number => TARGETS[Math.min(l, TARGETS.length) - 1]

/** Seats: 2, 4, 8, 16, 32. */
export const levelCapacity = (l: number): number => Math.min(32, 2 ** l)

/** A bigger ship steers slower. */
export const levelHandling = (l: number): number => Math.max(0.5, 0.92 ** (l - 1))

/** The ship grows with its seat count. `unit` is the layout's base unit. */
export const shipRadius = (l: number, unit: number): number => [13, 15, 17, 20, 22][Math.min(l, 5) - 1] * unit

/** Parsecs into a run before the first planetoid appears: the opening is rocks alone. */
export const FIRST_RESCUE = 200

/**
 * Seconds between stranded crews, [min, max] per level. Kept sparse so the seats
 * fill over the whole level instead of in its first moments. Level 1 is shorter
 * and starts its crews late, so its gap is tighter.
 */
export const rescueGap = (l: number): [number, number] => l === 1 ? [11, 15] : [15, 20]

// The numbers that shape the game. What each one does for the player is
// described in _meta/game-design.md.

// The play field has one fixed shape on every device; the window only scales it.
export const FIELD_W = 400
export const FIELD_H = 720
export const STEP = 1 / 60           // seconds per simulation step, on every device

export const SPEED_GAIN = 1.3        // speed multiplier gained over a level's parsec target, whatever its length
export const MISS_RATE = 0.1         // each crew member left behind takes this share of what is still at risk
export const MISS_CAP = 0.75         // at most this share of a mission's score is ever at risk

export const LEVEL_MIN_TIME = 20     // seconds of dodging before a level can end
export const LAST_LEVEL = 7          // the wormhole of this level is the way home
export const WELL_TIME = 6           // seconds parked in one spot for the deepest gravity well
export const WELL_AHEAD = 4          // well centre sits this many ship radii above the ship's centre
export const WELL_PULL = 780         // how hard a well pulls rocks in, before ship mass and speed
export const DILEMMA_EVERY = 3       // every Nth rescue is a "save these or those" choice
export const SHIELDS = 3             // every level starts with at least this many
export const MAX_SHIELDS = 5         // a ship holds no more than this
export const GRACE = 2               // seconds the ship cannot be hit after losing a life
export const SLOW_TIME = 1.4         // real seconds of slow motion when a two-crew pair comes into view
export const SLOW_SCALE = 0.3        // game speed at the depth of the slow motion

const at = <T>(list: T[], l: number): T => list[Math.max(1, Math.min(l, list.length)) - 1]

/** Parsecs to fly within the level. */
export const levelTarget = (l: number): number => at([500, 750, 1250, 2000, 2500, 3000, 3500], l)

/** Seats. */
export const levelCapacity = (l: number): number => at([2, 4, 8, 16, 20, 24, 32], l)

/** Speed multiplier a level starts at. */
export const startSpeed = (l: number): number => at([1, 1, 1, 1, 1.4, 1.8, 2.2], l)

/**
 * Speed multiplier for a level. It follows progress, not the clock: `progress`
 * is the share of the level's target flown, and speed rises in a straight line
 * by SPEED_GAIN over the target, whatever the level's length, and keeps rising
 * at the same rate for as long as the ship stays on. There is no ceiling.
 */
export const speedAt = (l: number, progress: number): number => startSpeed(l) + progress * SPEED_GAIN

/** Shield arcs that drift down the field during the level, evenly spaced over its first DROPS_WITHIN. */
export const shieldDrops = (l: number): number => at([0, 0, 0, 0, 6, 4, 0], l)
export const DROPS_WITHIN = 2 / 3
export const CHOICE_EVERY = 2        // every Nth shield drop arrives as "2 crew, 3 crew or a shield"

/** Seconds until a missed wormhole returns: dealt in a random order, reshuffled when all are used. */
export const WORM_WAITS = [16, 19, 22, 25, 28]

// Crew make the ship heavy: its size and steering come from the crew on board.
export const FULL_CREW = 32          // the load at which the ship is at its biggest and slowest
const LOAD_CURVE = 0.7               // below 1: the first crew aboard are felt the most
const load = (crew: number): number => Math.min(1, Math.max(0, crew) / FULL_CREW) ** LOAD_CURVE

/** Ship radius for the crew on board, in field units: 13 empty, 22 full. */
export const shipRadius = (crew: number): number => 13 + 9 * load(crew)

/** Steering speed for the crew on board: 100% empty, 60% full. */
export const handling = (crew: number): number => 1 - 0.4 * load(crew)

/** How much each crew member on board adds to the ship's mass, which deepens the well dug while parked. */
export const CREW_MASS = 0.05

/** Parsecs into a run before the first planetoid appears: the opening is rocks alone. */
export const FIRST_RESCUE = 200

/**
 * Seconds between stranded crews, [min, max] per level. Kept sparse so the seats
 * fill over the whole level instead of in its first moments. Level 1 is shorter
 * and starts its crews late, so its gap is tighter.
 */
export const rescueGap = (l: number): [number, number] => l === 1 ? [11, 15] : [15, 20]

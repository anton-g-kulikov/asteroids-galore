import type { Records } from './records'

/** `between`: the results screen shown after a wormhole, before the next level starts. */
export type GameState = 'menu' | 'play' | 'between' | 'over' | 'won'

export interface Ship { x: number; y: number; vx: number; r: number }

export interface Crater { a: number; d: number; r: number }

export interface Asteroid {
  x: number
  y: number
  r: number
  shape: number[]       // rim radius at each vertex, as a fraction of r
  craters: Crater[]
  vx: number            // px/s
  vy: number            // multiplied by the scroll speed
  rot: number
  spin: number
  shade: number         // index into the rock palette
  gy: number            // extra fall speed picked up from the ship's gravity (px/s)
  people: number        // stranded crew waiting for pickup
  planet?: boolean      // a planetoid: round and coloured, where stranded crew are found
  dead?: boolean        // destroyed by hitting the ship
}

export interface Particle {
  x: number; y: number; vx: number; vy: number
  life: number; max: number; size: number; color: string
}

export interface Floater { x: number; y: number; str: string; life: number }

export interface Star { x: number; y: number; z: number }   // x, y as fractions of the field

/** What one finished level added to the run. */
export interface LevelResult {
  level: number
  saved: number      // crew delivered at the wormhole that ended it
  missed: number     // crew who drifted past during it
  distance: number   // whole parsecs flown in it
  lost?: number      // crew who went down with the ship, when the level ended in its destruction
}

export interface Well { x: number; y: number; dwell: number; depth: number }

export interface Wormhole { x: number; y: number; r: number }

/** A shield arc drifting down the field; flying through it adds a shield. `fall` is its share of the scroll speed. */
export interface Drop { x: number; y: number; r: number; fall: number }

/** How a run ended: what a row of the board says besides the score. */
export interface RunEnd {
  /** `won`: went home through the last wormhole. `over`: ship destroyed. */
  outcome: 'won' | 'over'
  /** Mission the run ended on. */
  level: number
  /** Whole parsecs flown in the last mission; 0 when the run never reached it. */
  finalDistance: number
}

/** One line of a leaderboard, ready to draw. */
export interface BoardRow { rank: number; callsign: string; value: number; me: boolean; end: RunEnd | null }

/** Someone else's run, opened from a share link. */
export interface SharedRun {
  callsign: string
  outcome: 'won' | 'over'
  score: number
  saved: number
  distance: number
}

export interface Game {
  // Field size and base unit: fixed (see FIELD_W, FIELD_H); the window only scales the picture
  W: number
  H: number
  U: number

  state: GameState
  stateTime: number      // seconds since the state began
  clock: number          // seconds since load; drives animations

  time: number
  speed: number
  distance: number       // parsecs flown; the score is this times the crew saved
  spawnTimer: number
  shake: number
  flash: number

  level: number
  levelTime: number
  levelScore: number
  onboard: number        // crew in the seats right now: not saved until the next wormhole
  saved: number          // crew delivered through a wormhole; safe for good
  lost: number           // crew who were on board when the ship was destroyed
  missed: number         // crew that drifted past without being picked up
  rescueTimer: number
  rescueCount: number
  /** One entry per level finished so far in this run. */
  results: LevelResult[]
  /** The distance and missed count when the current level began, to work out its result. */
  levelFrom: { distance: number; missed: number }

  wormhole: Wormhole | null   // exit to the next level, once the level's goals are met
  wormTimer: number
  /** Waits still to be dealt to missed wormholes: see WORM_WAITS. */
  wormWaits: number[]
  /** Wormholes that have appeared on this level. */
  wormCount: number
  drops: Drop[]
  /** Shield drops that have appeared on this level. */
  dropCount: number

  // Gravity: the longer the ship sits in one place, the deeper the well it digs.
  // Wells stay where they were dug. When the ship leaves one it is left behind,
  // still pulling asteroids in while it slowly relaxes, and a fresh well starts
  // at the ship. wells[0] is always the one the ship is sitting in.
  wells: Well[]
  gridOff: number

  shields: number             // shields left; a hit with none destroys the ship
  grace: number               // seconds of protection left after a hit
  slowmo: number              // slow-motion seconds left
  slowWatch: { y: number } | null   // the rock or wormhole whose arrival triggers the slow motion

  newBest: boolean
  records: Records
  /** The leaderboard from the cloud; null until loaded (or for good, when there is no cloud). */
  board: BoardRow[] | null
  /** True while the leaderboard screen is open over an end screen. */
  boardOpen: boolean
  /** True once the run on the end screen has a link to share. */
  shareReady: boolean
  /** Seconds left of the "copied" note on the share button. */
  shareNote: number
  /** The run from the share link this page was opened with, shown on the start screen. */
  shared: SharedRun | null

  ship: Ship
  asteroids: Asteroid[]
  particles: Particle[]
  floaters: Floater[]
  stars: Star[]
}

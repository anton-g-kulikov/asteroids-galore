import type { Records } from './records'

export type GameState = 'menu' | 'play' | 'over' | 'won'

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
  dead?: boolean        // destroyed by hitting the ship
}

export interface Particle {
  x: number; y: number; vx: number; vy: number
  life: number; max: number; size: number; color: string
}

export interface Floater { x: number; y: number; str: string; life: number }

export interface Star { x: number; y: number; z: number }   // x, y as fractions of the field

export interface Well { x: number; y: number; dwell: number; depth: number }

export interface Wormhole { x: number; y: number; r: number }

export type BoardKind = 'distance' | 'crew'

/** One line of a leaderboard, ready to draw. */
export interface BoardRow { rank: number; callsign: string; value: number; me: boolean }

/** Someone else's run, opened from a share link. */
export interface SharedRun {
  callsign: string
  outcome: 'won' | 'over'
  distance: number
  level: number
  rescued: number
}

export interface Game {
  // Field size in CSS px; U = base unit (scales sprites)
  W: number
  H: number
  U: number

  state: GameState
  stateTime: number      // seconds since the state began
  clock: number          // seconds since load; drives animations

  time: number
  speed: number
  score: number
  spawnTimer: number
  shake: number
  flash: number

  level: number
  levelTime: number
  levelScore: number
  onboard: number        // crew in the seats right now
  rescued: number
  missed: number         // crew that drifted past without being picked up
  rescueTimer: number
  rescueCount: number

  wormhole: Wormhole | null   // exit to the next level, once the level's goals are met
  wormTimer: number

  // Gravity: the longer the ship sits in one place, the deeper the well it digs.
  // Wells stay where they were dug. When the ship leaves one it is left behind,
  // still pulling asteroids in while it slowly relaxes, and a fresh well starts
  // at the ship. wells[0] is always the one the ship is sitting in.
  wells: Well[]
  gridOff: number

  shields: number             // shields left; a hit with none destroys the ship
  grace: number               // seconds of protection left after a hit
  slowmo: number              // slow-motion seconds left
  slowWatch: Asteroid | null  // the rock whose arrival triggers the slow motion

  newBest: boolean
  newBestCrew: boolean
  records: Records
  /** Leaderboards from the cloud; null until loaded (or for good, when there is no cloud). */
  boards: Record<BoardKind, BoardRow[] | null>
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

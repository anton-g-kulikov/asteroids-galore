// A fake browser, just big enough to run the game headless and deterministically:
// seeded Math.random, a manual clock, captured event listeners, and a 2D context
// that hashes every call instead of drawing.

export interface DebugHook {
  readonly state: 'menu' | 'play' | 'over' | 'won'
  readonly score: number
  readonly speed: number
  readonly asteroids: { x: number; y: number; r: number; people: number }[]
  readonly rescued: number
  readonly missed: number
  readonly wells: { x: number; y: number; dwell: number; depth: number }[]
  readonly level: number
  readonly onboard: number
  readonly wormhole: { x: number; y: number; r: number } | null
  readonly wormTimer: number
  readonly slowmo: number
  readonly lives: number
  readonly grace: number
  readonly ship: { x: number; y: number; vx: number; r: number }
  skipLevel(): void
  fill(n: number): void
  spawnRescue(): void
  spawnDilemma(): void
}

export interface Io {
  keyDown(key: string): void
  keyUp(key: string): void
  pointerDown(id: number, x: number): void
  pointerMove(id: number, x: number): void
  pointerUp(id: number): void
  blur(): void
  resize(width: number, height: number): void
  /** A second seeded generator for the pilot, independent of the game's Math.random. */
  random(): number
}

export interface Scenario {
  name: string
  seed: number
  frames: number
  width?: number
  height?: number
  storage?: Record<string, string>
  pilot(frame: number, game: DebugHook, io: Io): void
}

export const SAMPLE_EVERY = 20
export const SAMPLE_KEYS = [
  'frame', 'state', 'level', 'lives', 'score', 'speed', 'rescued', 'missed', 'onboard',
  'grace', 'slowmo', 'wormTimer', 'shipX', 'shipVx', 'shipR', 'rocks', 'rocksX', 'rocksY',
  'people', 'wells', 'depth', 'wormX', 'wormY', 'draw',
] as const
export type Sample = (number | string | null)[]

export interface Trace {
  samples: Sample[]
  storage: Record<string, string>
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round = (n: number, places = 4) => {
  const k = 10 ** places
  const r = Math.round(n * k) / k
  return r === 0 ? 0 : r   // no negative zero
}

const show = (v: unknown): string =>
  typeof v === 'number' ? String(round(v, 3)) : Array.isArray(v) ? `[${v.map(show).join(',')}]` : String(v)

type Listener = (e: Record<string, unknown>) => void

function eventTarget() {
  const listeners = new Map<string, Listener[]>()
  return {
    addEventListener(type: string, fn: Listener) {
      listeners.set(type, [...(listeners.get(type) ?? []), fn])
    },
    dispatch(type: string, init: Record<string, unknown> = {}) {
      const e = { type, repeat: false, preventDefault() {}, ...init }
      for (const fn of listeners.get(type) ?? []) fn(e)
    },
  }
}

const GLOBALS = ['window', 'document', 'navigator', 'localStorage', 'performance', 'requestAnimationFrame'] as const

/**
 * Runs one scenario. `boot` must start the game (it finds the fake globals in place).
 * `log`, when given, receives every canvas call made during frames in `logFrames`.
 */
export async function runScenario(
  scn: Scenario,
  boot: () => void | Promise<void>,
  debug?: { log: string[]; from: number; to: number },
): Promise<Trace> {
  let hash = 0x811c9dc5
  let frameNo = 0
  const record = (line: string) => {
    for (let i = 0; i < line.length; i++) hash = Math.imul(hash ^ line.charCodeAt(i), 0x01000193)
    hash = Math.imul(hash ^ 10, 0x01000193)
    if (debug && frameNo >= debug.from && frameNo <= debug.to) debug.log.push(`${frameNo}: ${line}`)
  }

  const gradient = { addColorStop: (...args: unknown[]) => record(`addColorStop(${args.map(show).join(',')})`) }
  const ctx = new Proxy({}, {
    get: (_t, prop) => (...args: unknown[]) => {
      record(`${String(prop)}(${args.map(show).join(',')})`)
      return prop === 'createRadialGradient' ? gradient : undefined
    },
    set: (_t, prop, value) => {
      record(`${String(prop)}=${value === gradient ? 'gradient' : show(value)}`)
      return true
    },
  })
  const canvas = { style: {} as Record<string, string>, width: 0, height: 0, getContext: () => ctx }

  const store = new Map(Object.entries(scn.storage ?? {}))
  const localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
  }

  let now = 0
  let nextFrame: ((t: number) => void) | null = null
  const requestAnimationFrame = (fn: (t: number) => void) => { nextFrame = fn; return 0 }

  const doc = Object.assign(eventTarget(), { getElementById: () => canvas })
  const win = Object.assign(eventTarget(), {
    innerWidth: scn.width ?? 390,
    innerHeight: scn.height ?? 844,
    devicePixelRatio: 2,
    requestAnimationFrame,
    __game: undefined as DebugHook | undefined,
  })

  const fakes: Record<(typeof GLOBALS)[number], unknown> = {
    window: win, document: doc, navigator: {}, localStorage,
    performance: { now: () => now }, requestAnimationFrame,
  }
  const saved = GLOBALS.map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)] as const)
  const realRandom = Math.random
  for (const k of GLOBALS) Object.defineProperty(globalThis, k, { value: fakes[k], configurable: true, writable: true })
  Math.random = mulberry32(scn.seed)

  const pilotRandom = mulberry32(scn.seed * 7919 + 13)
  const io: Io = {
    keyDown: key => win.dispatch('keydown', { key }),
    keyUp: key => win.dispatch('keyup', { key }),
    pointerDown: (pointerId, clientX) => win.dispatch('pointerdown', { pointerId, clientX }),
    pointerMove: (pointerId, clientX) => win.dispatch('pointermove', { pointerId, clientX }),
    pointerUp: pointerId => win.dispatch('pointerup', { pointerId }),
    blur: () => win.dispatch('blur'),
    resize: (w, h) => { win.innerWidth = w; win.innerHeight = h; win.dispatch('resize') },
    random: pilotRandom,
  }

  const samples: Sample[] = []
  try {
    await boot()
    const game = win.__game
    if (!game) throw new Error('the game did not install window.__game')
    for (frameNo = 1; frameNo <= scn.frames; frameNo++) {
      scn.pilot(frameNo, game, io)
      now += 1000 / 60
      const fn = nextFrame as ((t: number) => void) | null
      if (!fn) throw new Error('the game stopped requesting frames')
      nextFrame = null
      fn(now)
      if (frameNo % SAMPLE_EVERY === 0) {
        const sum = (f: (a: DebugHook['asteroids'][number]) => number) => round(game.asteroids.reduce((s, a) => s + f(a), 0))
        samples.push([
          frameNo, game.state, game.level, game.lives, round(game.score), round(game.speed),
          game.rescued, game.missed, game.onboard, round(game.grace), round(game.slowmo),
          round(game.wormTimer), round(game.ship.x), round(game.ship.vx), round(game.ship.r),
          game.asteroids.length, sum(a => a.x), sum(a => a.y), sum(a => a.people),
          game.wells.length, round(game.wells.reduce((s, w) => s + w.depth, 0)),
          game.wormhole ? round(game.wormhole.x) : null, game.wormhole ? round(game.wormhole.y) : null,
          (hash >>> 0).toString(16),
        ])
      }
    }
  } finally {
    Math.random = realRandom
    for (const [k, d] of saved) {
      if (d) Object.defineProperty(globalThis, k, d)
      else delete (globalThis as Record<string, unknown>)[k]
    }
  }
  return { samples, storage: Object.fromEntries(store) }
}

export const column = (trace: Trace, key: (typeof SAMPLE_KEYS)[number]) =>
  trace.samples.map(s => s[SAMPLE_KEYS.indexOf(key)])

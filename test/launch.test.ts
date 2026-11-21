import { expect, test } from 'vitest'
import { showsMute } from '../src/audio/muteButton'
import { showsFpsButton } from '../src/fps/fpsButton'
import { createGame, shipHome } from '../src/game/game'
import { createRecords } from '../src/game/records'
import { startGame, tryStart, update } from '../src/game/simulation'
import { LAUNCH_TIME, STEP } from '../src/game/tuning'
import type { Game } from '../src/game/types'
import { showsMusicButton } from '../src/music/musicButton'
import { updateAllowed } from '../src/pwa/updates'

const fresh = (seed = 12345): Game => { const g = createGame(createRecords(null)); g.seed = seed; return g }
const step = (g: Game, steer = 0) => update(g, STEP, steer)
const launchSteps = Math.ceil(LAUNCH_TIME / STEP) + 1

test('LAUNCH-01 a start flies the ship in from below, then the run is in play', () => {
  const g = fresh()
  tryStart(g)
  expect(g.state).toBe('launch')
  const home = shipHome(g)
  expect(g.ship.y).toBeGreaterThan(g.H + g.ship.r)        // below the field
  expect(g.ship.x).toBe(g.W / 2)
  const ys: number[] = []
  for (let i = 0; i < launchSteps && g.state === 'launch'; i++) {
    step(g, 1)                                            // steering is ignored
    tryStart(g)                                           // and so are taps
    if (g.state !== 'launch') break
    ys.push(g.ship.y)
    expect(g.ship.x).toBe(g.W / 2)
    expect(g.asteroids).toHaveLength(0)
    expect(g.distance).toBe(0)
  }
  expect(g.state).toBe('play')
  expect(g.ship.y).toBe(home)
  expect(ys.length * STEP).toBeCloseTo(LAUNCH_TIME, 1)
  // rising all the way, and slowing as it arrives
  for (let i = 1; i < ys.length; i++) expect(ys[i]).toBeLessThan(ys[i - 1])
  const first = ys[0] - ys[1], last = ys[ys.length - 2] - ys[ys.length - 1]
  expect(last).toBeLessThan(first / 4)
  expect(ys[ys.length - 1]).toBeGreaterThanOrEqual(home)
  expect(ys[ys.length - 1]).toBeLessThan(home + 1)
  expect(g.stateTime).toBeLessThan(STEP * 2)              // play has only just begun
})

test('LAUNCH-01 a restart from an end screen also flies in', () => {
  const g = fresh()
  startGame(g)
  g.state = 'over'; g.stateTime = 2
  tryStart(g)
  expect(g.state).toBe('launch')
})

// What a run is made of; the scenery (stars, grid, clock) and the exhaust are left out.
const snapshot = (g: Game) => JSON.stringify({
  state: g.state, time: g.time, speed: g.speed, distance: g.distance, spawnTimer: g.spawnTimer, level: g.level,
  shields: g.shields, saved: g.saved, missed: g.missed, onboard: g.onboard, rescueTimer: g.rescueTimer, wormTimer: g.wormTimer,
  ship: g.ship, wells: g.wells, asteroids: g.asteroids, drops: g.drops, wormhole: g.wormhole, levelTime: g.levelTime,
  levelScore: g.levelScore, slowmo: g.slowmo, grace: g.grace, events: g.events,
})

test('LAUNCH-02 after the fly-in the run plays as one started directly', () => {
  // One after the other: the run's numbers come from one generator, so two runs cannot be interleaved.
  const steer = (i: number) => [0, 1, 1, 0, -1, -1, 0][Math.floor(i / 40) % 7]
  const fly = (g: Game) => {
    const seen: string[] = []
    for (let i = 0; i < 1800; i++) {
      g.events.length = 0
      step(g, steer(i))
      if (i % 60 === 0) seen.push(snapshot(g))
    }
    return seen
  }
  const flown = fresh(777)
  tryStart(flown)
  while (flown.stateTime < LAUNCH_TIME - 1e-9) step(flown)  // the next step arrives, and is the run's first
  expect(flown.state).toBe('launch')
  const a = fly(flown)
  const direct = fresh(777)
  startGame(direct)
  const b = fly(direct)
  expect(a).toEqual(b)
  expect(direct.distance).toBeGreaterThan(0)
})

test('LAUNCH-03 the fly-in shows no icons and holds back updates', () => {
  const g = fresh()
  tryStart(g)
  expect(showsMute(g, true)).toBe(false)
  expect(showsMusicButton(g, true)).toBe(false)
  expect(showsFpsButton(g)).toBe(false)
  expect(updateAllowed(g.state)).toBe(false)
})

test('LAUNCH-03 the fly-in draws the play HUD', async () => {
  const { drawHud } = await import('../src/render/hud')
  const textOf = (g: Game) => {
    const out: string[] = []
    const ctx = new Proxy({}, {
      get: (_t, prop) => (...args: unknown[]) => { if (prop === 'fillText') out.push(String(args[0])) },
      set: () => true,
    }) as CanvasRenderingContext2D
    drawHud(ctx, g)
    return out
  }
  const flying = fresh(); tryStart(flying)
  const playing = fresh(); startGame(playing)
  expect(textOf(flying)).toEqual(textOf(playing))
  expect(textOf(flying).length).toBeGreaterThan(0)
})

test('LAUNCH-04 every mission starts with the fly-in, and plays as it did without it', () => {
  const g = fresh(4242)
  startGame(g)
  g.wormhole = { x: g.ship.x, y: g.ship.y, r: 30 }
  step(g)                                                    // into the wormhole
  expect(g.state).toBe('between')
  g.stateTime = 1
  const x = g.ship.x
  tryStart(g)
  expect([g.state, g.level]).toEqual(['launch', 2])
  expect(g.ship.y).toBeGreaterThan(g.H + g.ship.r)
  const flown = structuredClone({ ...g, records: null })
  let steps = 0
  while (g.stateTime < LAUNCH_TIME - 1e-9) { step(g, -1); tryStart(g); steps++ }   // steering and taps are ignored
  expect(g.state).toBe('launch')
  expect(steps * STEP).toBeCloseTo(LAUNCH_TIME, 1)
  expect(g.ship.x).toBe(x)                                  // where it left the stop
  // nothing of the mission ran during the fly-in
  for (const k of ['speed', 'distance', 'levelTime', 'wormTimer', 'rescueTimer', 'spawnTimer', 'shields', 'level', 'shipType'] as const) expect(g[k]).toBe(flown[k])
  step(g)
  expect([g.state, g.ship.y]).toEqual(['play', shipHome(g)])
})

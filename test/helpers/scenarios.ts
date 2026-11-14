import type { DebugHook, Io, Scenario } from './harness'

// Holds at most one arrow key, releasing the other first.
function keys(io: Io) {
  let held = 0
  return (dir: number) => {
    if (dir === held) return
    if (held) io.keyUp(held < 0 ? 'ArrowLeft' : 'ArrowRight')
    if (dir) io.keyDown(dir < 0 ? 'ArrowLeft' : 'ArrowRight')
    held = dir
  }
}

// Heads for the wormhole when there is one. Otherwise picks the clearest lane
// near the ship, with a pull towards stranded crew.
function dodge(g: DebugHook): number {
  const s = g.ship
  if (g.wormhole) return Math.abs(g.wormhole.x - s.x) < 6 ? 0 : g.wormhole.x > s.x ? 1 : -1
  const crew = g.asteroids.filter(a => a.people && a.y < s.y).sort((a, b) => b.y - a.y)[0]
  let best = s.x, bestCost = Infinity
  for (let x = 24; x <= 376; x += 6) {
    let cost = Math.abs(x - s.x) * 0.02
    if (crew) cost += Math.abs(x - (crew.x + (s.x >= crew.x ? 1 : -1) * (crew.r + 24))) * 0.01
    for (const a of g.asteroids) {
      const ahead = s.y - a.y
      if (ahead < -60 || ahead > 380) continue
      const overlap = a.r + s.r + 26 - Math.abs(a.x - x)
      if (overlap > 0) cost += overlap * (1.2 - Math.max(0, ahead) / 380)
    }
    if (cost < bestCost) { bestCost = cost; best = x }
  }
  return Math.abs(best - s.x) < 5 ? 0 : best > s.x ? 1 : -1
}

// Presses Enter now and then, which starts a run from the menu or an end screen.
const tapStart = (f: number, io: Io) => { if (f % 60 === 5) { io.keyDown('Enter'); io.keyUp('Enter') } }

function mission(): Scenario['pilot'] {
  let steer: ((dir: number) => void) | null = null
  let level = 0, since = 0
  return (f, g, io) => {
    steer ??= keys(io)
    if (g.state !== 'play') { steer(0); if (g.state !== 'between') level = 0; tapStart(f, io); return }
    if (g.level !== level) { level = g.level; since = 0 }
    since++
    // Level 1 is skipped quickly; later levels get long enough for a few pickups.
    if (since === (level === 1 ? 240 : 780)) g.skipLevel()
    steer(dodge(g))
  }
}

function crash(): Scenario['pilot'] {
  let steer: ((dir: number) => void) | null = null
  let wait = 0
  return (f, g, io) => {
    steer ??= keys(io)
    if (g.state !== 'play') { steer(0); tapStart(f, io); return }
    if (--wait <= 0) {
      wait = 10 + Math.floor(io.random() * 30)
      steer(Math.floor(io.random() * 3) - 1)
    }
  }
}

function pairs(): Scenario['pilot'] {
  let steer: ((dir: number) => void) | null = null
  let since = 0
  return (f, g, io) => {
    steer ??= keys(io)
    // The stop between levels is tapped through without restarting the script's clock.
    if (g.state !== 'play') { steer(0); if (g.state !== 'between') since = 0; tapStart(f, io); return }
    since++
    if (since === 30) g.skipLevel()
    if (g.level >= 2) {
      if (since % 360 === 0) g.spawnDilemma()
      if (since % 360 === 180) g.spawnRescue()
      if (since === 1500) g.fill(4)   // a full ship: rings turn grey, nobody is taken
    }
    steer(dodge(g))
  }
}

function touch(): Scenario['pilot'] {
  let wait = 0
  const down = new Set<number>()
  let width = 390
  return (f, g, io) => {
    if (f === 600) { width = 320; io.resize(320, 700) }
    if (f === 1200) { width = 800; io.resize(800, 600) }   // wider than the play field
    if (f === 900) { io.blur(); down.clear() }
    if (g.state !== 'play') {
      for (const id of down) io.pointerUp(id)
      down.clear()
      if (f % 60 === 5) { io.pointerDown(9, width * 0.5); io.pointerUp(9) }
      return
    }
    if (--wait > 0) return
    wait = 8 + Math.floor(io.random() * 30)
    const id = 1 + Math.floor(io.random() * 2)   // two thumbs
    const x = io.random() * width
    const act = io.random()
    if (!down.has(id)) { io.pointerDown(id, x); down.add(id) }
    else if (act < 0.5) io.pointerMove(id, x)
    else { io.pointerUp(id); down.delete(id) }
  }
}

export const scenarios: Scenario[] = [
  { name: 'GOLD-01 mission', seed: 1, frames: 7800, pilot: mission() },
  { name: 'GOLD-02 crash and retry', seed: 2, frames: 2400, pilot: crash(), storage: { 'asteroids-galore-best-v2': '120' } },
  { name: 'GOLD-03 two-crew pairs', seed: 3, frames: 3000, pilot: pairs() },
  { name: 'GOLD-04 touch and resize', seed: 4, frames: 2400, pilot: touch() },
]

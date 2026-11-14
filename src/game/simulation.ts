import { newWell, reachOf, setState, shipMass, wellY } from './game'
import { buzz } from './haptics'
import { newSeed, rand, random, seedRandom } from './random'
import { runEnd } from './runSummary'
import { missionSoFar, scoreOf } from './score'
import { spawnAsteroid, spawnChoice, spawnDilemma, spawnDrop, spawnRescue } from './spawn'
import {
  CHOICE_EVERY, DILEMMA_EVERY, DROPS_WITHIN, FIRST_RESCUE, GRACE, LAST_LEVEL, LEVEL_MIN_TIME, MAX_SHIELDS, SHIELDS,
  SLOW_TIME, WELL_PULL, WELL_TIME, WORM_WAITS,
  handling, levelCapacity, levelTarget, rescueGap, shieldDrops, shipRadius, speedAt, startSpeed,
} from './tuning'
import type { Asteroid, Game } from './types'

export function startGame(g: Game): void {
  seedRandom(g.seed)            // the whole run is dealt from its seed
  g.asteroids = []; g.particles = []; g.floaters = []; g.drops = []
  g.time = 0; g.speed = 1; g.distance = 0; g.spawnTimer = 0.6; g.shake = 0; g.newBest = false
  g.level = 1; g.ship.r = shipRadius(0); g.levelTime = 0; g.levelScore = 0; g.onboard = 0
  g.wormhole = null; g.wormTimer = 0; g.wormWaits = []; g.wormCount = 0; g.dropCount = 0; g.flash = 0
  g.missed = 0; g.saved = 0; g.lost = 0
  g.results = []; g.levelFrom = { distance: 0, missed: 0 }
  g.boardOpen = false
  g.rescueTimer = 0; g.rescueCount = 0; g.slowmo = 0; g.slowWatch = null   // the first crew waits for FIRST_RESCUE
  g.shields = SHIELDS; g.grace = 0
  g.ship.x = g.W / 2; g.ship.vx = 0
  g.wells = [newWell(g, g.ship.x)]
  setState(g, 'play')
}

/**
 * A tap or a key: starts a run from the menu, moves on from the results screen
 * between levels, or restarts from an end screen. Screens that follow play must
 * have been up for a moment first, so a frantic tap does not skip them.
 */
export function tryStart(g: Game): void {
  if (g.state === 'menu') startGame(g)
  else if (g.stateTime <= 0.7) return
  else if (g.state === 'between') nextLevel(g)
  else if (g.state === 'over' || g.state === 'won') { g.seed = newSeed(); startGame(g) }
}

// Starts the next level, from the results screen. Each level restarts the speed
// ramp, the later ones from a higher speed, and the ship has more seats.
function nextLevel(g: Game): void {
  g.level++
  g.speed = startSpeed(g.level)
  g.wormTimer = 0; g.wormCount = 0; g.flash = 1 // arrive somewhere new
  g.levelFrom = { distance: g.distance, missed: g.missed }
  g.shields = Math.max(g.shields, SHIELDS)      // topped up; spares found on the way are kept
  g.levelTime = 0; g.levelScore = 0; g.dropCount = 0
  g.spawnTimer = Math.max(g.spawnTimer, 1.2)    // short breather
  g.rescueTimer = 4
  buzz([40, 60, 40])
  setState(g, 'play')
}

// Flying into the wormhole ends the level: the crew on board are delivered and
// the level's result is written down. The last level's wormhole is the way
// home and ends the run; any other shows the results screen until the player
// moves on.
function enterWormhole(g: Game): void {
  const saved = g.onboard
  deliver(g)
  g.results.push({ ...missionSoFar(g), saved })
  g.asteroids = []; g.drops = []; g.wormhole = null; g.slowmo = 0; g.slowWatch = null
  if (g.level >= LAST_LEVEL) { win(g); return }
  g.flash = 1
  buzz([40, 60, 40])
  setState(g, 'between')
}

// Through a wormhole the crew on board are home: saved for good, and only now
// do they count towards the score.
function deliver(g: Game): void {
  if (g.onboard > 0) g.floaters.push({ x: g.ship.x, y: g.ship.y - g.ship.r * 2.4, str: `${g.onboard} SAVED`, life: 1.6 })
  g.saved += g.onboard
  g.onboard = 0
}

// Takes as many people as there are free seats; the rest stay behind.
function rescue(g: Game, a: Asteroid): void {
  const { ship, U } = g
  const n = Math.min(a.people, levelCapacity(g.level) - g.onboard)
  g.onboard += n
  g.floaters.push({ x: a.x, y: a.y - a.r, str: `×${n}`, life: 1.2 })   // a multiplier, not points: crew multiply the distance
  for (let i = 0; i < 14; i++) {
    const t = rand(0.2, 0.45)   // crew "beam" towards the ship
    g.particles.push({
      x: a.x + rand(-1, 1) * a.r, y: a.y + rand(-1, 1) * a.r,
      vx: (ship.x - a.x) / t, vy: (ship.y - a.y) / t,
      life: t, max: t, size: rand(1.5, 3) * U, color: '#5dffa0',
    })
  }
  a.people -= n
  buzz(30)
}

function explode(g: Game, x: number, y: number): void {
  for (let i = 0; i < 46; i++) {
    const a = rand(0, 6.283), v = rand(40, 420) * g.U
    g.particles.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      life: rand(0.4, 1.1), max: 1.1, size: rand(1.5, 4.5) * g.U,
      color: ['#ffd166', '#ff7b54', '#ffffff', '#7fdcff'][i % 4],
    })
  }
}

function saveBest(g: Game): void {
  if (g.records.saveBest(scoreOf(g), runEnd(g))) g.newBest = true
}

// A hit burns a shield, and the run carries on where it is: same level, same
// distance, same crew. The rock that hit is destroyed and the ship is
// untouchable for a moment so the player can get clear. With no shield left
// the hit destroys the ship.
function takeHit(g: Game, a: Asteroid): void {
  if (g.shields <= 0) { gameOver(g); return }
  g.shields--
  explode(g, g.ship.x, g.ship.y)
  g.shake = 0.4
  a.dead = true
  g.missed += a.people          // anyone on that rock is lost
  g.grace = GRACE
  buzz([60, 40, 60])
}

// A shield arc flown through: one more shield, up to what a ship can hold.
function takeDrop(g: Game, d: { x: number; y: number; r: number }): void {
  g.shields = Math.min(MAX_SHIELDS, g.shields + 1)
  for (let i = 0; i < 12; i++) {
    const a = rand(0, 6.283), v = rand(40, 160) * g.U
    g.particles.push({ x: d.x, y: d.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.2, 0.5), max: 0.5, size: rand(1.5, 3) * g.U, color: '#7fdcff' })
  }
  d.r = 0                       // taken: removed with the ones that drifted past
  buzz(30)
}

function gameOver(g: Game): void {
  explode(g, g.ship.x, g.ship.y)
  g.shake = 0.5
  g.lost = g.onboard            // everyone still aboard goes down with the ship
  g.results.push({ ...missionSoFar(g), saved: 0, lost: g.lost })   // the level that was never finished: it scores nothing
  buzz([60, 40, 140])
  setState(g, 'over')
  saveBest(g)
}

function win(g: Game): void {
  g.flash = 1
  buzz([40, 60, 40, 60, 120])
  setState(g, 'won')
  saveBest(g)
}

/** Meets the current level's goals at once. For the debug hook. */
export function skipLevel(g: Game): void { g.levelScore = Math.max(g.levelScore, levelTarget(g.level)); g.levelTime = 1e9 }

/** Advances the game by `dt` seconds. `steer` is -1, 0 or 1. */
export function update(g: Game, dt: number, steer: number): void {
  const { H, U, ship } = g
  g.stateTime += dt
  g.clock += dt
  const scroll = H * 0.34 * (g.state === 'play' ? g.speed : g.state === 'over' ? 0.25 : 0.6)

  for (const s of g.stars) {
    s.y += (scroll * 0.35 * s.z * dt) / H
    if (s.y > 1) { s.y -= 1; s.x = Math.random() }   // scenery: not dealt from the seed
  }

  if (g.state === 'play') playerAndSpawns(g, dt, steer, scroll)

  for (let i = g.wells.length - 1; i >= 0; i--) {
    const w = g.wells[i]
    if (i > 0 || g.state !== 'play') w.dwell = Math.max(0, w.dwell - dt * 1.5)   // abandoned wells drain
    const want = w.dwell / WELL_TIME
    w.depth += (want - w.depth) * Math.min(1, dt * (want > w.depth ? 4 : 1.5))  // quick to deepen, slow to relax
    if (i > 0 && w.depth < 0.01) g.wells.splice(i, 1)
  }
  g.gridOff = (g.gridOff + scroll * 0.5 * dt) % (40 * U)
  // Pull grows with time parked, ship mass and flight speed.
  const pull = g.state === 'play' ? WELL_PULL * U * shipMass(g) * (0.6 + 0.4 * g.speed) : 0
  const wellR = 170 * U
  for (const a of g.asteroids) {
    for (const w of g.wells) {
      if (pull <= 0 || w.depth <= 0) continue
      // fall towards the well; strongest nearby, fading with distance
      const gx = w.x - a.x, gy = w.y - a.y, d2 = gx * gx + gy * gy
      const f = pull * w.depth ** 0.7 / (1 + d2 / (wellR * wellR)) / (Math.sqrt(d2) + 1) * dt
      a.vx = Math.max(-600 * U, Math.min(600 * U, a.vx + gx * f))
      a.gy += gy * f
    }
    a.y += (a.vy * scroll + a.gy) * dt
    a.x += a.vx * dt
    a.rot += a.spin * dt
    if (g.state === 'play') {
      const dx = a.x - ship.x, dy = a.y - ship.y
      if (a.people && g.onboard < levelCapacity(g.level)) {
        const reach = reachOf(g, a)
        if (dx * dx + dy * dy < reach * reach) rescue(g, a)
      }
      // Only rocks are dangerous. A planetoid is safe to fly across: it does not
      // break and costs no shield.
      const hit = a.r * 0.86 + ship.r * 0.7   // forgiving hitbox
      if (!a.planet && g.grace <= 0 && dx * dx + dy * dy < hit * hit) takeHit(g, a)
    }
  }
  for (const d of g.drops) {
    d.y += d.fall * scroll * dt
    if (g.state === 'play' && Math.hypot(d.x - ship.x, d.y - ship.y) < d.r + ship.r * 0.7) takeDrop(g, d)
  }
  g.drops = g.drops.filter(d => d.r > 0 && d.y - d.r < H + 10)
  g.asteroids = g.asteroids.filter(a => {
    if (a.dead) return false
    if (a.y - a.r < H + 10) return true
    if (g.state === 'play') g.missed += a.people
    return false
  })

  if (g.state === 'play' && random() < dt * 60) {
    g.particles.push({
      x: ship.x + rand(-3, 3) * U, y: ship.y + ship.r * 1.1,
      vx: rand(-14, 14) * U - ship.vx * 0.15, vy: rand(120, 220) * U,
      life: rand(0.15, 0.35), max: 0.35, size: rand(1.5, 3.2) * U,
      color: random() < 0.5 ? '#7fdcff' : '#ffd166',
    })
  }
  for (const p of g.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt }
  g.particles = g.particles.filter(p => p.life > 0)
  for (const f of g.floaters) { f.y -= 45 * U * dt; f.life -= dt }
  g.floaters = g.floaters.filter(f => f.life > 0)
  g.shake = Math.max(0, g.shake - dt)
  g.flash = Math.max(0, g.flash - dt * 1.6)
}

// A wormhole appears at a random position across the middle of the field. On
// the last level it is the way home, and every one arrives with a shield in
// the same row on the opposite side, equally easy to reach: nobody can take
// both. The first such offer is announced by the slow motion.
function openWormhole(g: Game): void {
  const { W, U } = g
  const r = 34 * U, y = -r - 30 * U
  g.wormCount++
  if (g.level < LAST_LEVEL) { g.wormhole = { x: rand(W * 0.2, W * 0.8), y, r }; return }
  const side = random() < 0.5 ? -1 : 1, off = rand(W * 0.2, W * 0.3)
  g.wormhole = { x: W / 2 + side * off, y, r }
  g.drops.push({ x: W / 2 - side * off, y, r: 16 * U, fall: 0.75 })
  if (g.wormCount === 1) g.slowWatch = g.wormhole
}

// A missed wormhole returns after a wait dealt from a shuffled set: nobody can
// predict the next one, and over a full set everyone has waited the same.
function nextWormWait(g: Game): number {
  if (!g.wormWaits.length) {
    g.wormWaits = [...WORM_WAITS]
    for (let i = g.wormWaits.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[g.wormWaits[i], g.wormWaits[j]] = [g.wormWaits[j], g.wormWaits[i]]
    }
  }
  return g.wormWaits.pop()!
}

// The part of a frame that only happens during a run: level progress, the
// wormhole, the ship, the well under it, and what gets spawned.
function playerAndSpawns(g: Game, dt: number, steer: number, scroll: number): void {
  const { W, H, U, ship } = g
  g.time += dt
  g.levelTime += dt
  g.speed = speedAt(g.level, g.levelScore / levelTarget(g.level))
  g.distance += dt * g.speed * 10
  g.levelScore += dt * g.speed * 10

  // Goals met: a wormhole drifts past. Fly into it to move on; miss it and
  // the next one takes a while to show up.
  const ready = g.levelScore >= levelTarget(g.level) && g.levelTime >= LEVEL_MIN_TIME
  if (ready && !g.wormhole) {
    g.wormTimer -= dt
    if (g.wormTimer <= 0) openWormhole(g)
  }
  if (g.wormhole) {
    g.wormhole.y += scroll * 0.75 * dt
    if (Math.hypot(g.wormhole.x - ship.x, g.wormhole.y - ship.y) < g.wormhole.r) {
      enterWormhole(g)
      return
    } else if (g.wormhole.y - g.wormhole.r > H + 10) {
      g.wormhole = null
      g.wormTimer = nextWormWait(g)
    }
  }

  // Ship: quick, slightly weighty lateral movement.
  // Crew make the ship heavy: it swells and steers slower as the seats fill,
  // and shrinks back when they are delivered.
  ship.r += (shipRadius(g.onboard) * U - ship.r) * Math.min(1, dt * 5)
  const maxV = W * (1.25 + g.speed * 0.18) * handling(g.onboard)
  const target = steer * maxV
  ship.vx += (target - ship.vx) * Math.min(1, dt * (target ? 9 : 7))
  ship.x += ship.vx * dt
  const margin = ship.r * 1.3
  if (ship.x < margin) { ship.x = margin; ship.vx = 0 }
  if (ship.x > W - margin) { ship.x = W - margin; ship.vx = 0 }

  // "Same place" = within a small radius of where the current well was started.
  const cur = g.wells[0]
  cur.y = wellY(g)
  if (Math.abs(ship.x - cur.x) < 26 * U) {
    cur.dwell = Math.min(WELL_TIME, cur.dwell + dt)
    cur.x += (ship.x - cur.x) * Math.min(1, dt * 3)            // settle onto the ship, not beside it
  }
  else if (cur.dwell > 0.3) g.wells.unshift(newWell(g, ship.x))   // leave the old well behind
  else { cur.x = ship.x; cur.dwell = 0 }                       // nothing dug yet: just follow the ship

  g.spawnTimer -= dt
  if (g.spawnTimer <= 0) {
    spawnAsteroid(g)
    // Slightly denser over time, and scaled so wide fields aren't sparse.
    g.spawnTimer = rand(0.4, 0.8) * (400 * U / W) / (0.75 + g.speed * 0.25)
  }

  // Show, don't tell: as the first of two crews comes into view, time slows
  // for a moment so the player can take in that a second one follows.
  if (g.slowWatch && g.slowWatch.y > 0) { g.slowmo = SLOW_TIME; g.slowWatch = null }

  g.grace = Math.max(0, g.grace - dt)

  // Shield drops: a fixed number per level, evenly spaced by distance, so
  // everyone is offered the same. Every few arrive as a choice against crew.
  const drops = shieldDrops(g.level)
  if (g.dropCount < drops && g.levelScore >= levelTarget(g.level) * DROPS_WITHIN * (g.dropCount + 1) / drops) {
    g.dropCount++
    if (g.dropCount % CHOICE_EVERY === 0) spawnChoice(g); else spawnDrop(g)
  }

  // A run opens with rocks alone: the first planetoid shows up at a set distance.
  if (g.level === 1 && g.distance < FIRST_RESCUE) return
  g.rescueTimer -= dt
  if (g.rescueTimer <= 0) {
    g.rescueCount++
    // Level 1 only ever shows one crew at a time, one person each.
    if (g.level > 1 && g.rescueCount % DILEMMA_EVERY === 0) spawnDilemma(g); else spawnRescue(g)
    g.rescueTimer = rand(...rescueGap(g.level))
  }
}

// Headless check of the story-mode rules (2026-11-22; see "Headless check of the story rules" in
// _meta/game-design.md). Not part of the game and not run by `npm test`: `npm run sim:story` runs
// story.sim.ts beside this file. It does not ship: it drives the
// real simulation and lays the story rules over it. The pilot is adapted from the Game Producer's
// scripted pilot (ship balance work, 2026-11-20): it predicts rock paths over a short horizon,
// with human limits (rocks unnoticed at first, a reaction delay, lapses).
import { createGame, seats, shipMass } from '../../src/game/game'
import { startGame, update } from '../../src/game/simulation'
import { FIRST_RESCUE, MAX_SHIELDS, SHIELDS, STEP, WELL_PULL, handling, levelTarget, shieldDrops, shipRadius, startSpeed } from '../../src/game/tuning'
import type { Records } from '../../src/game/records'
import type { Game } from '../../src/game/types'

export interface Skill { react: number; margin: number; horizon: number; wide: number; commit: number; notice: number; delay: number; lapse: number; lapseFor: number }
const base = { react: 6, margin: 6, horizon: 1.2, wide: 1, commit: 15, lapseFor: 0.4 }
export const PILOTS: Record<string, Skill> = {
  expert: { ...base, notice: 0.15, delay: 6, lapse: 0.005 },
  strong: { ...base, notice: 0.2, delay: 9, lapse: 0.01 },
  average: { ...base, notice: 0.25, delay: 12, lapse: 0.01 },
}
export const MOONS = [6, 7, 11, 12, 16, 18, 20]
const records = { best: 0, bestEnd: { outcome: 'over', level: 1, finalDistance: 0, ship: 0 }, saveBest: () => false, absorb: () => {} } as unknown as Records

function decide(g: Game, sk: Skill, last: number): number {
  const { ship, W, H } = g
  const scroll = H * 0.34 * g.speed
  const full = g.onboard >= seats(g)
  let tx: number | null = null, tw = 1, ty = 0
  if (g.wormhole) { tx = g.wormhole.x; ty = g.wormhole.y; tw = 6 }
  else {
    let best = -1
    for (const d of g.drops) {
      if (d.y > ship.y || g.shields >= MAX_SHIELDS) continue
      const v = g.shields <= 1 ? 100 : full ? 50 : 2.5
      if (v > best) { best = v; tx = d.x; ty = d.y; tw = 3 }
    }
    if (!full) for (const a of g.asteroids) {
      if (!a.people || a.y > ship.y) continue
      const v = Math.min(a.people, seats(g) - g.onboard) + a.y / H
      if (v > best) { best = v; tx = a.x; ty = a.y; tw = 2 }
    }
  }
  if (tx === null) { tx = W / 2 + Math.sin(g.time * 1.1) * W * 0.22; ty = ship.y; tw = 0.4 }
  const dtp = 1 / 30, n = Math.round(sk.horizon / dtp)
  const maxV = W * (1.25 + g.speed * 0.18) * handling(g.shipType)
  const mrg = ship.r * 1.3
  const rocks = g.asteroids.filter(a => !a.planet && a.y > -a.r + sk.notice * a.vy * scroll)
  const m = rocks.length
  const px = new Float64Array(m * (n + 1)), py = new Float64Array(m * (n + 1)), hr = new Float64Array(m)
  const pull = WELL_PULL * shipMass(g) * (0.6 + 0.4 * g.speed), wr2 = 170 * 170
  const wells = g.wells.filter(w => w.depth > 0.02)
  for (let i = 0; i < m; i++) {
    const a = rocks[i]
    let x = a.x, y = a.y, vx = a.vx, gy = a.gy
    hr[i] = a.r * 0.86 + ship.r * 0.7 + sk.margin
    for (let j = 1; j <= n; j++) {
      for (const w of wells) {
        const gx = w.x - x, gyy = w.y - y, d2 = gx * gx + gyy * gyy
        const f = pull * w.depth ** 0.7 / (1 + d2 / wr2) / (Math.sqrt(d2) + 1) * dtp
        vx = Math.max(-600, Math.min(600, vx + gx * f)); gy += gyy * f
      }
      y += (a.vy * scroll + gy) * dtp; x += vx * dtp
      px[i * (n + 1) + j] = x; py[i * (n + 1) + j] = y
    }
  }
  const well = g.wells[0]
  const plans: [number, number][] = [[-1, -1], [0, 0], [1, 1], [-1, 0], [1, 0], [-1, 1], [1, -1]]
  let bestPlan = 0, bestScore = -1e18
  const dl = sk.delay / 60
  const tArr = Math.max(0, Math.min(sk.horizon, (ship.y - ty) / Math.max(1, scroll * 0.9)))
  for (const [s1, s2] of plans) {
    let x = ship.x, v = ship.vx, hitAt = -1, xAt = x, clear = 1e9
    for (let j = 1; j <= n && hitAt < 0; j++) {
      const tt = j * dtp, s = tt < dl ? last : tt < dl + 0.3 ? s1 : s2, target = s * maxV
      v += (target - v) * Math.min(1, dtp * (target ? 9 : 7)); x += v * dtp
      if (x < mrg) { x = mrg; v = 0 } else if (x > W - mrg) { x = W - mrg; v = 0 }
      if (tt <= tArr + dtp) xAt = x
      if (g.grace > tt) continue
      for (let i = 0; i < m; i++) {
        const dx = px[i * (n + 1) + j] - x, dy = py[i * (n + 1) + j] - ship.y
        const d = Math.sqrt(dx * dx + dy * dy) - hr[i]
        if (d < 0) { hitAt = tt; break }
        if (d < clear) clear = d
      }
    }
    const parked = well.dwell > 1.2 && Math.abs(x - well.x) < 40 ? 30 * well.dwell : 0
    const score = (hitAt >= 0 ? -5000 / (hitAt + 0.05) : 0) - Math.abs(tx - xAt) * tw - parked - (s1 !== 0 ? 0.5 : 0) - sk.wide * 400 / (clear + 10) + (s1 === last ? sk.commit : 0)
    if (score > bestScore) { bestScore = score; bestPlan = s1 }
  }
  return bestPlan
}

/**
 * The rules a story is flown under. `maxReturns`: returns per moon (the owner chose no limit;
 * a large number stands for it). `returnAtShields`: the pilot goes back only with this many
 * shields or more. `gentle`: missions 04 and 05 start at mission 03's speed (decided by the owner).
 * `loophole`: the empty 4-seater is crashed on purpose at m00n. `returnTopUp`: returns start
 * with shields topped up (tried and rejected).
 */
export interface Rules { maxReturns: number; loophole: boolean; returnAtShields: number; returnTopUp?: boolean; gentle?: boolean }

/** The rules as decided by the owner on 2026-11-22. */
export const DECIDED: Rules = { maxReturns: 6, loophole: false, returnAtShields: 2, gentle: true }
interface Trip { level: number; boat: number; people: number; isReturn: boolean; shields: number; seed: number }
interface TripOut { picked: number; missed: number; destroyed: boolean; seconds: number; shieldsLeft: number; won: boolean }

// One flight: a mission's first trip, a return, or mission 06. The moon's people are dealt onto the
// flight's planetoids and nowhere else; the crew member a hit throws off in arcade stays aboard.
function fly(t: Trip, sk: Skill): TripOut {
  const g = createGame(records)
  g.seed = t.seed
  startGame(g)
  const T = levelTarget(t.level)
  Object.assign(g, { level: t.level, shipType: t.boat, shields: t.shields, onboard: 0 })
  g.ship.r = shipRadius(t.boat)
  if (t.isReturn) {                                    // a third of the target, at the speed the trip ended near
    g.levelScore = T * 2 / 3; g.levelTime = 20
    g.distance = FIRST_RESCUE                          // past arcade's rocks-only opening
    g.dropCount = shieldDrops(t.level)                 // no shield drops on a return
  }
  g.speed = startSpeed(t.level)
  let undealt = t.people, missed = 0
  const seen = new Set<object>()
  const est = () => Math.max(4, (T - g.levelScore) / (10 * Math.max(1, g.speed)))   // seconds of flight left
  g.rescueTimer = t.isReturn ? 1.5 : 3
  let want = 0, lapseLeft = 0, frame = 0
  const queue: number[] = []
  let rs = (t.seed ^ 0x9e3779b9) >>> 0
  const prnd = () => { rs = (rs + 0x6d2b79f5) >>> 0; let x = rs; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296 }
  while (g.state === 'play' && frame < 60 * 60 * 6) {
    if (lapseLeft > 0) lapseLeft -= STEP
    else if (frame % sk.react === 0) { want = decide(g, sk, want); if (prnd() < sk.lapse) lapseLeft = sk.lapseFor }
    queue.push(want); const steer = queue.length > sk.delay ? queue.shift()! : 0
    const before = g.onboard
    g.events.length = 0
    update(g, STEP, steer)
    frame++
    // a hit costs a shield and nothing else: put back the crew member arcade throws off
    for (let i = 0; i < g.events.length; i++) {
      const e = g.events[i]
      if (e.kind === 'hit' && g.events[i + 1]?.kind === 'missed' && before > g.onboard) { g.onboard++; g.missed--; i++ }
      else if (e.kind === 'missed') missed += e.count   // drifted past: still on the moon
    }
    // planetoids carry only the moon's people, spread over the flight
    let spawned = false
    for (const a of g.asteroids) {
      if (!a.people || seen.has(a)) continue
      seen.add(a); spawned = true
      if (undealt <= 0) { a.dead = true; continue }
      a.people = Math.min(a.people, undealt); undealt -= a.people
    }
    if (spawned) g.rescueTimer = undealt > 0 ? est() / Math.max(1, Math.ceil(undealt / 2)) : 1e9
    // mission 06: the way out opens as soon as the boat is full
    if (t.level === 7 && g.onboard >= seats(g) && !g.wormhole) { g.levelScore = Math.max(g.levelScore, T); g.levelTime = Math.max(g.levelTime, 20); g.wormTimer = Math.min(g.wormTimer, 0) }
  }
  const destroyed = g.state === 'over'
  return { picked: destroyed ? g.lost : g.saved, missed, destroyed, seconds: g.time, shieldsLeft: g.shields, won: g.state === 'won' }
}

export function flyStory(seed: number, sk: Skill, rules: Rules) {
  const left = [...MOONS]
  const lost: Record<number, boolean> = {}
  let offered = [1]                                     // the boats on offer: the 8-seater after 01, the 12 after 03
  let lantern = 0, dead = 0, seconds = 0, n = 0, fullAt03 = false, home06 = 0, reached06Boats = -1, endedAt = -1
  const boatsLostAt: number[] = [], returns: number[] = [], cleared: boolean[] = [], lostOnReturn: number[] = []
  const nextSeed = () => (seed * 7919 + 13 + (n++) * 104729) >>> 0
  const boat = () => { const ok = [1, 2, 3].filter(b => offered.includes(b) && !lost[b]); return ok.length ? ok[ok.length - 1] : 0 }
  const release = () => { for (const b of [1, 2, 3]) if (!lost[b] && !offered.includes(b)) { offered.push(b); return } }
  const loseBoat = (b: number, moon: number) => { lost[b] = true; boatsLostAt.push(moon); if (!boat()) release() }
  if (rules.loophole) loseBoat(1, 0)                   // the empty 4-seater crashed on purpose at m00n
  for (let moon = 0; moon < 6; moon++) {
    if (moon === 2) offered = [...new Set([...offered, 2])]
    if (moon === 4) offered = [...new Set([...offered, 3])]
    let shields = SHIELDS, ret = 0, retLost = 0
    for (let trip = 0; ; trip++) {
      const b = boat()
      if (!b) { endedAt = moon; break }
      const out = fly({ level: rules.gentle && moon >= 4 ? 4 : moon + 1, boat: b, people: left[moon], isReturn: trip > 0, shields: trip > 0 && !rules.returnTopUp ? shields : Math.max(shields, SHIELDS), seed: nextSeed() }, sk)
      seconds += out.seconds
      if (out.destroyed) { dead += out.picked; left[moon] -= out.picked; loseBoat(b, moon); if (trip > 0) retLost++; shields = SHIELDS }
      else { lantern += out.picked; left[moon] -= out.picked; shields = out.shieldsLeft }
      if (!boat()) { endedAt = moon; break }
      // go back? only while people are left, within the limit, and (careful) with shields to spare
      if (left[moon] <= 0 || ret >= rules.maxReturns || (!out.destroyed && shields < rules.returnAtShields)) break
      ret++
    }
    returns.push(ret); cleared.push(left[moon] <= 0); lostOnReturn.push(retLost)
    if (moon === 3) fullAt03 = lantern >= 36           // the ore choice: this pilot always drops the ore and goes on
    if (endedAt >= 0) break
  }
  const fullAt05 = lantern >= 70
  const boatsLeft = [1, 2, 3].filter(b => !lost[b]).length
  if (endedAt < 0) {
    reached06Boats = boatsLeft
    const b = [1, 2, 3].filter(x => !lost[x]).pop()!    // the biggest boat left flies mission 06
    const out = fly({ level: 7, boat: b, people: left[6], isReturn: false, shields: SHIELDS, seed: nextSeed() }, sk)
    seconds += out.seconds
    if (out.won) home06 = out.picked; else if (out.destroyed) dead += out.picked
  }
  const leftBehind = left.slice(0, 6).reduce((s, x) => s + x, 0)
  return { lantern, dead, leftBehind, home06, reached06Boats, endedAt, boatsLostAt, returns, cleared, lostOnReturn, fullAt03, fullAt05, minutes: seconds / 60 }
}

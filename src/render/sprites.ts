import { curvature, ringRadius, shipMass } from '../game/game'
import { GRACE, shipGrid, shipSeats } from '../game/tuning'
import type { Asteroid, Castaway, Drop, Game, Wormhole } from '../game/types'
import { glow, text } from './text'

// Vector glow: every body is a dark fill inside a bright, glowing outline.
// Each pair is [outline, fill].
const ROCK = [['#9fb4b0', '#2b3634'], ['#b4a898', '#37312b'], ['#93a6b8', '#29313a']]
// Planetoids are round and coloured, so they never read as one of the grey rocks.
const PLANET = [['#ff5fd2', '#5a1f4c'], ['#ff9a5f', '#5c3521'], ['#b48cff', '#3a2a66']]
const LINE = '#5ff5ff'   // the ship's own lines
const BLACK = '#000000'

// A planetoid: a banded disc in a glowing rim.
function drawPlanetBody(ctx: CanvasRenderingContext2D, a: Asteroid, U: number): void {
  const [light, dark] = PLANET[a.shade]
  const r = a.r
  ctx.save()
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fillStyle = dark
  ctx.fill()
  ctx.clip()
  ctx.fillStyle = light
  ctx.globalAlpha = 0.3
  ctx.fillRect(-r, -r * 0.5, r * 2, r * 0.26)
  ctx.fillRect(-r, r * 0.08, r * 2, r * 0.4)
  ctx.fillRect(-r, r * 0.72, r * 2, r * 0.3)
  ctx.restore()
  ctx.lineWidth = Math.max(1.5, 2 * U)
  ctx.strokeStyle = light
  glow(ctx, light, 10 * U)
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke()
  glow(ctx)
}

// An asteroid: a jagged dark rock in a glowing outline, with craters.
function drawRockBody(ctx: CanvasRenderingContext2D, a: Asteroid, U: number): void {
  ctx.beginPath()
  const n = a.shape.length
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2, rr = a.r * a.shape[i]
    const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y)
  }
  ctx.closePath()
  const [light, dark] = ROCK[a.shade]
  ctx.fillStyle = dark
  ctx.fill()
  ctx.lineWidth = Math.max(1.5, 2 * U)
  ctx.strokeStyle = light
  glow(ctx, light, 10 * U)
  ctx.stroke()
  glow(ctx)
  ctx.lineWidth = Math.max(1, 1.2 * U)
  ctx.globalAlpha = 0.6
  for (const c of a.craters) {
    ctx.beginPath()
    ctx.arc(Math.cos(c.a) * c.d * a.r, Math.sin(c.a) * c.d * a.r, c.r * a.r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

// One crew member: a yellow suit, a white helmet, and both arms waving.
// Drawn standing on the origin, `s` sets the size.
function drawPerson(ctx: CanvasRenderingContext2D, s: number, U: number, wave: number): void {
  ctx.strokeStyle = ctx.fillStyle = '#ffe66b'
  glow(ctx, '#ffe66b', 6 * U)
  ctx.lineWidth = 1.6 * U
  ctx.lineCap = 'round'
  for (const d of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(d * s * 0.5, -s * 0.9)
    ctx.lineTo(d * s * (1.3 + wave * d * 0.5), -s * (1.9 + wave * d))
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.roundRect(-s * 0.6, -s * 1.5, s * 1.2, s * 1.7, s * 0.4)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath(); ctx.arc(0, -s * 2.1, s * 0.75, 0, Math.PI * 2); ctx.fill()
  glow(ctx)
}

function drawCrew(ctx: CanvasRenderingContext2D, a: Asteroid, U: number, clock: number): void {
  // stranded crew, standing around the rim and waving
  for (let i = 0; i < a.people; i++) {
    ctx.save()
    ctx.rotate((i / a.people) * Math.PI * 2 + 0.4)
    ctx.translate(0, -a.r * 0.92)
    drawPerson(ctx, 4.6 * U, U, Math.sin(clock * 9 + i * 2) * 0.5)
    ctx.restore()
  }
}

// A crew member thrown off the ship by a hit: the same figure the player
// picked up, a little larger, tumbling away and fading.
export function drawCastaway(ctx: CanvasRenderingContext2D, g: Game, c: Castaway): void {
  const { U, clock } = g
  ctx.save()
  ctx.globalAlpha = Math.min(1, c.life / 0.8)
  ctx.translate(c.x, c.y)
  ctx.rotate(c.rot)
  ctx.translate(0, 6 * U)
  drawPerson(ctx, 6 * U, U, Math.sin(clock * 14) * 0.5)
  ctx.restore()
}

// The pickup ring around a body that still has crew on it.
function drawRing(ctx: CanvasRenderingContext2D, g: Game, a: Asteroid): void {
  const { U, clock } = g
  if (a.people) {
    const R = ringRadius(g, a)
    ctx.save()
    const full = g.onboard >= shipSeats(g.shipType)
    const col = full ? '#6a7574' : '#5dffa0'
    ctx.strokeStyle = col
    if (!full) glow(ctx, col, 10 * U)
    ctx.globalAlpha = 0.55 + 0.3 * Math.sin(clock * 6)
    ctx.lineWidth = 2 * U
    ctx.setLineDash([8 * U, 7 * U])
    ctx.lineDashOffset = -clock * 30 * U
    ctx.beginPath(); ctx.arc(a.x, a.y, R, 0, Math.PI * 2); ctx.stroke()
    ctx.restore()
    if (!full) text(ctx, `SOS ×${a.people}`, a.x, a.y - R - 8 * U, 14 * U, col)   // a full ship just sees grey rings
  }
}

export function drawAsteroid(ctx: CanvasRenderingContext2D, g: Game, a: Asteroid): void {
  const { U, clock } = g
  ctx.save()
  ctx.translate(a.x, a.y)
  ctx.rotate(a.rot)
  if (a.planet) drawPlanetBody(ctx, a, U); else drawRockBody(ctx, a, U)
  drawCrew(ctx, a, U, clock)
  ctx.restore()
  drawRing(ctx, g, a)
}

export function drawWormhole(ctx: CanvasRenderingContext2D, g: Game, w: Wormhole): void {
  const { U, clock } = g
  ctx.save()
  ctx.translate(w.x, w.y)
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, w.r * 1.25)
  grad.addColorStop(0, '#000000')
  grad.addColorStop(0.45, '#2a1466')
  grad.addColorStop(0.8, 'rgba(127,90,255,.55)')
  grad.addColorStop(1, 'rgba(127,220,255,0)')
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.arc(0, 0, w.r * 1.25, 0, Math.PI * 2); ctx.fill()
  ctx.lineCap = 'round'
  for (let i = 0; i < 4; i++) {
    const rr = w.r * (1 - i * 0.2), a0 = clock * (2.5 + i * 1.3) + i * 1.7
    ctx.strokeStyle = i % 2 ? '#7fdcff' : '#c9a8ff'
    glow(ctx, i % 2 ? '#7fdcff' : '#c9a8ff', 12 * U)
    ctx.lineWidth = (3 - i * 0.5) * U
    for (let k = 0; k < 2; k++) {
      ctx.beginPath(); ctx.arc(0, 0, rr, a0 + k * Math.PI, a0 + k * Math.PI + 1.9); ctx.stroke()
    }
  }
  ctx.restore()
}

/** Shields look the same ahead of the ship, in the HUD and drifting down the field. */
export const SHIELD_COLOR = '#7fdcff'
export const SHIELD_SPREAD = 0.8   // half-width of a shield arc, in radians

// A shield to pick up: the arc the player knows from the ship, glowing and
// doubled so it reads as something to take, not something worn.
export function drawDrop(ctx: CanvasRenderingContext2D, g: Game, d: Drop): void {
  const { U, clock } = g
  ctx.save()
  ctx.translate(d.x, d.y)
  ctx.globalAlpha = 0.16 + 0.08 * Math.sin(clock * 6)
  ctx.fillStyle = SHIELD_COLOR
  ctx.beginPath(); ctx.arc(0, 0, d.r * 1.35, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = 1
  ctx.lineCap = 'round'
  ctx.strokeStyle = SHIELD_COLOR
  glow(ctx, SHIELD_COLOR, 10 * U)
  for (const k of [1, 0.62]) {
    ctx.lineWidth = 3 * U * k
    ctx.beginPath(); ctx.arc(0, d.r * 0.55, d.r * k, -Math.PI / 2 - SHIELD_SPREAD, -Math.PI / 2 + SHIELD_SPREAD); ctx.stroke()
  }
  ctx.restore()
}

/**
 * A ship's body around the origin, nose up: wings, hull, cockpit and its seats,
 * `onboard` of them taken. `type` is the ship, 1 to 3, and decides the seats;
 * `r` is the size it is drawn at. The flame is left off a ship that is not flying.
 */
/** A seat nobody sits in. */
export const SEAT_FREE = '#8fc4cc'

export function drawHull(ctx: CanvasRenderingContext2D, r: number, type: number, onboard: number, flame = true): void {
  if (flame) {
    const f = r * (1.0 + Math.random() * 0.5)
    ctx.fillStyle = '#ffe66b'
    glow(ctx, '#ffe66b', r * 0.6)
    ctx.beginPath()
    ctx.moveTo(-r * 0.32, r * 0.75); ctx.lineTo(0, r * 0.75 + f); ctx.lineTo(r * 0.32, r * 0.75)
    ctx.fill()
  }
  // the ship is drawn in lines of light: black inside, so nothing shows through
  ctx.strokeStyle = LINE
  ctx.lineWidth = Math.max(1.5, r * 0.09)
  ctx.lineJoin = 'round'
  glow(ctx, LINE, r * 0.5)
  // wings
  ctx.fillStyle = BLACK
  ctx.beginPath()
  ctx.moveTo(0, -r * 0.2); ctx.lineTo(r * 1.15, r * 0.95); ctx.lineTo(r * 0.3, r * 0.7)
  ctx.lineTo(-r * 0.3, r * 0.7); ctx.lineTo(-r * 1.15, r * 0.95)
  ctx.closePath(); ctx.fill(); ctx.stroke()
  // hull
  ctx.fillStyle = BLACK
  ctx.beginPath()
  ctx.moveTo(0, -r * 1.35)
  ctx.quadraticCurveTo(r * 0.55, -r * 0.2, r * 0.42, r * 0.85)
  ctx.lineTo(-r * 0.42, r * 0.85)
  ctx.quadraticCurveTo(-r * 0.55, -r * 0.2, 0, -r * 1.35)
  ctx.fill(); ctx.stroke()
  glow(ctx)
  // cockpit
  ctx.fillStyle = LINE
  ctx.beginPath()
  ctx.ellipse(0, -r * 0.62, r * 0.17, r * 0.27, 0, 0, Math.PI * 2)
  ctx.fill()
  // passenger deck: one seat per dot, filling from the back as crew come
  // aboard. Every ship's seats are a full rectangle, in rows of two or three.
  const [cols, rows] = shipGrid(type)
  // The seats keep clear of the hull's lines and of the cockpit glass: the
  // lowest row stops short of the tail, the highest short of the glass.
  const p = Math.min(0.72 * r / Math.max(2, cols), 1.0 * r / rows)
  // the pair sits midway between the cockpit glass and the tail
  const back = cols === 1 ? r * 0.25 + p / 2 : r * 0.6
  for (let i = 0; i < cols * rows; i++) {
    const cx = (i % cols - (cols - 1) / 2) * p
    const cy = back - Math.floor(i / cols) * p
    const taken = i < onboard
    ctx.fillStyle = taken ? '#5dffa0' : SEAT_FREE
    if (taken) glow(ctx, '#5dffa0', p * 0.6)
    ctx.beginPath(); ctx.arc(cx, cy, p * (taken ? 0.36 : 0.28), 0, Math.PI * 2); ctx.fill()
    glow(ctx)
  }
}

export function drawShip(ctx: CanvasRenderingContext2D, g: Game): void {
  const { ship, W, clock } = g
  const r = ship.r
  ctx.save()
  ctx.translate(ship.x, ship.y)
  ctx.rotate(Math.max(-0.45, Math.min(0.45, ship.vx / (W * 1.4) * 0.45)))
  drawHull(ctx, r, g.shipType, g.onboard)
  // shields: one arc per shield left, stacked ahead of the nose
  ctx.lineCap = 'round'
  ctx.strokeStyle = SHIELD_COLOR
  glow(ctx, SHIELD_COLOR, r * 0.5)
  // After a hit the shields blink while the ship cannot be hit, and the arc
  // that was just burnt flickers out beyond them.
  const safe = g.grace > 0 && g.state === 'play'
  const blink = safe ? (Math.sin(clock * 28) > 0 ? 0.95 : 0.25) : 1
  for (let n = 0; n < g.shields + (safe ? 1 : 0); n++) {
    ctx.globalAlpha = n < g.shields ? blink : blink * 0.6 * Math.min(1, g.grace / GRACE * 1.5)
    ctx.lineWidth = r * 0.14
    ctx.beginPath()
    ctx.arc(0, -r * 0.2, r * (1.75 + n * 0.34), -Math.PI / 2 - SHIELD_SPREAD, -Math.PI / 2 + SHIELD_SPREAD)
    ctx.stroke()
  }
  ctx.restore()
}

// Spacetime grid: barely visible when flat, brighter and pinched towards the
// ship as the gravity well deepens.
export function drawGrid(ctx: CanvasRenderingContext2D, g: Game): void {
  const { W, H, U } = g
  const c = curvature(g), step = 40 * U, seg = 20 * U, R2 = (130 * U) ** 2
  const k = 0.62 * Math.min(1.4, shipMass(g))
  const live = g.wells.filter(w => w.depth > 0.004)
  const warp = (x: number, y: number) => {
    let ox = 0, oy = 0
    for (const w of live) {
      const dx = w.x - x, dy = w.y - y, s = k * w.depth / (1 + (dx * dx + dy * dy) / R2)
      ox += dx * s; oy += dy * s
    }
    return [x + ox, y + oy]
  }
  ctx.beginPath()
  const x0 = (W / 2) % step - step
  for (let x = x0; x <= W + step; x += step) {
    for (let y = -seg; y <= H + seg * 2; y += seg) {
      const [px, py] = warp(x, y)
      if (y === -seg) ctx.moveTo(px, py); else ctx.lineTo(px, py)
    }
  }
  for (let y = g.gridOff - step; y <= H + step; y += step) {
    for (let x = -seg; x <= W + seg * 2; x += seg) {
      const [px, py] = warp(x, y)
      if (x === -seg) ctx.moveTo(px, py); else ctx.lineTo(px, py)
    }
  }
  ctx.strokeStyle = `rgba(${Math.round(110 + 90 * c)},${Math.round(160 - 30 * c)},255,${0.07 + 0.38 * c})`
  ctx.lineWidth = 1 + c * 0.6
  ctx.stroke()
}

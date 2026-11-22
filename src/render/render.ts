import type { Game } from '../game/types'
import { drawHud, type StoryHud } from './hud'
import { drawAsteroid, drawCastaway, drawDrop, drawFlame, drawGrid, drawShip, drawWormhole } from './sprites'
import { text } from './text'

/**
 * How the field is drawn. `starStretch`: how much a near star lengthens for each 1× of speed above
 * the starting speed. `shipFade`: seconds the ship takes to fade away on the stop between missions.
 */
export const look = { starStretch: 4, shipFade: 0.8 }

/** How strongly the ship is drawn: whole, except on the stop between missions, where it fades away. */
export const shipAlpha = (g: Game): number => g.state === 'between' ? Math.max(0, 1 - g.stateTime / look.shipFade) : 1

// The grid and the stars.
function drawSky(ctx: CanvasRenderingContext2D, g: Game): void {
  const { W, H, U } = g
  drawGrid(ctx, g)
  for (const s of g.stars) {
    ctx.globalAlpha = 0.25 + s.z * 0.6
    ctx.fillStyle = '#7fa8a2'
    const sz = (0.6 + s.z * 1.4) * U
    ctx.fillRect(s.x * W, s.y * H, sz, sz * (1 + (g.state === 'play' ? g.speed - 1 : 0) * s.z * look.starStretch))
  }
  ctx.globalAlpha = 1
}

/** The empty field, black with its grid and stars: what the story's own screens are drawn over, in place of a frame. */
export function drawBackdrop(ctx: CanvasRenderingContext2D, g: Game): void {
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, g.W, g.H)
  drawSky(ctx, g)
}

/** Draws one frame. Reads the game, never changes it. `story` is what the story mode adds to it (see `StoryHud`). */
export function render(ctx: CanvasRenderingContext2D, g: Game, story: StoryHud = {}): void {
  const { W, H, U } = g
  ctx.save()
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, W, H)
  if (g.shake > 0) ctx.translate((Math.random() * 2 - 1) * g.shake * 16 * U, (Math.random() * 2 - 1) * g.shake * 16 * U)

  drawSky(ctx, g)

  if (g.wormhole) drawWormhole(ctx, g, g.wormhole)
  for (const a of g.asteroids) drawAsteroid(ctx, g, a)
  for (const d of g.drops) drawDrop(ctx, g, d)
  for (const c of g.castaways) drawCastaway(ctx, g, c)
  for (const p of g.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max)
    ctx.fillStyle = p.color
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill()
  }
  for (const f of g.floaters) {
    ctx.globalAlpha = Math.min(1, f.life * 2)
    text(ctx, f.str, f.x, f.y, 20 * U, '#5dffa0', 'center', 800)
  }
  ctx.globalAlpha = 1
  if (g.state === 'launch') drawFlame(ctx, g)
  if (g.state !== 'over' && shipAlpha(g) > 0) drawShip(ctx, g, shipAlpha(g), story.flight?.captainAboard ? { glass: '#5dffa0' } : {})
  ctx.restore()

  if (g.flash > 0) {
    ctx.fillStyle = `rgba(201,168,255,${g.flash * 0.85})`
    ctx.fillRect(0, 0, W, H)
  }

  drawHud(ctx, g, story)
}

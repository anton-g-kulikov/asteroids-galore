import { rand } from '../game/random'
import type { Game } from '../game/types'
import { drawHud } from './hud'
import { drawAsteroid, drawDrop, drawGrid, drawShip, drawWormhole } from './sprites'
import { text } from './text'

/** Draws one frame. Reads the game, never changes it. */
export function render(ctx: CanvasRenderingContext2D, g: Game): void {
  const { W, H, U } = g
  ctx.save()
  ctx.fillStyle = '#05060d'
  ctx.fillRect(0, 0, W, H)
  if (g.shake > 0) ctx.translate(rand(-1, 1) * g.shake * 16 * U, rand(-1, 1) * g.shake * 16 * U)

  drawGrid(ctx, g)
  for (const s of g.stars) {
    ctx.globalAlpha = 0.25 + s.z * 0.6
    ctx.fillStyle = '#cfe0ff'
    const sz = (0.6 + s.z * 1.4) * U
    ctx.fillRect(s.x * W, s.y * H, sz, sz * (1 + (g.state === 'play' ? g.speed - 1 : 0) * s.z * 1.5))
  }
  ctx.globalAlpha = 1

  if (g.wormhole) drawWormhole(ctx, g, g.wormhole)
  for (const a of g.asteroids) drawAsteroid(ctx, g, a)
  for (const d of g.drops) drawDrop(ctx, g, d)
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
  if (g.state !== 'over') drawShip(ctx, g)
  ctx.restore()

  if (g.flash > 0) {
    ctx.fillStyle = `rgba(201,168,255,${g.flash * 0.85})`
    ctx.fillRect(0, 0, W, H)
  }

  drawHud(ctx, g)
}

import { LAST_LEVEL, LIVES, levelCapacity, levelTarget } from '../game/tuning'
import type { BoardRow, Game, SharedRun } from '../game/types'
import { text } from './text'

function drawTouchHints(ctx: CanvasRenderingContext2D, g: Game, alpha: number): void {
  const { W, H, U } = g
  ctx.save()
  ctx.globalAlpha = alpha
  const y = H * 0.8, s = 18 * U
  for (const dir of [-1, 1]) {
    const x = W / 2 + dir * W * 0.3
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2 * U
    ctx.beginPath(); ctx.arc(x, y, 34 * U, 0, Math.PI * 2); ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.moveTo(x + dir * s, y); ctx.lineTo(x - dir * s * 0.6, y - s); ctx.lineTo(x - dir * s * 0.6, y + s)
    ctx.closePath(); ctx.fill()
  }
  ctx.restore()
}

function drawPlayHud(ctx: CanvasRenderingContext2D, g: Game, top: number): void {
  const { W, U } = g
  text(ctx, `${Math.floor(g.score)} pc`, W / 2, top, 34 * U, '#ffffff')
  text(ctx, `BEST ${g.records.best} pc`, W - 14, top - 8 * U, 13 * U, 'rgba(255,255,255,.55)', 'right', 600)
  text(ctx, `LEVEL ${g.level}/${LAST_LEVEL}`, 14, top - 8 * U, 13 * U, 'rgba(127,220,255,.9)', 'left', 700)
  // lives: one small ship each, under the best distance; spent ones are hollow
  for (let i = 0; i < LIVES; i++) {
    const lr = 6 * U, lx = W - 14 - lr - i * lr * 2.6, ly = top + 34 * U
    ctx.beginPath()
    ctx.moveTo(lx, ly - lr * 1.3); ctx.lineTo(lx + lr, ly + lr); ctx.lineTo(lx, ly + lr * 0.55); ctx.lineTo(lx - lr, ly + lr)
    ctx.closePath()
    if (i < g.lives) { ctx.fillStyle = '#e8eefc'; ctx.fill() }
    else { ctx.strokeStyle = 'rgba(232,238,252,.35)'; ctx.lineWidth = 1.2 * U; ctx.stroke() }
  }
  if (levelCapacity(g.level)) {
    text(ctx, `RESCUED ${g.rescued}`, 14, top + 12 * U, 11 * U, '#5dffa0', 'left', 700)
    text(ctx, `MISSED ${g.missed}`, 14, top + 28 * U, 11 * U, '#ff7b54', 'left', 700)
  }

  // level progress: points bar, then "hold on" if the minimum time isn't up yet
  const target = levelTarget(g.level), bw = 150 * U, bh = 5 * U, bx = W / 2 - bw / 2, by = top + 10 * U
  ctx.fillStyle = 'rgba(255,255,255,.18)'
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh / 2); ctx.fill()
  ctx.fillStyle = '#7fdcff'
  ctx.beginPath(); ctx.roundRect(bx, by, bw * Math.min(1, g.levelScore / target), bh, bh / 2); ctx.fill()
  text(ctx, `${Math.min(target, Math.floor(g.levelScore))} / ${target} pc`, bx + bw + 8 * U, by + bh + 1 * U, 11 * U, 'rgba(255,255,255,.6)', 'left', 600)

  // ship capacity: one seat per pip, filled as crew come aboard
  const cap = levelCapacity(g.level)
  const step = Math.min(14 * U, (W - 40) / cap), pw = step * 0.68, ph = 9 * U
  const px = W / 2 - (cap * step - (step - pw)) / 2, py = by + bh + 9 * U
  if (cap) text(ctx, `CREW ${g.onboard}/${cap}`, W / 2, py + ph + 14 * U, 11 * U, g.onboard >= cap ? '#ffd166' : 'rgba(93,255,160,.85)', 'center', 700)
  for (let i = 0; i < cap; i++) {
    ctx.beginPath(); ctx.roundRect(px + i * step, py, pw, ph, pw * 0.3)
    if (i < g.onboard) { ctx.fillStyle = '#5dffa0'; ctx.fill() }
    else { ctx.strokeStyle = 'rgba(93,255,160,.55)'; ctx.lineWidth = 1.2 * U; ctx.stroke() }
  }

  if (g.time < 3.5) drawTouchHints(ctx, g, 0.35 * Math.min(1, 3.5 - g.time))
}

function drawMenu(ctx: CanvasRenderingContext2D, g: Game): void {
  const { W, H, U } = g
  const best = g.records.best
  text(ctx, 'ASTEROIDS', W / 2, H * 0.3, 46 * U, '#ffffff', 'center', 800)
  text(ctx, 'GALORE', W / 2, H * 0.3 + 44 * U, 46 * U, '#7fdcff', 'center', 800)
  if (best) text(ctx, `BEST ${best} pc`, W / 2, H * 0.3 + 84 * U, 15 * U, '#ffd166', 'center', 700)
  drawTouchHints(ctx, g, 0.55)
  text(ctx, 'hold left', W / 2 - W * 0.3, H * 0.8 + 62 * U, 13 * U, 'rgba(255,255,255,.7)', 'center', 600)
  text(ctx, 'hold right', W / 2 + W * 0.3, H * 0.8 + 62 * U, 13 * U, 'rgba(255,255,255,.7)', 'center', 600)
  // A shared run sits clear of the player's own best above it, and on short
  // screens pushes the prompt down rather than touching it.
  const sharedY = H * 0.3 + 124 * U
  if (g.shared) drawShared(ctx, g, g.shared, sharedY)
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(g.stateTime * 4)
  text(ctx, 'TAP TO START', W / 2, g.shared ? Math.max(H * 0.58, sharedY + 86 * U) : H * 0.58, 20 * U, '#ffffff')
  ctx.globalAlpha = 1
}

// End-of-run summary in two groups, each with its own best: distance, then crew.
function drawSummary(ctx: CanvasRenderingContext2D, g: Game, y: number): void {
  const { W, U, rescued, missed } = g
  const { best, bestCrew } = g.records
  const pc = Math.floor(g.score), grey = 'rgba(255,255,255,.65)', gold = '#ffd166'
  const title = (str: string, ty: number) => text(ctx, str, W / 2, ty, 12 * U, 'rgba(127,220,255,.85)', 'center', 700)

  title('DISTANCE', y)
  text(ctx, `${pc} pc`, W / 2, y + 52 * U, 54 * U, '#ffffff', 'center', 800)
  text(ctx, `≈ ${Math.round(pc * 3.26)} light-years`, W / 2, y + 73 * U, 12 * U, grey, 'center', 500)
  text(ctx, g.newBest ? 'NEW BEST!' : `BEST ${best} pc`, W / 2, y + 94 * U, 14 * U, gold)

  title('CREW', y + 136 * U)
  // Only a finished mission counts as a rescue: crew aboard a ship that is lost are lost with it.
  if (g.state === 'won') {
    text(ctx, `${rescued} RESCUED`, W / 2, y + 172 * U, 34 * U, '#5dffa0', 'center', 800)
    text(ctx, `${missed} MISSED`, W / 2, y + 194 * U, 15 * U, '#ff5a4d', 'center', 700)
  } else {
    text(ctx, `${rescued} WENT DOWN WITH THE SHIP`, W / 2, y + 168 * U, 20 * U, '#ff9a3c', 'center', 800)
    text(ctx, `${missed} MISSED`, W / 2, y + 194 * U, 15 * U, 'rgba(255,255,255,.5)', 'center', 700)
  }
  if (g.newBestCrew) text(ctx, 'NEW BEST!', W / 2, y + 216 * U, 14 * U, gold)
  else if (bestCrew) text(ctx, `BEST ${bestCrew} RESCUED`, W / 2, y + 216 * U, 14 * U, gold)
}

// A blinking prompt, shown once the end screen has been up long enough to be read.
function drawPrompt(ctx: CanvasRenderingContext2D, g: Game, str: string, y: number): void {
  if (g.stateTime <= 0.7) return
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(g.stateTime * 4)
  text(ctx, str, g.W / 2, y, 20 * g.U, '#ffffff')
  ctx.globalAlpha = 1
}

// The run a share link points at: who flew it, how far, and how it ended.
// A lost run shows only the level reached, so the fate of the crew stays a surprise.
function drawShared(ctx: CanvasRenderingContext2D, g: Game, run: SharedRun, y: number): void {
  const { W, U } = g
  text(ctx, run.callsign, W / 2, y, 13 * U, '#ffd166', 'center', 700)
  text(ctx, `${run.distance} pc`, W / 2, y + 30 * U, 28 * U, '#ffffff', 'center', 800)
  if (run.outcome === 'won') text(ctx, `MISSION COMPLETE · ${run.rescued} RESCUED`, W / 2, y + 48 * U, 12 * U, '#5dffa0', 'center', 700)
  else text(ctx, `REACHED LEVEL ${run.level}`, W / 2, y + 48 * U, 12 * U, 'rgba(255,255,255,.65)', 'center', 600)
}

/** Where the share button is, in play-field pixels. Used to draw it and to tell a tap on it from a tap to restart. */
export function shareButtonRect(g: Game): { x: number; y: number; w: number; h: number } {
  const { W, U } = g
  const w = 92 * U, h = Math.max(40, 40 * U)
  return { x: W - 14 - w, y: 44 * U + 8 - h / 2, w, h }
}

// Shown on an end screen once the run has a link to share.
function drawShareButton(ctx: CanvasRenderingContext2D, g: Game): void {
  if (!g.shareReady) return
  const { U } = g
  const r = shareButtonRect(g)
  const copied = g.shareNote > 0
  ctx.strokeStyle = copied ? '#5dffa0' : 'rgba(255,255,255,.55)'
  ctx.lineWidth = 1.5 * U
  ctx.beginPath(); ctx.roundRect(r.x, r.y + 3 * U, r.w, r.h - 6 * U, (r.h - 6 * U) / 2); ctx.stroke()
  text(ctx, copied ? 'COPIED' : 'SHARE', r.x + r.w / 2, r.y + r.h / 2 + 4.5 * U, 13 * U, copied ? '#5dffa0' : '#ffffff', 'center', 700)
}

// A leaderboard: a title, then rank, callsign and best per row. The player's
// own row is gold. Draws nothing until there are rows to show.
function drawBoard(ctx: CanvasRenderingContext2D, g: Game, rows: BoardRow[] | null, title: string, unit: string, y: number): void {
  if (!rows?.length) return
  const { W, U } = g
  const half = 128 * U, line = 19 * U
  text(ctx, title, W / 2, y, 12 * U, 'rgba(127,220,255,.85)', 'center', 700)
  rows.forEach((row, i) => {
    const ry = y + 24 * U + i * line
    const color = row.me ? '#ffd166' : 'rgba(255,255,255,.78)'
    const weight = row.me ? 800 : 600
    text(ctx, String(row.rank), W / 2 - half, ry, 13 * U, row.me ? color : 'rgba(255,255,255,.45)', 'left', weight)
    text(ctx, row.callsign, W / 2 - half + 30 * U, ry, 13 * U, color, 'left', weight)
    text(ctx, `${row.value}${unit}`, W / 2 + half, ry, 13 * U, color, 'right', weight)
  })
}

/** Everything drawn over the playfield: the in-run HUD, the menu, or an end screen. */
export function drawHud(ctx: CanvasRenderingContext2D, g: Game): void {
  const { W, H, U } = g
  if (g.state === 'play') {
    drawPlayHud(ctx, g, 44 * U + 8)
  } else if (g.state === 'menu') {
    drawMenu(ctx, g)
  } else if (g.state === 'won') {
    text(ctx, 'MISSION', W / 2, H * 0.22, 40 * U, '#5dffa0', 'center', 800)
    text(ctx, 'COMPLETE', W / 2, H * 0.22 + 40 * U, 40 * U, '#5dffa0', 'center', 800)
    drawSummary(ctx, g, H * 0.22 + 76 * U)
    drawPrompt(ctx, g, 'TAP TO PLAY AGAIN', H * 0.22 + 336 * U)
    drawBoard(ctx, g, g.boards.crew, 'TOP CREW', '', H * 0.22 + 382 * U)
    drawShareButton(ctx, g)
  } else {
    ctx.fillStyle = `rgba(5,6,13,${Math.min(0.55, g.stateTime * 1.2)})`
    ctx.fillRect(0, 0, W, H)
    text(ctx, 'GAME OVER', W / 2, H * 0.26, 38 * U, '#ff7b54', 'center', 800)
    drawSummary(ctx, g, H * 0.26 + 36 * U)
    drawPrompt(ctx, g, 'TAP TO RETRY', H * 0.26 + 296 * U)
    drawBoard(ctx, g, g.boards.distance, 'TOP DISTANCE', ' pc', H * 0.26 + 342 * U)
    drawShareButton(ctx, g)
  }
}

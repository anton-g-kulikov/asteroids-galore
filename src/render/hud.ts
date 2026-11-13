import { scoreOf } from '../game/score'
import { LAST_LEVEL, SHIELDS, levelCapacity, levelTarget } from '../game/tuning'
import type { BoardRow, Game, SharedRun } from '../game/types'
import { SHIELD_COLOR, SHIELD_SPREAD } from './sprites'
import { text } from './text'

/** Scores get long: 25680 reads better as 25,680. */
const fmt = (n: number): string => n.toLocaleString('en-US')

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
  // One number at a time. With crew on board it is what they are worth, in
  // green with a plus: banked at the next wormhole, gone if the ship is lost
  // first. With the seats empty it is the score. Before anything is banked and
  // with nobody aboard there is no number to show.
  const score = scoreOf(g), pending = Math.floor(g.distance) * g.onboard
  if (pending) text(ctx, `+${fmt(pending)}`, W / 2, top, 34 * U, 'rgba(93,255,160,.9)')
  else if (score) text(ctx, fmt(score), W / 2, top, 34 * U, '#ffffff')
  if (g.records.best) text(ctx, `BEST ${fmt(g.records.best)}`, W - 14, top - 8 * U, 13 * U, 'rgba(255,255,255,.55)', 'right', 600)
  text(ctx, `MISSION ${g.level}/${LAST_LEVEL}`, 14, top - 8 * U, 13 * U, 'rgba(127,220,255,.9)', 'left', 700)
  // shields: one arc each, under the best distance, the same shape as the
  // arcs ahead of the ship; spent ones are faint
  ctx.lineCap = 'round'
  for (let i = 0; i < SHIELDS; i++) {
    const sr = 7 * U, sx = W - 14 - sr - i * sr * 2.5, sy = top + 38 * U
    ctx.beginPath(); ctx.arc(sx, sy, sr, -Math.PI / 2 - SHIELD_SPREAD, -Math.PI / 2 + SHIELD_SPREAD)
    ctx.strokeStyle = i < g.shields ? SHIELD_COLOR : 'rgba(127,220,255,.2)'
    ctx.lineWidth = (i < g.shields ? 2.6 : 1.4) * U
    ctx.stroke()
  }
  ctx.lineCap = 'butt'
  text(ctx, `SAVED ${g.saved}`, 14, top + 12 * U, 11 * U, '#5dffa0', 'left', 700)
  text(ctx, `MISSED ${g.missed}`, 14, top + 28 * U, 11 * U, '#ff7b54', 'left', 700)

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
  if (best) text(ctx, `BEST ${fmt(best)}`, W / 2, H * 0.3 + 84 * U, 15 * U, '#ffd166', 'center', 700)
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

// A blinking prompt, shown once the end screen has been up long enough to be read.
function drawPrompt(ctx: CanvasRenderingContext2D, g: Game, str: string, y: number): void {
  if (g.stateTime <= 0.7) return
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(g.stateTime * 4)
  text(ctx, str, g.W / 2, y, 20 * g.U, '#ffffff')
  ctx.globalAlpha = 1
}

// The run a share link points at: who flew it, what it scored, and the crew behind the score.
function drawShared(ctx: CanvasRenderingContext2D, g: Game, run: SharedRun, y: number): void {
  const { W, U } = g
  text(ctx, run.callsign, W / 2, y, 13 * U, '#ffd166', 'center', 700)
  text(ctx, fmt(run.score), W / 2, y + 30 * U, 28 * U, '#ffffff', 'center', 800)
  if (run.outcome === 'won') text(ctx, `ALL MISSIONS COMPLETE · ${run.saved} SAVED`, W / 2, y + 48 * U, 12 * U, '#5dffa0', 'center', 700)
  else text(ctx, `${run.saved} SAVED · ${run.distance} pc`, W / 2, y + 48 * U, 12 * U, 'rgba(255,255,255,.65)', 'center', 600)
}

const LABEL = 'rgba(127,220,255,.85)'

// The score, under its label. Returns the y of the number's baseline.
function drawScore(ctx: CanvasRenderingContext2D, g: Game, y: number): number {
  const { W, U } = g
  text(ctx, 'SCORE', W / 2, y, 12 * U, LABEL, 'center', 700)
  text(ctx, fmt(scoreOf(g)), W / 2, y + 48 * U, 48 * U, '#ffffff', 'center', 800)
  return y + 48 * U
}

// Missed crew are not part of the sum, so they sit apart from the table, on a line of their own.
function drawMissed(ctx: CanvasRenderingContext2D, g: Game, missed: number, y: number): void {
  text(ctx, `${missed} MISSED`, g.W / 2, y, 13 * g.U, '#ff7b54', 'center', 700)
}

// Between levels: two rows that each read as a sum, distance times crew saved
// equals score. The first is the mission just finished (the title says which),
// the second, brighter, is the whole run so far. The run's score is not the
// missions' scores added up, since every parsec multiplies every crew saved,
// which is why both rows are spelled out.
function drawBetween(ctx: CanvasRenderingContext2D, g: Game): void {
  const { W, H, U } = g
  const top = H * 0.22, head = top + 50 * U
  const cols = [-132, -52, 24, 116].map(dx => W / 2 + dx * U)
  const last = g.results[g.results.length - 1] ?? { saved: 0, missed: 0, distance: 0 }
  text(ctx, `MISSION ${g.level} COMPLETE`, W / 2, top, 30 * U, '#7fdcff', 'center', 800)
  ;['DISTANCE', 'SAVED', 'SCORE'].forEach((h, i) => text(ctx, h, cols[i + 1], head, 11 * U, LABEL, 'center', 700))

  const row = (y: number, name: string, distance: number, saved: number, bright: boolean) => {
    const size = (bright ? 21 : 16) * U, weight = bright ? 800 : 600
    const white = bright ? '#ffffff' : 'rgba(255,255,255,.6)'
    text(ctx, name, cols[0], y, 12 * U, white, 'center', bright ? 800 : 700)
    text(ctx, `${distance} pc`, cols[1], y, size, white, 'center', weight)
    text(ctx, `×${saved}`, cols[2], y, size, bright ? '#5dffa0' : 'rgba(93,255,160,.65)', 'center', weight)
    text(ctx, fmt(distance * saved), cols[3], y, size, white, 'center', weight)
  }
  row(head + 28 * U, 'MISSION', last.distance, last.saved, false)
  row(head + 60 * U, 'TOTAL', Math.floor(g.distance), g.saved, true)

  drawMissed(ctx, g, last.missed, head + 98 * U)
  drawPrompt(ctx, g, 'TAP TO CONTINUE', head + 146 * U)
}

// Both end screens: a table with a row per mission played and a bright TOTAL
// row, then the score, the best, what a crash cost, the prompt and the
// leaderboard. After a crash the unfinished mission has a row too, with the
// crew who went down with the ship in its saved column.
function drawEnd(ctx: CanvasRenderingContext2D, g: Game): void {
  const { W, H, U } = g
  const won = g.state === 'won', gold = '#ffd166'
  const top = H * 0.17, head = top + 48 * U, line = 24 * U
  const cols = [-110, 0, 110].map(dx => W / 2 + dx * U)
  const dim = 'rgba(255,255,255,.45)'
  text(ctx, won ? 'ALL MISSIONS COMPLETE' : 'GAME OVER', W / 2, top, 30 * U, won ? '#5dffa0' : '#ff7b54', 'center', 800)
  ;['MISSION', 'DISTANCE', 'SAVED'].forEach((h, i) => text(ctx, h, cols[i], head, 11 * U, LABEL, 'center', 700))

  g.results.forEach((r, i) => {
    const ry = head + (i + 1) * line
    text(ctx, String(r.level), cols[0], ry, 15 * U, dim, 'center', 600)
    text(ctx, `${r.distance} pc`, cols[1], ry, 15 * U, dim, 'center', 600)
    if (r.lost) text(ctx, `−${r.lost}`, cols[2], ry, 15 * U, 'rgba(255,154,60,.75)', 'center', 600)
    else text(ctx, `×${r.saved}`, cols[2], ry, 15 * U, 'rgba(93,255,160,.5)', 'center', 600)
  })
  const ty = head + (g.results.length + 1) * line + 4 * U
  text(ctx, 'TOTAL', cols[0], ty, 13 * U, '#ffffff', 'center', 800)
  // The total row is the sum itself: distance, times the crew that count, is the score below.
  text(ctx, `${Math.floor(g.distance)} pc`, cols[1], ty, 20 * U, '#ffffff', 'center', 800)
  text(ctx, `×${Math.max(0, g.saved - g.lost)}`, cols[2], ty, 20 * U, '#5dffa0', 'center', 800)

  let y = drawScore(ctx, g, ty + 36 * U)
  // the best sits right under the score it is compared with
  if (g.newBest) { y += 24 * U; text(ctx, 'NEW BEST!', W / 2, y, 14 * U, gold) }
  else if (g.records.best) { y += 24 * U; text(ctx, `BEST ${fmt(g.records.best)}`, W / 2, y, 14 * U, gold) }   // no best yet: say nothing

  // A section of its own for the crew who were not saved.
  y += 38 * U
  text(ctx, 'NOT SAVED', W / 2, y, 12 * U, LABEL, 'center', 700)
  if (g.lost) { y += 23 * U; text(ctx, `${g.lost} WENT DOWN WITH THE SHIP`, W / 2, y, 14 * U, '#ff9a3c', 'center', 800) }
  y += 22 * U; drawMissed(ctx, g, g.missed, y)
  drawPrompt(ctx, g, won ? 'TAP TO PLAY AGAIN' : 'TAP TO RETRY', y + 44 * U)
  drawBoardButton(ctx, g)
  drawShareButton(ctx, g)
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

/** True when an end screen is up and there is a leaderboard to open from it. */
export const hasBoard = (g: Game): boolean => (g.state === 'over' || g.state === 'won') && !!g.board?.length

/** Where the leaderboard link is: top left, mirroring the share button. In play-field pixels. */
export function boardButtonRect(g: Game): { x: number; y: number; w: number; h: number } {
  const { U } = g
  const w = 122 * U, h = Math.max(40, 40 * U)
  return { x: 14, y: 44 * U + 8 - h / 2, w, h }
}

// The link to the leaderboard, on an end screen once the board has loaded.
function drawBoardButton(ctx: CanvasRenderingContext2D, g: Game): void {
  if (!hasBoard(g)) return
  const { U } = g
  const r = boardButtonRect(g)
  ctx.strokeStyle = 'rgba(255,255,255,.55)'
  ctx.lineWidth = 1.5 * U
  ctx.beginPath(); ctx.roundRect(r.x, r.y + 3 * U, r.w, r.h - 6 * U, (r.h - 6 * U) / 2); ctx.stroke()
  text(ctx, 'LEADERBOARD', r.x + r.w / 2, r.y + r.h / 2 + 4.5 * U, 13 * U, '#ffffff', 'center', 700)
}

// The leaderboard screen, opened from the link on an end screen: a title, then
// rank, callsign and best score per row. The player's own row is gold.
function drawBoard(ctx: CanvasRenderingContext2D, g: Game, rows: BoardRow[]): void {
  const { W, H, U } = g
  const half = 150 * U, line = 30 * U, y = H * 0.17
  ctx.fillStyle = 'rgba(5,6,13,.72)'
  ctx.fillRect(0, 0, W, H)
  text(ctx, 'TOP SCORES', W / 2, y, 30 * U, '#7fdcff', 'center', 800)
  rows.forEach((row, i) => {
    const ry = y + 56 * U + i * line
    const color = row.me ? '#ffd166' : 'rgba(255,255,255,.78)'
    const weight = row.me ? 800 : 600
    text(ctx, String(row.rank), W / 2 - half, ry, 15 * U, row.me ? color : 'rgba(255,255,255,.45)', 'left', weight)
    text(ctx, row.callsign, W / 2 - half + 34 * U, ry, 15 * U, color, 'left', weight)
    text(ctx, fmt(row.value), W / 2 + half, ry, 15 * U, color, 'right', weight)
  })
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(g.stateTime * 4)
  text(ctx, 'TAP TO GO BACK', W / 2, y + 56 * U + rows.length * line + 30 * U, 20 * U, '#ffffff')
  ctx.globalAlpha = 1
}

/** Everything drawn over the playfield: the in-run HUD, the menu, the results between levels, or an end screen. */
export function drawHud(ctx: CanvasRenderingContext2D, g: Game): void {
  const { W, H, U } = g
  if (g.state === 'play') {
    drawPlayHud(ctx, g, 44 * U + 8)
  } else if (g.state === 'menu') {
    drawMenu(ctx, g)
  } else if (g.state === 'between') {
    drawBetween(ctx, g)
  } else {
    if (g.state === 'over') {
      ctx.fillStyle = `rgba(5,6,13,${Math.min(0.55, g.stateTime * 1.2)})`
      ctx.fillRect(0, 0, W, H)
    }
    if (g.boardOpen && g.board?.length) drawBoard(ctx, g, g.board)
    else drawEnd(ctx, g)
  }
}

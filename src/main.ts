import './style.css'
import { startCloud } from './cloud'
import { shareIdFromPath, shareMessage, shareResult, shareUrl } from './cloud/share'
import { createDebugHook } from './debugHook'
import { createGame, fit } from './game/game'
import { createInput } from './game/input'
import { createRecords, type RecordStore } from './game/records'
import { runSummary, type RunResult } from './game/runSummary'
import { tryStart, update } from './game/simulation'
import { timeScale } from './game/timeScale'
import { STEP } from './game/tuning'
import { boardButtonRect, hasBoard, shareButtonRect } from './render/hud'
import { render } from './render/render'

const canvas = document.getElementById('game') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!

// Reading `localStorage` itself can throw when storage is blocked.
let store: RecordStore | null = null
try { store = localStorage } catch { /* play without saved bests */ }

const records = createRecords(store)
const game = createGame(records)
// null when Firebase is not configured; the board then stays empty and is not drawn
const cloud = startCloud(records, rows => { game.board = rows })
const input = createInput()

// ---------- Layout ----------
// The play field never changes shape: the window only decides how big it is drawn.
let view = fit(window.innerWidth, window.innerHeight)
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  view = fit(window.innerWidth, window.innerHeight)
  canvas.style.width = game.W * view.scale + 'px'
  canvas.style.height = game.H * view.scale + 'px'
  canvas.width = Math.round(game.W * view.scale * dpr)
  canvas.height = Math.round(game.H * view.scale * dpr)
  ctx.setTransform(dpr * view.scale, 0, 0, dpr * view.scale, 0, 0)
}
window.addEventListener('resize', resize)
resize()

// ---------- Sharing ----------
// The run on the end screen, and its ID once it has been saved. `runCount` tells
// a save that finishes late which run it belonged to.
let lastRun: RunResult | null = null
let lastRunId: string | null = null
let runCount = 0
let sharePointer: number | null = null

function runEnded() {
  const run = lastRun = runSummary(game)
  const mine = ++runCount
  lastRunId = null
  game.shareReady = false
  game.shareNote = 0
  cloud?.submit(run).then(id => {
    if (mine !== runCount || !id) return
    lastRunId = id
    game.shareReady = true
  })
}

function inside(e: PointerEvent, r: { x: number; y: number; w: number; h: number }): boolean {
  // from window pixels to play-field units
  const x = (e.clientX - view.x) / view.scale, y = (e.clientY - view.y) / view.scale
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
}

function onShareButton(e: PointerEvent): boolean {
  if (!game.shareReady || (game.state !== 'over' && game.state !== 'won')) return false
  return inside(e, shareButtonRect(game))
}

// ---------- Leaderboard ----------
// The link on an end screen opens the leaderboard over it; the next tap or key
// closes it again. Neither one restarts the game.
const onBoardButton = (e: PointerEvent): boolean => hasBoard(game) && inside(e, boardButtonRect(game))

function closeBoard(): boolean {
  if (!game.boardOpen) return false
  game.boardOpen = false
  return true
}

function share() {
  if (!lastRun || !lastRunId) return
  shareResult(navigator, shareMessage(lastRun), shareUrl(window.location.origin, lastRunId))
    .then(result => { if (result === 'copied') game.shareNote = 2 })
}

// Opened from a share link: show that run on the start screen.
const sharedId = shareIdFromPath(window.location?.pathname ?? '/')
if (sharedId) cloud?.loadShared(sharedId).then(run => { game.shared = run })

// ---------- Input ----------
window.addEventListener('pointerdown', e => {
  e.preventDefault()
  if (closeBoard()) return
  if (onBoardButton(e)) { game.boardOpen = true; return }
  if (onShareButton(e)) { sharePointer = e.pointerId; return }   // not a steer, not a restart
  input.pointer(e.pointerId, e.clientX, window.innerWidth)
  tryStart(game)
}, { passive: false })
window.addEventListener('pointermove', e => input.movePointer(e.pointerId, e.clientX, window.innerWidth))
const release = (e: PointerEvent) => input.release(e.pointerId)
window.addEventListener('pointerup', e => {
  // Sharing happens on release: that is when browsers allow the share sheet to open.
  if (e.pointerId === sharePointer) {
    sharePointer = null
    if (onShareButton(e)) share()
  }
  release(e)
})
window.addEventListener('pointercancel', release)
window.addEventListener('blur', () => input.clear())
window.addEventListener('contextmenu', e => e.preventDefault())
// iOS Safari ignores touch-action for some gestures; block them explicitly.
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false })
document.addEventListener('gesturestart', e => e.preventDefault())

const sideOf = (key: string) =>
  key === 'ArrowLeft' || key === 'a' || key === 'A' ? 'left' :
  key === 'ArrowRight' || key === 'd' || key === 'D' ? 'right' : null

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeBoard(); return }
  const side = sideOf(e.key)
  if (side) input.key(side, true)
  else if (e.key === ' ' || e.key === 'Enter') { if (!e.repeat && !closeBoard()) tryStart(game) }   // closing the leaderboard is not a restart
  else return
  e.preventDefault()
  if (!e.repeat && game.state === 'menu') tryStart(game)   // a steering key also starts the first run
})
window.addEventListener('keyup', e => {
  const side = sideOf(e.key)
  if (side) input.key(side, false)
})

// ---------- Loop ----------
// The game advances in steps of one fixed length, however often the screen
// refreshes: a slow device takes several steps per frame and a fast one takes
// a step every other frame, and both play the same game.
function step() {
  let scale = 1
  if (game.slowmo > 0 && game.state === 'play') {
    scale = timeScale(game.slowmo)
    game.slowmo -= STEP
  }
  const wasPlaying = game.state === 'play'
  update(game, STEP * scale, input.steer())
  if (wasPlaying && (game.state === 'over' || game.state === 'won')) runEnded()   // not the stop between levels
}

let last = performance.now(), owed = 0
function frame(now: number) {
  let dt = Math.min(0.25, (now - last) / 1000)   // clamp: no jumps after tab switch
  last = now
  if (Math.abs(dt - STEP) < 0.002) dt = STEP     // a 60 Hz screen: exactly one step per frame, no stutter
  owed += dt
  while (owed >= STEP - 1e-9) { owed -= STEP; step() }
  game.shareNote = Math.max(0, game.shareNote - dt)
  render(ctx, game)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

window.__game = createDebugHook(game)

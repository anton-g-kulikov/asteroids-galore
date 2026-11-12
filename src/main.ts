import './style.css'
import { startCloud } from './cloud'
import { shareIdFromPath, shareMessage, shareResult, shareUrl } from './cloud/share'
import { createDebugHook } from './debugHook'
import { createGame, layout } from './game/game'
import { createInput } from './game/input'
import { createRecords, type RecordStore } from './game/records'
import { runSummary, type RunResult } from './game/runSummary'
import { tryStart, update } from './game/simulation'
import { timeScale } from './game/timeScale'
import { shareButtonRect } from './render/hud'
import { render } from './render/render'

const canvas = document.getElementById('game') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!

// Reading `localStorage` itself can throw when storage is blocked.
let store: RecordStore | null = null
try { store = localStorage } catch { /* play without saved bests */ }

const records = createRecords(store)
const game = createGame(records)
// null when Firebase is not configured; the boards then stay empty and are not drawn
const cloud = startCloud(records, (kind, rows) => { game.boards[kind] = rows })
const input = createInput()

// ---------- Layout ----------
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  layout(game, window.innerWidth, window.innerHeight)
  canvas.style.width = game.W + 'px'
  canvas.width = Math.round(game.W * dpr)
  canvas.height = Math.round(game.H * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
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

function onShareButton(e: PointerEvent): boolean {
  if (!game.shareReady || (game.state !== 'over' && game.state !== 'won')) return false
  const r = shareButtonRect(game)
  const x = e.clientX - (window.innerWidth - game.W) / 2   // the play field is centred
  return x >= r.x && x <= r.x + r.w && e.clientY >= r.y && e.clientY <= r.y + r.h
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
  const side = sideOf(e.key)
  if (side) input.key(side, true)
  else if (e.key === ' ' || e.key === 'Enter') { if (!e.repeat) tryStart(game) }
  else return
  e.preventDefault()
  if (!e.repeat && game.state === 'menu') tryStart(game)   // a steering key also starts the first run
})
window.addEventListener('keyup', e => {
  const side = sideOf(e.key)
  if (side) input.key(side, false)
})

// ---------- Loop ----------
let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)   // clamp: no jumps after tab switch
  last = now
  let scale = 1
  if (game.slowmo > 0 && game.state === 'play') {
    scale = timeScale(game.slowmo)
    game.slowmo -= dt
  }
  const wasPlaying = game.state === 'play'
  update(game, dt * scale, input.steer())
  if (wasPlaying && game.state !== 'play') runEnded()
  game.shareNote = Math.max(0, game.shareNote - dt)
  render(ctx, game)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

window.__game = createDebugHook(game)

import './style.css'
import { drawMuteButton, onMuteButton, showsMute } from './audio/muteButton'
import { createSoundPlayer } from './audio/player'
import { SOUNDS } from './audio/sounds'
import { createWebAudio, hasWebAudio } from './audio/webAudio'
import { drawFpsButton, drawFpsReading, onFpsButton, showsFpsButton } from './fps/fpsButton'
import { createFpsSwitch, createFrameMeter } from './fps/meter'
import { createRunFrames } from './fps/runFrames'
import { createRunSound, type PlaybackStats } from './audio/runSound'
import { createConductor } from './music/conductor'
import { drawMusicButton, onMusicButton, showsMusicButton } from './music/musicButton'
import { startCloud } from './cloud'
import { createStoryMode } from './storyMode'
import { FEEL } from './story/controller'
import type { Store } from './story/progress'
import { shareIdFromPath, shareMessage, shareResult, shareUrl } from './cloud/share'
import { createDebugHook } from './debugHook'
import { createGame, fit } from './game/game'
import { createInput } from './game/input'
import { createRecords, type RecordStore } from './game/records'
import { runSummary, type RunResult } from './game/runSummary'
import { chooseSide, tryStart, update } from './game/simulation'
import { timeScale } from './game/timeScale'
import { STEP } from './game/tuning'
import { boardButtonRect, hasBoard, shareButtonRect } from './render/hud'
import { render } from './render/render'
import { browserFullscreen, createFullscreenKeeper } from './pwa/fullscreen'
import type { Updater } from './pwa/updates'

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

// Sound follows what the simulation reports; nothing it does goes back into the game.
// Browsers allow audio only after a tap or a key, so the first one starts it.
const sound = createSoundPlayer({ storage: store, createAudio: createWebAudio })
const canPlaySound = hasWebAudio()

// Music: its own switch, independent of the sound effects. Tone.js is big, so it
// is loaded only once the first tap has started the audio; until it arrives the
// game plays without music. It shares the sound effects' audio context.
const music = createConductor(store)
let musicLoading = false
function loadMusic() {
  const context = sound.context
  if (musicLoading || !context) return
  musicLoading = true
  Promise.all([import('./music/engine'), import('./music/effects')])
    .then(([m, fx]) => {
      const engine = m.createMusicEngine(context)
      music.attach(engine)
      if (import.meta.env.DEV) (window as unknown as { __music: unknown }).__music = engine.inspect   // for checking by hand
      sound.attachEffects(fx.createEffects(context), () => music.chord())   // the sound effects follow the music's chord
    })
    .catch(error => console.warn('Music unavailable', error))
}

// The frame-rate display: off by default, switched by the gauge on the start screen.
// It counts frames drawn, and never touches the simulation.
const fps = createFpsSwitch(store)
const frames = createFrameMeter()
const runFrames = createRunFrames()   // the frame rate each run was flown at, saved with it
// how the sound held up over each run: the browser's count of gaps in it, and stops a tap had to undo
const soundSource = {
  stats: () => (sound.context as (AudioContext & { playbackStats?: PlaybackStats }) | null)?.playbackStats ?? null,
  restarts: () => sound.restarts,
}
const runSound = createRunSound(soundSource)
// the same for each story flight, saved as its own record (src/story/flightRecord.ts)
const flightFrames = createRunFrames(), flightSound = createRunSound(soundSource)
let flightSeconds = 0
let lastState = game.state
document.addEventListener('visibilitychange', () => sound.setHidden(document.visibilityState === 'hidden'))
window.addEventListener('pagehide', () => sound.setHidden(true))
window.addEventListener('pageshow', () => sound.setHidden(false))

// Installed or not, the game keeps working offline after one visit. Only in a
// production build: in development and tests there is no service worker.
let updater: Updater | null = null
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  import('./pwa/register').then(m => { updater = m.startServiceWorker() })
}

// Installed as an app: the first tap covers the whole screen (see pwa/fullscreen.ts).
const fullscreen = createFullscreenKeeper(browserFullscreen())

// ---------- Layout ----------
// The play field never changes shape: the window only decides how big it is drawn.
let view = fit(window.innerWidth, window.innerHeight)
function resize() {
  // At most 2 pixels per point: on a 3× phone, 3 would draw 2.25 times the pixels for edges hard to tell apart at arm's length
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
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
  const run = lastRun = { ...runSummary(game), ...runFrames.result(), ...runSound.result() }
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

// Story mode: shown only while the dev switch is on, until the owner releases it (see storyMode.ts).
let storyStore: Store | null = null
try { storyStore = localStorage } catch { /* play without a saved story */ }
let callsign = ''                               // until the cloud has signed in; with none the story says pilot or Captain
cloud?.callsign().then(c => { if (c) callsign = c })
const storyMode = createStoryMode({
  game, store: storyStore, search: window.location?.search ?? '', callsign: () => callsign, onArcade: () => tryStart(game),
  flights: {
    started() { flightFrames.start(); flightSound.start(); flightSeconds = 0 },
    ended(f) {
      void cloud?.submitFlight({ ...f, durationSeconds: Math.round(flightSeconds * 10) / 10, ...flightFrames.result(), ...flightSound.result() })
    },
  },
})

// Opened from a share link: show that run on the start screen.
const sharedId = shareIdFromPath(window.location?.pathname ?? '/')
if (sharedId) cloud?.loadShared(sharedId).then(run => { game.shared = run })

// ---------- Input ----------
window.addEventListener('pointerdown', e => {
  e.preventDefault()
  sound.unlock()
  loadMusic()
  fullscreen.tap()
  // the music switch: only a switch, not a start or a choice
  if (onMusicButton(game, (e.clientX - view.x) / view.scale, (e.clientY - view.y) / view.scale, canPlaySound)) { music.press(game); return }
  // the frame-rate switch: only a switch, not a start
  if (onFpsButton(game, (e.clientX - view.x) / view.scale, (e.clientY - view.y) / view.scale)) { fps.toggle(); return }
  // only a mute: not a start, a steer, a choice of ship or a move on
  if (onMuteButton(game, (e.clientX - view.x) / view.scale, (e.clientY - view.y) / view.scale, canPlaySound)) { sound.toggleMute(); return }
  // the start screen's two entries, and every tap and hold on a story screen
  if (storyMode.pointerDown((e.clientX - view.x) / view.scale, (e.clientY - view.y) / view.scale)) return
  if (closeBoard()) return
  if (onBoardButton(e)) { game.boardOpen = true; return }
  if (onShareButton(e)) { sharePointer = e.pointerId; return }   // not a steer, not a restart
  input.pointer(e.pointerId, e.clientX, window.innerWidth)
  tryStart(game, (e.clientX - view.x) / view.scale)   // where it landed across the field: between missions that chooses the ship
}, { passive: false })
window.addEventListener('pointermove', e => input.movePointer(e.pointerId, e.clientX, window.innerWidth))
const release = (e: PointerEvent) => input.release(e.pointerId)
window.addEventListener('pointerup', e => {
  storyMode.pointerUp()
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
  sound.unlock()
  loadMusic()
  fullscreen.tap()
  if (e.key === 'm' || e.key === 'M') { if (!e.repeat) sound.toggleMute(); return }   // the sound effects
  if (e.key === 'n' || e.key === 'N') { if (!e.repeat) music.press(game); return }   // the music: on the start screen, the drone
  if (storyMode.key(e.key, true, e.repeat)) { e.preventDefault(); return }
  if (e.key === 'Escape') { closeBoard(); return }
  const side = sideOf(e.key)
  if (side) { input.key(side, true); if (!e.repeat) chooseSide(game, side === 'left' ? -1 : 1) }
  else if (e.key === ' ' || e.key === 'Enter') { if (!e.repeat && !closeBoard()) tryStart(game) }   // closing the leaderboard is not a restart
  else return
  e.preventDefault()
  if (!e.repeat && game.state === 'menu') tryStart(game)   // a steering key also starts the first run
})
window.addEventListener('keyup', e => {
  storyMode.key(e.key, false, false)
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
  if (wasPlaying && (game.state === 'over' || game.state === 'won') && !game.story) runEnded()   // not the stop between levels, nor a story flight
}

let last = performance.now(), owed = 0
function frame(now: number) {
  const raw = (now - last) / 1000
  if (raw < 1) {                                 // a frame actually drawn; a long gap is the tab coming back, not a stutter
    frames.frame(raw)
    runFrames.frame(raw, game.state === 'launch' || game.state === 'play')
    runSound.frame(raw)
    if (storyMode.flying) {                      // a story flight in the air: its own count
      flightFrames.frame(raw, game.state === 'launch' || game.state === 'play')
      flightSound.frame(raw)
      flightSeconds += raw
    }
  }
  let dt = Math.min(0.25, raw)                   // clamp: no jumps after tab switch
  last = now
  if (Math.abs(dt - STEP) < 0.002) dt = STEP     // a 60 Hz screen: exactly one step per frame, no stutter
  owed += dt
  storyMode.beforeSteps(dt)
  const storyScreen = storyMode.active && !storyMode.flying   // a story screen: the game waits
  if (storyMode.holdsGame) owed = 0
  while (owed >= STEP - 1e-9) { owed -= STEP; step() }
  storyMode.afterSteps()
  if (game.state === 'launch' && lastState !== 'launch' && game.level === 1) { runFrames.start(); runSound.start() }   // a run's first fly-in
  lastState = game.state
  game.shareNote = Math.max(0, game.shareNote - dt)
  updater?.tick(game.state)
  music.frame(game, storyMode.musicMode())       // reads the events; the sound effects then take them
  sound.frame(game, dt)
  for (const e of storyMode.takeEvents()) sound.story(e, FEEL.holdSeconds)   // the story screens' sounds
  if (!storyMode.draw(ctx)) {
    render(ctx, game, { start: storyMode.startView(), flight: storyMode.flightView(), orbit: storyMode.orbitView() })
    storyMode.overlay(ctx)
  }
  if (!storyScreen && showsMute(game, canPlaySound)) drawMuteButton(ctx, game, sound.muted)
  if (!storyScreen && showsMusicButton(game, canPlaySound)) drawMusicButton(ctx, game, music.on)
  if (!storyScreen && showsFpsButton(game)) drawFpsButton(ctx, game, fps.on)
  if (fps.on) drawFpsReading(ctx, game, frames.reading())   // on every screen: it sits alone in the bottom left corner
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

window.__game = createDebugHook(game)
window.__story = storyMode.debug
// For tuning the sounds by ear, after one tap on the page: `__sound.play('save')`,
// `__sound.play('save', 1.5)` for a higher one, or `__sound.event({ kind: 'missed', count: 3 })`.
window.__sound = {
  sounds: Object.keys(SOUNDS),
  play: (name: keyof typeof SOUNDS, pitch = 1) => sound.audition(name, pitch),
  event: (e: Parameters<typeof sound.audition>[0]) => sound.audition(e),
}

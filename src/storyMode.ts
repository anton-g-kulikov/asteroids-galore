// The page's side of story mode: the dev switch that hides it until the owner releases it, the
// start screen's two entries, taps, holds and keys on story screens, starting each flight and
// catching its end, and drawing. The story itself is in src/story; the drawing in src/render/story.

import { setState } from './game/game'
import { orbitAt, startStoryTrip, storyTripResult } from './game/simulation'
import type { Game } from './game/types'
import { choiceSideAt, devControlAt, drawBackdrop, drawDevPanel, drawDevPill, drawManifest, drawStoryPicker, drawStoryScreen, onDevPill, startEntryAt, storyCardAt, type DevControlId } from './render/story'
import { FEEL, createStoryController, savedMoon, type StoryController, type StoryEvent } from './story/controller'
import { defaultsFor, endingState, jumpState, placesAt, roomOf, type DevSet } from './story/dev'
import { ENDING_NAMES } from './story/lines'
import { MOON_PEOPLE, boatSeats } from './story/numbers'
import { ENDINGS, newStory } from './story/story'
import type { DevPanelView, DevPlace, MoonIndex } from './story/view'
import type { Store } from './story/progress'
import type { StartEntriesView, StoryFlightView } from './story/view'
import type { Mode as MusicMode } from './music/score'
import type { OrbitView } from './render/story/orbit'

export const DEV_KEY = 'asteroids-galore-dev'

/** Story mode is shown only while the dev switch is on, until the owner releases it. `?dev` turns it on, `?dev=off` off; remembered on the device. */
export function readDevSwitch(store: Store | null, search: string): boolean {
  const q = new URLSearchParams(search).get('dev')
  try {
    if (q !== null) store?.setItem(DEV_KEY, q === 'off' ? '0' : '1')
    return store?.getItem(DEV_KEY) === '1'
  } catch { return q !== null && q !== 'off' }
}

/** Seconds the version line at the foot of the start screen must be held to switch dev on or off. */
export const VERSION_HOLD = 3
const onVersionLine = (g: Game, x: number, y: number) => y > g.H - 34 * g.U && Math.abs(x - g.W / 2) < 120

export interface StoryMode {
  /** Dev on: the start screen has two entries and story mode can be played. */
  readonly enabled: boolean
  /** A story is being played (its screens or its flights). */
  readonly active: boolean
  /** A story flight is in the air: arcade's steering applies, and nothing else of the page's. */
  readonly flying: boolean
  /** The game waits: a story screen, or the dev panel open. */
  readonly holdsGame: boolean
  pointerDown(x: number, y: number): boolean
  pointerUp(): void
  key(key: string, down: boolean, repeat: boolean): boolean
  /** Once a frame, before the game steps: starts a flight the story asks for. */
  beforeSteps(dt: number): void
  /** Once a frame, after the game steps: catches the end of a flight. */
  afterSteps(): void
  /** Draws a story screen in place of the game; false when the game should draw itself. */
  draw(ctx: CanvasRenderingContext2D): boolean
  /** After the game has drawn a story flight: the dev pill over it. */
  overlay(ctx: CanvasRenderingContext2D): void
  startView(): StartEntriesView | null
  flightView(): StoryFlightView | null
  /** The orbit under a story flight: where the boat is on its lap and the laps flown. */
  orbitView(): OrbitView | null
  /** The music under the story's screens, or null to let the game decide. */
  musicMode(): MusicMode | null
  takeEvents(): StoryEvent[]
  /** For automated checks and play testing (window.__story): the story's state, and ending a flight at once. */
  readonly debug: { mode(): string; state(): unknown; screen(): unknown; endTrip(picked: number, destroyed?: boolean): void; devAt(x: number, y: number): string | null; dev(): unknown }
}

export function createStoryMode(o: { game: Game; store: Store | null; search: string; callsign: () => string; onArcade: () => void }): StoryMode {
  const g = o.game
  let enabled = readDevSwitch(o.store, o.search)
  let story: StoryController | null = null
  let versionHeld = -1
  let pending: ReturnType<StoryController['takeTrip']> = null
  // the dev control: open or not, and what it is set to
  let panel: { inFlight: boolean } | null = null
  const dev = { moon: 0 as MoonIndex, place: 'trip' as DevPlace, set: defaultsFor(0) as DevSet, freighter: 'chance' as 'chance' | 'yes' | 'no', lanternHome: 'chance' as 'chance' | 'yes' | 'no', invincible: false }
  /** Story chance, never the run's seed; the dev control can force either telling. */
  const rand = () => {
    const forced = story?.state.moon === 6 ? dev.lanternHome : dev.freighter
    if (!enabled || forced === 'chance') return Math.random()
    return story?.state.moon === 6 ? (forced === 'yes' ? 0.99 : 0) : (forced === 'yes' ? 0 : 0.99)
  }

  const start = () => {
    story = createStoryController({ store: o.store, callsign: o.callsign, rand })
    g.stateTime = 0
  }
  const startDev = (initial: ReturnType<typeof newStory>, afterTrip = false) => {
    story = createStoryController({ store: o.store, callsign: o.callsign, rand, dev: true, initial, afterTrip })
    g.story = null; setState(g, 'between'); g.stateTime = 0; pending = null; panel = null
  }
  const panelView = (): DevPanelView => ({
    moon: dev.moon, place: dev.place, places: placesAt(dev.moon), inFlight: !!panel?.inFlight,
    state: { lantern: dev.set.lantern, still: dev.set.still, lost: dev.set.lost, boats: dev.set.boats, oreAboard: dev.set.oreAboard },
    trip: { aboard: g.onboard, shields: g.shields },
    chance: { secondFreighter: dev.freighter, lanternHome: dev.lanternHome },
    endings: ENDINGS.map(e => ENDING_NAMES[e]),
    feel: { typingPerSecond: FEEL.typingPerSecond, holdSeconds: FEEL.holdSeconds },
    invincible: dev.invincible,
  })
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  function devControl(id: DevControlId) {
    const [name, arg] = id.split(':')
    const step = arg === '+' ? 1 : -1
    switch (name) {
      case 'close': panel = null; break
      case 'invincible': dev.invincible = !dev.invincible; break
      case 'go': startDev(jumpState(dev.moon, dev.place, dev.set), dev.place === 'afterTrip'); break
      case 'newStory': startDev(newStory()); break
      case 'endTrip': case 'loseBoat':
        if (story?.mode === 'flight') { story.tripEnded({ picked: g.onboard, destroyed: name === 'loseBoat', shieldsLeft: g.shields }); g.story = null; setState(g, 'between') }
        panel = null; break
      case 'toWormhole': if (story?.mode === 'flight') g.wormhole = { x: g.ship.x, y: g.ship.y - 90, r: 30 }; panel = null; break
      case 'moon': dev.moon = Number(arg) as MoonIndex; dev.set = defaultsFor(dev.moon); if (!placesAt(dev.moon).includes(dev.place)) dev.place = 'trip'; break
      case 'place': if (placesAt(dev.moon).includes(arg as DevPlace)) dev.place = arg as DevPlace; break
      case 'lantern': dev.set.lantern = clamp(dev.set.lantern + step, 0, roomOf(dev.set)); break
      case 'still': dev.set.still = clamp(dev.set.still + step, 0, MOON_PEOPLE[dev.moon]); break
      case 'lost': dev.set.lost = clamp(dev.set.lost + step, 0, MOON_PEOPLE[dev.moon]); break
      case 'aboard': g.onboard = clamp(g.onboard + step, 0, boatSeats(g.shipType)); break
      case 'shields': g.shields = clamp(g.shields + step, 0, 5); break
      case 'typing': FEEL.typingPerSecond = clamp(FEEL.typingPerSecond + 10 * step, 10, 400); break
      case 'hold': FEEL.holdSeconds = Math.round(clamp(FEEL.holdSeconds + 0.1 * step, 0.3, 4) * 10) / 10; break
      case 'boat': { const i = Number(arg) - 1; dev.set.boats = dev.set.boats.map((b, j) => j === i ? !b : b) as DevSet['boats']; break }
      case 'ore': dev.set.oreAboard = arg === 'aboard'; dev.set.lantern = clamp(dev.set.lantern, 0, roomOf(dev.set)); break
      case 'freighter': dev.freighter = arg as typeof dev.freighter; break
      case 'lanternHome': dev.lanternHome = arg as typeof dev.lanternHome; break
      case 'ending': startDev(endingState(ENDINGS[Number(arg)], dev.moon, dev.set, Math.max(g.onboard, dev.set.still), dev.freighter !== 'no')); break
    }
  }
  const finish = () => { story = null; g.story = null; setState(g, 'menu') }
  const isScreen = () => !!story && story.mode !== 'flight'

  return {
    get enabled() { return enabled },
    get active() { return !!story },
    get flying() { return story?.mode === 'flight' },
    get holdsGame() { return !!story && (story.mode !== 'flight' || !!panel) },
    pointerDown(x, y) {
      if (story) {
        if (panel) { const id = devControlAt(g, panelView(), x, y); if (id) devControl(id); return true }
        if (enabled && onDevPill(g, x, y)) { panel = { inFlight: story.mode === 'flight' }; story.release(); return true }   // the game stops; in flight, not a steer
        if (story.mode === 'flight') return false
        if (story.mode === 'picker') { const v = story.pickerView()!; const b = storyCardAt(g, v, x); if (b) story.hold(b); return true }
        const v = story.screenView()
        if (story.mode === 'screen' && v?.choice) story.hold(choiceSideAt(g, x))
        else story.tap()
        return true
      }
      if (g.state !== 'menu') return false
      if (onVersionLine(g, x, y)) { versionHeld = 0; return true }
      if (!enabled) return false
      const entry = startEntryAt(g, x, y)
      if (entry === 'arcade') o.onArcade()
      else if (entry === 'story') start()
      return true                                                             // a tap that misses both entries does nothing
    },
    pointerUp() { story?.release(); versionHeld = -1 },
    key(key, down, repeat) {
      const side = key === 'ArrowLeft' || key === 'a' || key === 'A' ? 'left' : key === 'ArrowRight' || key === 'd' || key === 'D' ? 'right' : null
      if (story) {
        if (panel) return true
        if (story.mode === 'flight') return false
        if (!down) { if (side) story.release(); return !!side }
        if (repeat) return true
        if (key === ' ' || key === 'Enter') { story.tap(); return true }
        if (side && story.mode === 'picker') { const boats = story.pickerView()!.boats.filter(b => !b.lost); const b = side === 'left' ? boats[0] : boats[boats.length - 1]; if (b) story.hold(b.ship); return true }
        if (side) { if (story.screenView()?.choice) story.hold(side); return true }
        return false
      }
      if (!enabled || g.state !== 'menu' || !down) return false
      if (side === 'left') { if (!repeat) o.onArcade(); return true }
      if (side === 'right') { if (!repeat) start(); return true }
      return key === ' ' || key === 'Enter'                                   // on the start screen with two entries, these choose neither
    },
    beforeSteps(dt) {
      if (versionHeld >= 0 && (versionHeld += dt) >= VERSION_HOLD) {
        versionHeld = -1
        enabled = !enabled
        try { o.store?.setItem(DEV_KEY, enabled ? '1' : '0') } catch { /* this visit only */ }
      }
      g.invincible = enabled && dev.invincible && !!story && story.mode === 'flight'   // story flights only, and only while dev is on
      if (!story) return
      if (story.mode === 'done') { finish(); return }
      if (panel) return                                                       // the dev panel holds everything
      if (story.mode === 'flight') {
        const t = story.takeTrip()
        if (t && t !== pending) { pending = t; startStoryTrip(g, t) }
      } else {
        pending = null
        story.tick(dt)
        g.stateTime += dt
        g.clock += dt
      }
    },
    afterSteps() {
      // only a flight that has started can end: a hold that chose to fly in this frame's tick has not started one yet,
      // and the game still shows how the last flight ended
      if (story?.mode !== 'flight' || !g.story || !pending) return
      if (g.state === 'between' || g.state === 'over' || g.state === 'won') story.tripEnded(storyTripResult(g))
    },
    draw(ctx) {
      if (!isScreen()) return false
      drawBackdrop(ctx, g)
      if (story!.mode === 'manifest' || story!.mode === 'done') drawManifest(ctx, g, story!.manifestView()!)
      else {
        const v = story!.screenView()
        if (v) drawStoryScreen(ctx, g, v)
        if (story!.mode === 'picker') drawStoryPicker(ctx, g, story!.pickerView()!)
      }
      if (enabled) drawDevPill(ctx, g)
      if (panel) drawDevPanel(ctx, g, panelView())
      return true
    },
    overlay(ctx) {
      if (story?.mode !== 'flight' || !enabled) return
      drawDevPill(ctx, g)
      if (panel) drawDevPanel(ctx, g, panelView())
    },
    startView() {
      if (!enabled || story || g.state !== 'menu') return null
      const moon = savedMoon(o.store)
      return { storyLabel: moon ? `STORY · ${moon}` : 'STORY' }
    },
    flightView() { return story?.mode === 'flight' ? story.flightView(g.onboard) : null },
    orbitView() {
      if (story?.mode !== 'flight' || !g.story) return null
      const { at, laps } = orbitAt(g)
      return { at, laps, captainAboard: story.state.moon === 6 }   // nobody knows in advance where people are (the owner)
    },
    musicMode() {
      if (!story || story.mode === 'flight') return null
      if (story.mode === 'manifest' || story.mode === 'done') return story.state.ending === 'lostAtTheHeart' ? 'silent' : 'over'
      return 'results'                                                        // the pad alone, as between missions
    },
    takeEvents() { return story?.takeEvents() ?? [] },
    debug: {
      mode: () => story?.mode ?? (g.state === 'menu' ? 'start' : 'arcade'),
      state: () => story?.state ?? null,
      screen: () => story?.screenView() ?? story?.manifestView() ?? null,
      devAt: (x, y) => devControlAt(g, panelView(), x, y),
      dev: () => ({ open: !!panel, ...dev }),
      endTrip(picked, destroyed = false) {
        if (story?.mode !== 'flight') return
        story.tripEnded({ picked, destroyed, shieldsLeft: g.shields })
        g.story = null; setState(g, 'between')
      },
    },
  }
}

// Runs a story from screen to screen: typing the transmissions, a tap to read on, a hold to
// choose, the flights, the boat picker and the manifest. It knows nothing of drawing or of the
// page: main.ts feeds it time, taps, holds and the end of each flight, and draws the views it
// gives back. Story chance uses `rand`, never the run's seeded numbers.

import { ENDING_NAMES, briefing, ending, lanternChoice, lastBoatLost, leaving, moonName, oreChoice, oreDropped, stayed, stop, type Screen, type Tx } from './lines'
import { manifestFor } from './manifest'
import { boatSeats } from './numbers'
import { loadLamps, loadStory, saveLamps, saveStory, clearStory, type Store } from './progress'
import {
  afterLeaving, chooseLantern, chooseOre, endTrip, goBack, goOn, heard, lanternAboard, lanternRoom, newStory, pickBoat, readyBoats, startFlying, still, tripSetup,
  type Boat, type Ending, type StoryState,
} from './story'
import type { ChoiceView, LanternView, ManifestView, PickerView, StoryFlightView, StoryScreenView } from './view'

/** How the screens feel: the owner wants both tried on a phone (the dev control changes them). */
export const FEEL = { typingPerSecond: 60, holdSeconds: 1.2, callDelay: 0.3, countGap: 0.9 }

type Choice = 'backOrOn' | 'ore' | 'lantern'
type Kind = 'briefing' | 'afterTrip' | 'stop' | 'lastBoatLost' | 'leaving' | 'ore' | 'oreDropped' | 'lantern' | 'stayed' | 'ending'

interface ScreenState {
  kind: Kind
  txs: Tx[]
  shown: number          // transmissions shown so far, the last of them typing
  typed: number          // characters typed of the last shown
  sinceCall: number      // seconds since the last one's sender appeared
  choice: Choice | null
}

/** What happened, for the sounds. */
export type StoryEvent =
  | { kind: 'call'; voice: Tx['voice'] }
  | { kind: 'typingDone' }
  | { kind: 'holdStart' }
  | { kind: 'holdCancel' }
  | { kind: 'chosen'; heavy: boolean }
  | { kind: 'count'; mark: ManifestView['counts'][number]['mark'] }
  | { kind: 'lamp' }

/** What main.ts should be doing now. */
export type Mode = 'screen' | 'flight' | 'picker' | 'manifest' | 'done'

const chars = (t: Tx) => t.lines.join('').length

export interface StoryController {
  readonly mode: Mode
  readonly state: StoryState
  /** A flight to start now (main.ts calls startStoryTrip with it), or null. Read once. */
  takeTrip(): ReturnType<typeof tripSetup> | null
  tick(dt: number): void
  tap(): void
  /** A side (or a boat in the picker) is pressed or let go. */
  hold(side: 'left' | 'right' | Boat): void
  release(): void
  tripEnded(result: { picked: number; destroyed: boolean; shieldsLeft: number}): void
  screenView(): StoryScreenView | null
  pickerView(): PickerView | null
  manifestView(): ManifestView | null
  flightView(aboard: number): StoryFlightView
  /** The moon the story is at, for the start screen's `STORY · m02n`; null before it starts. */
  takeEvents(): StoryEvent[]
}

/** The moon a saved story is at, for the start screen. */
export const savedMoon = (store: Store | null): string | null => { const s = loadStory(store); return s && s.phase !== 'briefing' ? moonName(s.moon) : null }

export function createStoryController(opts: {
  store: Store | null; callsign: () => string; rand: () => number
  /** A dev story: never saved, never overwrites the player's, and mission 06's one-try rule does not hold. */
  dev?: boolean
  /** Where a dev story starts; with `afterTrip`, a stop shows the story's lines for the trip first. */
  initial?: StoryState; afterTrip?: boolean
}): StoryController {
  const { store, rand } = opts
  let s: StoryState = opts.initial ?? loadStory(store) ?? newStory()
  let mode: Mode = 'screen'
  let screen: ScreenState | null = null
  let trip: ReturnType<typeof tripSetup> | null = null
  let holding: { side: 'left' | 'right' | Boat; time: number } | null = null
  let manifest = { countsShown: 0, time: 0, lampLit: false, lamps: loadLamps(store) }
  const events: StoryEvent[] = []

  const save = () => { if (!opts.dev) saveStory(store, s) }
  const show = (kind: Kind, sc: Screen, choice: Choice | null = null) => {
    s = heard(s, sc.heard)
    screen = { kind, txs: sc.transmissions, shown: sc.transmissions.length ? 1 : 0, typed: 0, sinceCall: 0, choice }
    if (screen.txs.length) events.push({ kind: 'call', voice: screen.txs[0].voice })
    mode = 'screen'
    save()
  }
  const fly = () => { trip = tripSetup(s); mode = 'flight'; save() }
  const toManifest = () => {
    mode = 'manifest'; manifest = { ...manifest, countsShown: 0, time: 0, lampLit: false }
    if (!manifest.lamps.includes(s.ending!)) manifest.lamps = [...manifest.lamps, s.ending!]
    if (!opts.dev) { saveLamps(store, manifest.lamps); clearStory(store) }
  }
  const toEnding = () => {
    if (s.ending === 'lostAtTheHeart') { toManifest(); return }   // no story screen and no title: the manifest alone
    show('ending', ending(s, opts.callsign()))
  }
  const callsign = () => opts.callsign()

  /** Where the story goes after the phase it is in now. */
  function enter() {
    switch (s.phase) {
      case 'briefing': show('briefing', briefing(s, callsign())); break
      case 'flying':
        // closing the app in mission 06 cannot buy a second try: the boat did not come out
        if (s.moon === 6 && trip === null && s.m06Committed && loadedMidFlight && !opts.dev) { s = endTrip(s, { picked: 0, destroyed: true, shieldsLeft: 0 }, rand); toEnding(); break }
        fly(); break
      case 'stop':
        if (opts.afterTrip && s.lastTrip) show('afterTrip', stop(s, callsign()))
        else show('stop', { transmissions: [], heard: {} }, still(s) > 0 ? 'backOrOn' : null)
        break
      case 'leaving': show('leaving', leaving(s, callsign())); break
      case 'oreChoice': show('ore', oreChoice(s, callsign()), 'ore'); break
      case 'lanternChoice': show('lantern', lanternChoice(s, callsign()), 'lantern'); break
      case 'picker': mode = 'picker'; save(); break
      case 'ending': toEnding(); break
    }
  }
  const loadedMidFlight = s.phase === 'flying'
  enter()

  const allShown = () => !!screen && screen.shown >= screen.txs.length && (screen.txs.length === 0 || screen.typed >= chars(screen.txs[screen.shown - 1]))

  function choose(side: 'left' | 'right') {
    const c = screen!.choice!
    events.push({ kind: 'chosen', heavy: c !== 'backOrOn' })
    if (c === 'backOrOn') { if (side === 'left') { s = goBack(s); if (s.phase === 'picker') { mode = 'picker'; save() } else fly() } else { s = goOn(s); show('leaving', leaving(s, callsign())) } }
    else if (c === 'ore') { s = chooseOre(s, side === 'left' ? 'home' : 'drop', rand); if (side === 'left') toEnding(); else show('oreDropped', oreDropped(s, callsign())) }
    else { s = chooseLantern(s, side === 'left' ? 'home' : 'stay'); if (side === 'left') toEnding(); else show('stayed', stayed(s, callsign())) }
  }

  /** TAP TO CONTINUE on a screen with no choice. */
  function next() {
    const k = screen!.kind
    if (k === 'briefing') { s = startFlying(s); if (s.phase === 'picker') { mode = 'picker'; save() } else fly() }
    else if (k === 'afterTrip') show('stop', { transmissions: [], heard: {} }, still(s) > 0 ? 'backOrOn' : null)
    else if (k === 'stop') { s = goOn(s); show('leaving', leaving(s, callsign())) }
    else if (k === 'lastBoatLost') toEnding()
    else if (k === 'leaving' || k === 'oreDropped' || k === 'stayed') {
      if (k === 'leaving') s = afterLeaving(s)
      if (s.phase === 'oreChoice') show('ore', oreChoice(s, callsign()), 'ore')
      else if (s.phase === 'lanternChoice') show('lantern', lanternChoice(s, callsign()), 'lantern')
      else if (s.phase === 'picker') { mode = 'picker'; save() }
      else fly()
    }
    else if (k === 'ending') toManifest()
  }

  return {
    get mode() { return mode },
    get state() { return s },
    takeTrip() { const t = mode === 'flight' ? trip : null; return t },
    tick(dt) {
      if (mode === 'screen' && screen) {
        const cur = screen.txs[screen.shown - 1]
        if (cur) {
          screen.sinceCall += dt
          const before = screen.typed
          if (screen.sinceCall > FEEL.callDelay) screen.typed = Math.min(chars(cur), screen.typed + FEEL.typingPerSecond * dt)
          if (before < chars(cur) && screen.typed >= chars(cur)) events.push({ kind: 'typingDone' })
        }
      }
      if (holding) {
        holding.time += dt
        if (holding.time >= FEEL.holdSeconds) {
          const side = holding.side
          holding = null
          if (mode === 'picker' && typeof side === 'number') { events.push({ kind: 'chosen', heavy: false }); s = pickBoat(s, side); fly() }
          else if (mode === 'screen' && typeof side === 'string') choose(side)
        }
      }
      if (mode === 'manifest') {
        manifest.time += dt
        const counts = manifestFor(s, callsign(), manifest.lamps, 9, true).counts
        const due = Math.min(counts.length, Math.floor(manifest.time / FEEL.countGap))
        while (manifest.countsShown < due) {
          const c = counts[manifest.countsShown++]
          if (s.ending !== 'lostAtTheHeart' && c.value > 0 && c.mark !== 'missing') events.push({ kind: 'count', mark: c.mark })
        }
        if (!manifest.lampLit && manifest.time >= FEEL.countGap * (counts.length + 1)) {
          manifest.lampLit = true
          if (s.ending !== 'lostAtTheHeart') events.push({ kind: 'lamp' })
        }
      }
    },
    tap() {
      if (mode === 'manifest') { if (manifest.lampLit) mode = 'done'; return }
      if (mode !== 'screen' || !screen) return
      const cur = screen.txs[screen.shown - 1]
      if (cur && screen.typed < chars(cur)) { screen.typed = chars(cur); screen.sinceCall = FEEL.callDelay; events.push({ kind: 'typingDone' }); return }
      if (screen.shown < screen.txs.length) { screen.shown++; screen.typed = 0; screen.sinceCall = 0; events.push({ kind: 'call', voice: screen.txs[screen.shown - 1].voice }); return }
      if (!screen.choice) next()
    },
    hold(side) {
      if (mode === 'picker' && typeof side === 'number' && s.boats[side - 1] === 'ready') { holding = { side, time: 0 }; events.push({ kind: 'holdStart' }) }
      else if (mode === 'screen' && typeof side === 'string' && screen?.choice && allShown()) { holding = { side, time: 0 }; events.push({ kind: 'holdStart' }) }
    },
    release() { if (holding) { holding = null; events.push({ kind: 'holdCancel' }) } },
    tripEnded(result) {
      if (mode !== 'flight') return
      trip = null
      s = endTrip(s, result, rand)
      if (s.phase === 'ending') {
        if (s.moon < 6 && result.destroyed) show('lastBoatLost', lastBoatLost(s, callsign()))
        else toEnding()
      } else show('afterTrip', stop(s, callsign()))
    },
    screenView() {
      if ((mode !== 'screen' && mode !== 'picker') || !screen) return null
      // under the picker: only the last transmission of the screen before it, all shown (the boat cards stand where the rest would be)
      const sc = mode === 'picker' ? { ...screen, choice: null, txs: screen.txs.slice(-1), shown: Math.min(1, screen.txs.length), typed: Infinity } : screen
      // under the picker only the chain, the title and that one transmission: the boat cards stand where the Lantern and counts would
      const isStop = sc.kind === 'stop' && mode !== 'picker', big = (sc.kind === 'ore' || sc.kind === 'lantern') && mode !== 'picker'
      const choiceView = (): ChoiceView | null => {
        if (!sc.choice || !allShown()) return null
        const words: Record<Choice, [[string, string], [string, string]]> = {
          backOrOn: [['GO BACK', `FOR ${still(s)}`], s.moon === 3 || s.moon === 5 ? ['LEAVE', moonName(s.moon)] : ['GO ON', `TO ${moonName(s.moon + 1)}`]],
          ore: [['GO HOME', 'WITH THE ORE'], ['DROP', 'THE ORE']],
          lantern: [['GO HOME WITH', 'THE LANTERN'], ['STAY WITH', 'THE LAST BOAT']],
        }
        const [left, right] = words[sc.choice]
        const h = holding && typeof holding.side === 'string' ? holding : null
        return { left, right, held: h ? h.side as 'left' | 'right' : null, progress: h ? Math.min(1, h.time / FEEL.holdSeconds) : 0 }
      }
      const isEnding = sc.kind === 'ending'
      return {
        chain: { named: s.named, current: isEnding ? null : s.moon },
        title: isEnding ? ENDING_NAMES[s.ending as Ending] : moonName(s.moon),
        ending: isEnding,
        transmissions: sc.txs.slice(0, sc.shown).map((t, i) => ({ ...t, typed: i < sc.shown - 1 ? chars(t) : Math.min(chars(t), Math.floor(sc.typed)) })),
        people: isStop ? { aboard: s.saved[s.moon], still: still(s), lost: s.dead[s.moon] } : null,
        lantern: isStop || big ? lanternView() : null,
        counts: isStop ? { lantern: lanternAboard(s), room: lanternRoom(s), moon: moonName(s.moon), still: still(s), lost: s.dead[s.moon] } : null,
        choice: choiceView(),
        tapToContinue: mode === 'screen' && allShown() && !sc.choice,
      }
    },
    pickerView() {
      if (mode !== 'picker') return null
      const h = holding && typeof holding.side === 'number' ? holding : null
      return {
        boats: ([1, 2, 3] as Boat[]).map(b => ({ ship: b, lost: s.boats[b - 1] === 'lost' })),
        held: h ? h.side as Boat : null, progress: h ? Math.min(1, h.time / FEEL.holdSeconds) : 0,
        captainAboard: s.m06Committed,
      }
    },
    manifestView() {
      return mode === 'manifest' || mode === 'done' ? manifestFor(s, callsign(), manifest.lamps, manifest.countsShown, manifest.lampLit) : null
    },
    flightView(aboard) {
      const t = trip ?? tripSetup({ ...s, phase: 'flying' })
      return { moon: moonName(s.moon), still: Math.max(0, t.people - aboard), aboard, seats: boatSeats(s.boat), captainAboard: s.moon === 6 }
    },
    takeEvents() { return events.splice(0) },
  }

  function lanternView(): LanternView {
    return { aboard: lanternAboard(s), room: lanternRoom(s), oreAboard: s.oreAboard, boats: [...s.boats] as LanternView['boats'] }
  }
}

/** For checks: the boats ready now. */
export const boatsReady = readyBoats

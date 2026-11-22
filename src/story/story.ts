// The story mode's state and its moves, as pure functions: every move returns a new state and
// never changes the one it is given. Chance (the second freighter, the Lantern sent home alone)
// comes from `rand`, which the caller passes in: never the run's seeded numbers.

import { SHIELDS } from '../game/tuning'
import { LANTERN_LOST, MOON_PEOPLE, ROOM, SECOND_FREIGHTER, SECOND_FREIGHTER_SHARE, boatSeats, storyStartSpeed, storyTarget } from './numbers'
import type { BoatState, MoonIndex } from './view'

export type Phase = 'briefing' | 'flying' | 'stop' | 'leaving' | 'oreChoice' | 'picker' | 'lanternChoice' | 'ending'
export type Ending = 'commission' | 'pastTheList' | 'fullShip' | 'emptyRail' | 'home' | 'lightThatStayed' | 'lightboat' | 'lostAtTheHeart'
export const ENDINGS: Ending[] = ['commission', 'pastTheList', 'fullShip', 'emptyRail', 'home', 'lightThatStayed', 'lightboat', 'lostAtTheHeart']
export type Boat = 1 | 2 | 3
/** The moons the second freighter goes to: m04n to m06n only (the owner: "it's a narrative device, and yes, it shouldn't save all crew"). */
export const SECOND_FREIGHTER_REACH: MoonIndex[] = [4, 5, 6]
/** The hero is the pilot until the ore choice is made, whichever way, and the captain after (the owner's arc). */
export const isCaptain = (s: StoryState): boolean => !s.oreAboard || (s.ending === 'commission' && readyBoats(s).length > 0)

export interface StoryState {
  phase: Phase
  moon: MoonIndex
  /** Trips flown to this moon so far: 0 before the first. */
  trips: number
  /** Per moon: people brought aboard (to the Lantern, or for m06n into the last boat), and people who died in lost boats. */
  saved: number[]
  dead: number[]
  oreAboard: boolean
  boats: [BoatState, BoatState, BoatState]
  /** The boat in use. */
  boat: Boat
  /** Shields the boat was left with, for a return. */
  shields: number
  /** Moons the captain has been told about, in moon order. */
  named: MoonIndex[]
  /** The moon of the first person brought aboard, who keeps the names (the First); null until someone is aboard. */
  first: MoonIndex | null
  /** What the last trip did, for the story's lines. */
  lastTrip: { picked: number; destroyed: boolean; boat: Boat } | null
  /** Boats lost so far, for the lines ("I've marked them too"). */
  boatsLost: number
  /** The captain chose to stay: mission 06 is committed and cannot be flown again. */
  m06Committed: boolean
  ending: Ending | null
  /** The commission's two tellings: did the second freighter come, and how many it brought out of each moon. */
  secondFreighter: boolean | null
  anotherShip: number[]
  /** After mission 06: was the Lantern, sent home alone, lost. */
  lanternLost: boolean | null
  /** Per moon: has its one-time survivor spoken (they speak at the first stop with someone from their moon aboard). */
  spoke: boolean[]
  /** Has the First's opening block been shown. */
  firstOpened: boolean
  /** Per moon: has the First's block for that moon been shown (at its first stop, whatever the boat brought). */
  firstHere: boolean[]
  /** Has the Foreman been heard (leaving m04n). */
  foremanHeard: boolean
  /** Has Control explained going back (at the first stop with people still on the moon). */
  goingBackTold: boolean
}

/** What a screen's transmissions did to the story: moons they named, and who has now spoken. */
export interface Heard { names?: MoonIndex[]; spoke?: MoonIndex; firstOpened?: boolean; firstHere?: MoonIndex; foremanHeard?: boolean; goingBackTold?: boolean }

/** Records what a story screen said: the chain grows only when a line names a moon (see "When each moon is named"). */
export function heard(s: StoryState, h: Heard): StoryState {
  const n = copy(s)
  for (const m of h.names ?? []) name(n, m)
  if (h.spoke !== undefined) n.spoke[h.spoke] = true
  if (h.firstOpened) n.firstOpened = true
  if (h.firstHere !== undefined) n.firstHere[h.firstHere] = true
  if (h.foremanHeard) n.foremanHeard = true
  if (h.goingBackTold) n.goingBackTold = true
  return n
}

export function newStory(): StoryState {
  return {
    phase: 'briefing', moon: 0, trips: 0, saved: [0, 0, 0, 0, 0, 0, 0], dead: [0, 0, 0, 0, 0, 0, 0], oreAboard: true,
    boats: ['ready', 'ready', 'ready'], boat: 1, shields: SHIELDS, named: [0], first: null, lastTrip: null, boatsLost: 0,
    m06Committed: false, ending: null, secondFreighter: null, anotherShip: [0, 0, 0, 0, 0, 0, 0], lanternLost: null,
    spoke: [false, false, false, false, false, false, false], firstOpened: false, firstHere: [false, false, false, false, false, false, false], foremanHeard: false, goingBackTold: false,
  }
}

const copy = (s: StoryState): StoryState => ({ ...s, saved: [...s.saved], dead: [...s.dead], boats: [...s.boats] as StoryState['boats'], named: [...s.named], anotherShip: [...s.anotherShip], spoke: [...s.spoke], firstHere: [...s.firstHere] })
const name = (s: StoryState, m: MoonIndex) => { if (!s.named.includes(m)) s.named = [...s.named, m].sort((a, b) => a - b) }
const need = (ok: boolean, what: string) => { if (!ok) throw new Error(`story: ${what}`) }

/** People still on the moon in play. */
export const still = (s: StoryState, m: number = s.moon): number => MOON_PEOPLE[m] - s.saved[m] - s.dead[m]
/** People aboard the Lantern. */
export const lanternAboard = (s: StoryState): number => s.saved.slice(0, 6).reduce((a, b) => a + b, 0)
/** The Lantern's room now. */
export const lanternRoom = (s: StoryState): number => s.oreAboard ? 36 : ROOM
/** The boats aboard and ready, smallest first. */
export const readyBoats = (s: StoryState): Boat[] => ([1, 2, 3] as Boat[]).filter(b => s.boats[b - 1] === 'ready')

/** The briefing has been read: the boat for m00n is chosen, then the first flight. */
export function startFlying(s: StoryState): StoryState {
  need(s.phase === 'briefing', 'not on the briefing')
  return chooseOrFly(copy(s))
}

/**
 * All three boats are on the ship and ready (the owner, 2026-11-22). The choice comes before the first
 * flight to each moon, and before a flight back when the last boat was lost, whenever more than one is
 * left; otherwise the one left flies. Flights back keep the boat (the Engineer's choice).
 */
function chooseOrFly(n: StoryState): StoryState {
  const ready = readyBoats(n)
  if (ready.length > 1) return { ...n, phase: 'picker' }
  return { ...n, boat: ready[0], phase: 'flying' }
}

/** What the next flight is: the mission, the boat, the moon's people, a flight back or not, and its shields. */
export function tripSetup(s: StoryState) {
  need(s.phase === 'flying', 'not flying')
  const level = s.moon + 1, isReturn = s.trips > 0
  return {
    level, boat: s.boat, seats: boatSeats(s.boat), people: still(s), isReturn,
    shields: isReturn ? s.shields : Math.max(s.shields, SHIELDS),
    /** Every flight starts at the mission's starting speed: going back to the Lantern resets it (the owner). */
    startSpeed: storyStartSpeed(level), target: storyTarget(level),
    captainAboard: s.moon === 6,
  }
}

/** A trip has ended: `picked` people brought out (or aboard a boat that was destroyed). */
export function endTrip(s: StoryState, out: { picked: number; destroyed: boolean; shieldsLeft: number }, rand: () => number): StoryState {
  need(s.phase === 'flying', 'not flying')
  const n = copy(s), m = s.moon
  n.trips++
  n.lastTrip = { picked: out.picked, destroyed: out.destroyed, boat: s.boat }
  if (m === 6) {                                      // mission 06: one trip, then an ending
    if (out.destroyed) { n.dead[6] += out.picked; return end(n, 'lostAtTheHeart') }
    n.saved[6] += out.picked
    n.lanternLost = rand() < LANTERN_LOST
    if (n.lanternLost) return end(n, 'lightboat')
    return end(n, lanternAboard(n) >= ROOM && out.picked >= boatSeats(s.boat) ? 'lightThatStayed' : 'home')
  }
  if (out.destroyed) {
    n.dead[m] += out.picked
    n.boats[s.boat - 1] = 'lost'
    n.boatsLost++
    n.shields = SHIELDS                               // the next boat goes out with full shields
    const ready = readyBoats(n)
    if (!ready.length) return n.oreAboard ? commission(n, rand) : end(n, 'emptyRail')
    n.boat = ready[ready.length - 1]
  } else {
    n.saved[m] += out.picked
    n.shields = out.shieldsLeft
    if (out.picked > 0 && n.first === null) n.first = m
  }
  n.phase = 'stop'
  return n
}

/** On the stop: go back for those still there (after a lost boat, by way of the picker when more than one is left). */
export function goBack(s: StoryState): StoryState {
  need(s.phase === 'stop' && still(s) > 0, 'nobody to go back for')
  const n = copy(s)
  return s.lastTrip?.destroyed ? chooseOrFly(n) : { ...n, phase: 'flying' }
}

/** On the stop: go on (those still there are left behind). The leaving screen follows. */
export function goOn(s: StoryState): StoryState {
  need(s.phase === 'stop', 'not on the stop')
  return { ...copy(s), phase: 'leaving' as Phase }
}

/** After the leaving screen: the turns at m03n and m05n; otherwise the next moon. */
export function afterLeaving(s: StoryState): StoryState {
  need(s.phase === 'leaving', 'not leaving')
  const n = copy(s)
  if (s.moon === 3) return { ...n, phase: 'oreChoice' }
  if (s.moon === 5) return { ...n, phase: 'lanternChoice' }
  return toNextMoon(n)
}

/** To the next moon, by way of the picker when more than one boat is ready. */
function toNextMoon(n: StoryState): StoryState {
  return chooseOrFly({ ...n, moon: (n.moon + 1) as MoonIndex, trips: 0, shields: SHIELDS })
}

/** The choice of boat, for the flight about to start: the moon's first, or a flight back after a lost boat. */
export function pickBoat(s: StoryState, boat: Boat): StoryState {
  need(s.phase === 'picker' && s.boats[boat - 1] === 'ready', 'that boat is not ready')
  return { ...copy(s), boat, phase: 'flying' }
}

/** Leaving m03n: go home with the ore (the commission), or drop it (room for all six moons; the twelve is ready). */
export function chooseOre(s: StoryState, choice: 'home' | 'drop', rand: () => number): StoryState {
  need(s.phase === 'oreChoice', 'no ore choice now')
  const n = copy(s)
  if (choice === 'home') return commission(n, rand)
  n.oreAboard = false
  return toNextMoon(n)
}

/** Leaving m05n: go home with the Lantern, or stay with the last boat (mission 06 is committed now). */
export function chooseLantern(s: StoryState, choice: 'home' | 'stay'): StoryState {
  need(s.phase === 'lanternChoice', 'no last choice now')
  const n = copy(s)
  if (choice === 'home') return end(n, lanternAboard(n) >= ROOM ? 'fullShip' : 'pastTheList')
  n.m06Committed = true
  return chooseOrFly({ ...n, moon: 6, trips: 0, shields: SHIELDS })
}

function end(n: StoryState, ending: Ending): StoryState {
  return { ...n, phase: 'ending', ending }
}

/** Home with the ore. The second freighter comes 60 times in 100 and brings out a share of the people on m04n to m06n, never all (the owner). */
function commission(n: StoryState, rand: () => number): StoryState {
  n.secondFreighter = rand() < SECOND_FREIGHTER
  if (n.secondFreighter) for (const m of SECOND_FREIGHTER_REACH) n.anotherShip[m] = Math.ceil(still(n, m) * SECOND_FREIGHTER_SHARE)
  return end(n, 'commission')
}

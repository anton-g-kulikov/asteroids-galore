// The dev control's jumps (see "A dev control for play testing" in _meta/game-design.md): a state
// that could have happened, for any moon and place, and for showing any ending. With nothing else
// set, every earlier moon was emptied and no boat was lost; the steppers then change it.

import { MOON_PEOPLE, ROOM, ROOM_WITH_ORE, SECOND_FREIGHTER_SHARE, boatSeats } from './numbers'
import { SECOND_FREIGHTER_REACH, newStory, still, type Boat, type Ending, type StoryState } from './story'
import type { BoatState, DevPlace, MoonIndex } from './view'

export interface DevSet {
  /** People on the Lantern. */
  lantern: number
  /** People still on the moon (after its trip). */
  still: number
  /** People lost on the moon. */
  lost: number
  /** The four, the eight and the twelve: present (true) or lost. */
  boats: [boolean, boolean, boolean]
  oreAboard: boolean
}

/** Where a jump can land at a moon: CHOICE only at m03n and m05n; m06n only flies. */
export const placesAt = (moon: MoonIndex): DevPlace[] =>
  moon === 6 ? ['trip'] : moon === 3 || moon === 5 ? ['trip', 'afterTrip', 'stop', 'leaving', 'choice', 'boats'] : ['trip', 'afterTrip', 'stop', 'leaving', 'boats']

/** The moons named by the time the captain arrives at `moon`, by the script's table. */
const namedOnArrival = (moon: MoonIndex): MoonIndex[] => {
  const order: [MoonIndex, number][] = [[0, 0], [1, 1], [2, 2], [3, 2], [6, 3], [4, 4], [5, 5]]   // moon named, arriving at
  return order.filter(([, at]) => at <= moon).map(([m]) => m).sort((a, b) => a - b) as MoonIndex[]
}

/** What the steppers start at for a moon: every earlier moon emptied, no boat lost, the ore dropped from m04n. */
export function defaultsFor(moon: MoonIndex): DevSet {
  const lantern = MOON_PEOPLE.slice(0, Math.min(moon, 6)).reduce((a, b) => a + b, 0)
  return { lantern, still: Math.ceil(MOON_PEOPLE[moon] / 3), lost: 0, boats: [true, true, true], oreAboard: moon < 4 }
}

export const roomOf = (set: DevSet): number => set.oreAboard ? ROOM_WITH_ORE : ROOM

/** A story at `moon`, at `place`, as set. */
export function jumpState(moon: MoonIndex, place: DevPlace, set: DevSet): StoryState {
  const s = newStory()
  s.named = namedOnArrival(moon)
  // the Lantern's people come from the earlier moons, in order; anyone else there was left behind
  let lantern = Math.min(set.lantern, roomOf(set))
  for (let m = 0; m < Math.min(moon, 6); m++) { s.saved[m] = Math.min(MOON_PEOPLE[m], lantern); lantern -= s.saved[m] }
  for (let m = 0; m < Math.min(moon, 6); m++) { s.spoke[m] = s.saved[m] > 0; s.firstHere[m] = true }
  s.first = s.saved.findIndex(n => n > 0) as MoonIndex
  if (s.first < 0) s.first = null
  s.firstOpened = s.first !== null
  s.foremanHeard = moon >= 5
  s.goingBackTold = moon > 0
  s.oreAboard = set.oreAboard
  s.boats = set.boats.map(b => b ? 'ready' : 'lost') as BoatState[] as StoryState['boats']   // all three are on the ship from the start
  if (!s.boats.includes('ready')) s.boats[0] = 'ready'
  s.boatsLost = s.boats.filter(b => b === 'lost').length
  s.boat = ([3, 2, 1] as Boat[]).find(b => s.boats[b - 1] === 'ready')!
  s.moon = moon
  s.m06Committed = moon === 6 || (moon === 5 && place === 'boats')
  if (place === 'trip') { s.phase = 'flying'; return s }
  // after a trip at this moon: those not still there or lost came aboard
  const lost = Math.min(set.lost, MOON_PEOPLE[moon])
  const stillThere = Math.min(set.still, MOON_PEOPLE[moon] - lost)
  s.dead[moon] = lost
  s.saved[moon] = Math.min(MOON_PEOPLE[moon] - lost - stillThere, Math.max(0, roomOf(set) - s.saved.reduce((a, b) => a + b, 0)))
  if (s.saved[moon] > 0 && s.first === null) s.first = moon
  s.trips = 1
  s.lastTrip = { picked: s.saved[moon], destroyed: false, boat: s.boat }
  s.phase = place === 'afterTrip' || place === 'stop' ? 'stop' : place === 'leaving' ? 'leaving'
    : place === 'choice' ? (moon === 3 ? 'oreChoice' : 'lanternChoice') : 'picker'
  return s
}

/** A story ended as `ending`, with the counts as set; `freighter`: did the second freighter come (for the commission). */
export function endingState(ending: Ending, moon: MoonIndex, set: DevSet, aboard: number, freighter: boolean): StoryState {
  const at: MoonIndex = ending === 'commission' ? 3 : ending === 'pastTheList' || ending === 'fullShip' ? 5 : ending === 'emptyRail' ? (Math.min(moon, 5) as MoonIndex) : 6
  const full = ending === 'fullShip' || ending === 'lightThatStayed'
  const s = jumpState(at, 'stop', full ? { ...set, lantern: ROOM, still: 0, lost: 0, oreAboard: false } : { ...set, oreAboard: ending === 'commission' })
  if (full) s.saved = [...MOON_PEOPLE.slice(0, 6), 0]
  s.phase = 'ending'
  s.ending = ending
  if (ending === 'emptyRail') { s.boats = ['lost', 'lost', 'lost']; s.boatsLost = 3 }
  if (ending === 'commission') {
    s.secondFreighter = freighter
    if (freighter) for (const m of SECOND_FREIGHTER_REACH) s.anotherShip[m] = Math.ceil(still(s, m) * SECOND_FREIGHTER_SHARE)
    if (!s.named.includes(4)) s.named = [...s.named, 4 as MoonIndex].sort((a, b) => a - b)
  }
  if (at === 6) {
    const seats = boatSeats(s.boat)
    const inBoat = ending === 'lightThatStayed' ? seats : Math.min(aboard, seats)
    if (ending === 'lostAtTheHeart') s.dead[6] = inBoat
    else s.saved[6] = inBoat
    s.lanternLost = ending === 'lostAtTheHeart' ? null : ending === 'lightboat'
    s.trips = 1
    s.lastTrip = { picked: inBoat, destroyed: ending === 'lostAtTheHeart', boat: s.boat }
  }
  return s
}

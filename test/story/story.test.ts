import { describe, expect, test } from 'vitest'
import { MOON_PEOPLE, ROOM, ROOM_WITH_ORE } from '../../src/story/numbers'
import {
  afterLeaving, chooseLantern, chooseOre, endTrip, goBack, goOn, lanternAboard, newStory, pickBoat, readyBoats, startFlying, still, tripSetup,
  type Boat, type StoryState,
} from '../../src/story/story'
import { storyStartSpeed } from '../../src/story/numbers'

const never = () => 0.99, always = () => 0
// Flies a trip: saves `picked` (or loses the boat with them aboard).
const trip = (s: StoryState, picked: number, destroyed = false, shields = 2) => endTrip(s, { picked, destroyed, shieldsLeft: shields }, never)
// The picker, when it is up: the boat given, or the biggest ready.
const pick = (s: StoryState, b?: Boat) => s.phase === 'picker' ? pickBoat(s, b ?? Math.max(...readyBoats(s)) as Boat) : s
const begin = (b: Boat = 1) => pick(startFlying(newStory()), b)

describe('story rules', () => {
  test('STORY-01 a story starts at m00n with the briefing, all three boats ready, m00n named', () => {
    const s = newStory()
    expect([s.phase, s.moon, s.boats, s.named, s.oreAboard]).toEqual(['briefing', 0, ['ready', 'ready', 'ready'], [0], true])
    expect(MOON_PEOPLE).toEqual([6, 7, 11, 12, 16, 18, 20])
    expect([ROOM_WITH_ORE, ROOM]).toEqual([36, 70])
    expect(still(s)).toBe(6)
  })

  test('STORY-02 a trip saves people to the Lantern; going back flies a return for those still there, with the shields left', () => {
    let s = begin()
    expect(tripSetup(s)).toMatchObject({ level: 1, boat: 1, people: 6, isReturn: false, shields: 3 })
    s = trip(s, 4, false, 1)
    expect([s.phase, still(s), lanternAboard(s), s.first]).toEqual(['stop', 2, 4, 0])
    s = goBack(s)
    expect(tripSetup(s)).toMatchObject({ level: 1, boat: 1, people: 2, isReturn: true, shields: 1, startSpeed: storyStartSpeed(1) })   // the same boat; speed starts again
    s = trip(s, 2)
    expect([still(s), lanternAboard(s)]).toEqual([0, 6])
    expect(() => goBack(s)).toThrow()                                 // nobody left: no going back
  })

  test('STORY-03 the chain grows only when a screen\'s lines name a moon (see STORY-L03 to L05)', () => {
    const s = begin()
    expect(trip(s, 4).named).toEqual([0])                         // the stop itself names nothing until its lines are shown
  })

  test('STORY-04 boats: all three ready from m00n, chosen before each moon\'s first flight; a lost boat is gone; after a loss the picker comes back', () => {
    const at0 = startFlying(newStory())
    expect([at0.phase, readyBoats(at0)]).toEqual(['picker', [1, 2, 3]])
    let s = pick(at0, 3)
    expect(tripSetup(s)).toMatchObject({ boat: 3, seats: 12 })
    s = trip(s, 2, true)                                              // the twelve lost with two aboard
    expect([s.boats, s.dead[0], s.phase]).toEqual([['ready', 'ready', 'lost'], 2, 'stop'])
    s = goBack(s)
    expect([s.phase, readyBoats(s)]).toEqual(['picker', [1, 2]])     // two left: choose again
    s = pick(s, 1)
    expect(tripSetup(s)).toMatchObject({ boat: 1, shields: 3, people: 4, isReturn: true })   // a new boat goes back with full shields
    s = goBack(trip(s, 1))
    expect([s.phase, s.boat]).toEqual(['flying', 1])                  // a flight back keeps the boat
    s = afterLeaving(goOn(trip(s, 3)))
    expect([s.phase, s.moon]).toEqual(['picker', 1])                  // the next moon: choose again
    expect([pick(s, 2).phase, pick(s, 2).boat, pick(s, 2).moon]).toEqual(['flying', 2, 1])
    // one boat left: no picker, it flies
    let one = pick(startFlying(newStory()), 1)
    one = pick(goBack(trip(one, 0, true)), 2)
    one = goBack(trip(one, 0, true))
    expect([one.phase, one.boat]).toEqual(['flying', 3])
  })

  test('STORY-05 losing the last boat ends the story: the empty rail, or the commission with the ore still aboard', () => {
    let s = begin(1)
    s = trip(s, 0, true); s = trip(pick(goBack(s), 2), 0, true)
    expect(s.boats).toEqual(['lost', 'lost', 'ready'])
    s = trip(goBack(s), 1, true)
    expect([s.phase, s.ending]).toEqual(['ending', 'commission'])     // the ore is still aboard before m03n
  })

  test('STORY-06 leaving m03n puts the ore choice whatever the count; going home is the commission, with its chance outside the run', () => {
    let s = begin()
    for (let m = 0; m < 3; m++) { s = trip(s, 3); s = pick(afterLeaving(goOn(s))) }
    s = afterLeaving(goOn(trip(s, 3)))
    expect(s.phase).toBe('oreChoice')                                 // only 12 aboard, the choice is still put
    const yes = chooseOre(s, 'home', always), no = chooseOre(s, 'home', never)
    expect([yes.ending, yes.secondFreighter, no.secondFreighter]).toEqual(['commission', true, false])
    expect(yes.anotherShip.some(n => n > 0)).toBe(true)
    expect(no.anotherShip.every(n => n === 0)).toBe(true)
    const dropped = chooseOre(s, 'drop', never)
    expect([dropped.oreAboard, dropped.boats[2]]).toEqual([false, 'ready'])
  })

  test('STORY-07 leaving m05n: home is past the list, or a full ship with every place taken; staying commits mission 06 at once', () => {
    let s = begin()
    for (let m = 0; m < 5; m++) {
      s = trip(s, still(s)); s = afterLeaving(goOn(s))
      if (s.phase === 'oreChoice') s = chooseOre(s, 'drop', never)
      s = pick(s)
    }
    const full = afterLeaving(goOn(trip(s, still(s))))
    expect([full.phase, lanternAboard(full)]).toEqual(['lanternChoice', ROOM])
    expect(chooseLantern(full, 'home').ending).toBe('fullShip')
    const short = afterLeaving(goOn(trip(s, 3)))
    expect(chooseLantern(short, 'home').ending).toBe('pastTheList')
    const stay = chooseLantern(full, 'stay')
    expect([stay.m06Committed, stay.phase]).toEqual([true, 'picker'])
    const flying = pickBoat(stay, 3)
    expect([flying.moon, flying.phase, tripSetup(flying)]).toEqual([6, 'flying', expect.objectContaining({ level: 7, people: 20, boat: 3, isReturn: false })])
    // mission 06 is one trip: through with a full boat and a full ship, or lost
    expect(endTrip(flying, { picked: 12, destroyed: false, shieldsLeft: 1 }, never).ending).toBe('lightThatStayed')
    expect(endTrip(flying, { picked: 5, destroyed: false, shieldsLeft: 1 }, never).ending).toBe('home')
    expect(endTrip(flying, { picked: 12, destroyed: false, shieldsLeft: 1 }, always).ending).toBe('lightboat')   // the ship lost on automatic, 2 in 10
    expect(endTrip(flying, { picked: 7, destroyed: true, shieldsLeft: 0 }, never).ending).toBe('lostAtTheHeart')
    expect(() => goBack(endTrip(flying, { picked: 5, destroyed: false, shieldsLeft: 1 }, never))).toThrow()
  })

  test('STORY-08 moves are pure: the state given is never changed', () => {
    const s = begin()
    const copy = JSON.stringify(s)
    trip(s, 3); goBack(trip(s, 3)); goBack(trip(s, 2, true))
    expect(JSON.stringify(s)).toBe(copy)
  })
})

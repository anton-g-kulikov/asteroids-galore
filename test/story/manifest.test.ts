import { expect, test } from 'vitest'
import { manifestFor, peopleOn } from '../../src/story/manifest'
import { afterLeaving, chooseLantern, chooseOre, endTrip, goBack, goOn, heard, newStory, pickBoat, readyBoats, startFlying, still, type StoryState } from '../../src/story/story'
// All three boats are ready: each moon's picker takes the boat a story without losses would have flown before the orbit (the four, then the eight from m02n, the twelve from m04n).
const go = (s: StoryState, boat?: 1 | 2 | 3) => {
  if (s.phase !== 'picker') return s
  const want = boat ?? (s.moon < 2 ? 1 : s.moon < 4 ? 2 : 3), ready = readyBoats(s)
  return pickBoat(s, ready.includes(want) ? want : ready[ready.length - 1])
}

const never = () => 0.99, always = () => 0
const trip = (s: StoryState, picked: number, destroyed = false) => endTrip(s, { picked, destroyed, shieldsLeft: 2 }, never)
function toTurn(perMoon: number) {
  let s = go(startFlying(heard(newStory(), { names: [0, 1, 2, 3] })))
  for (let m = 0; m < 3; m++) { s = trip(s, perMoon); s = go(afterLeaving(goOn(s))); s = go(s) }
  return go(afterLeaving(goOn(trip(s, perMoon))))
}

test('STORY-M01 a row per named moon, a mark per person, adding up to the moons\' people; counts on Earth, left behind, dead; the heading', () => {
  const s = go(chooseOre(toTurn(3), 'home', never))
  const v = manifestFor(s, 'CALL', ['commission'], 9, true)
  expect(v.rows.map(r => r.moon)).toEqual([0, 1, 2, 3, 4, 5, 6])                // the commission: m04n to m06n always have rows
  expect(v.rows.flatMap(r => r.marks).length).toBe(peopleOn(s))
  expect(v.counts.map(c => [c.label, c.value])).toEqual([['ON EARTH', 12], ["ON NOBODY'S LIST", 54], ['LEFT BEHIND', 24], ['DEAD', 0]])   // came too late: all 54
  expect(v.cargo).toBe('COMMISSION PAID')
  expect([v.heading, manifestFor(s, '', ['commission'], 9, true).heading]).toEqual(['CAPTAIN CALL', 'CAPTAIN'])
  // the last boat lost with the ore aboard: the story ended before the ore choice, with a pilot; rows only for named moons
  let p = go(startFlying(newStory()))
  for (let b = 0; b < 3; b++) { p = trip(p, 0, true); if (p.phase === 'stop') p = go(goBack(p)) }
  const pv = manifestFor(p, '', ['commission'], 9, true)
  expect([p.ending, pv.heading, manifestFor(p, 'CALL', [], 9, true).heading]).toEqual(['commission', 'PILOT', 'PILOT CALL'])
})

test('STORY-M02 the second freighter: its people as their own count, second in the row', () => {
  const s = go(chooseOre(heard(toTurn(3), { names: [4] }), 'home', always))
  const v = manifestFor(s, 'CALL', ['commission'], 9, true)
  expect(v.counts.map(c => c.label)).toEqual(['ON EARTH', 'BY ANOTHER SHIP', "ON NOBODY'S LIST", 'LEFT BEHIND', 'DEAD'])
  expect(s.anotherShip).toEqual([0, 0, 0, 0, 8, 9, 10])                           // half of m04n to m06n, rounded up; nobody on m00n to m03n
  expect(v.counts.map(c => c.value).slice(1, 4)).toEqual([27, 27, 24])
  const row = (m: number) => v.rows.find(r => r.moon === m)!.marks
  expect([row(4).filter(m => m === 'anotherShip').length, row(4).filter(m => m === 'notReached').length, row(6).length]).toEqual([8, 8, 20])
  expect(row(0).every(m => m !== 'anotherShip' && m !== 'notReached')).toBe(true)
})

test('STORY-M03 Lightboat: the Lantern\'s people missing; Lost at the Heart: on their way, and the boat\'s people dead', () => {
  let s = go(chooseOre(heard(toTurn(still(newStory())), { names: [4, 5, 6] }), 'drop', never))
  s = go(s, 3)
  s = go(afterLeaving(goOn(trip(s, 5)))); s = go(afterLeaving(goOn(trip(s, 5))))
  s = go(chooseLantern(s, 'stay'), 3)
  const lb = manifestFor(endTrip(s, { picked: 4, destroyed: false, shieldsLeft: 1 }, always), 'CALL', ['lightboat'], 9, true)
  expect(lb.counts.map(c => [c.label, c.value])).toEqual([['ON EARTH', 4], ['MISSING', expect.any(Number)], ['LEFT BEHIND', expect.any(Number)], ['DEAD', 0]])
  const heart = manifestFor(endTrip(s, { picked: 4, destroyed: true, shieldsLeft: 0 }, never), 'CALL', ['lostAtTheHeart'], 9, true)
  expect(heart.counts.map(c => c.label)).toEqual(['ON THEIR WAY', 'LEFT BEHIND', 'DEAD'])
  expect(heart.counts[2].value).toBe(4)
  expect(heart.cargo).toBe('NO COMMISSION')
})

test('STORY-M04 the lamps: eight in order, lit for every ending reached; the one just reached waits for its moment; counts appear one by one', () => {
  const t = go(chooseOre(toTurn(3), 'home', never))
  const before = manifestFor(t, 'CALL', ['home', 'commission'], 1, false)
  expect(before.lamps.map(l => l.name)).toEqual(['THE COMMISSION', 'PAST THE LIST', 'A FULL SHIP', 'THE EMPTY RAIL', 'HOME', 'THE LIGHT THAT STAYED', 'LIGHTBOAT', 'LOST AT THE HEART'])
  expect(before.lamps.filter(l => l.lit).map(l => l.name)).toEqual(['HOME'])
  expect(before.lamps[0]).toMatchObject({ lit: false, justReached: true })
  expect(before.countsShown).toBe(1)
  expect(manifestFor(t, 'CALL', ['home', 'commission'], 9, true).lamps[0].lit).toBe(true)
})

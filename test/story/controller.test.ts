import { expect, test } from 'vitest'
import { FEEL, createStoryController, savedMoon, type StoryController } from '../../src/story/controller'
import { LAMPS_KEY, STORY_KEY } from '../../src/story/progress'

function store(init: Record<string, string> = {}) {
  const data = new Map(Object.entries(init))
  return { data, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) }
}
const make = (st = store(), rand = () => 0.99) => ({ c: createStoryController({ store: st, callsign: () => 'COSMIC OTTER 42', rand }), st })
const tick = (c: StoryController, seconds: number) => { for (let i = 0; i < seconds * 60; i++) c.tick(1 / 60) }
/** Reads a screen to its end: every tap shows the rest of the one typing, or the next. */
const readAll = (c: StoryController) => { for (let i = 0; i < 40 && !(c.screenView()?.tapToContinue || c.screenView()?.choice); i++) c.tap() }
const holdFor = (c: StoryController, side: 'left' | 'right' | 1 | 2 | 3, seconds = FEEL.holdSeconds + 0.05) => { c.hold(side); tick(c, seconds) }
/** Past the briefing and the picker, into the first flight in the four. */
const toFirstFlight = (c: StoryController) => { readAll(c); c.tap(); holdFor(c, 1) }

test('STORY-C01 the briefing types out after its call, a tap finishes a transmission and the next brings the next; then the first flight', () => {
  const { c } = make()
  const v0 = c.screenView()!
  expect([c.mode, v0.transmissions.length, v0.transmissions[0].typed, v0.chain.named]).toEqual(['screen', 1, 0, [0]])
  expect(c.takeEvents()).toEqual([{ kind: 'call', voice: 'control' }])
  tick(c, FEEL.callDelay + 0.5)
  const typed = c.screenView()!.transmissions[0].typed
  expect(typed).toBeGreaterThan(20); expect(typed).toBeLessThan(40)              // about 60 a second after the 0.3 s call
  c.tap()
  expect(c.screenView()!.transmissions[0].typed).toBe(c.screenView()!.transmissions[0].lines.join('').length)
  c.tap(); c.tap(); c.tap()                                                                 // Control on the laps, then the ship's three boats
  expect(c.screenView()!.transmissions.map(t => t.sender)).toEqual(['CONTROL TO LANTERN', 'CONTROL', 'LANTERN'])
  c.tap()
  expect(c.screenView()!.tapToContinue).toBe(true)
  c.tap()
  expect([c.mode, c.pickerView()!.boats.map(b => b.ship)]).toEqual(['picker', [1, 2, 3]])   // all three ready: the boat for m00n first
  holdFor(c, 1)
  expect(c.mode).toBe('flight')
  expect(c.takeTrip()).toMatchObject({ level: 1, people: 6, boat: 1, isReturn: false })
})

test('STORY-C02 after a trip: the story\'s lines, then the stop with the choice; holding a side for the hold time decides, letting go early does not', () => {
  const { c } = make()
  toFirstFlight(c)
  c.tripEnded({ picked: 4, destroyed: false, shieldsLeft: 2 })
  expect(c.screenView()!.transmissions[0].sender).toBe('SURVEY HAND, m00n')
  readAll(c); c.tap()
  const stop = c.screenView()!
  expect(stop.people).toEqual({ aboard: 4, still: 2, lost: 0 })
  expect(stop.counts).toMatchObject({ lantern: 4, room: 36, still: 2 })
  expect(stop.choice).toMatchObject({ left: ['GO BACK', 'FOR 2'], right: ['GO ON', 'TO m01n'], held: null })
  c.takeEvents()
  c.hold('left'); tick(c, 0.6)
  expect(c.screenView()!.choice).toMatchObject({ held: 'left', progress: expect.closeTo(0.5, 1) })
  c.release()
  expect(c.screenView()!.choice!.held).toBeNull()
  expect(c.takeEvents().map(e => e.kind)).toEqual(['holdStart', 'holdCancel'])
  holdFor(c, 'left')
  expect(c.mode).toBe('flight')
  expect(c.takeTrip()).toMatchObject({ isReturn: true, people: 2, shields: 2 })
  expect(c.takeEvents()).toContainEqual({ kind: 'chosen', heavy: false })
})

test('STORY-C03 the story is kept on the device between screens and resumed where it was; the start screen shows its moon', () => {
  const st = store()
  const { c } = make(st)
  toFirstFlight(c)
  c.tripEnded({ picked: 4, destroyed: false, shieldsLeft: 2 })
  readAll(c); c.tap()
  expect(savedMoon(st)).toBe('m00n')
  const again = make(st).c
  expect([again.mode, again.screenView()!.choice]).toEqual(['screen', expect.objectContaining({ left: ['GO BACK', 'FOR 2'] })])
  expect(savedMoon(store())).toBeNull()
})

test('STORY-C04 closing the app in mission 06 is no second try: the story resumes at its end, Lost at the Heart', () => {
  const st = store()
  const { c } = make(st)
  const s = { ...c.state, phase: 'flying', moon: 6, m06Committed: true, boat: 3, boats: ['ready', 'ready', 'ready'], named: [0, 1, 2, 3, 4, 5, 6], oreAboard: false }
  st.setItem(STORY_KEY, JSON.stringify(s))
  const again = make(st).c
  expect([again.mode, again.state.ending]).toEqual(['manifest', 'lostAtTheHeart'])
  expect(st.data.has(STORY_KEY)).toBe(false)                          // the story is over
})

test('STORY-C05 the manifest: counts appear one by one, then the lamp; the lamps are kept between stories and nothing else is', () => {
  const st = store()
  const { c } = make(st)
  const s = { ...c.state, phase: 'lanternChoice', moon: 5, oreAboard: false, saved: [6, 7, 11, 12, 16, 18, 0], named: [0, 1, 2, 3, 4, 5, 6], first: 0 }
  st.setItem(STORY_KEY, JSON.stringify(s))
  const d = make(st).c
  readAll(d)
  holdFor(d, 'left')
  expect(d.screenView()!.title).toBe('A FULL SHIP')
  readAll(d); d.tap()
  expect(d.mode).toBe('manifest')
  d.takeEvents()
  expect(d.manifestView()!.countsShown).toBe(0)
  tick(d, FEEL.countGap + 0.05)
  expect(d.manifestView()!.countsShown).toBe(1)
  tick(d, FEEL.countGap * 3)
  const v = d.manifestView()!
  expect(v.lamps.find(l => l.justReached)!.lit).toBe(true)
  expect(d.takeEvents().map(e => e.kind)).toEqual(['count', 'count', 'lamp'])   // on Earth (70), the fourth count skipped (none), then the lamp; zeros are silent
  expect(JSON.parse(st.data.get(LAMPS_KEY)!)).toEqual(['fullShip'])
  expect(st.data.has(STORY_KEY)).toBe(false)
  d.tap()
  expect(d.mode).toBe('done')
})

test('STORY-C06 under the boat picker only the last transmission of the screen before stands, so the boat cards never cover the lines', () => {
  const st = store()
  const { c } = make(st)
  const s = { ...c.state, phase: 'lanternChoice', moon: 5, oreAboard: false, saved: [6, 7, 11, 12, 16, 10, 0], boats: ['ready', 'ready', 'ready'], named: [0, 1, 2, 3, 4, 5, 6], first: 0 }
  st.setItem(STORY_KEY, JSON.stringify(s))
  const d = make(st).c
  readAll(d); holdFor(d, 'right')                                     // stay with the last boat
  readAll(d)
  expect(d.screenView()!.transmissions.length).toBe(3)                // Control, the First, the ship
  d.tap()
  expect(d.mode).toBe('picker')
  const under = d.screenView()!
  expect(under.transmissions.map(t => t.lines[0])).toEqual(['Choose the boat that stays.'])
  expect([under.choice, under.tapToContinue]).toEqual([null, false])
  expect(d.pickerView()!.captainAboard).toBe(true)
  // going back after a lost boat: the picker over the stop screen shows no Lantern, people or counts
  const { c: e } = make()
  readAll(e); e.tap(); e.tap(); e.tap(); readAll(e); e.tap(); holdFor(e, 3)
  e.tripEnded({ picked: 0, destroyed: true, shieldsLeft: 0 })
  readAll(e); e.tap()
  expect(e.screenView()!.lantern).not.toBeNull()                      // the stop itself shows the Lantern
  holdFor(e, 'left')
  expect(e.mode).toBe('picker')
  expect([e.screenView()!.lantern, e.screenView()!.people, e.screenView()!.counts]).toEqual([null, null, null])
})

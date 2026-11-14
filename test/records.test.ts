import { expect, test } from 'vitest'
import { BEST_END_KEY, BEST_KEY, createRecords, type RecordStore } from '../src/game/records'
import type { RunEnd } from '../src/game/types'

function memory(initial: Record<string, string> = {}): RecordStore & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return { data, getItem: k => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
}

const broken: RecordStore = {
  getItem() { throw new Error('blocked') },
  setItem() { throw new Error('blocked') },
}

const home: RunEnd = { outcome: 'won', level: 7, finalDistance: 5400 }
const lost: RunEnd = { outcome: 'over', level: 3, finalDistance: 0 }
const none: RunEnd = { outcome: 'over', level: 1, finalDistance: 0 }

test('REC-01 the best loads from storage, or 0', () => {
  expect(createRecords(memory({ [BEST_KEY]: '412' })).best).toBe(412)
  expect(createRecords(memory()).best).toBe(0)
  expect(createRecords(memory({ [BEST_KEY]: 'nonsense' })).best).toBe(0)
  expect(createRecords(broken).best).toBe(0)
  expect(createRecords(null).best).toBe(0)
})

test('REC-02 a higher score is saved and reported as new, together with how that run ended', () => {
  const store = memory({ [BEST_KEY]: '100', [BEST_END_KEY]: JSON.stringify(lost) })
  const r = createRecords(store)
  expect(r.bestEnd).toEqual(lost)
  expect(r.saveBest(99, home)).toBe(false)
  expect(r.saveBest(100, home)).toBe(false)
  expect(r.bestEnd).toEqual(lost)        // a run that did not beat the best does not replace its ending
  expect(r.saveBest(250, home)).toBe(true)
  expect(r.best).toBe(250)
  expect(store.data.get(BEST_KEY)).toBe('250')
  expect(createRecords(store).bestEnd).toEqual(home)
  // a missing or damaged ending reads as a plain lost run
  expect(createRecords(memory({ [BEST_KEY]: '5' })).bestEnd).toEqual(none)
  expect(createRecords(memory({ [BEST_KEY]: '5', [BEST_END_KEY]: '{"outcome":"draw"}' })).bestEnd).toEqual(none)
})

test('REC-03 bests saved under earlier rules are not read as a score', () => {
  const r = createRecords(memory({ 'asteroids-galore-best': '3682', 'asteroids-galore-best-crew': '20', 'asteroids-galore-best-score': '22640' }))
  expect(r.best).toBe(0)
})

test('REC-04 a storage that throws on write does not break the run', () => {
  const r = createRecords(broken)
  expect(r.saveBest(10, lost)).toBe(true)
  expect(r.best).toBe(10)
})

test('REC-05 a best from the cloud raises the local best', () => {
  const store = memory({ [BEST_KEY]: '100' })
  const r = createRecords(store)
  r.absorb(40, home)
  expect([r.best, r.bestEnd]).toEqual([100, none])
  r.absorb(300, home)
  expect([r.best, r.bestEnd]).toEqual([300, home])
  expect(store.data.get(BEST_KEY)).toBe('300')
  expect(r.saveBest(300, lost)).toBe(false)   // matching the absorbed best is not a new best
})

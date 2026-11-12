import { expect, test } from 'vitest'
import { BEST_CREW_KEY, BEST_KEY, createRecords, type RecordStore } from '../src/game/records'

function memory(initial: Record<string, string> = {}): RecordStore & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return { data, getItem: k => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
}

const broken: RecordStore = {
  getItem() { throw new Error('blocked') },
  setItem() { throw new Error('blocked') },
}

test('REC-01 bests load from storage, or 0', () => {
  const r = createRecords(memory({ [BEST_KEY]: '412', [BEST_CREW_KEY]: '7' }))
  expect([r.best, r.bestCrew]).toEqual([412, 7])
  expect(createRecords(memory()).best).toBe(0)
  expect(createRecords(memory({ [BEST_KEY]: 'nonsense' })).best).toBe(0)
  expect(createRecords(broken).best).toBe(0)
  expect(createRecords(null).bestCrew).toBe(0)
})

test('REC-02 a longer distance is saved and reported as new', () => {
  const store = memory({ [BEST_KEY]: '100' })
  const r = createRecords(store)
  expect(r.saveBest(99.9)).toBe(false)
  expect(r.saveBest(100.9)).toBe(false)   // the distance is floored
  expect(r.saveBest(250.7)).toBe(true)
  expect(r.best).toBe(250)
  expect(store.data.get(BEST_KEY)).toBe('250')
})

test('REC-03 the crew best is separate', () => {
  const store = memory({ [BEST_KEY]: '100' })
  const r = createRecords(store)
  expect(r.saveBestCrew(5)).toBe(true)
  expect(r.saveBestCrew(5)).toBe(false)
  expect([r.best, r.bestCrew]).toEqual([100, 5])
  expect(store.data.get(BEST_CREW_KEY)).toBe('5')
})

test('REC-04 a storage that throws on write does not break the run', () => {
  const r = createRecords(broken)
  expect(r.saveBest(10)).toBe(true)
  expect(r.best).toBe(10)
})

test('REC-05 bests from the cloud raise the local bests', () => {
  const store = memory({ [BEST_KEY]: '100', [BEST_CREW_KEY]: '9' })
  const r = createRecords(store)
  r.absorb({ best: 300, bestCrew: 4 })
  expect([r.best, r.bestCrew]).toEqual([300, 9])
  expect(store.data.get(BEST_KEY)).toBe('300')
  expect(store.data.get(BEST_CREW_KEY)).toBe('9')
  expect(r.saveBest(300)).toBe(false)   // matching the absorbed best is not a new best
})

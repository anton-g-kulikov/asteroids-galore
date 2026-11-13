import { expect, test } from 'vitest'
import { BEST_KEY, createRecords, type RecordStore } from '../src/game/records'

function memory(initial: Record<string, string> = {}): RecordStore & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return { data, getItem: k => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
}

const broken: RecordStore = {
  getItem() { throw new Error('blocked') },
  setItem() { throw new Error('blocked') },
}

test('REC-01 the best loads from storage, or 0', () => {
  expect(createRecords(memory({ [BEST_KEY]: '412' })).best).toBe(412)
  expect(createRecords(memory()).best).toBe(0)
  expect(createRecords(memory({ [BEST_KEY]: 'nonsense' })).best).toBe(0)
  expect(createRecords(broken).best).toBe(0)
  expect(createRecords(null).best).toBe(0)
})

test('REC-02 a higher score is saved and reported as new', () => {
  const store = memory({ [BEST_KEY]: '100' })
  const r = createRecords(store)
  expect(r.saveBest(99)).toBe(false)
  expect(r.saveBest(100)).toBe(false)
  expect(r.saveBest(250)).toBe(true)
  expect(r.best).toBe(250)
  expect(store.data.get(BEST_KEY)).toBe('250')
})

test('REC-03 the old distance best is not read as a score', () => {
  const r = createRecords(memory({ 'asteroids-galore-best': '3682', 'asteroids-galore-best-crew': '20' }))
  expect(r.best).toBe(0)
})

test('REC-04 a storage that throws on write does not break the run', () => {
  const r = createRecords(broken)
  expect(r.saveBest(10)).toBe(true)
  expect(r.best).toBe(10)
})

test('REC-05 a best from the cloud raises the local best', () => {
  const store = memory({ [BEST_KEY]: '100' })
  const r = createRecords(store)
  r.absorb(40)
  expect(r.best).toBe(100)
  r.absorb(300)
  expect(r.best).toBe(300)
  expect(store.data.get(BEST_KEY)).toBe('300')
  expect(r.saveBest(300)).toBe(false)   // matching the absorbed best is not a new best
})

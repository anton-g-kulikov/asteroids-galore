import { expect, test, vi } from 'vitest'
import { callsignFor } from '../../src/cloud/callsign'
import { createResultsSync, type CloudBackend } from '../../src/cloud/resultsSync'
import { BEST_KEY, createRecords } from '../../src/game/records'
import type { RunResult } from '../../src/game/runSummary'
import type { BoardRow } from '../../src/game/types'

const ME = callsignFor('uid-1')
const SHARED = { callsign: 'COSMIC OTTER 42', outcome: 'won' as const, score: 29400, saved: 14, distance: 2100 }
const run: RunResult = { outcome: 'over', score: 150, distance: 150, level: 2, saved: 1, lost: 0, missed: 0, durationSeconds: 30 }

function setup(localBest = 0, remote: number | null = null) {
  const data = new Map<string, string>([[BEST_KEY, String(localBest)]])
  const records = createRecords({ getItem: k => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) })
  const backend = {
    signIn: vi.fn(async () => 'uid-1'),
    loadBest: vi.fn(async () => remote),
    saveBest: vi.fn<CloudBackend['saveBest']>(async () => {}),
    saveRun: vi.fn<CloudBackend['saveRun']>(async () => 'run-1'),
    loadRun: vi.fn<CloudBackend['loadRun']>(async () => SHARED),
    loadBoard: vi.fn(async () => [{ uid: 'other', callsign: 'OTHER PILOT 01', value: 120 }]),
    countAbove: vi.fn(async () => 0),
  } satisfies CloudBackend
  const log = vi.fn()
  const seen: { board: BoardRow[] } = { board: [] }
  const onBoard = vi.fn((rows: BoardRow[]) => { seen.board = rows })
  return { records, backend, log, seen, onBoard, start: () => createResultsSync(backend, records, { log, onBoard }) }
}

test('SYNC-01 on start, a higher cloud best is absorbed', async () => {
  const t = setup(100, 400)
  await t.start().ready
  expect(t.backend.signIn).toHaveBeenCalledOnce()
  expect(t.backend.loadBest).toHaveBeenCalledWith('uid-1')
  expect(t.records.best).toBe(400)
  expect(t.backend.saveBest).not.toHaveBeenCalled()
})

test('SYNC-02 on start, a higher local best is uploaded', async () => {
  const t = setup(500, 400)
  await t.start().ready
  expect(t.backend.saveBest).toHaveBeenCalledWith('uid-1', 500, ME)

  const fresh = setup(80, null)   // no cloud document yet
  await fresh.start().ready
  expect(fresh.backend.saveBest).toHaveBeenCalledWith('uid-1', 80, ME)

  const empty = setup(0, null)    // nothing to say yet
  await empty.start().ready
  expect(empty.backend.saveBest).not.toHaveBeenCalled()
})

test('SYNC-03 a finished run is saved under the signed-in user', async () => {
  const t = setup()
  const sync = t.start()
  await sync.submit(run)
  expect(t.backend.saveRun).toHaveBeenCalledWith('uid-1', run, ME)
})

test('SYNC-04 the best is uploaded after a run only when it improved', async () => {
  const t = setup(100, 100)
  const sync = t.start()
  await sync.submit(run)
  expect(t.backend.saveBest).not.toHaveBeenCalled()

  t.records.saveBest(150)
  await sync.submit(run)
  expect(t.backend.saveBest).toHaveBeenCalledExactlyOnceWith('uid-1', 150, ME)
  await sync.submit(run)
  expect(t.backend.saveBest).toHaveBeenCalledOnce()
})

test('SYNC-05 a failed sign-in is retried at the next run', async () => {
  const t = setup()
  t.backend.signIn.mockRejectedValueOnce(new Error('offline'))
  const sync = t.start()
  await sync.ready
  expect(t.log).toHaveBeenCalled()
  await sync.submit(run)
  expect(t.backend.signIn).toHaveBeenCalledTimes(2)
  expect(t.backend.saveRun).toHaveBeenCalledWith('uid-1', run, ME)
})

test('SYNC-06 a failed save is logged and does not throw', async () => {
  const t = setup()
  t.backend.saveRun.mockRejectedValueOnce(new Error('denied'))
  await expect(t.start().submit(run)).resolves.toBeNull()
  expect(t.log).toHaveBeenCalled()
})

test('SYNC-07 the best is saved together with the callsign', async () => {
  const t = setup(80)
  await t.start().ready
  expect(t.backend.saveBest.mock.calls[0][2]).toBe(ME)
  expect(ME).toMatch(/^[A-Z]+ [A-Z]+ \d\d$/)
})

test('SYNC-08 the board arrives after start, and again after a run', async () => {
  const t = setup(100, 100)
  const sync = t.start()
  await sync.ready
  expect(t.backend.loadBoard).toHaveBeenCalledWith(10)
  expect(t.seen.board.map(r => [r.rank, r.callsign, r.value, r.me])).toEqual([
    [1, 'OTHER PILOT 01', 120, false],
    [2, ME, 100, true],
  ])

  t.records.saveBest(150)
  await sync.submit(run)   // resolves when the run is saved; the board follows
  await vi.waitFor(() => expect(t.onBoard).toHaveBeenCalledTimes(2))
  expect(t.seen.board[0]).toEqual({ rank: 1, callsign: ME, value: 150, me: true })
})

test('SYNC-09 a board that fails to load is logged; the run is still saved', async () => {
  const t = setup()
  t.backend.loadBoard.mockRejectedValue(new Error('offline'))
  const sync = t.start()
  await expect(sync.submit(run)).resolves.toBe('run-1')
  expect(t.backend.saveRun).toHaveBeenCalled()
  expect(t.log).toHaveBeenCalled()
  expect(t.onBoard).not.toHaveBeenCalled()
})

test('SYNC-10 a run is saved with the callsign, and submit resolves with its ID', async () => {
  const t = setup()
  await expect(t.start().submit(run)).resolves.toBe('run-1')
  expect(t.backend.saveRun).toHaveBeenCalledWith('uid-1', run, ME)
})

test('SYNC-11 when the save fails submit resolves with null', async () => {
  const t = setup()
  t.backend.saveRun.mockRejectedValueOnce(new Error('denied'))
  await expect(t.start().submit(run)).resolves.toBeNull()
})

test('SYNC-12 a shared run is loaded by ID; missing or failing gives null', async () => {
  const t = setup()
  const sync = t.start()
  await expect(sync.loadShared('abc')).resolves.toEqual(SHARED)
  expect(t.backend.loadRun).toHaveBeenCalledWith('abc')
  t.backend.loadRun.mockResolvedValueOnce(null)
  await expect(sync.loadShared('gone')).resolves.toBeNull()
  t.backend.loadRun.mockRejectedValueOnce(new Error('offline'))
  await expect(sync.loadShared('abc')).resolves.toBeNull()
})

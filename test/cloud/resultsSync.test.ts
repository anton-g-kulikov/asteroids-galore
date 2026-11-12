import { expect, test, vi } from 'vitest'
import { callsignFor } from '../../src/cloud/callsign'
import { createResultsSync, type CloudBackend } from '../../src/cloud/resultsSync'
import { BEST_CREW_KEY, BEST_KEY, createRecords } from '../../src/game/records'
import type { RunResult } from '../../src/game/runSummary'
import type { BoardRow } from '../../src/game/types'

const ME = callsignFor('uid-1')
const SHARED = { callsign: 'COSMIC OTTER 42', outcome: 'won' as const, distance: 2100, level: 4, rescued: 14 }
const run: RunResult = { outcome: 'over', distance: 150, level: 2, rescued: 1, missed: 0, durationSeconds: 30 }

function setup(local: { best?: number; bestCrew?: number } = {}, remote: { best: number; bestCrew: number } | null = null) {
  const data = new Map<string, string>([[BEST_KEY, String(local.best ?? 0)], [BEST_CREW_KEY, String(local.bestCrew ?? 0)]])
  const records = createRecords({ getItem: k => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) })
  const backend = {
    signIn: vi.fn(async () => 'uid-1'),
    loadBests: vi.fn(async () => remote),
    saveBests: vi.fn<CloudBackend['saveBests']>(async () => {}),
    saveRun: vi.fn<CloudBackend['saveRun']>(async () => 'run-1'),
    loadRun: vi.fn<CloudBackend['loadRun']>(async () => SHARED),
    loadBoard: vi.fn(async () => [{ uid: 'other', callsign: 'OTHER PILOT 01', value: 120 }]),
    countAbove: vi.fn(async () => 0),
  } satisfies CloudBackend
  const log = vi.fn()
  const boards: Record<string, BoardRow[]> = {}
  const onBoard = vi.fn((kind: string, rows: BoardRow[]) => { boards[kind] = rows })
  return { records, backend, log, boards, onBoard, start: () => createResultsSync(backend, records, { log, onBoard }) }
}

test('SYNC-01 on start, higher cloud bests are absorbed', async () => {
  const t = setup({ best: 100, bestCrew: 2 }, { best: 400, bestCrew: 2 })
  await t.start().ready
  expect(t.backend.signIn).toHaveBeenCalledOnce()
  expect(t.backend.loadBests).toHaveBeenCalledWith('uid-1')
  expect(t.records.best).toBe(400)
  expect(t.backend.saveBests).not.toHaveBeenCalled()
})

test('SYNC-02 on start, higher local bests are uploaded', async () => {
  const t = setup({ best: 500, bestCrew: 6 }, { best: 400, bestCrew: 9 })
  await t.start().ready
  expect(t.backend.saveBests).toHaveBeenCalledWith('uid-1', { best: 500, bestCrew: 9 }, ME)

  const fresh = setup({ best: 80 }, null)   // no cloud document yet
  await fresh.start().ready
  expect(fresh.backend.saveBests).toHaveBeenCalledWith('uid-1', { best: 80, bestCrew: 0 }, ME)

  const empty = setup({}, null)             // nothing to say yet
  await empty.start().ready
  expect(empty.backend.saveBests).not.toHaveBeenCalled()
})

test('SYNC-03 a finished run is saved under the signed-in user', async () => {
  const t = setup()
  const sync = t.start()
  await sync.submit(run)
  expect(t.backend.saveRun).toHaveBeenCalledWith('uid-1', run, ME)
})

test('SYNC-04 bests are uploaded after a run only when they improved', async () => {
  const t = setup({ best: 100 }, { best: 100, bestCrew: 0 })
  const sync = t.start()
  await sync.submit(run)
  expect(t.backend.saveBests).not.toHaveBeenCalled()

  t.records.saveBest(150)
  await sync.submit(run)
  expect(t.backend.saveBests).toHaveBeenCalledExactlyOnceWith('uid-1', { best: 150, bestCrew: 0 }, ME)
  await sync.submit(run)
  expect(t.backend.saveBests).toHaveBeenCalledOnce()
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

test('SYNC-07 bests are saved together with the callsign', async () => {
  const t = setup({ best: 80 })
  await t.start().ready
  expect(t.backend.saveBests.mock.calls[0][2]).toBe(ME)
  expect(ME).toMatch(/^[A-Z]+ [A-Z]+ \d\d$/)
})

test('SYNC-08 both boards arrive after start, and again after a run', async () => {
  const t = setup({ best: 100, bestCrew: 0 }, { best: 100, bestCrew: 0 })
  const sync = t.start()
  await sync.ready
  expect(t.backend.loadBoard).toHaveBeenCalledWith('distance', 5)
  expect(t.backend.loadBoard).toHaveBeenCalledWith('crew', 5)
  expect(t.boards.distance.map(r => [r.rank, r.callsign, r.value, r.me])).toEqual([
    [1, 'OTHER PILOT 01', 120, false],
    [2, ME, 100, true],
  ])
  expect(t.boards.crew.some(r => r.me)).toBe(false)   // no crew best yet

  t.records.saveBest(150)
  await sync.submit(run)   // resolves when the run is saved; the boards follow
  await vi.waitFor(() => expect(t.onBoard).toHaveBeenCalledTimes(4))
  expect(t.boards.distance[0]).toEqual({ rank: 1, callsign: ME, value: 150, me: true })
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

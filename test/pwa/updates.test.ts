import { expect, test, vi } from 'vitest'
import { createUpdater, updateAllowed } from '../../src/pwa/updates'

test('UPD-01 only the start screen allows an update', () => {
  expect(updateAllowed('menu')).toBe(true)
  for (const state of ['play', 'between', 'over', 'won'] as const) expect(updateAllowed(state)).toBe(false)
})

test('UPD-02 an update found during a run waits for the start screen', () => {
  const apply = vi.fn()
  const updater = createUpdater(apply)
  updater.tick('play')
  updater.found()
  for (const state of ['play', 'between', 'play', 'over', 'won'] as const) updater.tick(state)
  expect(apply).not.toHaveBeenCalled()
  updater.tick('menu')
  updater.tick('menu')
  expect(apply).toHaveBeenCalledOnce()
})

test('UPD-03 with no update waiting nothing is applied', () => {
  const apply = vi.fn()
  const updater = createUpdater(apply)
  for (const state of ['menu', 'play', 'between', 'over', 'won', 'menu'] as const) updater.tick(state)
  expect(apply).not.toHaveBeenCalled()
})

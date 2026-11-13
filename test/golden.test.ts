import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, test, vi } from 'vitest'
import { column, runScenario, SAMPLE_KEYS, type Trace } from './helpers/harness'
import { scenarios } from './helpers/scenarios'

// See test-documentation.md. Re-record with UPDATE_GOLDEN=1 when the game changes on purpose.
const FIXTURE = new URL('./fixtures/golden-traces.json', import.meta.url)
const update = !!process.env.UPDATE_GOLDEN
const golden: { keys: string[]; traces: Record<string, Trace> } = JSON.parse(readFileSync(FIXTURE, 'utf8'))

const play = (name: string) => {
  const scn = scenarios.find(s => s.name === name)!
  return runScenario(scn, async () => {
    vi.resetModules()
    await import('../src/main')
  })
}

const traces = new Map<string, Promise<Trace>>()
const traceOf = (name: string) => {
  if (!traces.has(name)) traces.set(name, play(name))
  return traces.get(name)!
}

describe('golden traces', () => {
  test.each(scenarios.map(s => s.name))('%s matches the recorded run', async name => {
    const trace = await traceOf(name)
    if (update) { golden.traces[name] = trace; return }
    const want = golden.traces[name]
    expect(golden.keys).toEqual([...SAMPLE_KEYS])
    // Compare sample by sample so a failure names the first frame that differs.
    for (let i = 0; i < want.samples.length; i++) {
      expect(Object.fromEntries(SAMPLE_KEYS.map((k, j) => [k, trace.samples[i]?.[j]])))
        .toEqual(Object.fromEntries(SAMPLE_KEYS.map((k, j) => [k, want.samples[i][j]])))
    }
    expect(trace.samples.length).toBe(want.samples.length)
    expect(trace.storage).toEqual(want.storage)
  }, 60000)

  test('GOLD-05 each scenario reaches what it is meant to cover', async () => {
    const [mission, crash, pairs, touch] = await Promise.all(scenarios.map(s => traceOf(s.name)))
    const max = (t: Trace, k: Parameters<typeof column>[1]) => Math.max(...(column(t, k) as number[]))

    expect(column(mission, 'state')).toContain('won')
    expect(max(mission, 'level')).toBe(4)
    expect(max(mission, 'saved')).toBeGreaterThan(0)
    expect(max(mission, 'score')).toBeGreaterThan(0)
    expect(Number(mission.storage['asteroids-galore-best-score'])).toBe(max(mission, 'score'))

    expect(column(crash, 'state')).toContain('over')
    expect(column(crash, 'state').lastIndexOf('play')).toBeGreaterThan(column(crash, 'state').indexOf('over'))
    expect(crash.storage['asteroids-galore-best-score']).toBe('120')   // nobody saved: the best stands

    expect(max(pairs, 'slowmo')).toBeGreaterThan(0)
    expect(max(pairs, 'onboard')).toBe(4)
    expect(max(pairs, 'missed')).toBeGreaterThan(0)

    expect(column(touch, 'state')).toContain('play')
    expect(new Set(column(touch, 'shipR')).size).toBeGreaterThan(1)   // the resizes took effect
  }, 60000)

  test.runIf(update)('write the fixture', () => {
    writeFileSync(FIXTURE, JSON.stringify({ keys: SAMPLE_KEYS, traces: golden.traces }))
  })
})

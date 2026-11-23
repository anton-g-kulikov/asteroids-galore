import { expect, test } from 'vitest'
import { createRunSound, type PlaybackStats } from '../../src/audio/runSound'

function source(stats: PlaybackStats | null = { underrunEvents: 0, underrunDuration: 0 }) {
  const s = { stats, restarts: 0 }
  return { s, src: { stats: () => s.stats && { ...s.stats }, restarts: () => s.restarts } }
}
const seconds = (r: ReturnType<typeof createRunSound>, n: number) => { for (let i = 0; i < n * 60; i++) r.frame(1 / 60) }

test('SND-RUN-01 a run keeps the gaps in its sound counted from its own start, when the first came, and the stops a tap undid', () => {
  const { s, src } = source({ underrunEvents: 7, underrunDuration: 0.2 })   // gaps from before the run are not its own
  const r = createRunSound(src)
  expect(r.result()).toBeNull()                                              // no run yet
  r.start()
  seconds(r, 30)
  s.stats = { underrunEvents: 9, underrunDuration: 0.25 }
  seconds(r, 30)
  s.stats = { underrunEvents: 19, underrunDuration: 0.5 }; s.restarts = 1
  expect(r.result()).toEqual({ audioUnderruns: 12, audioUnderrunMs: 300, audioFirstUnderrun: 31, audioStops: 1 })
  r.start()                                                                   // a new run starts afresh
  seconds(r, 5)
  expect(r.result()).toEqual({ audioUnderruns: 0, audioUnderrunMs: 0, audioStops: 0 })   // no gap: no first
})

test('SND-RUN-02 a browser that counts no gaps saves only the stops; a sound started mid-run counts from when it starts', () => {
  const none = source(null)
  const r = createRunSound(none.src)
  r.start(); seconds(r, 10); none.s.restarts = 2
  expect(r.result()).toEqual({ audioStops: 2 })
  const late = source(null)
  const q = createRunSound(late.src)
  q.start(); seconds(q, 3)
  late.s.stats = { underrunEvents: 4, underrunDuration: 0.1 }               // the first tap starts the audio, with totals of its own
  seconds(q, 3)
  late.s.stats = { underrunEvents: 6, underrunDuration: 0.15 }
  seconds(q, 2)
  expect(q.result()).toEqual({ audioUnderruns: 2, audioUnderrunMs: 50, audioFirstUnderrun: 7, audioStops: 0 })
})

test('SND-RUN-03 the browser\'s totals are read through its getters, and figures that are not numbers are left out', () => {
  class Stats { get underrunEvents() { return n } get underrunDuration() { return n / 100 } }   // as Chrome's: getters, nothing of its own
  let n = 2
  const r = createRunSound({ stats: () => new Stats(), restarts: () => 0 })
  r.start(); for (let i = 0; i < 120; i++) r.frame(1 / 60)
  n = 5
  expect(r.result()).toEqual({ audioUnderruns: 3, audioUnderrunMs: 30, audioFirstUnderrun: 2, audioStops: 0 })
  const odd = createRunSound({ stats: () => ({ underrunEvents: NaN, underrunDuration: 0 }), restarts: () => 0 })
  odd.start()
  expect(odd.result()).toEqual({ audioStops: 0 })
})

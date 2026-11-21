import { expect, test } from 'vitest'
import { ARP, BASS, CHORDS, LAYERS, MUSIC, bpmFor, controlFor, createSequencer, slowDepth, wanted, type Mode } from '../../src/music/score'
import { SLOW_TIME } from '../../src/game/tuning'

const plan = (mode: Mode, speed: number, steps: number, rand = () => 0.3, depth = 0) => {
  const seq = createSequencer(rand)
  return Array.from({ length: steps }, (_, s) => seq.step(s, { mode, speed, depth }))
}

test('MUS-01 the sketch\'s numbers, in one table', () => {
  expect(MUSIC.tempo).toEqual({ base: 96, perSpeed: 14, max: 140, results: 90 })
  expect(MUSIC.from).toEqual({ pad: 0, bass: 1.3, drums: 1.7, arp: 2.0, lead: 2.2 })
  expect([MUSIC.hats16From, MUSIC.slack]).toEqual([2.8, 0.05])
  expect(MUSIC.slow).toEqual({ tempo: 0.6, semis: -5, cutoff: 700 })
  expect([MUSIC.level, MUSIC.limiter]).toEqual([-12, -1])
  expect(LAYERS.map(l => l.id)).toEqual(['pad', 'bass', 'drums', 'arp', 'lead'])
  expect(CHORDS.map(c => c.name)).toEqual(['Am', 'F', 'C', 'G'])
  expect(BASS).toEqual([0, 0, 12, 0, 0, 12, 0, 12])
  expect(ARP).toEqual([0, 1, 2, 4, 3, 2, 1, 2])
})

test('MUS-02 tempo, pad filter and slow motion', () => {
  expect([1, 2, 3, 4, 9].map(bpmFor)).toEqual([96, 110, 124, 138, 140])
  const flying = controlFor('flying', 2, 0)
  expect([flying.bpm, flying.padCutoff, flying.masterCutoff]).toEqual([110, 1500, 18000])
  expect(flying.arpDelay).toBeCloseTo(60 / 110 * 0.75)
  expect(controlFor('flying', 9, 0).padCutoff).toBe(4200)
  const slow = controlFor('flying', 2, 1)
  expect(slow.bpm).toBeCloseTo(110 * 0.6)
  expect(slow.masterCutoff).toBeCloseTo(700)
  const results = controlFor('results', 3, 0)
  expect([results.bpm, results.padCutoff]).toEqual([90, 520])
  // the depth follows the game's time scale: none, full at its depth, none after
  expect(slowDepth(0)).toBe(0)
  expect(slowDepth(SLOW_TIME - 0.5)).toBeCloseTo(1)
  // new notes are up to 5 semitones lower
  const deep = plan('flying', 1, 1, () => 0.3, 1)[0].notes.find(n => n.voice === 'pad')!
  expect(deep.semis).toBe(-5)
  expect(plan('flying', 1, 1, () => 0.3, 0.5)[0].notes.find(n => n.voice === 'pad')!.semis).toBe(-2)   // Math.round(-2.5), as in the sketch
})

test('MUS-03 layers come in by speed, with slack, only at a chord change', () => {
  expect(wanted('pad', 'flying', 1, false)).toBe(true)
  expect(wanted('bass', 'flying', 1.29, false)).toBe(false)
  expect(wanted('bass', 'flying', 1.3, false)).toBe(true)
  expect(wanted('bass', 'flying', 1.26, true)).toBe(true)       // once in, it stays down to 1.25
  expect(wanted('bass', 'flying', 1.24, true)).toBe(false)
  expect(['pad', 'bass', 'drums', 'arp', 'lead'].map(id => wanted(id as never, 'results', 4, true))).toEqual([true, false, false, false, false])
  expect(['pad', 'bass', 'drums', 'arp', 'lead'].map(id => wanted(id as never, 'silent', 4, true))).toEqual([false, false, false, false, false])
  // a run at 2.5x: all but the lead come in on step 0, and gates change at no other step than a chord start
  const steps = plan('flying', 2.5, 64)
  expect(steps[0].gates.map(g => g.id).sort()).toEqual(['arp', 'bass', 'drums', 'pad'])
  steps.forEach((st, s) => { if (s % 32 !== 0) expect(st.gates).toEqual([]) })
  // speed rising mid-chord waits for the next chord
  const seq = createSequencer(() => 0.3)
  seq.step(0, { mode: 'flying', speed: 1, depth: 0 })
  for (let s = 1; s < 32; s++) expect(seq.step(s, { mode: 'flying', speed: 2, depth: 0 }).gates).toEqual([])
  expect(seq.step(32, { mode: 'flying', speed: 2, depth: 0 }).gates.map(g => g.id).sort()).toEqual(['arp', 'bass', 'drums'])
})

test('MUS-04 a one-bar rest at most once in 16 bars, in the last, for a layer that has played 16 bars, never twice running', () => {
  expect([MUSIC.restEvery, MUSIC.restAfter]).toEqual([16, 16])
  // the bars that rest, as [first step, layer]
  const restBars = (rests: (string | null)[]) => rests.flatMap((r, s) => r && (s === 0 || rests[s - 1] !== r) ? [[s, r]] : [])
  // everything in from step 0 at 2.5x: no rest in the first 16 bars (nobody has played 16 yet), then one in the last bar of
  // every 16 (steps 496, 752, 1008), never the same layer twice running
  const all = plan('flying', 2.5, 1100, () => 0).map(st => st.rest)
  expect(restBars(all)).toEqual([[496, 'bass'], [752, 'drums'], [1008, 'bass']])
  expect(all.slice(496, 512).every(r => r === 'bass') && all[512] === null).toBe(true)   // one bar, back on the downbeat
  // only the bass playing: it rests once, and then never again, since no other layer rests in between (as in the sketch)
  expect(restBars(plan('flying', 1.5, 1300, () => 0).map(st => st.rest))).toEqual([[496, 'bass']])
  // a layer that came in late is not ready: drums and arpeggio from step 448 are not ready at 496, but are at 752
  const seq = createSequencer(() => 0)
  const rests: (string | null)[] = []
  for (let s = 0; s < 800; s++) rests.push(seq.step(s, { mode: 'flying', speed: s < 448 ? 1.5 : 2.5, depth: 0 }).rest)
  expect(restBars(rests)).toEqual([[496, 'bass'], [752, 'drums']])
  // a layer that comes in again starts its count afresh
  const again = createSequencer(() => 0)
  for (let s = 0; s < 480; s++) again.step(s, { mode: 'flying', speed: 1.5, depth: 0 })
  again.drop(['bass'])
  const after: (string | null)[] = Array(480).fill(null)
  for (let s = 480; s < 1100; s++) after.push(again.step(s, { mode: 'flying', speed: 1.5, depth: 0 }).rest)
  // back in at the chord change at 480, so not ready at 496 (where it would have rested without the drop), but at 752
  expect(restBars(after)).toEqual([[752, 'bass']])
  // only the pad: no rest ever
  expect(plan('flying', 1, 1100, () => 0).every(st => st.rest === null)).toBe(true)
})

test('MUS-05 each sixteenth plays what the sketch plays', () => {
  const steps = plan('flying', 3, 32, () => 0.9)           // the rest falls on bar 8, outside these two bars
  const at = (s: number, voice: string) => steps[s].notes.filter(n => n.voice === voice)
  expect(at(0, 'pad')[0].notes).toEqual(CHORDS[0].pad)
  expect(steps.filter(st => st.notes.some(n => n.voice === 'pad')).length).toBe(1)        // one chord per two bars
  for (let i = 0; i < 8; i++) expect(at(i * 2, 'bass')[0]).toMatchObject({ notes: ['A1'], semis: BASS[i] })
  for (let s = 0; s < 16; s += 4) { expect(at(s, 'kick')).toHaveLength(1); expect(steps[s].duck).toBe(true) }
  expect([4, 12].every(s => at(s, 'snare').length === 1 && at(s, 'snareBody').length === 1)).toBe(true)
  expect(at(2, 'hat')[0].vel).toBe(0.9)                      // off-beat hats
  expect(at(1, 'hat')[0].vel).toBe(0.35)                     // sixteenths from 2.8x
  expect(plan('flying', 2.5, 2)[1].notes.some(n => n.voice === 'hat')).toBe(false)
  for (let i = 0; i < 8; i++) expect(at(i * 2, 'arp')[0].notes).toEqual([CHORDS[0].arp[ARP[i]]])
  expect(at(16 + 0, 'pad')).toHaveLength(0)
  expect(plan('flying', 3, 33, () => 0.9)[32].notes.find(n => n.voice === 'pad')!.notes).toEqual(CHORDS[1].pad)
  // the fill at the end of bar 8
  const fill = plan('flying', 3, 128, () => 0.2).slice(112 + 13, 128).map(st => st.notes.filter(n => n.voice === 'snare').length)
  expect(fill).toEqual([1, 1, 1])
  // no duck while the drums are out
  expect(plan('flying', 1, 1)[0].duck).toBe(false)
})

test('MUS-11 tempo and filters change only when they have moved enough to hear; slow motion is two ramps', async () => {
  const { createControlTracker } = await import('../../src/music/score')
  const t = createControlTracker()
  t.reset(1)
  // steady flight at 1x: the pad filter is set once, on the first frame, and then nothing changes
  const ramps: string[] = []
  for (let i = 0; i < 600; i++) ramps.push(...t.update(i / 60, 'flying', 1).map(r => r.param))
  expect(ramps).toEqual(['padCutoff'])
  // the tempo moves only in steps of 0.5 BPM or more, over 0.5 s, with the echo
  const first = t.update(10, 'flying', 1.05)
  expect(first.map(r => r.param).sort()).toEqual(['arpDelay', 'bpm', 'leadDelay', 'padCutoff'])
  expect(first.find(r => r.param === 'bpm')).toEqual({ param: 'bpm', to: bpmFor(1.05), over: 0.5, at: 10 })
  expect(t.update(10.1, 'flying', 1.07).filter(r => r.param === 'bpm')).toEqual([])   // 0.28 BPM: not yet
  // slow motion: two ramps each for tempo and the master low-pass, and nothing else until it ends
  const slow = t.slowMotion(20, 'flying', 2)
  const bpm = bpmFor(2)
  expect(slow).toEqual([
    { param: 'bpm', to: bpm * MUSIC.slow.tempo, over: 0.2, at: 20 },
    { param: 'bpm', to: bpm, over: 0.45, at: 20 + SLOW_TIME - 0.45 },
    { param: 'master', to: MUSIC.slow.cutoff, over: 0.2, at: 20 },
    { param: 'master', to: 18000, over: 0.45, at: 20 + SLOW_TIME - 0.45 },
  ])
  expect(t.update(20.5, 'flying', 2.4)).toEqual([])
  expect(t.update(20 + SLOW_TIME + 0.01, 'flying', 2.4).length).toBeGreaterThan(0)   // after it, the tempo catches up

  // a whole run, frame by frame: seven missions, speed rising, stops between, slow motion every 30 s
  const run = createControlTracker()
  run.reset(1)
  let count = 0, now = 0
  const tempo = (rs: { param: string }[]) => rs.filter(r => r.param === 'bpm').length
  for (let mission = 0; mission < 7; mission++) {
    const start = [1, 1, 1, 1, 1.4, 1.8, 2.2][mission]
    for (let f = 0; f < 100 * 60; f++) {                       // 100 s of flight: 7 missions, about 12 minutes
      now += 1 / 60
      const speed = start + 1.3 * f / (100 * 60)
      count += tempo(f % 1800 === 900 ? run.slowMotion(now, 'flying', speed) : run.update(now, 'flying', speed))
    }
    for (let f = 0; f < 5 * 60; f++) { now += 1 / 60; count += tempo(run.update(now, 'results', 1)) }
  }
  // the tempo is what Tone.js never trims (its other settings keep at most 1,000 changes each)
  expect(count).toBeLessThan(400)
})

test('MUS-12 the lead plays the melody, and comes in last, from the top of a half', async () => {
  const { MELODY } = await import('../../src/music/score')
  // the melody: two eight-bar halves of [start, note, length in sixteenths], in G4–G5, each ending within its 128 sixteenths
  expect(MELODY[1][MELODY[1].length - 1]).toEqual([96, 'D5', 28])   // the owner's latest: the second half ends on a held D5
  expect(MELODY).toHaveLength(2)
  for (const half of MELODY) for (const [at, note, len] of half) {
    expect(at + len).toBeLessThanOrEqual(128)
    expect(note).toMatch(/^(G4|A4|B4|C5|D5|E5|F5|G5)$/)
  }
  for (const half of MELODY) {
    half.forEach(([at, , len], i) => { if (i + 1 < half.length) expect(at + len).toBeLessThanOrEqual(half[i + 1][0]) })   // no overlaps
    const [lastAt, , lastLen] = half[half.length - 1]
    expect(lastAt + lastLen).toBeLessThanOrEqual(128)   // a half may end a little before its 128 sixteenths
  }
  const leadAt = (steps: ReturnType<typeof plan>) => steps.map(st => st.gates.find(g => g.id === 'lead')?.on)
  // at 2.5x from the start the arpeggio comes in on step 0, so the lead waits for the next half: step 128
  const fast = plan('flying', 2.5, 300, () => 0.9)
  expect(leadAt(fast).findIndex(x => x === true)).toBe(128)
  // the half follows the loop, as in the sketch: step 128 starts the second half, step 256 the first again
  const lead = (st: ReturnType<typeof plan>[number]) => st.notes.find(n => n.voice === 'lead')
  expect(lead(fast[128])).toMatchObject({ notes: [MELODY[1][0][1]], len: MELODY[1][0][2], dur: 'melody' })
  expect(lead(fast[256])).toMatchObject({ notes: [MELODY[0][0][1]], len: MELODY[0][0][2] })
  // below 2.2x: no lead, however long
  expect(leadAt(plan('flying', 2.1, 600, () => 0.9)).includes(true)).toBe(false)
  // the arpeggio must have been playing since an earlier chord change: here it comes in on step 0,
  // which is the top of a half, but the lead still waits for the next top (step 128)
  expect(leadAt(plan('flying', 2.3, 140, () => 0.9))[0]).toBeUndefined()
  // it never takes the rest, and the rest still falls on the others
  const rests = plan('flying', 2.5, 1024, () => 0.99).map(st => st.rest)
  expect(rests.includes('lead' as never)).toBe(false)
  // it leaves at a chord change, like the others; between missions it is out
  const seq = createSequencer(() => 0.9)
  for (let s = 0; s <= 128; s++) seq.step(s, { mode: 'flying', speed: 2.5, depth: 0 })
  expect(seq.gates.lead).toBe(true)
  for (let s = 129; s < 160; s++) seq.step(s, { mode: 'flying', speed: 1.5, depth: 0 })
  expect(seq.step(160, { mode: 'flying', speed: 1.5, depth: 0 }).gates.find(g => g.id === 'lead')).toEqual({ id: 'lead', on: false })
  // slow motion lowers it like everything else
  const deep = createSequencer(() => 0.9)
  let note
  for (let s = 0; s <= 128; s++) note = deep.step(s, { mode: 'flying', speed: 2.5, depth: s === 128 ? 1 : 0 }).notes.find(n => n.voice === 'lead')
  expect(note!.semis).toBe(MUSIC.slow.semis)
})

test('MUS-13 the lead plays at most 32 bars, then rests 16 before starting again from the top', () => {
  expect([MUSIC.leadBars, MUSIC.leadPause]).toEqual([32, 16])
  // at a steady 2.5x the lead comes in at step 128 (the second half's top), plays 32 bars (512 sixteenths),
  // leaves at step 640, rests 16 bars (256 sixteenths) and comes back at step 896, again from a top; the cycle repeats
  const steps = plan('flying', 2.5, 1700, () => 0.9)
  const changes = steps.flatMap((st, s) => st.gates.filter(g => g.id === 'lead').map(g => [s, g.on]))
  expect(changes).toEqual([[128, true], [640, false], [896, true], [1408, false], [1664, true]])   // and so on, for as long as the run lasts
  // over bars 31–32 of each stretch it fades to silence, so the fade does not reach into the next pass
  const fades = steps.flatMap((st, s) => st.fades.map(f => [s, f.id, f.bars]))
  expect(MUSIC.leadFade).toBe(2)
  expect(fades).toEqual([[608, 'lead', 2], [1376, 'lead', 2]])
  // rests or not, nothing else is touched: the arpeggio stays in throughout
  expect(steps.flatMap(st => st.gates.filter(g => g.id === 'arp'))).toEqual([{ id: 'arp', on: true }])
  // leaving early, when the speed drops, starts the count afresh
  const seq = createSequencer(() => 0.9)
  const go = (from: number, to: number, speed: number) => {
    const out: [number, boolean][] = []
    for (let s = from; s < to; s++) for (const g of seq.step(s, { mode: 'flying', speed, depth: 0 }).gates) if (g.id === 'lead') out.push([s, g.on])
    return out
  }
  expect(go(0, 300, 2.5)).toEqual([[128, true]])
  expect(go(300, 384, 1.5)).toEqual([[320, false]])          // too slow: out at the next chord change
  expect(go(384, 1200, 2.5)).toEqual([[512, true], [1024, false]])   // back at the next top, for a full 32 bars
  // leaving early has no two-bar fade: the usual fade-out of the gate change does it
  const early = createSequencer(() => 0.9)
  const earlyFades: number[] = []
  for (let s = 0; s < 400; s++) earlyFades.push(...early.step(s, { mode: 'flying', speed: s < 300 ? 2.5 : 1.5, depth: 0 }).fades.map(() => s))
  expect(earlyFades).toEqual([])
})

test('MUS-14 from mission 2 the bass plays from the start, coming in at the first bar line', () => {
  const bassAt = (level: number, speed: number, steps: number, from = 0, seq = createSequencer(() => 0.9)) => {
    const out: [number, boolean][] = []
    for (let s = from; s < from + steps; s++) for (const g of seq.step(s, { mode: 'flying', speed, depth: 0, level }).gates) if (g.id === 'bass') out.push([s, g.on])
    return out
  }
  // mission 1 at 1x: no bass; mission 2 at 1x: in on the first bar line
  expect(bassAt(1, 1, 200)).toEqual([])
  expect(bassAt(2, 1, 200)).toEqual([[0, true]])
  // coming back from a stop between missions mid-loop: in at the next bar line, not the next chord change
  const seq = createSequencer(() => 0.9)
  for (let s = 0; s < 70; s++) seq.step(s, { mode: 'results', speed: 1, depth: 0, level: 2 })
  expect(bassAt(3, 1, 40, 70, seq)).toEqual([[80, true]])       // step 80 is a bar line (bar 6), not a chord change
  // between missions it is out as before
  const back = createSequencer(() => 0.9)
  bassAt(3, 1, 40, 0, back)
  const out: [number, boolean][] = []
  for (let s = 40; s < 100; s++) for (const g of back.step(s, { mode: 'results', speed: 1, depth: 0, level: 3 }).gates) if (g.id === 'bass') out.push([s, g.on])
  expect(out).toEqual([[64, false]])
  // wanted(): the bass from mission 2, whatever the speed; the others by speed as before
  expect(wanted('bass', 'flying', 1, false, 2)).toBe(true)
  expect(wanted('bass', 'flying', 1, false, 1)).toBe(false)
  expect(wanted('drums', 'flying', 1, false, 5)).toBe(false)
})

test('MUS-16 a loop started on the start screen or between missions starts at that tempo', async () => {
  const { createControlTracker } = await import('../../src/music/score')
  const t = createControlTracker()
  t.reset(1, 'results')
  expect(t.update(0, 'results', 1).filter(r => r.param === 'bpm')).toEqual([])   // already at 90: no ramp
  const f = createControlTracker()
  f.reset(1)
  expect(f.update(0, 'flying', 1).filter(r => r.param === 'bpm')).toEqual([])
  expect(controlFor('results', 1, 0).bpm).toBe(MUSIC.tempo.results)
})

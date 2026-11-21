import { expect, test } from 'vitest'
import { HIT_V2, createSlots, noteMidi, scoredFor, scoredPulse, type FxNote } from '../../src/audio/scored'

const AM = 0, F = 1, C = 2, G = 3
const by = (notes: FxNote[], voice: string) => notes.filter(n => n.voice === voice)

test('SFX-01 every event on the soundtrack\'s instruments, as in the sketch', () => {
  // save: the chord on the bell, one inversion higher per seat; the 12-seater starts an octave lower
  const pad = ['A3', 'C4', 'E4', 'B4'].map(noteMidi)
  expect(scoredFor({ kind: 'save', seat: 1, seats: 4 }, AM, 0).notes).toEqual([{ voice: 'bell', midi: pad.map(m => m + 12), at: 0, len: 0.22, vel: 1 }])
  expect(scoredFor({ kind: 'save', seat: 2, seats: 4 }, AM, 0).notes[0].midi).toEqual([57 + 24, 60 + 12, 64 + 12, 71 + 12])
  expect(scoredFor({ kind: 'save', seat: 1, seats: 12 }, AM, 0).notes[0].midi).toEqual(pad)
  // every seat higher: each inversion lifts the chord's lowest note
  const lows = (seats: number) => Array.from({ length: seats }, (_, i) => Math.min(...scoredFor({ kind: 'save', seat: i + 1, seats }, AM, 0).notes[0].midi))
  for (const seats of [4, 8, 12]) lows(seats).forEach((t, i, a) => { if (i) expect(t).toBeGreaterThan(a[i - 1]) })
  // full: the pad's voicing an octave up, the lead on the root above, after the last save
  const full = scoredFor({ kind: 'full' }, AM, 0)
  expect(by(full.notes, 'pad')).toEqual([{ voice: 'pad', midi: pad.map(m => m + 12), at: 0.12, len: 0.5, vel: 0.9, afterBell: true }])
  expect(by(full.notes, 'lead')).toEqual([{ voice: 'lead', midi: [81], at: 0.17, len: 0.6, vel: 0.6, afterBell: true }])
  // missed: two piano notes per crew member, stepping down the scale (SFX-10)
  expect(scoredFor({ kind: 'missed', count: 1 }, AM, 0).notes).toEqual([
    { voice: 'piano', midi: [77], at: 0, len: 0.2, vel: 0.85 },
    { voice: 'piano', midi: [76], at: 0.16, len: 0.7, vel: 0.65 },
  ])
  // last shield: two arpeggio notes falling a fifth, after the shield's crack (SFX-08)
  expect(by(scoredFor({ kind: 'hit', size: 30, shieldsLeft: 0 }, AM, 0).notes, 'arp').slice(1)).toEqual([
    { voice: 'arp', midi: [76], at: 0.12, len: 0.09, vel: 1 }, { voice: 'arp', midi: [69], at: 0.24, len: 0.16, vel: 1 },
  ])
  expect(by(scoredFor({ kind: 'hit', size: 30, shieldsLeft: 1 }, AM, 0).notes, 'arp')).toHaveLength(1)   // the crack alone
  // shield: the arpeggio's root, fifth, octave
  expect(scoredFor({ kind: 'shield' }, AM, 0).notes.map(n => [n.voice, n.midi[0], n.at])).toEqual([['arp', 69, 0], ['arp', 76, 0.06], ['arp', 81, 0.12]])
  // pulse: the bass on the root, a soft kick under it, by its loudness
  expect(scoredPulse(0.5, AM, 0).notes).toEqual([
    { voice: 'bass', midi: [45], at: 0, len: 0.35, vel: 0.5 },
    { voice: 'kick', midi: [28], at: 0, len: 0.2, vel: 0.25, decay: 0.32 },
  ])
  // enter: ten chord notes climbing on the arpeggio, the lead sliding two octaves up; it cuts the rest
  const enter = scoredFor({ kind: 'enter' }, AM, 0)
  expect(enter.cut).toBe(true)
  const climb = by(enter.notes, 'arp')
  expect(climb.map(n => n.midi[0])).toEqual([57, 60, 64, 67, 69, 72, 76, 79, 81, 84])   // A minor's chord tones (with its 7th, G) from A3
  expect(climb.map(n => n.at)).toEqual(climb.map((_, i) => Math.round(i * 0.055 * 1000) / 1000))
  expect(climb[9].vel).toBeCloseTo(0.96)
  expect(by(enter.notes, 'lead')).toEqual([{ voice: 'lead', midi: [57], slideTo: 81, at: 0, len: 0.6, vel: 0.4 }])
  // home: A major on everything
  const home = scoredFor({ kind: 'home' }, F, 0)                         // whatever the chord
  expect(by(home.notes, 'pad')[0].midi).toEqual(['A3', 'C#4', 'E4', 'A4'].map(noteMidi))
  expect(by(home.notes, 'arp').map(n => n.midi[0])).toEqual([69, 73, 76, 81])
  expect(by(home.notes, 'lead')).toEqual([{ voice: 'lead', midi: [81], at: 0.3, len: 1.4, vel: 0.5 }])
  // destroyed: see SFX-09
  // the choice: a hat and one arpeggio note, five semitones lower for ship 2, two octaves for ship 3; the mark quieter
  const click = (ship: number, kind: 'choice' | 'mark' = 'choice') => scoredFor({ kind, ship }, AM, 0).notes
  expect(click(1).map(n => [n.voice, n.midi[0]])).toEqual([['hat', undefined], ['arp', 81]])
  expect([click(2)[1].midi[0], click(3)[1].midi[0]]).toEqual([76, 57])
  expect(click(1, 'mark')[1].vel).toBeLessThan(click(1)[1].vel)
})

test('SFX-02 the hit\'s size runs between the first sound effects\' rock sizes; the pulse\'s kick carries its own decay', () => {
  expect(HIT_V2).toEqual({ small: 14, big: 50 })
  expect(scoredPulse(1, AM, 0).notes.find(n => n.voice === 'kick')!.decay).toBe(0.32)
})

test('SFX-03 the notes follow the chord, in the octave nearest the target', () => {
  const shield = (chord: number) => scoredFor({ kind: 'shield' }, chord, 0).notes[0].midi[0]
  expect([shield(AM), shield(F), shield(C), shield(G)]).toEqual([69, 65, 72, 67])      // root nearest A4: A4, F4, C5, G4
  const missed = (chord: number) => scoredFor({ kind: 'missed', count: 1 }, chord, 0).notes[0].midi[0]
  expect([missed(AM), missed(F), missed(C), missed(G)]).toEqual([77, 77, 77, 77])      // crew left behind is fixed in the key (SFX-10)
  expect(scoredFor({ kind: 'save', seat: 1, seats: 4 }, G, 0).notes[0].midi).toEqual(['G3', 'B3', 'D4', 'G4'].map(m => noteMidi(m) + 12))
  expect(scoredFor({ kind: 'enter' }, C, 0).notes.filter(n => n.voice === 'arp').map(n => n.midi[0]).slice(0, 4)).toEqual([60, 64, 67, 72])   // root nearest A3 is C4, then C major's E, G, C
})

test('SFX-04 slow motion lowers every v2 sound by the music\'s whole semitones', () => {
  const at = (semis: number) => scoredFor({ kind: 'destroyed' }, AM, semis).notes.map(n => n.midi.concat(n.slideTo ?? []))
  const normal = at(0), low = at(-5)
  normal.forEach((ms, i) => ms.forEach((m, j) => expect(low[i][j]).toBe(m - 5)))
  expect(scoredFor({ kind: 'save', seat: 3, seats: 8 }, F, -3).notes[0].midi).toEqual(scoredFor({ kind: 'save', seat: 3, seats: 8 }, F, 0).notes[0].midi.map(m => m - 3))
  // the enter climb stays on the chord's tones, lowered with everything else
  expect(scoredFor({ kind: 'enter' }, AM, -5).notes.filter(n => n.voice === 'arp').map(n => n.midi[0])).toEqual([52, 55, 59, 62, 64, 67, 71, 74, 76, 79])
})

test('SFX-05 one instrument never starts two notes at the same instant', () => {
  const slots = createSlots()
  expect([slots.start('lead', 1), slots.start('lead', 1), slots.start('lead', 1)]).toEqual([1, 1.03, 1.06])
  expect(slots.start('arp', 1)).toBe(1)                              // each instrument on its own
  expect([slots.start('bell', 2), slots.start('bell', 2)]).toEqual([2, 2.06])   // saves at once roll, 60 ms apart
  expect(slots.start('pad', 3)).toBe(3); expect(slots.start('pad', 3)).toBe(3)  // the pad plays chords: no spacing
  // ship full waits for the last save
  expect(slots.afterBell(2, 0.12)).toBeCloseTo(2.06 + 0.12)
  expect(slots.afterBell(9, 0.12)).toBeCloseTo(9.12)
})

test('SFX-08 a hit is a chord on the pad and a falling bass, with the shield cracking on the arpeggio', () => {
  const hit = (size: number, chord = AM, shieldsLeft = 2) => scoredFor({ kind: 'hit', size, shieldsLeft }, chord, 0).notes
  expect(hit(14)).toEqual([
    { voice: 'pad', midi: [57, 64, 69], at: 0, len: 0.2, vel: 0.7 },             // A minor's root nearest 52 is A3
    { voice: 'bass', midi: [45], slideTo: 40, at: 0, len: 0.2, vel: 0.5 },
    { voice: 'arp', midi: [93], slideTo: 69, at: 0.02, len: 0.09, vel: 0.7 },
  ])
  expect(hit(50).slice(0, 2)).toEqual([
    { voice: 'pad', midi: [45, 52, 57], at: 0, len: 0.45, vel: 1 },
    { voice: 'bass', midi: [33], slideTo: 28, at: 0, len: 0.45, vel: 0.8 },
  ])
  // between the sizes the target moves from 52 to 45 and the root is the nearest to it
  expect(by(hit(20, C), 'pad')[0].midi[0]).toBe(48)                           // target 50.8: C3 (48) over C4 (60)
  expect(by(hit(32), 'pad')[0].len).toBeCloseTo(0.325)
  expect(hit(5)).toEqual(hit(14))
  for (const size of [14, 30, 50]) {
    expect(by(hit(size), 'kick')).toEqual([]); expect(by(hit(size), 'snare')).toEqual([]); expect(by(hit(size), 'lead')).toEqual([])
  }
  // the crack ends before the last shield's warning, which is unchanged
  const last = by(hit(30, AM, 0), 'arp')
  expect(last.map(n => [n.at, n.midi[0]])).toEqual([[0.02, 93], [0.12, 76], [0.24, 69]])
  expect(last[0].at + (last[0].len as number)).toBeLessThan(0.12)
})

test('SFX-09 the ship destroyed is the biggest hit, held', () => {
  const lost = scoredFor({ kind: 'destroyed' }, AM, 0)
  expect(lost).toEqual({ cut: true, notes: [
    { voice: 'pad', midi: [45, 52, 57], at: 0, len: 0.9, vel: 1 },
    { voice: 'bass', midi: [33], slideTo: 21, at: 0, len: 1.1, vel: 0.8 },
  ] })
  expect(scoredFor({ kind: 'destroyed' }, F, 0).notes[0].midi).toEqual([41, 48, 53])
})

test('SFX-10 crew left behind: two sad piano notes each, stepping down the scale', () => {
  const pairs = (count: number, semis = 0) => {
    const n = scoredFor({ kind: 'missed', count }, AM, semis).notes
    return Array.from({ length: count }, (_, i) => [n[2 * i].midi[0], n[2 * i + 1].midi[0], n[2 * i].at, n[2 * i + 1].at])
  }
  const m = noteMidi
  expect(pairs(4)).toEqual([
    [m('F5'), m('E5'), 0, 0.16],
    [m('D5'), m('C5'), 0.32, 0.48],
    [m('B4'), m('A4'), 0.64, 0.8],
    [m('F4'), m('E4'), 0.96, 1.12],                                    // a fourth starts again an octave down
  ])
  for (const n of scoredFor({ kind: 'missed', count: 2 }, AM, 0).notes) expect(n.voice).toBe('piano')
  const [first, second] = scoredFor({ kind: 'missed', count: 1 }, AM, 0).notes
  expect([first.len, first.vel, second.len, second.vel]).toEqual([0.2, 0.85, 0.7, 0.65])
  // the same over every chord, and lowered in slow motion by whole semitones
  for (const chord of [AM, F, C, G]) expect(scoredFor({ kind: 'missed', count: 3 }, chord, 0)).toEqual(scoredFor({ kind: 'missed', count: 3 }, AM, 0))
  expect(pairs(1, -5)[0].slice(0, 2)).toEqual([m('F5') - 5, m('E5') - 5])
  // the piano plays chords and overlapping notes: it needs no spacing
  const slots = createSlots()
  expect([slots.start('piano', 1), slots.start('piano', 1)]).toEqual([1, 1])
})

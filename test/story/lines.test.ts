import { describe, expect, test } from 'vitest'
import { FIRST_SIGNS, SCRIPT, briefing, ending, lanternChoice, leaving, oreChoice, oreDropped, stayed, stop, type Screen } from '../../src/story/lines'
import { afterLeaving, chooseLantern, chooseOre, endTrip, goBack, goOn, heard, newStory, pickBoat, readyBoats, startFlying, still, type StoryState } from '../../src/story/story'
// All three boats are ready: each moon's picker takes the boat a story without losses would have flown before the orbit (the four, then the eight from m02n, the twelve from m04n).
const go = (s: StoryState, boat?: 1 | 2 | 3) => {
  if (s.phase !== 'picker') return s
  const want = boat ?? (s.moon < 2 ? 1 : s.moon < 4 ? 2 : 3), ready = readyBoats(s)
  return pickBoat(s, ready.includes(want) ? want : ready[ready.length - 1])
}

const CALL = 'QUIETEST HERONWALK 99'                        // 21 characters, the longest callsign
const never = () => 0.99, always = () => 0
const said = (sc: Screen) => sc.transmissions.flatMap(t => [t.sender, ...t.lines]).join(' | ')
const trip = (s: StoryState, picked: number, destroyed = false) => endTrip(s, { picked, destroyed, shieldsLeft: 2 }, never)
// Shows a screen and applies what it said, as the game will.
const show = (s: StoryState, f: (s: StoryState, c: string) => Screen) => { const sc = f(s, CALL); return { s: heard(s, sc.heard), sc } }

describe('the script as data', () => {
  test('STORY-L01 the script is read: every section the game uses has its transmissions, each sender has a voice', () => {
    for (const [section, part] of [['Before mission 00', ''], ['m00n', 'After the first trip to m00n'], ['m03n', 'Leaving m03n'], ['m05n', 'Leaving m05n'],
      ['Blocks used at any moon from m00n to m05n', 'When a boat is destroyed'], ['Endings', 'The commission'], ['Endings', 'Home']] as const) {
      expect(SCRIPT.filter(b => b.section === section && b.part === part).length, `${section} / ${part}`).toBeGreaterThan(0)
    }
    expect(SCRIPT.find(b => b.sender === 'FOREMAN, m06n')!).toMatchObject({ voice: 'foreman', faint: true })
    expect(SCRIPT.find(b => b.sender === 'SURVEYOR, m00n')!.voice).toBe('first')
    expect(SCRIPT.find(b => b.sender === 'LANTERN')!.voice).toBe('lantern')
  })

  test('STORY-L02 every line is at most 42 characters once filled in, with two-digit counts and the longest callsign', () => {
    for (const b of SCRIPT) for (const l of b.lines) {
      const filled = l.replace(/\[N\]/g, '70').replace(/\[CALLSIGN\]/g, CALL).replace(/m0Xn/g, 'm00n')
      expect(filled.length, `"${filled}" (${b.section} / ${b.part})`).toBeLessThanOrEqual(42)
    }
  })
})

describe('what each screen says', () => {
  test('STORY-L03 the briefing names m00n; the first stop with someone aboard: the survivor, the First\'s opening, Control once, and m01n named', () => {
    let { s } = show(newStory(), briefing)
    expect(s.named).toEqual([0])
    s = trip(go(startFlying(s)), 4)
    const r = show(s, stop)
    expect(r.sc.transmissions.map(t => t.sender)).toEqual(['SURVEY HAND, m00n', 'SURVEYOR, m00n', 'CONTROL'])
    expect(said(r.sc)).toContain('2 still on m00n.')
    expect([r.s.named, r.s.spoke[0], r.s.firstOpened]).toEqual([[0, 1], true, true])
    expect(said(r.sc)).not.toMatch(/\[N\]|\[CALLSIGN\]|m0Xn/)
  })

  test('STORY-L04 with nobody aboard: the ship counts the signals, and names m01n on leaving in the survivor\'s place', () => {
    let s = trip(go(startFlying(heard(newStory(), { names: [0] }))), 0)
    const r = show(s, stop)
    expect(said(r.sc)).toContain('Boat back. | No one aboard.')
    expect(said(r.sc)).toContain('6 signals still on m00n.')
    expect(r.s.named).toEqual([0])                                  // not named yet: nobody has said it
    s = goOn(r.s)
    const l = show(s, leaving)
    expect(said(l.sc)).toContain('New signals from m01n.')
    expect(l.s.named).toEqual([0, 1])
    expect(said(l.sc)).not.toContain('SURVEYOR')                     // no First, so the First's lines on rig crews are left out
  })

  test('STORY-L05 a First from a later moon signs by their own job; the chain follows the table through m06n\'s early naming', () => {
    let s = trip(go(startFlying(heard(newStory(), { names: [0] }))), 0)
    s = show(s, stop).s; s = show(goOn(s), leaving).s; s = go(afterLeaving(s))
    s = trip(s, 3)                                                  // the first people aboard come from m01n
    const r = show(s, stop)
    expect(r.sc.transmissions.map(t => t.sender)).toEqual(['RIG HAND, m01n', FIRST_SIGNS[1], FIRST_SIGNS[1]])
    expect(r.s.named).toEqual([0, 1, 2])
    s = show(goOn(r.s), leaving).s
    expect(s.named).toEqual([0, 1, 2, 3])                            // Control reads the company's list
    s = go(afterLeaving(s)); s = go(s)
    s = show(trip(s, 5), stop).s
    expect(s.named).toEqual([0, 1, 2, 3, 6])                         // the shift hand names m06n
    s = show(goOn(s), leaving).s; s = go(afterLeaving(s))
    s = show(trip(s, 5), stop).s
    s = show(goOn(s), leaving).s
    expect(s.named).toEqual([0, 1, 2, 3, 4, 6])                      // the First names m04n at the turn
  })

  test('STORY-L06 a boat lost: the ship names it and counts what is left; the First marks them, "too" the second time', () => {
    let s = trip(go(startFlying(heard(newStory(), { names: [0] }))), 3)
    s = show(s, stop).s
    s = trip(go(goBack(s)), 1, true)
    let r = show(s, stop)
    expect(said(r.sc)).toContain('Lightboat-4 is lost. | 1 aboard. None recovered. | Two boats left.')
    expect(said(r.sc)).toContain("I've marked them.")
    s = trip(go(goBack(r.s), 2), 0, true)                            // the eight chosen after the four was lost
    r = show(s, stop)
    expect(said(r.sc)).toContain('Lightboat-8 is lost. | Nobody aboard. | One boat left.')
    expect(said(r.sc)).toContain("I've marked them too.")
  })

  test('STORY-L07 a return: names crossed off, or the moon empty', () => {
    let s = show(trip(go(startFlying(heard(newStory(), { names: [0] }))), 4), stop).s
    s = trip(go(goBack(s)), 1)
    expect(said(stop(s, CALL))).toContain('1 more names crossed off. | 1 still on m00n.')
    s = trip(go(goBack(s)), 1)
    expect(said(stop(s, CALL))).toContain('m00n is empty. | Every name crossed off.')
  })

  test('STORY-L08 the turns: the ore stakes, the ore dropped naming the boat ready, the last stakes (full or not), staying with one boat', () => {
    let s = go(startFlying(heard(newStory(), { names: [0] })))
    for (let m = 0; m < 3; m++) { s = trip(s, still(s)); s = go(afterLeaving(goOn(s))); s = go(s) }
    s = go(afterLeaving(goOn(trip(s, still(s)))))
    expect(said(oreChoice(s, CALL))).toContain('36 aboard, and a hold full of light0re.')
    s = go(chooseOre(s, 'drop', never))
    expect(said(oreDropped(s, CALL))).not.toContain('is ready.')                 // all three boats were ready from the start
    s = go(s, 3)
    for (let m = 4; m < 5; m++) { s = trip(s, still(s)); s = go(afterLeaving(goOn(s))) }
    const full = go(afterLeaving(goOn(trip(s, still(s)))))
    expect(said(lanternChoice(full, CALL))).toContain('Full. Every place aboard is taken.')
    const short = go(afterLeaving(goOn(trip(s, 2))))
    expect(said(lanternChoice(short, CALL))).toContain('54 aboard. Room for 16 more.')
    const stay = go(chooseLantern(full, 'stay'))
    expect(said(stayed(stay, CALL))).toContain('Choose the boat that stays.')
  })

  test('STORY-L09 endings: the commission\'s two tellings, home with an empty boat, Lightboat, and nothing at all after Lost at the Heart', () => {
    let s = go(startFlying(heard(newStory(), { names: [0] })))
    for (let m = 0; m < 3; m++) { s = trip(s, 2); s = go(afterLeaving(goOn(s))); s = go(s) }
    s = go(afterLeaving(goOn(trip(s, 2))))
    expect(said(ending(go(chooseOre(s, 'home', always)), CALL))).toContain('It brought out')
    expect(said(ending(go(chooseOre(s, 'home', never)), CALL))).toContain('It was a day late.')
    expect(said(ending(go(chooseOre(s, 'home', never)), CALL))).toContain('8 people came home with it.')
    let t = go(chooseOre(s, 'drop', never)); t = go(t, 3)
    t = trip(t, 3); t = go(afterLeaving(goOn(t))); t = trip(t, 3); t = go(afterLeaving(goOn(t)))
    t = go(chooseLantern(t, 'stay'), 3)
    const home0 = endTrip(t, { picked: 0, destroyed: false, shieldsLeft: 1 }, never)
    expect(said(ending(home0, CALL))).toContain('Your boat came in empty.')
    const lb = endTrip(t, { picked: 6, destroyed: false, shieldsLeft: 1 }, always)
    expect(lb.ending).toBe('lightboat')
    expect(said(ending(lb, CALL))).toContain('6 people came in your boat.')
    expect(ending(endTrip(t, { picked: 6, destroyed: true, shieldsLeft: 0 }, never), CALL).transmissions).toEqual([])
  })
})

test('STORY-L10 a trip that brings nobody replaces the survivor only: the First still speaks for the moon, and names what it names', () => {
  let s = show(trip(go(startFlying(heard(newStory(), { names: [0] }))), 4), stop).s   // the First is aboard from m00n
  s = show(goOn(s), leaving).s; s = go(afterLeaving(s))
  s = trip(s, 0)                                                   // the first trip to m01n brings nobody
  const r = show(s, stop)
  expect(said(r.sc)).toContain('Boat back. | No one aboard.')
  expect(said(r.sc)).toContain('SURVEYOR, m00n | 7 still on m01n.')
  expect(r.s.named).toContain(2)                                   // the First names m02n, as usual
  expect(said(r.sc)).not.toContain('RIG HAND')                     // the survivor waits until someone from m01n is aboard
  s = trip(go(goBack(r.s)), 3)
  const later = show(s, stop)
  expect(later.sc.transmissions.map(t => t.sender)).toEqual(['RIG HAND, m01n'])   // the First's block is not said twice
})

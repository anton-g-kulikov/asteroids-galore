// The manifest: the screen that closes a story (see "The manifest" in _meta/story-script.md and
// _meta/game-design.md). One row per moon the captain was told about, one mark per person.

import { ENDING_NAMES } from './lines'
import { MOON_PEOPLE } from './numbers'
import { ENDINGS, SECOND_FREIGHTER_REACH, isCaptain, readyBoats, still, type Ending, type StoryState } from './story'
import type { ManifestView, Mark } from './view'

const LABELS: Record<Mark, string> = { earth: 'ON EARTH', onTheirWay: 'ON THEIR WAY', anotherShip: 'BY ANOTHER SHIP', missing: 'MISSING', left: 'LEFT BEHIND', dead: 'DEAD', notReached: "ON NOBODY'S LIST" }

/**
 * The manifest for an ended story. `reached` is every ending reached in any story so far (the
 * lamps, the one thing kept between stories); the one just reached stays unlit until `lampLit`.
 */
export function manifestFor(s: StoryState, callsign: string, reached: Ending[], countsShown: number, lampLit: boolean): ManifestView {
  const e = s.ending!
  const savedMark: Mark = e === 'lightboat' ? 'missing' : e === 'lostAtTheHeart' ? 'onTheirWay' : 'earth'
  // after "The commission" the report is how the captain hears of m04n to m06n: their rows are always there (the owner)
  const moons = e === 'commission' ? [...new Set([...s.named, ...SECOND_FREIGHTER_REACH])].sort((a, b) => a - b) : s.named
  const rows = moons.map(moon => {
    const marks: Mark[] = []
    const saved = s.saved[moon], dead = s.dead[moon], left = still(s, moon)
    if (moon === 6) marks.push(...Array<Mark>(saved).fill(e === 'lostAtTheHeart' ? 'dead' : 'earth'))
    else marks.push(...Array<Mark>(saved).fill(savedMark))
    marks.push(...Array<Mark>(dead).fill('dead'))
    const other = Math.min(left, s.anotherShip[moon])
    const unreached: Mark = e === 'commission' && SECOND_FREIGHTER_REACH.includes(moon) ? 'notReached' : 'left'
    marks.push(...Array<Mark>(other).fill('anotherShip'), ...Array<Mark>(left - other).fill(unreached))
    return { moon, marks }
  })
  const all = rows.flatMap(r => r.marks)
  const n = (m: Mark) => all.filter(x => x === m).length
  // in the order they stand and appear: on Earth, the fourth count, left behind, dead
  const counts: ManifestView['counts'] = []
  if (e === 'lostAtTheHeart') counts.push({ mark: 'onTheirWay', label: LABELS.onTheirWay, value: n('onTheirWay') })
  else counts.push({ mark: 'earth', label: LABELS.earth, value: n('earth') })
  if (e === 'commission' && s.secondFreighter) counts.push({ mark: 'anotherShip', label: LABELS.anotherShip, value: n('anotherShip') })
  if (e === 'commission') counts.push({ mark: 'notReached', label: LABELS.notReached, value: n('notReached') })
  if (e === 'lightboat') counts.push({ mark: 'missing', label: LABELS.missing, value: n('missing') })
  counts.push({ mark: 'left', label: LABELS.left, value: n('left') }, { mark: 'dead', label: LABELS.dead, value: n('dead') })
  const cargo = !s.oreAboard ? 'NO COMMISSION' : readyBoats(s).length === 0 ? 'COMMISSION PAID, LESS THREE BOATS' : 'COMMISSION PAID'
  return {
    callsign, heading: [isCaptain(s) ? 'CAPTAIN' : 'PILOT', callsign].filter(Boolean).join(' '), rows, counts, countsShown: Math.min(countsShown, counts.length), cargo,
    lamps: ENDINGS.map(x => ({ name: ENDING_NAMES[x], lit: reached.includes(x) && (x !== e || lampLit), justReached: x === e })),
  }
}

/** Everyone on the moons with a row, for checks: the marks always add up to the moons' people. */
export const peopleOn = (s: StoryState): number => (s.ending === 'commission' ? [...new Set([...s.named, ...SECOND_FREIGHTER_REACH])] : s.named).reduce<number>((a, m) => a + MOON_PEOPLE[m], 0)

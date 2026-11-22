// What is said on each story screen, picked from the script (_meta/story-script.md) by the
// story's state and filled in: [N], [CALLSIGN], m0Xn, the boat's name, the First's signature.
// Each screen also reports what it did: the moons its lines named, and who has now spoken.

import scriptText from '../../_meta/story-script.md?raw'
import { ROOM } from './numbers'
import { parseScript, type ScriptBlock } from './scriptParse'
import { isCaptain, lanternAboard, readyBoats, still, type Ending, type Heard, type StoryState } from './story'
import type { MoonIndex, Voice } from './view'

export const SCRIPT: ScriptBlock[] = parseScript(scriptText)

/** A transmission, filled in and not yet typed. */
export interface Tx { sender: string; voice: Voice; faint: boolean; lines: string[] }
export interface Screen { transmissions: Tx[]; heard: Heard }

export const moonName = (m: number): string => `m0${m}n`
/** What the First signs as, by the moon they come from (see "What the First signs as"). */
export const FIRST_SIGNS = ['SURVEYOR, m00n', 'RIG BOSS, m01n', 'TALLY CLERK, m02n', 'TEACHER, m03n', 'CHARGE HAND, m04n', 'DRILL HAND, m05n']
/** A lost boat is named by its seats: "Lightboat-4 is lost." (the owner, 2026-11-22). */
const lostBoat = (boat: number): string => `Lightboat-${[4, 8, 12][boat - 1]} is lost.`
const COUNT_WORDS = ['No boats left.', 'One boat left.', 'Two boats left.', 'Three boats left.']
/** The ending's title on its screen and its lamp. */
export const ENDING_NAMES: Record<Ending, string> = {
  commission: 'THE COMMISSION', pastTheList: 'PAST THE LIST', fullShip: 'A FULL SHIP', emptyRail: 'THE EMPTY RAIL',
  home: 'HOME', lightThatStayed: 'THE LIGHT THAT STAYED', lightboat: 'LIGHTBOAT', lostAtTheHeart: 'LOST AT THE HEART',
}

const blocks = (section: string, part = ''): ScriptBlock[] => SCRIPT.filter(b => b.section === section && b.part === part)
const after = (list: ScriptBlock[], marker: string): ScriptBlock[] => list.filter(b => b.before.includes(marker))
const until = (list: ScriptBlock[], marker: string): ScriptBlock[] => { const i = list.findIndex(b => b.before.includes(marker)); return i < 0 ? list : list.slice(0, i) }

/** [CALLSIGN]: the player's callsign, or with none "pilot" before the ore choice and "Captain" after it. */
export const callsignOr = (s: StoryState, callsign: string): string => callsign || (isCaptain(s) ? 'Captain' : 'pilot')

/** Fills a block's [N]s in order, [CALLSIGN], and m0Xn with the moon in play; the First signs as who they are. */
function fill(b: ScriptBlock, s: StoryState, callsign: string, ns: number[] = [], lines?: string[]): Tx {
  let i = 0
  const out = (lines ?? b.lines).map(l => l
    .replace(/\[N\]/g, () => String(ns[i++] ?? 0))
    .replace(/\[CALLSIGN\]/g, callsignOr(s, callsign))
    .replace(/m0Xn/g, moonName(s.moon)))
  const sender = b.voice === 'first' && s.first !== null ? FIRST_SIGNS[s.first] : b.sender
  return { sender, voice: b.voice, faint: b.faint, lines: out }
}
const lantern = (...lines: string[]): Tx => ({ sender: 'LANTERN', voice: 'lantern', faint: false, lines })

/** Moons named at a stop by the table "When each moon is named", and what the ship says if their speaker never did. */
const STOP_NAMES: Partial<Record<number, { names: MoonIndex; by: 'survivor' | 'first'; standIn: string[] }>> = {
  0: { names: 1, by: 'survivor', standIn: ['New signals from m01n.'] },
  1: { names: 2, by: 'first', standIn: ['New signals from m02n.'] },
  2: { names: 6, by: 'survivor', standIn: ['The pull comes from m06n.'] },
  4: { names: 5, by: 'survivor', standIn: ['New signals from m05n.'] },
}

/** The briefing, before mission 00. */
export function briefing(s: StoryState, callsign: string): Screen {
  return { transmissions: blocks('Before mission 00').map(b => fill(b, s, callsign)), heard: { names: [0] } }
}

/** The stop after a trip to m00n–m05n: what the boat brought, and the choice to go back or go on. */
export function stop(s: StoryState, callsign: string): Screen {
  const m = s.moon, lt = s.lastTrip!, st = still(s), txs: Tx[] = [], heard: Heard = { names: [] }
  const count = () => s.first === null ? [lantern(`${st} signals still on ${moonName(m)}.`)] : []
  if (lt.destroyed) {
    const [ship, first] = blocks('Blocks used at any moon from m00n to m05n', 'When a boat is destroyed')
    const left = readyBoats(s).length
    txs.push(fill(ship, s, callsign, [lt.picked], [lostBoat(lt.boat), lt.picked ? '[N] aboard. None recovered.' : 'Nobody aboard.', COUNT_WORDS[left]]))
    if (s.first !== null) txs.push(fill(first, s, callsign, [st], [s.boatsLost > 1 ? "I've marked them too." : first.lines[0], ...first.lines.slice(1)]))
    else txs.push(...count())
  } else if (lt.picked === 0) {
    // the ship stands in for the survivor only: the First, if there is one, still speaks for this moon
    txs.push(fill(blocks('Blocks used at any moon from m00n to m05n', 'When a trip brings nobody')[0], s, callsign))
    const own = blocks(moonName(m), `After the first trip to ${moonName(m)}`).find(b => b.voice === 'first')
    if (s.first !== null && m !== 0 && own && !s.firstHere[m]) { txs.push(fill(own, s, callsign, [st])); heard.firstHere = m as MoonIndex }
    else txs.push(...count())
  } else if (!s.spoke[m]) {
    // the first stop with someone from this moon aboard: its survivor speaks, and the First comes in
    for (const b of blocks(moonName(m), `After the first trip to ${moonName(m)}`)) {
      if (b.voice === 'survivor') { txs.push(fill(b, s, callsign)); heard.spoke = m as MoonIndex }
      else if (b.voice === 'control') continue                        // Control: below, at the first stop with people still there
      else if (b.voice === 'first') {
        const opening = blocks('m00n', 'After the first trip to m00n').find(x => x.voice === 'first')!
        if (!s.firstOpened) { txs.push(fill(opening, s, callsign, [st])); heard.firstOpened = true }
        if (m !== 0 && !s.firstHere[m]) { txs.push(fill(b, s, callsign, [st])); heard.firstHere = m as MoonIndex }
      }
    }
  } else {
    const [more, empty] = blocks('Blocks used at any moon from m00n to m05n', 'After a return trip')
    txs.push(st > 0 ? fill(more, s, callsign, [lt.picked, st]) : fill(empty, s, callsign))
  }
  // the moon this stop names, by its speaker or by the ship in their place
  const n = STOP_NAMES[m]
  if (n && !s.named.includes(n.names)) {
    const spoken = n.by === 'survivor' ? heard.spoke === m : txs.some(t => t.voice === 'first' && t.lines.some(l => l.includes(moonName(n.names))))
    if (spoken) heard.names!.push(n.names)
    else if (n.by === 'first' && s.first === null) {   // the First at m01n names m02n; with no First the ship gives the count and names it
      const i = txs.findIndex(t => t.voice === 'lantern' && t.lines[0].includes('signals still'))
      if (i >= 0) txs[i] = lantern(txs[i].lines[0], ...n.standIn)
      else txs.push(lantern(`${st} signals still on ${moonName(m)}.`, ...n.standIn))
      heard.names!.push(n.names)
    }
  }
  // Control explains going back once, at the first stop where the choice is put
  if (st > 0 && !s.goingBackTold) {
    txs.push(fill(blocks('m00n', 'After the first trip to m00n').find(b => b.voice === 'control')!, s, callsign))
    heard.goingBackTold = true
  }
  return { transmissions: st > 0 ? txs : txs.map(emptied), heard }
}

/** Nobody left on the moon: its count lines say so (the script's variant under the m00n stop). */
function emptied(t: Tx): Tx {
  const lines: string[] = []
  let wasEmpty = false
  for (const l of t.lines) {
    const still_ = /^\d+ still on (m0\dn)\.$/.exec(l), signals = /^\d+ signals still on (m0\dn)\.$/.exec(l)
    if (still_) { lines.push(`${still_[1]} is empty.`); wasEmpty = true; continue }
    if (signals) { lines.push(`No signals left on ${signals[1]}.`); continue }
    lines.push(wasEmpty && l === 'I have their names.' ? 'Every name crossed off.' : l)
    wasEmpty = false
  }
  return { ...t, lines }
}

/** The last boat lost before mission 06: the ship's report and Control, before the ending. */
export function lastBoatLost(s: StoryState, callsign: string): Screen {
  const [ship, control] = blocks('Blocks used at any moon from m00n to m05n', 'When the last boat is lost')
  const lt = s.lastTrip!
  return {
    transmissions: [
      fill(ship, s, callsign, [lt.picked], [lostBoat(lt.boat), lt.picked ? '[N] aboard. None recovered.' : 'Nobody aboard.', 'No boats left.']),
      fill(control, s, callsign),
    ],
    heard: {},
  }
}

/** Leaving a moon: those still there, the moon's own leaving lines, and the ship naming any moon whose speaker never spoke. */
export function leaving(s: StoryState, callsign: string): Screen {
  const m = s.moon, st = still(s), txs: Tx[] = [], heard: Heard = { names: [] }
  if (st > 0 && s.first !== null) txs.push(fill(blocks('Blocks used at any moon from m00n to m05n', 'Going on with people still there')[0], s, callsign, [st]))
  // a moon this moon's stop should have named, if nobody named it there
  const n = STOP_NAMES[m]
  if (n && !s.named.includes(n.names)) { txs.push(lantern(...n.standIn)); heard.names!.push(n.names) }
  const own = until(blocks(moonName(m), `Leaving ${moonName(m)}`), 'Then the choice')
  for (const b of own) {
    if (b.voice === 'first' && s.first === null) {
      if (m === 3) { txs.push(lantern('Signals from m04n.', "The company's list has nobody there.")); heard.names!.push(4) }
      if (m === 5) txs.push(lantern('No other ship can reach m06n in time.'))
      continue
    }
    if (b.voice === 'foreman') heard.foremanHeard = true
    txs.push(fill(b, s, callsign))
    if (m === 1 && b.voice === 'control') heard.names!.push(3)
    if (m === 3 && b.voice === 'first') heard.names!.push(4)
  }
  return { transmissions: txs, heard }
}

/** The ore choice leaving m03n: the ship states the stakes. */
export function oreChoice(s: StoryState, callsign: string): Screen {
  const b = after(blocks('m03n', 'Leaving m03n'), 'Then the choice')[0]
  return { transmissions: [fill(b, s, callsign, [lanternAboard(s)])], heard: {} }
}

/** The ore dropped: Control and the ship. */
export function oreDropped(s: StoryState, callsign: string): Screen {
  return { transmissions: after(blocks('m03n', 'Leaving m03n'), 'If the captain drops it').map(b => fill(b, s, callsign)), heard: {} }
}

/** The last choice leaving m05n: the ship states the stakes. */
export function lanternChoice(s: StoryState, callsign: string): Screen {
  const b = after(blocks('m05n', 'Leaving m05n'), 'Then the choice')[0]
  const aboard = lanternAboard(s)
  const lines = aboard >= ROOM ? ['Full. Every place aboard is taken.', ...b.lines.slice(1)] : b.lines
  return { transmissions: [fill(b, s, callsign, [aboard, ROOM - aboard], lines)], heard: {} }
}

/** The captain stays: Control, the First, and the ship asking for the boat that stays. */
export function stayed(s: StoryState, callsign: string): Screen {
  const list = after(blocks('m05n', 'Leaving m05n'), 'If the captain stays')
  const left = readyBoats(s).length
  return {
    transmissions: list.filter(b => !(b.voice === 'first' && s.first === null)).map(b => b.voice === 'lantern' && left === 1
      ? fill(b, s, callsign, [], ['One boat left.', 'It stays with you.'])
      : fill(b, s, callsign)),
    heard: {},
  }
}

/** People left behind on the moons the captain reached, and the dead. */
export const leftBehind = (s: StoryState): number => { let n = 0; for (let m = 0; m <= Math.min(s.moon, 5); m++) n += still(s, m); return n }
const deadCount = (s: StoryState): number => s.dead.reduce((a, b) => a + b, 0)

/** An ending's transmissions. "Lost at the Heart" has none: the manifest comes up alone. */
export function ending(s: StoryState, callsign: string): Screen {
  const e = s.ending!, aboard = lanternAboard(s), txs: Tx[] = []
  const nobody = (lines: string[], with_: string) => aboard ? lines : lines.map(l => l.startsWith('[N] people') ? with_ : l)
  const noFirst = (list: ScriptBlock[]) => list.filter(b => !(b.voice === 'first' && s.first === null))
  const foreman = (part: string) => blocks('Endings', part).find(b => b.voice === 'foreman')
  if (e === 'commission') {
    const list = blocks('Endings', 'The commission')
    const opening = list[0], lastBoat = readyBoats(s).length === 0
    const lines = lastBoat ? ['Cargo delivered. Commission paid,', 'less three boats.', '[N] people came home with it.'] : opening.lines
    txs.push(fill(opening, s, callsign, [aboard], nobody(lines, 'Nobody came home with it.')))
    const brought = s.anotherShip.reduce((a, b) => a + b, 0)
    for (const b of noFirst(after(list, s.secondFreighter ? 'Another freighter went in' : 'It came too late'))) txs.push(fill(b, s, callsign, [brought]))
  } else if (e === 'pastTheList' || e === 'fullShip') {
    const own = blocks('Endings', e === 'pastTheList' ? 'Past the list' : 'A full ship')
    const f = foreman('Past the list'); if (f) txs.push(fill(f, s, callsign))
    for (const b of noFirst(own.filter(b => b.voice !== 'foreman'))) txs.push(fill(b, s, callsign, [aboard], nobody(b.lines, 'Nobody is coming home.')))
  } else if (e === 'emptyRail') {
    const own = blocks('Endings', 'The empty rail')
    for (const b of own) {
      if (b.voice === 'foreman') { if (s.foremanHeard) txs.push(fill(b, s, callsign)); continue }
      if (b.voice === 'first' && s.first === null) continue
      txs.push(fill(b, s, callsign, b.voice === 'first' ? [leftBehind(s), deadCount(s)] : [aboard], nobody(b.lines, 'Nobody is coming home.')))
    }
  } else if (e === 'home' || e === 'lightThatStayed' || e === 'lightboat') {
    const home = blocks('Endings', 'Home'), boatEmpty = s.saved[6] === 0
    const homeSet = boatEmpty ? after(home, 'nobody aboard') : until(home, 'nobody aboard')
    const f = homeSet.find(b => b.voice === 'foreman'); if (f) txs.push(fill(f, s, callsign))
    const own = e === 'home' ? homeSet.filter(b => b.voice !== 'foreman') : blocks('Endings', e === 'lightboat' ? 'Lightboat' : 'The light that stayed').filter(b => b.voice !== 'foreman')
    for (const b of noFirst(own)) {
      const ns = b.voice === 'first' ? [leftBehind(s)] : e === 'lightboat' ? [s.saved[6]] : [aboard, s.saved[6]]
      txs.push(fill(b, s, callsign, ns))
    }
  }
  return { transmissions: txs, heard: {} }
}

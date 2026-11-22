import type { Game } from '../../game/types'
import type { DevPanelView, DevPlace } from '../../story/view'
import { DEV, inRect, type Rect } from './look'

// The dev control, for play testing: a pill on every story screen and in flight, and the panel it
// opens. Amber, with dashed outlines, which no control of the game itself uses. It is plain: no
// glow. What is drawn and what is tapped come from one list, so they cannot drift apart.

const FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Roboto Mono", monospace'

/** Where the DEV pill is: top centre, the one place free on every story screen and in flight. */
export function devPillRect(g: Game): Rect {
  const { W, U } = g
  return { x: W / 2 - 24 * U, y: 6 * U, w: 48 * U, h: 24 * U }
}

/** True when a tap at (x, y) lands on the pill, with a margin a thumb needs. Such a tap only opens the panel. */
export function onDevPill(g: Game, x: number, y: number): boolean {
  const r = devPillRect(g), m = 10 * g.U
  return inRect({ x: r.x - m, y: r.y - 6 * g.U, w: r.w + 2 * m, h: r.h + m + 6 * g.U }, x, y)
}

export function drawDevPill(ctx: CanvasRenderingContext2D, g: Game): void {
  const { U } = g, r = devPillRect(g)
  ctx.save()
  ctx.strokeStyle = DEV; ctx.lineWidth = 1.3 * U; ctx.setLineDash([3 * U, 3 * U])
  ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, r.h / 2); ctx.stroke()
  ctx.setLineDash([])
  ctx.font = `800 ${Math.round(11 * U)}px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = DEV
  ctx.fillText('DEV', r.x + r.w / 2, r.y + 16 * U)
  ctx.restore()
}

/**
 * Everything on the panel that can be tapped, by name. Steppers end in `-` or `+`; a moon, a boat
 * or an ending carries its number; a place or a forced chance carries its name.
 */
export type DevControlId =
  | 'close' | 'go' | 'newStory' | 'endTrip' | 'loseBoat' | 'toWormhole' | 'invincible'
  | `moon:${0 | 1 | 2 | 3 | 4 | 5 | 6}` | `place:${DevPlace}`
  | `${'lantern' | 'still' | 'lost' | 'aboard' | 'shields' | 'typing' | 'hold'}:${'-' | '+'}`
  | `boat:${1 | 2 | 3}` | `ore:${'aboard' | 'dropped'}`
  | `${'freighter' | 'lanternHome'}:${'chance' | 'yes' | 'no'}` | `ending:${number}`

export interface DevControl extends Rect {
  id: DevControlId
  label: string
  /** Chosen: filled in amber. */
  on?: boolean
  /** Not there to choose (a place this moon has not got, a boat that is lost): dim and dashed. A lost boat can still be tapped back. */
  off?: boolean
  /** A place that does not exist at this moon cannot be tapped. */
  dead?: boolean
}

interface DevWord { str: string; x: number; y: number; kind: 'title' | 'head' | 'row' | 'value' }

const PLACES: [DevPlace, string][] = [['trip', 'TRIP'], ['afterTrip', 'AFTER TRIP'], ['stop', 'STOP'], ['leaving', 'LEAVING'], ['choice', 'CHOICE'], ['boats', 'BOATS']]

/** The panel, laid out: its controls, and the words that are only read. In play-field units. */
export function devLayout(g: Game, v: DevPanelView): { controls: DevControl[]; words: DevWord[] } {
  const { W, U } = g
  const controls: DevControl[] = [], words: DevWord[] = []
  const chip = (id: DevControlId, x: number, y: number, w: number, label: string, more: Partial<DevControl> = {}, h = 28) =>
    controls.push({ id, label, x: x * U, y: y * U, w: w * U, h: h * U, ...more })
  const word = (str: string, x: number, y: number, kind: DevWord['kind']) => words.push({ str, x: x * U, y: y * U, kind })
  const stepper = (id: 'lantern' | 'still' | 'lost' | 'aboard' | 'shields' | 'typing' | 'hold', x: number, y: number, value: string | number) => {
    chip(`${id}:-`, x, y, 34, '−'); chip(`${id}:+`, x + 92, y, 34, '+'); word(String(value), x + 63, y + 19, 'value')
  }
  const moonName = `m0${v.moon}n`

  word('DEV · STORY', 24, 42, 'title')
  chip('invincible', W / U - 24 - 78 - 6 - 106, 23, 106, 'INVINCIBLE', { on: v.invincible })
  chip('close', W / U - 24 - 78, 23, 78, '✕ CLOSE')

  word('JUMP TO', 24, 72, 'head')
  for (let i = 0; i < 7; i++) chip(`moon:${i as 0}`, 27 + i * 50, 80, 46, `m0${i}n`, { on: i === v.moon })
  PLACES.forEach(([place, label], i) => {
    const there = v.places.includes(place)
    chip(`place:${place}`, 27 + (i % 3) * 117, 114 + Math.floor(i / 3) * 34, 112, label, { on: there && place === v.place, off: !there, dead: !there })
  })

  word(v.inFlight ? 'THIS TRIP' : 'STATE', 24, 204, 'head')
  let y = 212
  if (v.inFlight) {
    word('ABOARD THE BOAT', 24, y + 18, 'row'); stepper('aboard', 248, y, v.trip.aboard); y += 34
    word('SHIELDS', 24, y + 18, 'row'); stepper('shields', 248, y, v.trip.shields); y += 34
    chip('endTrip', 27, y, 112, 'END TRIP'); chip('loseBoat', 144, y, 112, 'LOSE BOAT'); chip('toWormhole', 261, y, 112, 'TO WORMHOLE'); y += 34
    word('ON THE LANTERN', 24, y + 18, 'row'); stepper('lantern', 248, y, v.state.lantern); y += 34
    word(`STILL ON ${moonName}`, 24, y + 18, 'row'); stepper('still', 248, y, v.state.still)
  } else {
    word('ON THE LANTERN', 24, y + 18, 'row'); stepper('lantern', 248, y, v.state.lantern); y += 34
    word(`STILL ON ${moonName}`, 24, y + 18, 'row'); stepper('still', 248, y, v.state.still); y += 34
    word('LOST', 24, y + 18, 'row'); stepper('lost', 248, y, v.state.lost); y += 34
    word('BOATS', 24, y + 18, 'row')
    ;['4', '8', '12'].forEach((l, i) => chip(`boat:${(i + 1) as 1}`, 222 + i * 52, y, 48, l, { on: v.state.boats[i], off: !v.state.boats[i] }))
    y += 34
    word('ORE', 24, y + 18, 'row')
    chip('ore:aboard', 222, y, 74, 'ABOARD', { on: v.state.oreAboard }); chip('ore:dropped', 300, y, 74, 'DROPPED', { on: !v.state.oreAboard })
  }

  word('CHANCE', 24, 398, 'head')
  word('FREIGHTER', 24, 424, 'row')
  ;([['chance', 'CHANCE'], ['yes', 'COMES'], ['no', 'LATE']] as const).forEach(([k, l], i) => chip(`freighter:${k}`, 150 + i * 75, 406, 72, l, { on: v.chance.secondFreighter === k }))
  word('LANTERN ALONE', 24, 458, 'row')
  ;([['chance', 'CHANCE'], ['yes', 'ARRIVES'], ['no', 'LOST']] as const).forEach(([k, l], i) => chip(`lanternHome:${k}`, 150 + i * 75, 440, 72, l, { on: v.chance.lanternHome === k }))

  word('SHOW AN ENDING', 24, 492, 'head')
  v.endings.forEach((name, i) => chip(`ending:${i}`, 27 + (i % 2) * 176, 500 + Math.floor(i / 2) * 30, 171, name, {}, 26))

  word('FEEL', 24, 638, 'head')
  word('TYPE', 24, 664, 'row'); stepper('typing', 62, 646, v.feel.typingPerSecond)
  word('HOLD', 206, 664, 'row'); stepper('hold', 246, 646, v.feel.holdSeconds.toFixed(1))

  chip('newStory', 27, 680, 140, 'NEW STORY'); chip('go', 233, 680, 140, 'GO', { on: true })
  return { controls, words }
}

/** The control a tap at (x, y) lands on, or null. A place the moon has not got cannot be tapped. */
export function devControlAt(g: Game, v: DevPanelView, x: number, y: number): DevControlId | null {
  const hit = devLayout(g, v).controls.find(c => !c.dead && inRect(c, x, y))
  return hit ? hit.id : null
}

/** The panel, over whatever screen it was opened on. */
export function drawDevPanel(ctx: CanvasRenderingContext2D, g: Game, v: DevPanelView): void {
  const { W, H, U } = g
  const { controls, words } = devLayout(g, v)
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,.92)'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = DEV; ctx.lineWidth = 1.3 * U; ctx.setLineDash([4 * U, 4 * U])
  ctx.beginPath(); ctx.roundRect(8 * U, 8 * U, W - 16 * U, H - 16 * U, 14 * U); ctx.stroke()
  for (const c of controls) {
    ctx.setLineDash(c.off ? [3 * U, 3 * U] : [])
    ctx.lineWidth = 1.2 * U
    ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 7 * U)
    if (c.on) { ctx.fillStyle = DEV; ctx.fill() }
    else { ctx.strokeStyle = c.off ? 'rgba(255,154,60,.35)' : 'rgba(255,154,60,.8)'; ctx.stroke() }
    ctx.font = `700 ${Math.round(11 * U)}px ${FONT}`; ctx.textAlign = 'center'
    ctx.fillStyle = c.on ? '#000000' : c.off ? 'rgba(255,255,255,.4)' : '#ffffff'
    ctx.fillText(c.label, c.x + c.w / 2, c.y + c.h / 2 + 4 * U)
  }
  ctx.setLineDash([])
  for (const w of words) {
    const [weight, size, color, align] = w.kind === 'title' ? [800, 14, DEV, 'left'] as const
      : w.kind === 'head' ? [700, 10, 'rgba(255,154,60,.75)', 'left'] as const
        : w.kind === 'row' ? [600, 12, 'rgba(255,255,255,.9)', 'left'] as const
          : [800, 14, '#ffffff', 'center'] as const
    ctx.font = `${weight} ${Math.round(size * U)}px ${FONT}`; ctx.textAlign = align; ctx.fillStyle = color
    ctx.fillText(w.str, w.x, w.y)
  }
  ctx.restore()
}

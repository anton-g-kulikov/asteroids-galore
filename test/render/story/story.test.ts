import { expect, test } from 'vitest'
import { createGame } from '../../../src/game/game'
import { createRecords } from '../../../src/game/records'
import type { Game } from '../../../src/game/types'
import { drawHud } from '../../../src/render/hud'
import { drawHull } from '../../../src/render/sprites'
import { devControlAt, devLayout, devPillRect, drawDevPanel, onDevPill } from '../../../src/render/story/dev'
import { drawLantern, drawMark } from '../../../src/render/story/lantern'
import { drawManifest } from '../../../src/render/story/manifest'
import { drawOrbit, orbitBoatAt, orbitPoint, orbitWormholeAt, ORBIT_RISE } from '../../../src/render/story/orbit'
import type { OrbitView } from '../../../src/render/story/orbit'
import { drawStoryPicker, storyCardAt, storyCards } from '../../../src/render/story/picker'
import { choiceSideAt, drawChain, drawStoryScreen, drawTransmission, transmissionLength } from '../../../src/render/story/screen'
import { startEntryAt, startEntryRects } from '../../../src/render/story/start'
import type { DevPanelView, LanternView, ManifestView, PickerView, StoryScreenView, TransmissionView } from '../../../src/story/view'

interface Call { name: string; args: unknown[]; fillStyle: unknown; strokeStyle: unknown }

// A context that remembers every call, with the fill and stroke colours set at the time.
function recorder(): { ctx: CanvasRenderingContext2D; calls: Call[]; texts: () => string[] } {
  const calls: Call[] = [], state: Record<string, unknown> = {}
  const ctx = new Proxy({}, {
    get: (_t, prop: string) => prop in state ? state[prop]
      : (...args: unknown[]) => { calls.push({ name: prop, args, fillStyle: state.fillStyle, strokeStyle: state.strokeStyle }); return prop === 'measureText' ? { width: 100 } : prop === 'createLinearGradient' ? { addColorStop: () => undefined } : undefined },
    set: (_t, prop: string, value) => { state[prop] = value; return true },
  }) as CanvasRenderingContext2D
  return { ctx, calls, texts: () => calls.filter(c => c.name === 'fillText').map(c => String(c.args[0])) }
}

const game = (extra: Partial<Game> = {}): Game => Object.assign(createGame(createRecords(null)), { stateTime: 2 }, extra)

const said = (lines: string[], typed?: number): TransmissionView =>
  ({ sender: 'SURVEYOR, m00n', voice: 'first', faint: false, lines, typed: typed ?? lines.join('').length })

const lantern: LanternView = { aboard: 18, room: 36, oreAboard: true, boats: ['lost', 'ready', 'ready'] }

const screen = (extra: Partial<StoryScreenView> = {}): StoryScreenView => ({
  chain: { named: [0, 1], current: 0 }, title: 'm00n', ending: false, transmissions: [], people: null, lantern: null, counts: null, choice: null, tapToContinue: false, ...extra,
})

test('STORY-R01 with story mode in, the start screen has two entries and neither the prompt nor the best score', () => {
  const g = game({ state: 'menu', records: { best: 1200 } as Game['records'] })
  const plain = recorder(); drawHud(plain.ctx, g)
  expect(plain.texts()).toContain('TAP TO START')
  expect(plain.texts()).toContain('BEST 1,200')
  expect(plain.texts()).not.toContain('ARCADE')

  const story = recorder(); drawHud(story.ctx, g, { start: { storyLabel: 'STORY · m02n' } })
  expect(story.texts()).toContain('ARCADE')
  expect(story.texts()).toContain('STORY · m02n')
  expect(story.texts()).not.toContain('TAP TO START')
  expect(story.texts()).not.toContain('BEST 1,200')
  expect(story.texts()).toContain('LIGHTB0AT')   // the title and the hold hints stay
  expect(story.texts()).toContain('hold left')
})

test('STORY-R02 arcade is on the left and story on the right, big enough to tap, and a tap that misses both is nothing', () => {
  const g = game({ state: 'menu' })
  const r = startEntryRects(g)
  expect(r.arcade.x + r.arcade.w).toBeLessThan(r.story.x)
  expect(r.arcade.x).toBeGreaterThanOrEqual(0)
  expect(r.story.x + r.story.w).toBeLessThanOrEqual(g.W)
  expect(Math.min(r.arcade.h, r.story.h)).toBeGreaterThanOrEqual(44)
  expect(startEntryAt(g, r.arcade.x + 10, r.arcade.y + 10)).toBe('arcade')
  expect(startEntryAt(g, r.story.x + 10, r.story.y + 10)).toBe('story')
  expect(startEntryAt(g, g.W / 2, r.arcade.y + 10)).toBeNull()   // between the two
  expect(startEntryAt(g, g.W / 2, g.H * 0.8)).toBeNull()         // on a hold hint
})

test('STORY-R03 in flight the story shows the moon and the seats, with no mission counter and no score', () => {
  const g = game({ state: 'play', time: 10 })
  const { ctx, texts } = recorder()
  drawHud(ctx, g, { flight: { moon: 'm02n', still: 5, aboard: 3, seats: 8, captainAboard: false } })
  expect(texts()).toEqual(['m02n', 'ABOARD 3/8'])
})

test('STORY-R04 a transmission shows its sender and only what has been typed, with a block where the typing has got to', () => {
  const g = game()
  const lines = ['I know who works which moon.', 'Give me your radio.', '2 still on m00n.']
  const whole = recorder(); drawTransmission(whole.ctx, g, said(lines), 172)
  expect(whole.texts()).toEqual(['SURVEYOR, m00n', ...lines])
  const part = recorder(); drawTransmission(part.ctx, g, said(lines, lines[0].length + 4), 172)
  expect(part.texts()).toEqual(['SURVEYOR, m00n', lines[0], 'Give▌'])
  const none = recorder(); drawTransmission(none.ctx, g, said(lines, 0), 172)
  expect(none.texts()).toEqual(['SURVEYOR, m00n'])
  expect(transmissionLength(said(lines))).toBe(lines.join('').length)
  // the next transmission starts lower for every line of this one
  expect(drawTransmission(recorder().ctx, g, said(lines), 172)).toBeGreaterThan(drawTransmission(recorder().ctx, g, said(lines.slice(0, 1)), 172))
})

test('STORY-R05 a voice has its colour, and a faint one is dimmer with a broken line', () => {
  const g = game()
  const first = recorder(); drawTransmission(first.ctx, g, said(['One.']), 172)
  expect(first.calls.find(c => c.name === 'fillText')!.fillStyle).toBe('#5dffa0')
  expect(first.calls.some(c => c.name === 'setLineDash' && (c.args[0] as number[]).length > 0)).toBe(false)
  const foreman = recorder(); drawTransmission(foreman.ctx, g, { ...said(['Turn back.']), voice: 'foreman', faint: true, sender: 'FOREMAN, m06n' }, 172)
  expect(foreman.calls.find(c => c.name === 'fillText')!.fillStyle).toBe('#b48cff')
  expect(foreman.calls.some(c => c.name === 'setLineDash' && (c.args[0] as number[]).length > 0)).toBe(true)
})

test('STORY-R06 the chain draws one circle per named moon, and a broken stretch only where moons are not yet named', () => {
  const g = game()
  const dashes = (named: number[]) => {
    const r = recorder(); drawChain(r.ctx, g, { named: named as never, current: 2 }, 58)
    return { circles: r.calls.filter(c => c.name === 'arc').length, broken: r.calls.filter(c => c.name === 'setLineDash' && (c.args[0] as number[]).length > 0).length }
  }
  expect(dashes([0, 1, 2, 3])).toEqual({ circles: 4, broken: 0 })
  expect(dashes([0, 1, 2, 3, 6])).toEqual({ circles: 5, broken: 1 })
  expect(dashes([0, 1, 2, 3, 4, 6])).toEqual({ circles: 6, broken: 1 })
  expect(dashes([0, 1, 2, 3, 4, 5, 6])).toEqual({ circles: 7, broken: 0 })
})

test('STORY-R07 the stop after a trip shows the counts and the choice; people on the moon are STILL there, not LEFT', () => {
  const g = game()
  const { ctx, texts } = recorder()
  drawStoryScreen(ctx, g, screen({
    title: 'm02n', people: { aboard: 5, still: 4, lost: 2 }, lantern,
    counts: { lantern: 18, room: 36, moon: 'm02n', still: 4, lost: 2 },
    choice: { left: ['GO BACK', 'FOR 4'], right: ['GO ON', 'TO m03n'], held: null, progress: 0 },
  }))
  const t = texts()
  expect(t).toContain('ON THE LANTERN 18/36')
  expect(t).toContain('STILL ON m02n 4')
  expect(t).toContain('LOST 2')
  expect(t).toContain('HOLD TO CHOOSE')
  for (const w of ['GO BACK', 'FOR 4', 'GO ON', 'TO m03n']) expect(t).toContain(w)
  expect(t.some(s => s.includes('LEFT'))).toBe(false)
  expect(t).not.toContain('TAP TO CONTINUE')
})

test('STORY-R08 a screen ends with the prompt only when told to, and a choice is held by its half of the field', () => {
  const g = game()
  const done = recorder(); drawStoryScreen(done.ctx, g, screen({ transmissions: [said(['One.'])], tapToContinue: true }))
  expect(done.texts()).toContain('TAP TO CONTINUE')
  const typing = recorder(); drawStoryScreen(typing.ctx, g, screen({ transmissions: [said(['One.'], 2)] }))
  expect(typing.texts()).not.toContain('TAP TO CONTINUE')
  expect(typing.texts()).not.toContain('HOLD TO CHOOSE')
  expect(choiceSideAt(g, 10)).toBe('left')
  expect(choiceSideAt(g, g.W - 10)).toBe('right')
})

test('STORY-R09 the ring of a choice is drawn only on the side held, and grows with the hold', () => {
  const g = game()
  const rings = (held: 'left' | 'right' | null, progress: number) => {
    const r = recorder()
    drawStoryScreen(r.ctx, g, screen({ choice: { left: ['GO HOME', 'WITH THE ORE'], right: ['DROP', 'THE ORE'], held, progress } }))
    return r.calls.filter(c => c.name === 'arc' && c.args[2] === 41)
  }
  expect(rings(null, 0)).toHaveLength(0)
  expect(rings('right', 0)).toHaveLength(0)
  const half = rings('right', 0.5), full = rings('right', 1)
  expect(half).toHaveLength(1)
  expect(half[0].args[0]).toBeGreaterThan(g.W / 2)
  expect(Number(full[0].args[4])).toBeGreaterThan(Number(half[0].args[4]))
})

test('STORY-R10 the Lantern has a green place for each person aboard, and ore only while it is aboard', () => {
  const g = game()
  const count = (v: LanternView) => {
    const r = recorder(); drawLantern(r.ctx, g, v, 200, 156)
    return {
      green: r.calls.filter(c => c.name === 'fill' && c.fillStyle === '#5dffa0').length,
      ore: r.calls.filter(c => c.name === 'fillRect').length,
    }
  }
  expect(count(lantern)).toEqual({ green: 18, ore: 34 })
  expect(count({ ...lantern, aboard: 40, room: 70, oreAboard: false })).toEqual({ green: 40, ore: 0 })
  expect(count({ ...lantern, aboard: 0 })).toEqual({ green: 0, ore: 34 })
})

test('STORY-R11 the cockpit glass is the ship\'s blue unless told, and a lost boat is only a broken outline', () => {
  const glass = (look?: { glass?: string; lost?: boolean }) => {
    const r = recorder(); drawHull(r.ctx, 20, 2, 0, false, look)
    return { fills: r.calls.filter(c => c.name === 'fill').map(c => c.fillStyle), dashed: r.calls.some(c => c.name === 'setLineDash') }
  }
  expect(glass().fills).toContain('#5ff5ff')
  expect(glass().fills).not.toContain('#5dffa0')
  expect(glass({ glass: '#5dffa0' }).fills).toContain('#5dffa0')
  expect(glass({ lost: true })).toEqual({ fills: [], dashed: true })
})

test('STORY-R12 the picker keeps a lost boat in its place, where it cannot be held', () => {
  const g = game()
  const v: PickerView = { boats: [{ ship: 1, lost: true }, { ship: 2, lost: false }, { ship: 3, lost: false }], held: 3, progress: 0.5, captainAboard: true }
  const cards = storyCards(g, v)
  expect(cards.map(c => c.ship)).toEqual([1, 2, 3])
  expect(cards[0].x + cards[0].w).toBeLessThanOrEqual(cards[1].x)
  expect(storyCardAt(g, v, cards[0].x + 5)).toBeNull()
  expect(storyCardAt(g, v, cards[1].x + 5)).toBe(2)
  expect(storyCardAt(g, v, g.W - 1)).toBe(3)
  const r = recorder(); drawStoryPicker(r.ctx, g, v)
  expect(r.texts()).toEqual(['HOLD TO CHOOSE'])
  expect(r.calls.filter(c => c.name === 'fill' && c.fillStyle === '#5dffa0')).toHaveLength(1)   // the held boat's glass
})

const manifest: ManifestView = {
  callsign: 'WANDERING TORTOISE 42', heading: 'CAPTAIN WANDERING TORTOISE 42',
  rows: [{ moon: 0, marks: ['earth', 'earth'] }, { moon: 1, marks: ['earth', 'left'] }, { moon: 4, marks: ['anotherShip'] }],
  counts: [{ mark: 'earth', label: 'ON EARTH', value: 3 }, { mark: 'anotherShip', label: 'BY ANOTHER SHIP', value: 1 }, { mark: 'left', label: 'LEFT BEHIND', value: 1 }, { mark: 'dead', label: 'DEAD', value: 0 }],
  countsShown: 4, cargo: 'COMMISSION PAID',
  lamps: ['THE COMMISSION', 'PAST THE LIST', 'A FULL SHIP', 'THE EMPTY RAIL', 'HOME', 'THE LIGHT THAT STAYED', 'LIGHTBOAT', 'LOST AT THE HEART']
    .map((name, i) => ({ name, lit: i === 0 || i === 4, justReached: i === 0 })),
}

test('STORY-R13 the manifest names the captain, a row per named moon, the counts, the cargo, and only the lamps that are lit', () => {
  const g = game()
  const { ctx, texts, calls } = recorder()
  drawManifest(ctx, g, manifest)
  expect(texts()).toEqual([
    'THE MANIFEST', 'CAPTAIN WANDERING TORTOISE 42', 'm00n', 'm01n', 'm04n',
    '3', 'ON EARTH', '1', 'BY ANOTHER', 'SHIP', '1', 'LEFT BEHIND', '0', 'DEAD',
    'COMMISSION PAID', 'THE COMMISSION', 'HOME', 'TAP TO CONTINUE',
  ])
  expect(calls.filter(c => c.name === 'fillRect')).toHaveLength(3)   // three dots for the moons never named, between m01n and m04n
  expect(calls.filter(c => c.name === 'rect')).toHaveLength(8)       // eight lamps
  const bare = recorder(); drawManifest(bare.ctx, g, { ...manifest, callsign: '', heading: 'CAPTAIN' })
  expect(bare.texts()[1]).toBe('CAPTAIN')   // with no callsign, the one word alone
  // the counts arrive one after another, each in the place it keeps
  const two = recorder(); drawManifest(two.ctx, g, { ...manifest, countsShown: 2 })
  expect(two.texts()).toEqual(expect.arrayContaining(['ON EARTH', 'BY ANOTHER', 'SHIP']))
  expect(two.texts()).not.toContain('LEFT BEHIND')
  expect(two.texts()).not.toContain('DEAD')
  const xOf = (r: ReturnType<typeof recorder>) => r.calls.find(c => c.name === 'fillText' && c.args[0] === 'ON EARTH')!.args[1]
  expect(xOf(two)).toBe(xOf({ ctx, calls, texts }))
})

const dev = (extra: Partial<DevPanelView> = {}): DevPanelView => ({
  moon: 2, place: 'stop', places: ['trip', 'afterTrip', 'stop', 'leaving', 'boats'], inFlight: false,
  state: { lantern: 18, still: 4, lost: 2, boats: [false, true, true], oreAboard: true },
  trip: { aboard: 3, shields: 2 }, chance: { secondFreighter: 'chance', lanternHome: 'yes' },
  endings: manifest.lamps.map(l => l.name), feel: { typingPerSecond: 60, holdSeconds: 1.2 }, invincible: false, ...extra,
})

test('STORY-R14 every control of the dev panel is inside the field, clear of the others, and named once', () => {
  const g = game()
  for (const v of [dev(), dev({ inFlight: true })]) {
    const { controls } = devLayout(g, v)
    expect(new Set(controls.map(c => c.id)).size).toBe(controls.length)
    for (const c of controls) {
      expect(c.x).toBeGreaterThanOrEqual(8); expect(c.x + c.w).toBeLessThanOrEqual(g.W - 8)
      expect(c.y).toBeGreaterThanOrEqual(8); expect(c.y + c.h).toBeLessThanOrEqual(g.H - 8)
    }
    controls.forEach((a, i) => controls.slice(i + 1).forEach(b => {
      const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y
      expect(apart, `${a.id} and ${b.id}`).toBe(true)
    }))
  }
})

test('STORY-R15 a tap on the dev panel names what it hit; a place the moon has not got cannot be tapped', () => {
  const g = game(), v = dev()
  const at = (id: string) => { const c = devLayout(g, v).controls.find(c => c.id === id)!; return devControlAt(g, v, c.x + c.w / 2, c.y + c.h / 2) }
  for (const id of ['close', 'go', 'newStory', 'moon:5', 'place:leaving', 'lantern:+', 'still:-', 'boat:1', 'ore:dropped', 'freighter:no', 'lanternHome:chance', 'ending:7', 'typing:+', 'hold:-']) expect(at(id)).toBe(id)
  expect(at('place:choice')).toBeNull()                                   // m02n has no choice of its own
  expect(devControlAt(g, v, 12, g.H / 2)).toBeNull()
  const ids = (view: DevPanelView) => devLayout(g, view).controls.map(c => c.id)
  expect(ids(dev({ inFlight: true }))).toEqual(expect.arrayContaining(['endTrip', 'loseBoat', 'toWormhole', 'aboard:+', 'shields:-']))
  expect(ids(dev())).not.toContain('endTrip')
  expect(ids(dev({ inFlight: true }))).not.toContain('ore:aboard')
  const r = recorder(); drawDevPanel(r.ctx, g, v)
  expect(r.texts()).toEqual(expect.arrayContaining(['DEV · STORY', 'STILL ON m02n', '60', '1.2', 'LOST AT THE HEART']))
})

test('STORY-R16 the DEV pill sits top centre and takes a thumb', () => {
  const g = game()
  const r = devPillRect(g)
  expect(r.x + r.w / 2).toBe(g.W / 2)
  expect(r.y + r.h).toBeLessThan(40)
  expect(onDevPill(g, g.W / 2, r.y + r.h / 2)).toBe(true)
  expect(onDevPill(g, g.W / 2, r.y + r.h + 8)).toBe(true)   // a little below still counts
  expect(onDevPill(g, 30, 20)).toBe(false)
  expect(onDevPill(g, g.W / 2, 120)).toBe(false)
})

const orbit = (extra: Partial<OrbitView> = {}): OrbitView => ({ at: 0.4, laps: 0, captainAboard: false, ...extra })
const discs = (calls: Call[], colour: string, r: number): Call[] => calls.filter((c, i) => c.name === 'arc' && c.args[2] === r && calls[i + 1]?.name === 'fill' && calls[i + 1].fillStyle === colour)

test('STORY-R17 the orbit is a slight arc: its ends sit where the straight bar does and its middle stands 18 above them', () => {
  const g = game()
  const left = orbitPoint(g, 0), mid = orbitPoint(g, 0.5), right = orbitPoint(g, 1)
  expect(left.x).toBeCloseTo(14); expect(right.x).toBeCloseTo(g.W - 14)
  expect(left.y).toBeCloseTo(g.H - 16); expect(right.y).toBeCloseTo(g.H - 16)
  expect(mid.x).toBeCloseTo(g.W / 2); expect(mid.y).toBeCloseTo(g.H - 16 - ORBIT_RISE)
  for (let t = 0.05; t < 1; t += 0.05) expect(orbitPoint(g, t).x).toBeGreaterThan(orbitPoint(g, t - 0.05).x)
})

test('STORY-R18 the orbit marks one pip per lap flown, and a wormhole only while the field has one', () => {
  const g = game()
  const violet = (calls: Call[]) => calls.filter(c => c.name === 'stroke' && c.strokeStyle === '#b48cff').length
  const a = recorder(); drawOrbit(a.ctx, g, orbit({ laps: 2 }))
  expect(discs(a.calls, '#7fdcff', 2.4)).toHaveLength(2)
  expect(violet(a.calls)).toBe(0)                       // no wormhole at the start
  g.wormhole = { x: 200, y: 100, r: 34 }
  const b = recorder(); drawOrbit(b.ctx, g, orbit({ laps: 1 }))
  expect(violet(b.calls)).toBe(1)
  expect(a.calls.some(c => c.fillStyle === '#ffe66b')).toBe(false)   // nobody knows in advance where people are
})

test('STORY-R19 the boat on the orbit is an open ">" at its mark, unfilled, in the line of light, and green when the captain is aboard', () => {
  const g = game()
  const a = recorder(); drawOrbit(a.ctx, g, orbit({ laps: 1 }))
  const p = orbitPoint(g, 0.5)
  const at = a.calls.findIndex(c => c.name === 'translate' && c.args[0] === p.x && c.args[1] === p.y)
  expect(at).toBeGreaterThan(-1)
  const boat = a.calls.slice(at)
  expect(boat.filter(c => c.name === 'lineTo')).toHaveLength(2)          // two strokes meeting at the point: >
  expect(boat.some(c => c.name === 'fill' || c.name === 'closePath')).toBe(false)
  expect(boat.filter(c => c.name === 'stroke').map(c => c.strokeStyle)).toEqual(['#5ff5ff'])
  const b = recorder(); drawOrbit(b.ctx, g, orbit({ captainAboard: true }))
  expect(b.calls.filter(c => c.name === 'stroke').pop()?.strokeStyle).toBe('#5dffa0')
})

test('STORY-R22 the orbit shows flying in circles: the mark eases to the top in the first lap and stays; a wormhole comes over the far end, meets the mark at the boat and fades behind it', () => {
  expect(orbitBoatAt({ at: 0, laps: 0 })).toBe(0)
  expect(orbitBoatAt({ at: 0.5, laps: 0 })).toBeCloseTo(0.375)
  expect(orbitBoatAt({ at: 1, laps: 0 })).toBeCloseTo(0.5)
  expect(orbitBoatAt({ at: 0.1, laps: 3 })).toBe(0.5)
  const g = game()
  const w = (y: number) => { g.wormhole = { x: 200, y, r: 34 }; return orbitWormholeAt(g, 0.5)! }
  expect(orbitWormholeAt(g, 0.5)).toBeNull()
  expect(w(-64).t).toBeCloseTo(1)               // just opened, above the field: at the far end
  expect(w(g.ship.y)).toEqual({ t: 0.5, alpha: 1 })   // at the boat: at the mark
  expect(w(300).t).toBeGreaterThan(w(500).t)    // coming closer, it moves towards the mark
  const behind = w(g.ship.y + 80)               // passed: behind the mark, fading, at the same pace
  expect(behind.t).toBeLessThan(0.5)
  expect(behind.alpha).toBeGreaterThan(0); expect(behind.alpha).toBeLessThan(1)
  expect(0.5 - behind.t).toBeCloseTo(w(g.ship.y - 80).t - 0.5)
  expect(w(g.H + 10 + 34).alpha).toBeCloseTo(0)   // gone below the field: gone from the arc
})

test('STORY-R20 a story flight with an orbit draws it in place of the straight bar; without one the bar stays', () => {
  const g = game({ state: 'play', time: 10 })
  const flight = { moon: 'm02n', still: 5, aboard: 3, seats: 8, captainAboard: false }
  const bar = (calls: Call[]): boolean => calls.some(c => c.name === 'fillRect' && c.args[0] === 14 && c.args[3] === 4)
  const a = recorder(); drawHud(a.ctx, g, { flight })
  expect(bar(a.calls)).toBe(true)
  const b = recorder(); drawHud(b.ctx, g, { flight, orbit: orbit({ laps: 1 }) })
  expect(bar(b.calls)).toBe(false)
  expect(discs(b.calls, '#7fdcff', 2.4)).toHaveLength(1)
})

test('STORY-R21 someone the second freighter did not reach is a violet ring, apart from the pale ring of the left behind', () => {
  const g = game()
  const a = recorder(); drawMark(a.ctx, g, 100, 100, 'unreached')
  expect(a.calls.filter(c => c.name === 'stroke').map(c => c.strokeStyle)).toEqual(['#b48cff'])
  expect(a.calls.some(c => c.name === 'fill')).toBe(false)
  const b = recorder(); drawMark(b.ctx, g, 100, 100, 'left')
  expect(b.calls.filter(c => c.name === 'stroke').map(c => c.strokeStyle)).toEqual(['#8fc4cc'])
})

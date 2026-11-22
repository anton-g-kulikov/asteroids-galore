import { expect, test } from 'vitest'
import { createStoryController } from '../../src/story/controller'
import { defaultsFor, endingState, jumpState, placesAt } from '../../src/story/dev'
import { peopleOn } from '../../src/story/manifest'
import { ENDINGS, lanternAboard } from '../../src/story/story'
import type { MoonIndex } from '../../src/story/view'

const ctl = (initial: ReturnType<typeof jumpState>, afterTrip = false) =>
  createStoryController({ store: null, callsign: () => 'COSMIC OTTER 42', rand: () => 0.99, dev: true, initial, afterTrip })

test('STORY-D01 every moon and place jumps to a story that could have happened, and plays on from there', () => {
  for (let m = 0; m <= 6; m++) {
    const moon = m as MoonIndex
    for (const place of placesAt(moon)) {
      const s = jumpState(moon, place, defaultsFor(moon))
      const c = ctl(s, place === 'afterTrip')
      const want = place === 'trip' ? 'flight' : place === 'boats' ? 'picker' : 'screen'
      expect(c.mode, `m0${m}n ${place}`).toBe(want)
      expect(lanternAboard(s), `m0${m}n ${place}`).toBeLessThanOrEqual(s.oreAboard ? 36 : 70)
      for (const n of s.named) expect(n <= moon + 1 || n === 6).toBe(true)   // m03n is named leaving m01n, so it is known on arrival at m02n
      if (place === 'afterTrip') expect(c.screenView()!.transmissions.length).toBeGreaterThan(0)
    }
  }
  expect(placesAt(3)).toContain('choice')
  expect(placesAt(2)).not.toContain('choice')
})

test('STORY-D02 the steppers set the state: the Lantern\'s people, those still on the moon and lost, the boats, the ore', () => {
  const s = jumpState(2, 'stop', { lantern: 5, still: 4, lost: 2, boats: [false, true, true], oreAboard: true })
  expect([lanternAboard(s) - s.saved[2], s.dead[2], 11 - s.saved[2] - s.dead[2], s.boats]).toEqual([5, 2, 4, ['lost', 'ready', 'ready']])
  const c = ctl(s)
  expect(c.screenView()!.choice).toMatchObject({ left: ['GO BACK', 'FOR 4'] })
})

test('STORY-D03 any of the eight endings can be shown, with its manifest, from the state as set', () => {
  for (const e of ENDINGS) {
    const s = endingState(e, 4, defaultsFor(4), 6, true)
    const c = ctl(s)
    expect(c.state.ending).toBe(e)
    expect(c.mode, e).toBe(e === 'lostAtTheHeart' ? 'manifest' : 'screen')
    if (e !== 'lostAtTheHeart') expect(c.screenView()!.ending).toBe(true)
    for (let i = 0; i < 40 && c.mode === 'screen'; i++) c.tap()
    expect(c.mode).toBe('manifest')
    expect(c.manifestView()!.rows.flatMap(r => r.marks).length).toBe(peopleOn(s))
  }
})

test('STORY-D04 the panel has an INVINCIBLE switch on its title row, clear of every other control, lit while on', async () => {
  const { createGame } = await import('../../src/game/game')
  const { createRecords } = await import('../../src/game/records')
  const { devLayout, devControlAt } = await import('../../src/render/story/dev')
  const g = createGame(createRecords(null))
  const view = (invincible: boolean, inFlight: boolean) => ({
    moon: 2 as MoonIndex, place: 'trip' as const, places: placesAt(2), inFlight, state: { ...defaultsFor(2) }, trip: { aboard: 0, shields: 3 },
    chance: { secondFreighter: 'chance' as const, lanternHome: 'chance' as const }, endings: ENDINGS.map(String), feel: { typingPerSecond: 60, holdSeconds: 1.2 }, invincible,
  })
  for (const inFlight of [false, true]) {
    const { controls } = devLayout(g, view(true, inFlight))
    const sw = controls.find(c => c.id === 'invincible')!
    expect([sw.label, sw.on]).toEqual(['INVINCIBLE', true])
    const overlaps = controls.filter(c => c !== sw && c.x < sw.x + sw.w && sw.x < c.x + c.w && c.y < sw.y + sw.h && sw.y < c.y + c.h)
    expect(overlaps).toEqual([])
    expect(devControlAt(g, view(false, inFlight), sw.x + sw.w / 2, sw.y + sw.h / 2)).toBe('invincible')
  }
  expect(devLayout(g, view(false, false)).controls.find(c => c.id === 'invincible')!.on).toBe(false)
})

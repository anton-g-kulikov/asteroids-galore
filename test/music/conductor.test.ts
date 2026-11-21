import { expect, test } from 'vitest'
import { MUSIC_KEY, createConductor, type MusicEngine } from '../../src/music/conductor'
import { MUSIC } from '../../src/music/score'
import { createGame } from '../../src/game/game'
import { createRecords } from '../../src/game/records'
import { SLOW_TIME } from '../../src/game/tuning'
import type { Game } from '../../src/game/types'

function fakeEngine() {
  const calls: string[] = [], levels: number[] = []
  let last = ''
  const engine: MusicEngine = {
    start: () => void calls.push('start'),
    stop: fade => void calls.push(`stop ${fade}`),
    gameOver: () => void calls.push('over'),
    dropLayers: fade => void calls.push(`drop ${fade}`),
    slowMotion: () => void calls.push('slow'),
    chord: () => 3,
    setOn: on => void calls.push(`on ${on}`),
    set: (mode, speed, depth, level) => { last = `${mode} ${speed} ${Math.round(depth * 10) / 10}`; levels.push(level) },
  }
  return { engine, calls, levels, last: () => last }
}

function setup(stored: Record<string, string> = {}) {
  const data = new Map(Object.entries(stored))
  const store = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) }
  const g = createGame(createRecords(null))
  const c = createConductor(store)
  const e = fakeEngine()
  return { g, c, e, data, frame: (gg: Game = g) => c.frame(gg) }
}

test('MUS-06 the music follows the game', () => {
  const t = setup()
  t.c.attach(t.e.engine)
  t.frame()
  expect(t.e.calls).toEqual(['on true'])                     // the start screen is silent
  expect(t.e.last()).toBe('silent 1 0')
  Object.assign(t.g, { state: 'play', speed: 1.5 }); t.frame()
  expect(t.e.calls.slice(-1)).toEqual(['start'])
  expect(t.e.last()).toBe('flying 1.5 0')
  // slow motion is passed on once, when it starts, not on every frame of it
  t.g.slowmo = SLOW_TIME; t.frame()
  expect(t.e.calls.slice(-1)).toEqual(['slow'])
  for (const left of [1.2, 0.9, 0.5, 0.1]) { t.g.slowmo = left; t.frame() }
  expect(t.e.calls.filter(x => x === 'slow')).toHaveLength(1)
  expect(t.e.last()).toBe('flying 1.5 0.2')                // the depth with 0.1 s left, for the notes' pitch
  t.g.slowmo = 0; t.frame()
  // a wormhole: everything but the pad drops over 0.5 s; the stop plays the pad
  t.g.events.push({ kind: 'enter' }); t.g.state = 'between'; t.frame()
  expect(t.e.calls.slice(-1)).toEqual([`drop ${MUSIC.drop}`])
  expect(t.e.last()).toBe('results 1.5 0')
  // the next mission flies again, without starting over
  t.g.events.length = 0
  Object.assign(t.g, { state: 'play', speed: 1.4 }); t.frame()
  expect(t.e.calls.filter(x => x === 'start')).toHaveLength(1)
  expect(t.e.last()).toBe('flying 1.4 0')
  // destroyed: the music fades and the game-over screen plays its bass (MUS-17)
  t.g.events.push({ kind: 'destroyed' }); t.g.state = 'over'; t.frame()
  expect(t.e.calls.slice(-1)).toEqual(['over'])
  expect(t.e.last()).toBe('over 1.4 0')
  // a new run starts it again
  t.g.events.length = 0
  Object.assign(t.g, { state: 'launch', speed: 1 }); t.frame()
  expect(t.e.calls.slice(-1)).toEqual(['start'])
  // home: faded over 2.5 s
  t.g.events.push({ kind: 'home' }); t.g.state = 'won'; t.frame()
  expect(t.e.calls.slice(-1)).toEqual([`stop ${MUSIC.stopHome}`])
  // the events are left for the sound effects
  expect(t.g.events).toEqual([{ kind: 'home' }])
})

test('MUS-07 music that arrives late joins the game where it is', () => {
  const t = setup()
  Object.assign(t.g, { state: 'play', speed: 2.2 })
  t.frame(); t.frame()                                        // nothing to play yet: nothing breaks
  t.c.attach(t.e.engine)
  expect(t.e.calls).toEqual(['on true', 'start'])
  expect(t.e.last()).toBe('flying 2.2 0')
  // arriving between missions: started, on the pad
  const b = setup()
  b.g.state = 'between'
  b.frame()
  b.c.attach(b.e.engine)
  expect(b.e.calls).toEqual(['on true', 'start'])
  expect(b.e.last()).toBe('results 1 0')
  // arriving on the start screen: silent
  const m = setup()
  m.frame(); m.c.attach(m.e.engine)
  expect(m.e.calls).toEqual(['on true'])
})

test('MUS-08 the music switch is its own, on by default and remembered', () => {
  const t = setup()
  t.c.attach(t.e.engine)
  expect(t.c.on).toBe(true)
  t.c.toggle()
  expect([t.c.on, t.data.get(MUSIC_KEY), t.e.calls.slice(-1)[0]]).toEqual([false, '0', 'on false'])
  expect(setup({ [MUSIC_KEY]: '0' }).c.on).toBe(false)
  t.c.toggle()
  expect([t.c.on, t.data.get(MUSIC_KEY), t.e.calls.slice(-1)[0]]).toEqual([true, '1', 'on true'])
  // switched off before the music arrives: it arrives silent
  const off = setup({ [MUSIC_KEY]: '0' })
  off.c.attach(off.e.engine)
  expect(off.e.calls[0]).toBe('on false')
  // a storage that throws does not break it
  const broken = createConductor({ getItem() { throw new Error('x') }, setItem() { throw new Error('x') } })
  expect(broken.on).toBe(true)
  broken.toggle()
  expect(broken.on).toBe(false)
})

test('MUS-14 the conductor passes the mission to the music', () => {
  const t = setup()
  t.c.attach(t.e.engine)
  Object.assign(t.g, { state: 'play', level: 3 }); t.frame()
  expect(t.e.levels.slice(-1)).toEqual([3])
})

test('SFX-07 the effects follow the music\'s chord, or A minor when there is none', () => {
  const t = setup()
  expect(t.c.chord()).toBe(0)                                  // not loaded
  t.c.attach(t.e.engine)
  t.frame()
  expect(t.c.chord()).toBe(0)                                  // loaded, but the start screen is silent
  Object.assign(t.g, { state: 'play' }); t.frame()
  expect(t.c.chord()).toBe(3)                                  // playing: the music's chord
  t.c.toggle()
  expect(t.c.chord()).toBe(0)                                  // the music switched off
})

test('MUS-15 on the start screen the note starts the drone', () => {
  const t = setup()
  t.c.attach(t.e.engine)
  t.frame()
  expect(t.e.calls).toEqual(['on true'])                       // silent until the note is tapped
  t.c.press(t.g); t.frame()
  expect(t.c.on).toBe(true)                                    // a tap that starts the drone does not switch it off
  expect(t.e.calls.slice(-1)).toEqual(['start'])
  expect(t.e.last()).toBe('results 1 0')                       // the pad alone, as between missions
  t.c.press(t.g); t.frame()
  expect(t.c.on).toBe(false)                                   // while it plays, the note switches the music off
  expect(t.e.calls.slice(-1)).toEqual(['on false'])
  t.c.press(t.g); t.frame()
  expect(t.c.on).toBe(true)
  // the drone carries on into the run: the loop is not started again
  t.g.state = 'launch'; t.frame()
  expect(t.e.last()).toBe('flying 1 0')
  t.g.state = 'play'; t.frame()
  expect(t.e.calls.filter(x => x === 'start')).toHaveLength(1)

  // with the music off, the note switches it on with the drone
  const off = setup({ [MUSIC_KEY]: '0' })
  off.c.attach(off.e.engine)
  off.c.press(off.g); off.frame()
  expect(off.c.on).toBe(true)
  expect(off.data.get(MUSIC_KEY)).toBe('1')
  expect(off.e.calls).toEqual(['on false', 'on true', 'start'])
  // tapped before the music has loaded: it arrives playing the drone
  const late = setup()
  late.c.press(late.g); late.frame()
  late.c.attach(late.e.engine)
  expect(late.e.calls).toEqual(['on true', 'start'])
  expect(late.c.on).toBe(true)
  // between missions the note only toggles
  const b = setup()
  b.c.attach(b.e.engine)
  b.g.state = 'between'; b.frame()
  b.c.press(b.g)
  expect(b.c.on).toBe(false)
})

test('MUS-16 the music starts with the fly-in', () => {
  const t = setup()
  t.c.attach(t.e.engine)
  t.frame()
  t.g.state = 'launch'; t.frame()
  expect(t.e.calls.slice(-1)).toEqual(['start'])
  expect(t.e.last()).toBe('flying 1 0')
})

test('MUS-17 the ship destroyed hands over to the game-over bass; a new run cuts it', () => {
  const t = setup()
  t.c.attach(t.e.engine)
  Object.assign(t.g, { state: 'play', speed: 1.8 }); t.frame()
  t.g.events.push({ kind: 'destroyed' }); t.g.state = 'over'; t.frame()
  expect(t.e.calls.filter(c => c === 'over')).toHaveLength(1)
  expect(t.e.calls.filter(c => c.startsWith('stop'))).toEqual([])        // faded by the engine, not stopped
  t.g.events.length = 0
  for (let i = 0; i < 5; i++) t.frame()
  expect(t.e.last()).toBe('over 1.8 0')
  expect(t.e.calls.filter(c => c === 'start')).toHaveLength(1)           // the bass plays on the running loop
  // the music switch governs it
  t.c.toggle()
  expect(t.e.calls.slice(-1)).toEqual(['on false'])
  t.c.toggle()
  // a new run: the loop starts again from the top
  t.g.state = 'launch'; t.frame()
  expect(t.e.calls.slice(-1)).toEqual(['start'])
  expect(t.e.last()).toBe('flying 1.8 0')
  // home is as before: a 2.5 s fade to silence
  t.g.events.push({ kind: 'home' }); t.g.state = 'won'; t.frame()
  expect(t.e.calls.slice(-1)).toEqual([`stop ${MUSIC.stopHome}`])
  expect(t.e.last()).toBe('silent 1.8 0')
  // the music arriving on the game-over screen plays the bass
  const late = setup()
  late.g.state = 'over'; late.frame()
  late.c.attach(late.e.engine)
  expect(late.e.calls).toEqual(['on true', 'start'])
  expect(late.e.last()).toBe('over 1 0')
})

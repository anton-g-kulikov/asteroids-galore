// The listening page (audition.html, on the dev server only): a button for
// every sound, and for the events as the game plays them.
import type { SoundEvent } from '../game/events'
import { createGame } from '../game/game'
import { createRecords } from '../game/records'
import { SLOW_SCALE, SLOW_TIME } from '../game/tuning'
import { createConductor } from '../music/conductor'
import { MUSIC } from '../music/score'
import { createSoundPlayer, type EffectsOut } from './player'
import { scoredFor, scoredPulse } from './scored'
import { PULSE, SOUNDS, type SoundName } from './sounds'
import { createWebAudio } from './webAudio'

const player = createSoundPlayer({ storage: null, createAudio: createWebAudio })
const slow = document.getElementById('slow') as HTMLInputElement
const pitch = () => (slow.checked ? SLOW_SCALE : 1)
// Which set the event buttons play: v2 (what the game plays once Tone.js has loaded) or the live set before it (v1).
const setV2 = document.getElementById('setV2') as HTMLInputElement
let fx: EffectsOut | null = null
const v2 = () => setV2.checked && fx !== null
const semis = () => (slow.checked ? MUSIC.slow.semis : 0)
const playEvent = (e: SoundEvent) => { if (v2()) fx!.play(scoredFor(e, music.chord(), semis())); else player.audition(e, pitch()) }

type Item = { label: string; note: string; play: () => void }
const sound = (name: SoundName, note: string): Item => ({ label: name, note, play: () => player.audition(name, pitch()) })
const event = (label: string, note: string, e: SoundEvent): Item => ({ label, note, play: () => playEvent(e) })
const sequence = (label: string, note: string, events: SoundEvent[], gap: number): Item => ({
  label, note, play: () => events.forEach((e, i) => setTimeout(() => playEvent(e), i * gap * 1000)),
})

const groups: [string, Item[]][] = [
  ['Crew', [
    event('One crew saved', 'the first seat', { kind: 'save', seat: 1, seats: 8 }),
    sequence('Three saved at once', 'three quick notes, climbing', [1, 2, 3].map(seat => ({ kind: 'save', seat, seats: 8 })), 0.07),
    sequence('Filling the 12-seater', 'one per seat, then the full chord', [...Array.from({ length: 12 }, (_, i) => ({ kind: 'save' as const, seat: i + 1, seats: 12 })), { kind: 'full' }], 0.12),
    event('Ship full', 'the chord on its own', { kind: 'full' }),
    event('One left behind', 'a low falling note', { kind: 'missed', count: 1 }),
    event('Three left behind', 'one note each, a beat apart', { kind: 'missed', count: 3 }),
  ]],
  ['Danger', [
    event('Hit by a small rock', 'the smallest, radius 14: short and high', { kind: 'hit', size: 14, shieldsLeft: 2 }),
    event('Hit by a middle rock', 'radius 30', { kind: 'hit', size: 30, shieldsLeft: 2 }),
    event('Hit by a big rock', 'the biggest, radius 50: long and low', { kind: 'hit', size: 50, shieldsLeft: 2 }),
    event('Hit on the last shield', 'the shield is gone: a warning on top', { kind: 'hit', size: 30, shieldsLeft: 0 }),
    sequence('Hit, one thrown off', 'the hit, then the left-behind note', [{ kind: 'hit', size: 30, shieldsLeft: 2 }, { kind: 'missed', count: 1 }], 0),
    event('Shield picked up', 'a bright rising sweep', { kind: 'shield' }),
    event('Ship destroyed', 'a long burst fading to silence', { kind: 'destroyed' }),
  ]],
  ['Wormholes', [
    { label: 'Pulse, far', note: 'as it appears at the top', play: () => player.audition('pulse', pitch()) },
    sequence('Pulse, coming closer', 'four pulses, getting louder', [], 0),
    event('Wormhole entered', 'a sweep upward', { kind: 'enter' }),
    event('Made it home', 'the chord, held', { kind: 'home' }),
  ]],
  ['Between missions', [
    event('Choose ship 1', '4 seats', { kind: 'choice', ship: 1 }),
    event('Choose ship 2', '8 seats: lower', { kind: 'choice', ship: 2 }),
    event('Choose ship 3', '12 seats: lowest', { kind: 'choice', ship: 3 }),
    event('Move the fleet mark', 'the same click, quieter', { kind: 'mark', ship: 2 }),
  ]],
  ['Every sound, raw', (Object.keys(SOUNDS) as SoundName[]).map(n => sound(n, `${SOUNDS[n].length} voice${SOUNDS[n].length > 1 ? 's' : ''}`))],
]

// the pulse coming closer: louder each time, as in the game
const closer = groups[2][1][1]
closer.play = () => [0, 0.35, 0.7, 1].forEach((near, i) => setTimeout(() => {
  if (v2()) fx!.play(scoredPulse(PULSE.quiet + (PULSE.loud - PULSE.quiet) * near, music.chord(), semis()))
  else player.auditionPulse(near, pitch())
}, i * 900))

const list = document.getElementById('list')!
for (const [title, items] of groups) {
  const h = document.createElement('h2'); h.textContent = title; list.append(h)
  const grid = document.createElement('div'); grid.className = 'grid'; list.append(grid)
  for (const item of items) {
    const b = document.createElement('button')
    b.innerHTML = `${item.label}<small>${item.note}</small>`
    b.addEventListener('click', () => { startAudio(); item.play() })
    grid.append(b)
  }
}

// ---- The music, through the same conductor the game uses ----
const music = createConductor(null)
const game = createGame(createRecords(null))
let loading = false
function startAudio() {
  player.unlock()
  if (loading || !player.context) return
  loading = true
  void Promise.all([import('../music/engine'), import('../music/effects')]).then(([m, effects]) => {
    const engine = m.createMusicEngine(player.context!)
    music.attach(engine)
    fx = effects.createEffects(player.context!)
    player.attachEffects(fx, () => music.chord())   // the music section's run plays v2, as the game does
    ;(window as unknown as { __music: () => unknown }).__music = () => engine.inspect()   // for checking by hand
  })
}
const speedInput = document.getElementById('speed') as HTMLInputElement
const rise = document.getElementById('rise') as HTMLInputElement
const speedNote = document.getElementById('speedNote')!
speedInput.addEventListener('input', () => { rise.checked = false; game.speed = +speedInput.value })

const controls: [string, string, () => void][] = [
  ['Start a run', 'from 1x, silent start screen before', () => { Object.assign(game, { state: 'play', speed: 1, slowmo: 0, level: 1 }); speedInput.value = '1'; rise.checked = true }],
  ['Slow motion', 'as when two crews come into view', () => { if (game.state === 'play') game.slowmo = SLOW_TIME }],
  ['Into a wormhole', 'all but the pad drop; the stop between missions', () => { if (game.state === 'play') { game.events.push({ kind: 'enter' }); game.state = 'between' } }],
  ['Next mission', 'from mission 2 the bass is in at once', () => { if (game.state === 'between') { game.level = Math.min(7, game.level + 1); game.state = 'play' } }],
  ['Ship destroyed', 'the music stops in 0.3 s', () => { if (game.state === 'play') { game.events.push({ kind: 'destroyed' }); game.state = 'over' } }],
  ['Made it home', 'the music fades over 2.5 s', () => { if (game.state === 'play') { game.events.push({ kind: 'home' }); game.state = 'won' } }],
  ['Music on / off', 'its own switch, apart from the sound effects', () => music.toggle()],
]
const grid = document.getElementById('music')!
for (const [label, note, act] of controls) {
  const b = document.createElement('button')
  b.innerHTML = `${label}<small>${note}</small>`
  b.addEventListener('click', () => { startAudio(); act() })
  grid.append(b)
}

let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.25, (now - last) / 1000); last = now
  if (game.state === 'play') {
    if (game.slowmo > 0) game.slowmo = Math.max(0, game.slowmo - dt)
    if (rise.checked) game.speed = Math.min(4.5, game.speed + dt * 0.03)   // about a mission's rise
    speedInput.value = String(game.speed)
  }
  speedNote.textContent = `${game.speed.toFixed(2)}x`
  music.frame(game)
  player.frame(game, dt)            // plays the wormhole, destroyed and home sounds, and empties the events
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

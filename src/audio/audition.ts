// The listening page (audition.html, on the dev server only): a button for
// every sound, and for the events as the game plays them.
import type { SoundEvent } from '../game/events'
import { SLOW_SCALE } from '../game/tuning'
import { createSoundPlayer } from './player'
import { SOUNDS, type SoundName } from './sounds'
import { createWebAudio } from './webAudio'

const player = createSoundPlayer({ storage: null, createAudio: createWebAudio })
const slow = document.getElementById('slow') as HTMLInputElement
const pitch = () => (slow.checked ? SLOW_SCALE : 1)

type Item = { label: string; note: string; play: () => void }
const sound = (name: SoundName, note: string): Item => ({ label: name, note, play: () => player.audition(name, pitch()) })
const event = (label: string, note: string, e: SoundEvent): Item => ({ label, note, play: () => player.audition(e, pitch()) })
const sequence = (label: string, note: string, events: SoundEvent[], gap: number): Item => ({
  label, note, play: () => events.forEach((e, i) => setTimeout(() => player.audition(e, pitch()), i * gap * 1000)),
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
closer.play = () => [0, 0.35, 0.7, 1].forEach((near, i) => setTimeout(() => player.auditionPulse(near, pitch()), i * 900))

const list = document.getElementById('list')!
for (const [title, items] of groups) {
  const h = document.createElement('h2'); h.textContent = title; list.append(h)
  const grid = document.createElement('div'); grid.className = 'grid'; list.append(grid)
  for (const item of items) {
    const b = document.createElement('button')
    b.innerHTML = `${item.label}<small>${item.note}</small>`
    b.addEventListener('click', () => { player.unlock(); item.play() })
    grid.append(b)
  }
}

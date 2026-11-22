import { expect, test } from 'vitest'
import { noteMidi } from '../../src/audio/scored'
import { callPlan, channelClosePlan, chosenPlan, countPlan, lampPlan, ringRoot, ringSteps } from '../../src/audio/storyScored'

const AM = 0, F = 1
const short = (p: ReturnType<typeof callPlan>) => p.notes.map(n => [n.voice, n.midi.join('+'), n.at, n.len, n.vel])

test('SFX-S01 each voice has its two-note call, on the chord the music is on', () => {
  expect(short(callPlan('control', AM))).toEqual([['lead', '76', 0, 0.07, 0.72], ['lead', '76', 0.16, 0.07, 0.72]])
  expect(short(callPlan('lantern', AM))).toEqual([['arp', '69', 0, 0.08, 0.92], ['arp', '81', 0.12, 0.12, 0.92]])
  expect(short(callPlan('first', AM))).toEqual([['bell', '69', 0, 0.18, 1], ['bell', '72', 0.14, 0.3, 1]])     // A, then A minor's third
  expect(short(callPlan('first', F))).toEqual([['bell', '65', 0, 0.18, 1], ['bell', '69', 0.14, 0.3, 1]])      // F major's third is A
  expect(short(callPlan('survivor', AM))).toEqual([['piano', '72', 0, 0.2, 0.36], ['piano', '76', 0.14, 0.5, 0.33]])
  expect(short(callPlan('foreman', AM))).toEqual([['far', String(noteMidi('F2')), 0, 0.3, 0.8], ['far', String(noteMidi('E2')), 0.22, 0.9, 0.7]])
  expect(short(channelClosePlan())).toEqual([['hat', '', 0, '64n', 0.3]])
})

test('SFX-S02 the ring: a swell on the root nearest 45, the arpeggio climbing at quarters of the hold; a choice made, lighter or heavy', () => {
  expect(ringRoot(AM)).toBe(45)
  expect(ringSteps(AM)).toEqual([{ midi: 57, share: 0, vel: 0.35 }, { midi: 64, share: 0.25, vel: 0.45 }, { midi: 69, share: 0.5, vel: 0.55 }, { midi: 76, share: 0.75, vel: 0.65 }])
  expect(short(chosenPlan(false, AM))).toEqual([['bell', '69+76+81', 0, 0.5, 0.7], ['pad', '57+64+69', 0, 0.35, 0.5], ['arp', '81', 0, 0.12, 0.6]])
  const heavy = short(chosenPlan(true, AM))
  expect(heavy.slice(0, 2).map(n => n[3])).toEqual([1.2, 1.8])
  expect(heavy[3]).toEqual(['bass', '33', 0, 2.4, 0.45])
})

test('SFX-S03 the manifest\'s counts and the lamp: on Earth the bell an octave up, by another ship as written, left behind the falling pair, dead the pad and a falling bass, missing silent', () => {
  expect(countPlan('earth', AM).notes[0].midi).toEqual(['A3', 'C4', 'E4', 'B4'].map(n => noteMidi(n) + 12))
  expect(countPlan('anotherShip', AM).notes[0].midi).toEqual(['A3', 'C4', 'E4', 'B4'].map(noteMidi))
  expect(short(countPlan('left', AM))).toEqual([['piano', String(noteMidi('F5')), 0, 0.2, 0.85], ['piano', String(noteMidi('E5')), 0.16, 0.7, 0.65]])
  expect(countPlan('dead', AM).notes[1]).toMatchObject({ voice: 'bass', midi: [33], slideTo: 28 })
  expect(countPlan('missing', AM).notes).toEqual([])
  expect(short(lampPlan(AM))).toEqual([['bell', '81', 0, 0.5, 1]])
})

// Headless check of story mode as built for the play test (2026-11-22; see "The orbit (2026-11-22)"
// in _meta/game-design.md): the real story moves (src/story/story.ts) and the real story flight
// (startStoryTrip), flown by storySim's scripted pilot. Not part of the game; `npm run sim:story` runs
// orbit.sim.ts beside this file. Only the pilot's choices are added here:
// - which boat: the biggest ready, or the four while it lasts;
// - in flight: stay for another lap (steer past the wormhole) while the boat has seats, people are on
//   the orbit and it has `stayAtShields` shields; or take every wormhole;
// - at the stop: go back while people are left and it has `stayAtShields` shields (or a new boat).
// The ore is always dropped and the captain always stays for mission 06.
import { createGame, seats } from '../../src/game/game'
import { seedRandom } from '../../src/game/random'
import { startStoryTrip, storyTripResult, update } from '../../src/game/simulation'
import { STEP } from '../../src/game/tuning'
import type { Game } from '../../src/game/types'
import {
  afterLeaving, chooseLantern, chooseOre, endTrip, goBack, goOn, lanternAboard, newStory, pickBoat, readyBoats, startFlying, still, tripSetup,
  type Boat, type StoryState,
} from '../../src/story/story'
import { decide, records, type Skill } from './storySim'

export interface Pilot { takeEvery: boolean; stayAtShields: number; boat: 'biggest' | 'four' }
export const STAYS: Pilot = { takeEvery: false, stayAtShields: 2, boat: 'biggest' }

function prng(seed: number) {
  let rs = seed >>> 0
  return () => { rs = (rs + 0x6d2b79f5) >>> 0; let x = rs; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296 }
}

/** One flight of the built game. */
function flight(t: ReturnType<typeof tripSetup>, sk: Skill, p: Pilot, seed: number) {
  const g: Game = createGame(records)
  startStoryTrip(g, t)
  seedRandom(seed)                                      // the flight's own numbers, the same for every pilot
  const prnd = prng(seed ^ 0x9e3779b9)
  let want = 0, lapseLeft = 0, frame = 0, stays = 0
  const queue: number[] = []
  while ((g.state === 'play' || g.state === 'launch') && frame < 60 * 60 * 20) {
    const onOrbit = g.story!.onMoon + g.asteroids.reduce((a, x) => a + (x.planet ? x.people : 0), 0)
    const leaving = p.takeEvery || g.onboard >= seats(g) || onOrbit <= 0 || g.shields < p.stayAtShields
    if (lapseLeft > 0) lapseLeft -= STEP
    else if (frame % sk.react === 0) {
      const w = g.wormhole
      if (!leaving) g.wormhole = null                    // staying: the pilot pays the wormhole no mind
      want = decide(g, sk, want)
      g.wormhole = w
      if (prnd() < sk.lapse) lapseLeft = sk.lapseFor
    }
    queue.push(want); const steer = queue.length > sk.delay ? queue.shift()! : 0
    const had = !!g.wormhole
    update(g, STEP, steer)
    if (had && !g.wormhole && g.state === 'play' && !leaving) stays++
    frame++
  }
  return { result: storyTripResult(g), seconds: g.time, stays }
}

/** A whole story, under the built rules. */
export function flyBuiltStory(seed: number, sk: Skill, p: Pilot) {
  const rand = prng(seed * 7919 + 13)
  let s: StoryState = startFlying(newStory())
  let seconds = 0, flights = 0, stays = 0, n = 0, oneFlight = 0
  for (let guard = 0; guard < 300 && s.phase !== 'ending'; guard++) {
    if (s.phase === 'picker') {
      const ready = readyBoats(s)
      s = pickBoat(s, (p.boat === 'four' && ready.includes(1) ? 1 : ready[ready.length - 1]) as Boat)
    } else if (s.phase === 'flying') {
      const f = flight(tripSetup(s), sk, p, (seed * 104729 + (n++) * 7907) >>> 0)
      seconds += f.seconds; flights++; stays += f.stays
      s = endTrip(s, f.result, rand)
    } else if (s.phase === 'stop') {
      if (s.trips === 1 && still(s) === 0 && s.moon <= 3) oneFlight++
      const back = still(s) > 0 && (s.lastTrip!.destroyed || s.shields >= p.stayAtShields)
      s = back ? goBack(s) : afterLeaving(goOn(s))
    } else if (s.phase === 'oreChoice') s = chooseOre(s, 'drop', rand)
    else if (s.phase === 'lanternChoice') s = chooseLantern(s, 'stay')
  }
  const left = [0, 1, 2, 3, 4, 5].reduce((a, m) => a + still(s, m), 0)
  return {
    lantern: lanternAboard(s), dead: s.dead.reduce((a, b) => a + b, 0), left,
    home06: s.ending === 'home' || s.ending === 'lightThatStayed' || s.ending === 'lightboat' ? s.saved[6] : 0,
    out: s.moon < 6, boatsLost: s.boatsLost, full: lanternAboard(s) >= 70, flights, stays, minutes: seconds / 60, oneFlight,
  }
}

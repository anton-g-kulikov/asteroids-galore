import { mkdirSync, writeFileSync } from 'node:fs'
import { test } from 'vitest'
import { STAYS, flyBuiltStory, type Pilot } from './orbitSim'
import { PILOTS } from './storySim'

// Flies SIM_RUNS stories (default 100) per pilot through the built story mode, for each way of
// playing in ORBIT_VARIANTS (names split by |, all by default), and writes sim/story/out/orbit.md (git-ignored).
const runs = Number(process.env.SIM_RUNS) || 100
const VARIANTS: Record<string, Pilot> = {
  'stays, biggest boat': STAYS,
  'takes every wormhole, biggest boat': { ...STAYS, takeEvery: true },
  'stays, the four while it lasts': { ...STAYS, boat: 'four' },
}

test('story mode as built, on the orbit', () => {
  const only = process.env.ORBIT_VARIANTS?.split('|')
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length)
  const pc = (xs: boolean[]) => Math.round(100 * xs.filter(Boolean).length / runs)
  const lines = [`# Story mode as built: ${runs} stories per pilot`, '', '| Way of playing | Pilot | Out of boats | Boats lost | On the Lantern | Left | Dead | Home from m06n | Lantern full | Moons 00–03 in one flight | Laps stayed | Flights | Minutes (max) |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|']
  for (const [vn, v] of Object.entries(VARIANTS)) {
    if (only && !only.includes(vn)) continue
    for (const [name, skill] of Object.entries(PILOTS)) {
      const r = Array.from({ length: runs }, (_, i) => flyBuiltStory(i + 1, skill, v))
      lines.push(`| ${vn} | ${name} | ${pc(r.map(x => x.out))}% | ${mean(r.map(x => x.boatsLost)).toFixed(2)} | ${mean(r.map(x => x.lantern)).toFixed(1)} | ${mean(r.map(x => x.left)).toFixed(1)} | ${mean(r.map(x => x.dead)).toFixed(1)} | ${mean(r.map(x => x.home06)).toFixed(1)} | ${pc(r.map(x => x.full))}% | ${mean(r.map(x => x.oneFlight)).toFixed(1)} of 4 | ${mean(r.map(x => x.stays)).toFixed(1)} | ${mean(r.map(x => x.flights)).toFixed(1)} | ${mean(r.map(x => x.minutes)).toFixed(1)} (${Math.max(...r.map(x => x.minutes)).toFixed(1)}) |`)
    }
  }
  mkdirSync(new URL('./out/', import.meta.url), { recursive: true })
  writeFileSync(new URL('./out/orbit.md', import.meta.url), lines.join('\n') + '\n')
}, 3_600_000)

import { mkdirSync, writeFileSync } from 'node:fs'
import { test } from 'vitest'
import { DECIDED, PILOTS, flyStory } from './storySim'

// Flies SIM_RUNS stories (default 100) per pilot under the decided story rules and writes a summary
// to sim/story/out/summary.md (git-ignored). About half a second per story.
const runs = Number(process.env.SIM_RUNS) || 100

test('story mode, decided rules', () => {
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length)
  const lines = [`# Story mode, decided rules: ${runs} stories per pilot`, '', '| Pilot | Out of boats | Reach 06 with 3 / 2 / 1 | On the Lantern | Left | Dead | Home from m06n | Minutes (max) |', '|---|---|---|---|---|---|---|---|']
  for (const [name, skill] of Object.entries(PILOTS)) {
    const r = Array.from({ length: runs }, (_, i) => flyStory(i + 1, skill, DECIDED))
    const reach = (k: number) => Math.round(100 * r.filter(x => x.reached06Boats === k).length / runs)
    const out = Math.round(100 * r.filter(x => x.reached06Boats < 0).length / runs)
    lines.push(`| ${name} | ${out}% | ${reach(3)} / ${reach(2)} / ${reach(1)} | ${mean(r.map(x => x.lantern)).toFixed(1)} | ${mean(r.map(x => x.leftBehind)).toFixed(1)} | ${mean(r.map(x => x.dead)).toFixed(1)} | ${mean(r.map(x => x.home06)).toFixed(1)} | ${mean(r.map(x => x.minutes)).toFixed(1)} (${Math.max(...r.map(x => x.minutes)).toFixed(1)}) |`)
  }
  mkdirSync(new URL('./out/', import.meta.url), { recursive: true })
  writeFileSync(new URL('./out/summary.md', import.meta.url), lines.join('\n') + '\n')
}, 3_600_000)

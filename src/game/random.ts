// The game's own random numbers. Every run is dealt from a seed, so the same
// seed and the same inputs give the same run on every device. Drawing code
// must not use these (it runs a different number of times on each device):
// it uses Math.random.

let state = 0

/** Starts the sequence a run is dealt from. */
export function seedRandom(seed: number): void { state = seed >>> 0 }

/** The next number in [0, 1). (mulberry32) */
export function random(): number {
  state = (state + 0x6d2b79f5) >>> 0
  let t = state
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export const rand = (a: number, b: number): number => a + random() * (b - a)

/** A fresh seed for a run: 24 bits, so it reads as six characters. */
export const newSeed = (): number => Math.floor(Math.random() * 0x1000000)

/** A seed as the player sees it, for example `4F2A9C`. */
export const seedName = (seed: number): string => seed.toString(16).toUpperCase().padStart(6, '0')

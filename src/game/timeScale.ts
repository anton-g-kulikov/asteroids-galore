import { SLOW_SCALE, SLOW_TIME } from './tuning'

/**
 * Game speed for the slow-motion seconds left. Slow motion eases in quickly
 * and back out a little more gently.
 */
export function timeScale(slowmo: number): number {
  if (slowmo <= 0) return 1
  return 1 - (1 - SLOW_SCALE) * Math.min(1, (SLOW_TIME - slowmo) / 0.2, slowmo / 0.45)
}

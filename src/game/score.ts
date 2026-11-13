import type { Game } from './types'

/**
 * The score: parsecs flown times crew saved. Crew count as saved once they have
 * been delivered through a wormhole. Crew who were on board when the ship was
 * destroyed are taken off that number, so losing a full ship can cost the lot.
 */
export const scoreFor = (distance: number, saved: number, lost: number): number =>
  Math.floor(distance) * Math.max(0, saved - lost)

export const scoreOf = (g: Game): number => scoreFor(g.distance, g.saved, g.lost)

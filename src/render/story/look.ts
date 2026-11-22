import type { Mark, Voice } from '../../story/view'

// The story's colours. Each is one the game already uses for the same thing.
export const LINE = '#5ff5ff'     // the ship's own line of light
export const BLUE = '#7fdcff'     // the HUD's blue; light0re
export const GOLD = '#ffd166'
export const GREEN = '#5dffa0'    // a person aboard
export const ORANGE = '#ff7b54'   // a person lost
export const PALE = '#8fc4cc'     // an empty place
export const SUIT = '#ffe66b'     // the figures on the rocks
export const VIOLET = '#b48cff'   // the wormholes
export const WHITE = '#ffffff'
/** The dev control's amber: no control of the game itself uses it. */
export const DEV = '#ff9a3c'

/** A colour per voice. */
export const VOICE: Record<Voice, string> = { lantern: LINE, first: GREEN, survivor: SUIT, control: WHITE, foreman: VIOLET }

/** The colour a mark on the manifest, and its count, is drawn in. */
export const MARK: Record<Mark, string> = { earth: GREEN, left: PALE, dead: ORANGE, anotherShip: BLUE, missing: GREEN, onTheirWay: BLUE, notReached: VIOLET }

export interface Rect { x: number; y: number; w: number; h: number }
export const inRect = (r: Rect, x: number, y: number): boolean => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h

export const TAU = Math.PI * 2

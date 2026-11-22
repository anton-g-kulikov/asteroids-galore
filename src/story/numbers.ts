// The story mode's numbers, in one place (see "Planned: story mode rules" in _meta/game-design.md).
// Confirmed by the owner: the people on each moon and the Lantern's room. The rest are the
// Engineer's proposal, flown in the headless check (sim/story) and used as starting values.

import { levelTarget, shipSeats, startSpeed } from '../game/tuning'

/** People on m00n to m06n (confirmed by the owner). */
export const MOON_PEOPLE = [6, 7, 11, 12, 16, 18, 20]

/** The Lantern's places: with its cargo of ore aboard (the first four moons), and with the ore dropped (the first six). */
export const ROOM_WITH_ORE = 36
export const ROOM = 70

/** The second freighter after "The commission" comes this often (the owner's 60 in 100). */
export const SECOND_FREIGHTER = 0.6
/** Of each moon's people still there, the share the second freighter brings out (the Engineer's proposal: the script says only "[N] of those still there"). */
export const SECOND_FREIGHTER_SHARE = 0.5
/** The Lantern sent home alone is lost this often (the owner's 2 in 10). */
export const LANTERN_LOST = 0.2

/** A return flight is the last part of the mission's target: this share of it (the Engineer's proposal). */
export const RETURN_SHARE = 1 / 3
/** Mission 06's target, in parsecs; its way out also opens as soon as the boat is full (the Engineer's proposal). */
export const M06_TARGET = 2000

/** Seats of the four, the eight and the twelve. */
export const boatSeats = (boat: number): number => shipSeats(boat)

/** A story mission's starting speed: missions 04 and 05 start at mission 03's (the owner's decision). */
export const storyStartSpeed = (level: number): number => startSpeed(level === 5 || level === 6 ? 4 : level)

/** A story mission's target in parsecs: arcade's, but mission 06's own. */
export const storyTarget = (level: number): number => level === 7 ? M06_TARGET : levelTarget(level)

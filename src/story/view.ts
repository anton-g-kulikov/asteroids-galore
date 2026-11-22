// What the story mode's drawing is given. src/story works these out from the story's state;
// src/render/story draws them and nothing else (the Game Designer's side). Hit areas live with
// the drawing and are exported from there, as shipCards and shareButtonRect are.

/** The moons, 0 to 6, named m00n to m06n. */
export type MoonIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** Who speaks, which decides the colour (see "A colour per voice" in the design notes). */
export type Voice = 'lantern' | 'first' | 'survivor' | 'control' | 'foreman'

/** The chain of moons at the top of a story screen. */
export interface ChainView {
  /** The moons the captain has been told about, in moon order; a missing number is a gap. */
  named: MoonIndex[]
  /** The moon in play, lit; null on an ending, where none is lit and all seven are shown. */
  current: MoonIndex | null
}

/** One transmission, typed out. */
export interface TransmissionView {
  /** The sender in capitals, moon names in lower case: `SURVEYOR, m00n`. */
  sender: string
  voice: Voice
  /** Heard faintly: drawn at 0.6 with a broken line and one bar of three lit. */
  faint: boolean
  /** Up to three lines (the briefing has six), already filled in. */
  lines: string[]
  /** Characters typed so far, counted across the lines in order; equal to their total once it is all shown. */
  typed: number
}

/** A choice made by holding one side. */
export interface ChoiceView {
  /** Each side's words in two lines: left is back or home, right is further in. */
  left: [string, string]
  right: [string, string]
  /** The side being held, if any, and how far the ring has filled, 0 to 1. */
  held: 'left' | 'right' | null
  progress: number
}

/** The *Lantern* drawn from above. */
export interface LanternView {
  /** People aboard: the green places, filled from the stern. */
  aboard: number
  /** 36 with the ore, 70 without. */
  room: number
  /** While the ore is aboard, the places past the room are blue diamonds of light0re. */
  oreAboard: boolean
  /** The three boats on the rail, the four, the eight and the twelve: present or lost (a broken outline). */
  boats: [BoatState, BoatState, BoatState]
}

/** A boat on the rail: aboard and ready (all three are, from the start), or lost. */
export type BoatState = 'ready' | 'lost'

/** The story screen: after a trip, leaving a moon, a choice, the briefing or an ending. */
export interface StoryScreenView {
  chain: ChainView
  /** The moon's name (30 px), or an ending's name (40 px) when `ending` is true. */
  title: string
  ending: boolean
  /** Shown so far, in order; the last may still be typing. */
  transmissions: TransmissionView[]
  /** The moon's people as one mark each, on the stop after a trip; null where the screen has no row. */
  people: { aboard: number; still: number; lost: number } | null
  /** The *Lantern* and its counts, on the stop and on the two choices that can end the story; null elsewhere. */
  lantern: LanternView | null
  /** The three lines of count under the *Lantern*: on the *Lantern* n/room, still on the moon, lost. */
  counts: { lantern: number; room: number; moon: string; still: number; lost: number } | null
  /** The choice, once every transmission is shown; null when the screen ends with TAP TO CONTINUE or is still typing. */
  choice: ChoiceView | null
  /** TAP TO CONTINUE: every transmission shown and no choice to make. */
  tapToContinue: boolean
}

/** The boat picker: arcade's, with lost boats as broken outlines and a hold bar under the one held. */
export interface PickerView {
  /** The boats in order, 1 to 3, as arcade's ship numbers: on offer, or lost (kept in place, cannot be chosen). Stowed boats are not shown. */
  boats: { ship: 1 | 2 | 3; lost: boolean }[]
  /** The boat being held, and how far its bar has filled, 0 to 1. */
  held: 1 | 2 | 3 | null
  progress: number
  /** Leaving m05n: the boat held turns its glass green (it is the one the captain flies). */
  captainAboard: boolean
}

/** One mark on the manifest. */
/** `notReached`: after "The commission", someone on m04n to m06n whom no ship brought out. */
export type Mark = 'earth' | 'left' | 'dead' | 'anotherShip' | 'missing' | 'onTheirWay' | 'notReached'

/** The manifest, at a story's ending only. */
export interface ManifestView {
  callsign: string
  /** Under THE MANIFEST: `CAPTAIN [CALLSIGN]`, or `PILOT [CALLSIGN]` when the story ended before the ore choice; with no callsign the one word alone. */
  heading: string
  /** One row per moon the captain was told about, in moon order, one mark per person; a missing number is drawn as three dots. */
  rows: { moon: MoonIndex; marks: Mark[] }[]
  /** Three or four counts, each a number over its label in the mark's colour. */
  counts: { mark: Mark; label: string; value: number }[]
  /** How many of the counts are showing yet: they appear one after another, 0.9 s apart, each keeping its place. */
  countsShown: number
  /** `COMMISSION PAID`, `COMMISSION PAID, LESS THREE BOATS` (gold) or `NO COMMISSION` (dim). */
  cargo: string
  /** The eight endings in order: reached in any story so far, and the one just reached. */
  lamps: { name: string; lit: boolean; justReached: boolean }[]
}

/** The story's in-flight HUD, in place of arcade's mission counter and score. */
export interface StoryFlightView {
  /** `m02n`, in the HUD's blue. */
  moon: string
  /** The people still on the moon, as a row of small figures; one leaves when someone is picked up. */
  still: number
  aboard: number
  seats: number
  /** Mission 06: the captain is in the boat, and its glass is green. */
  captainAboard: boolean
}

/** The places within a moon the dev control can jump to. */
export type DevPlace = 'trip' | 'afterTrip' | 'stop' | 'leaving' | 'choice' | 'boats'

/** The dev control's panel (amber, dashed: never like the game). */
export interface DevPanelView {
  moon: MoonIndex
  place: DevPlace
  /** The places that exist at that moon (`choice` only at m03n and m05n). */
  places: DevPlace[]
  /** State steppers, or This trip's steppers when opened in flight. */
  inFlight: boolean
  state: { lantern: number; still: number; lost: number; boats: [boolean, boolean, boolean]; oreAboard: boolean }
  trip: { aboard: number; shields: number }
  chance: { secondFreighter: 'chance' | 'yes' | 'no'; lanternHome: 'chance' | 'yes' | 'no' }
  /** The eight endings by name, for "Show an ending". */
  endings: string[]
  feel: { typingPerSecond: number; holdSeconds: number }
  /** Rocks pass through the boat (play testing only). */
  invincible: boolean
}

/** The start screen's two entries. */
export interface StartEntriesView {
  /** `STORY`, or `STORY · m02n` with a story under way. */
  storyLabel: string
}

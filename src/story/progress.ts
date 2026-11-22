// What a story keeps on the device: the story under way (between screens, so it can be resumed),
// and which of the eight endings have been reached (the manifest's lamps, the one thing kept
// between stories). Nothing goes to the cloud.

import { ENDINGS, newStory, type Ending, type StoryState } from './story'

export type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export const STORY_KEY = 'asteroids-galore-story-v1'
export const LAMPS_KEY = 'asteroids-galore-story-lamps'

export function saveStory(store: Store | null, s: StoryState): void {
  try { store?.setItem(STORY_KEY, JSON.stringify(s)) } catch { /* kept for this visit only */ }
}

/** The saved story, or null; anything unreadable or from another shape counts as none. */
export function loadStory(store: Store | null): StoryState | null {
  try {
    const raw = store?.getItem(STORY_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Partial<StoryState> & Pick<StoryState, 'boats'>
    const fresh = newStory()
    // a story saved before today's rules: Control has explained going back if it got past m00n's first flight, and every boat aboard is ready
    if (!('goingBackTold' in s)) s.goingBackTold = (s.trips ?? 0) > 0 || (s.moon ?? 0) > 0
    s.boats = (s.boats as string[]).map(b => b === 'lost' ? 'lost' : 'ready') as StoryState['boats']
    if (Object.keys(fresh).some(k => !(k in s)) || s.phase === 'ending') return null
    return s as StoryState
  } catch { return null }
}

export function clearStory(store: Store | null): void {
  try { store?.removeItem(STORY_KEY) } catch { /* nothing to do */ }
}

export function loadLamps(store: Store | null): Ending[] {
  try {
    const list = JSON.parse(store?.getItem(LAMPS_KEY) ?? '[]') as unknown
    return Array.isArray(list) ? ENDINGS.filter(e => list.includes(e)) : []
  } catch { return [] }
}

export function saveLamps(store: Store | null, lamps: Ending[]): void {
  try { store?.setItem(LAMPS_KEY, JSON.stringify(lamps)) } catch { /* kept for this visit only */ }
}

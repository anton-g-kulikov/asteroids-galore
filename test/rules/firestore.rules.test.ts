import { readFileSync } from 'node:fs'
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import {
  collection, deleteDoc, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, test } from 'vitest'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-asteroids-galore',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})
beforeEach(() => env.clearFirestore())
afterAll(() => env.cleanup())

const as = (uid: string) => env.authenticatedContext(uid).firestore()
const anon = () => env.unauthenticatedContext().firestore()

// a run that went home from mission 7
const home = { outcome: 'won', level: 7, finalDistance: 300, lost: 0, score: 2060 }

const run = (userId: string, over: Record<string, unknown> = {}) => ({
  userId, callsign: 'COSMIC OTTER 42', createdAt: serverTimestamp(), appVersion: '0.1.0',
  outcome: 'over', score: 1236, distance: 412, level: 3, finalDistance: 0, saved: 5, lost: 2, missed: 2, durationSeconds: 61.2,
  ...over,
})
const bests = (over: Record<string, unknown> = {}) => ({
  callsign: 'COSMIC OTTER 42', best: 1236, bestOutcome: 'over', bestLevel: 3, bestFinal: 0, updatedAt: serverTimestamp(), ...over,
})

test('RULES-01 a player can create a well-formed run of their own', async () => {
  await assertSucceeds(setDoc(doc(as('ann'), 'runs/r1'), run('ann')))
  await assertSucceeds(setDoc(doc(as('ann'), 'runs/r2'), run('ann', home)))
  // lost in mission 7, and how far it got
  await assertSucceeds(setDoc(doc(as('ann'), 'runs/r5'), run('ann', { level: 7, finalDistance: 412 })))
  // nobody saved, or nothing banked before the crash: the score is 0
  await assertSucceeds(setDoc(doc(as('ann'), 'runs/r3'), run('ann', { saved: 0, lost: 0, score: 0 })))
  await assertSucceeds(setDoc(doc(as('ann'), 'runs/r4'), run('ann', { saved: 2, lost: 6, score: 0 })))
})

test('RULES-02 a run for someone else, or without sign-in, is refused', async () => {
  await assertFails(setDoc(doc(as('ann'), 'runs/r1'), run('bob')))
  await assertFails(setDoc(doc(anon(), 'runs/r1'), run('ann')))
})

test('RULES-03 malformed runs are refused', async () => {
  const db = as('ann')
  const withoutMissed: Record<string, unknown> = run('ann')
  delete withoutMissed.missed
  await assertFails(setDoc(doc(db, 'runs/a'), run('ann', { cheat: true })))
  await assertFails(setDoc(doc(db, 'runs/b'), withoutMissed))
  await assertFails(setDoc(doc(db, 'runs/c'), run('ann', { distance: -1 })))
  await assertFails(setDoc(doc(db, 'runs/d'), run('ann', { distance: 1.5 })))
  await assertFails(setDoc(doc(db, 'runs/e'), run('ann', { level: 8 })))
  await assertFails(setDoc(doc(db, 'runs/e2'), run('ann', { level: 0 })))
  await assertFails(setDoc(doc(db, 'runs/f'), run('ann', { ...home, level: 6, finalDistance: 0 })))   // only mission 7 leads home
  await assertFails(setDoc(doc(db, 'runs/f2'), run('ann', { finalDistance: 100 })))                    // mission 3 has no mission-7 parsecs
  await assertFails(setDoc(doc(db, 'runs/f3'), run('ann', { level: 7, finalDistance: 413 })))          // more than the whole run
  await assertFails(setDoc(doc(db, 'runs/f4'), run('ann', { level: 7, finalDistance: 1.5 })))
  await assertFails(setDoc(doc(db, 'runs/g'), run('ann', { outcome: 'draw' })))
  await assertFails(setDoc(doc(db, 'runs/h'), run('ann', { createdAt: new Date(2020, 0, 1) })))
  await assertFails(setDoc(doc(db, 'runs/i'), run('ann', { callsign: 'look at me' })))
})

test('RULES-08 the score cannot exceed the distance times the crew saved', async () => {
  const db = as('ann')
  await assertSucceeds(setDoc(doc(db, 'runs/ok'), run('ann', { score: 412 * 5 })))        // the ceiling itself
  await assertFails(setDoc(doc(db, 'runs/a'), run('ann', { score: 999999 })))
  await assertFails(setDoc(doc(db, 'runs/b'), run('ann', { score: 412 * 5 + 1 })))
  await assertFails(setDoc(doc(db, 'runs/c'), run('ann', { saved: 0, lost: 0, score: 412 })))
  await assertFails(setDoc(doc(db, 'runs/d'), run('ann', { score: -1 })))
  await assertFails(setDoc(doc(db, 'runs/e'), run('ann', { score: 1236.5 })))
  await assertFails(setDoc(doc(db, 'runs/f'), run('ann', { ...home, lost: 2 })))   // a run that went home loses nobody
  await assertFails(setDoc(doc(db, 'runs/g'), run('ann', { saved: -1, score: 0 })))
})

test('RULES-09 an entry written under earlier rules can be replaced by one of this kind', async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'users/ann'), { callsign: 'COSMIC OTTER 42', bestScore: 22640, updatedAt: new Date() })
  })
  await assertSucceeds(setDoc(doc(as('ann'), 'users/ann'), bests({ best: 10 })))
  await assertFails(setDoc(doc(as('ann'), 'users/ann'), bests({ best: 5 })))
})

test('RULES-04 runs cannot be changed or deleted; readable by ID, never listed', async () => {
  await setDoc(doc(as('ann'), 'runs/r1'), run('ann'))
  await assertFails(updateDoc(doc(as('ann'), 'runs/r1'), { distance: 9999 }))
  await assertFails(deleteDoc(doc(as('ann'), 'runs/r1')))
  await assertSucceeds(getDoc(doc(as('ann'), 'runs/r1')))
  await assertSucceeds(getDoc(doc(as('bob'), 'runs/r1')))
  await assertSucceeds(getDoc(doc(anon(), 'runs/r1')))
  await assertFails(getDocs(query(collection(as('ann'), 'runs'), where('userId', '==', 'ann'))))
  await assertFails(getDocs(collection(anon(), 'runs')))
})

test('RULES-05 a player owns their entry; anyone can read the board', async () => {
  await assertSucceeds(setDoc(doc(as('ann'), 'users/ann'), bests()))
  await assertSucceeds(setDoc(doc(as('ann'), 'users/ann'), bests({ best: 5000, bestOutcome: 'won', bestLevel: 7, bestFinal: 5400 })))
  await assertFails(setDoc(doc(as('bob'), 'users/ann'), bests()))
  await assertFails(setDoc(doc(anon(), 'users/zed'), bests()))
  await assertSucceeds(getDoc(doc(as('bob'), 'users/ann')))
  await assertSucceeds(getDoc(doc(anon(), 'users/ann')))
  const top = (db: ReturnType<typeof anon>) => query(collection(db, 'users'), where('best', '>', 0), orderBy('best', 'desc'), limit(5))
  await assertSucceeds(getDocs(top(anon())))
  await assertSucceeds(getCountFromServer(query(collection(as('bob'), 'users'), where('best', '>', 100))))
})

test('RULES-06 the best cannot go down, and malformed entries are refused', async () => {
  const db = as('ann')
  await setDoc(doc(db, 'users/ann'), bests())
  await assertFails(setDoc(doc(db, 'users/ann'), bests({ best: 100 })))
  await assertFails(setDoc(doc(db, 'users/ann'), bests({ bestScore: 99999 })))   // the old fields are gone
  await assertFails(setDoc(doc(db, 'users/ann'), bests({ bestOutcome: 'won' })))   // only mission 7 leads home
  await assertFails(setDoc(doc(db, 'users/ann'), bests({ bestLevel: 8 })))
  await assertFails(setDoc(doc(db, 'users/ann'), bests({ bestFinal: 50 })))        // mission 3 has no mission-7 parsecs
  await assertFails(setDoc(doc(db, 'users/ann'), { callsign: 'COSMIC OTTER 42', best: 5000, updatedAt: serverTimestamp() }))   // how the run ended is required
  await assertFails(setDoc(doc(db, 'users/ann'), bests({ admin: true })))
  await assertFails(setDoc(doc(db, 'users/ann'), bests({ best: 'high' })))
  await assertFails(setDoc(doc(db, 'users/ann'), bests({ updatedAt: new Date(2020, 0, 1) })))
  await assertFails(setDoc(doc(db, 'users/ann'), bests({ callsign: 'something rude' })))
  await assertFails(setDoc(doc(db, 'users/ann'), bests({ callsign: 'WAY TOO LONG A CALLSIGN TO BE REAL 42' })))
  await assertFails(setDoc(doc(db, 'users/ann'), { best: 1236, bestOutcome: 'over', bestLevel: 3, bestFinal: 0, updatedAt: serverTimestamp() }))
  await assertFails(deleteDoc(doc(db, 'users/ann')))
})

test('RULES-07 everything else is closed', async () => {
  await assertFails(setDoc(doc(as('ann'), 'other/x'), { a: 1 }))
  await assertFails(getDoc(doc(as('ann'), 'other/x')))
})

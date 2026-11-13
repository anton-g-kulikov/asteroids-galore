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

const run = (userId: string, over: Record<string, unknown> = {}) => ({
  userId, callsign: 'COSMIC OTTER 42', createdAt: serverTimestamp(), appVersion: '0.1.0',
  outcome: 'over', score: 1236, distance: 412, level: 3, saved: 5, lost: 2, missed: 2, durationSeconds: 61.2,
  ...over,
})
const bests = (over: Record<string, unknown> = {}) => ({
  callsign: 'COSMIC OTTER 42', bestScore: 1236, updatedAt: serverTimestamp(), ...over,
})

test('RULES-01 a player can create a well-formed run of their own', async () => {
  await assertSucceeds(setDoc(doc(as('ann'), 'runs/r1'), run('ann')))
  await assertSucceeds(setDoc(doc(as('ann'), 'runs/r2'), run('ann', { outcome: 'won', level: 4, lost: 0, score: 2060 })))
  // nobody saved, or more lost than saved: the score is 0
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
  await assertFails(setDoc(doc(db, 'runs/e'), run('ann', { level: 5 })))
  await assertFails(setDoc(doc(db, 'runs/f'), run('ann', { outcome: 'won', level: 3, lost: 0, score: 2060 })))
  await assertFails(setDoc(doc(db, 'runs/g'), run('ann', { outcome: 'draw' })))
  await assertFails(setDoc(doc(db, 'runs/h'), run('ann', { createdAt: new Date(2020, 0, 1) })))
  await assertFails(setDoc(doc(db, 'runs/i'), run('ann', { callsign: 'look at me' })))
})

test('RULES-08 the score must be the distance times the crew counted', async () => {
  const db = as('ann')
  await assertFails(setDoc(doc(db, 'runs/a'), run('ann', { score: 999999 })))
  await assertFails(setDoc(doc(db, 'runs/b'), run('ann', { score: 412 * 5 })))            // forgot the crew lost
  await assertFails(setDoc(doc(db, 'runs/c'), run('ann', { saved: 0, lost: 0, score: 412 })))
  await assertFails(setDoc(doc(db, 'runs/d'), run('ann', { saved: 2, lost: 6, score: 1 })))
  await assertFails(setDoc(doc(db, 'runs/e'), run('ann', { score: 1236.5 })))
  await assertFails(setDoc(doc(db, 'runs/f'), run('ann', { outcome: 'won', level: 4 })))   // a finished mission loses nobody
  await assertFails(setDoc(doc(db, 'runs/g'), run('ann', { saved: -1, score: 0 })))
})

test('RULES-09 an entry from before scores existed can be replaced by a scored one', async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'users/ann'), { callsign: 'COSMIC OTTER 42', bestDistance: 3682, bestCrew: 20, updatedAt: new Date() })
  })
  await assertSucceeds(setDoc(doc(as('ann'), 'users/ann'), bests({ bestScore: 10 })))
  await assertFails(setDoc(doc(as('ann'), 'users/ann'), bests({ bestScore: 5 })))
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
  await assertSucceeds(setDoc(doc(as('ann'), 'users/ann'), bests({ bestScore: 5000 })))
  await assertFails(setDoc(doc(as('bob'), 'users/ann'), bests()))
  await assertFails(setDoc(doc(anon(), 'users/zed'), bests()))
  await assertSucceeds(getDoc(doc(as('bob'), 'users/ann')))
  await assertSucceeds(getDoc(doc(anon(), 'users/ann')))
  const top = (db: ReturnType<typeof anon>) => query(collection(db, 'users'), where('bestScore', '>', 0), orderBy('bestScore', 'desc'), limit(5))
  await assertSucceeds(getDocs(top(anon())))
  await assertSucceeds(getCountFromServer(query(collection(as('bob'), 'users'), where('bestScore', '>', 100))))
})

test('RULES-06 the best cannot go down, and malformed entries are refused', async () => {
  const db = as('ann')
  await setDoc(doc(db, 'users/ann'), bests())
  await assertFails(setDoc(doc(db, 'users/ann'), bests({ bestScore: 100 })))
  await assertFails(setDoc(doc(db, 'users/ann'), bests({ bestDistance: 412 })))   // the old fields are gone
  await assertFails(setDoc(doc(db, 'users/ann'), bests({ admin: true })))
  await assertFails(setDoc(doc(db, 'users/ann'), bests({ bestScore: 'high' })))
  await assertFails(setDoc(doc(db, 'users/ann'), bests({ updatedAt: new Date(2020, 0, 1) })))
  await assertFails(setDoc(doc(db, 'users/ann'), bests({ callsign: 'something rude' })))
  await assertFails(setDoc(doc(db, 'users/ann'), bests({ callsign: 'WAY TOO LONG A CALLSIGN TO BE REAL 42' })))
  await assertFails(setDoc(doc(db, 'users/ann'), { bestScore: 1236, updatedAt: serverTimestamp() }))
  await assertFails(deleteDoc(doc(db, 'users/ann')))
})

test('RULES-07 everything else is closed', async () => {
  await assertFails(setDoc(doc(as('ann'), 'other/x'), { a: 1 }))
  await assertFails(getDoc(doc(as('ann'), 'other/x')))
})

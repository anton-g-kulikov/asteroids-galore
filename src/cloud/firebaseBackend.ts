import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth'
import {
  addDoc, collection, connectFirestoreEmulator, doc, getCountFromServer, getDoc, getDocs, initializeFirestore,
  limit, orderBy, persistentLocalCache, query, serverTimestamp, setDoc, where,
} from 'firebase/firestore'
import type { CloudConfig } from './config'
import type { BoardKind } from './leaderboard'
import type { CloudBackend } from './resultsSync'

// Ports match the "emulators" block in firebase.json.
const AUTH_EMULATOR = 'http://127.0.0.1:9199'
const FIRESTORE_EMULATOR = ['127.0.0.1', 8180] as const

// The field of a `users` document that each board is ranked by.
const BOARD_FIELD: Record<BoardKind, string> = { distance: 'bestDistance', crew: 'bestCrew' }

/**
 * The Firebase side of the cloud. Document shapes are enforced by firestore.rules:
 * `runs/{id}` holds one finished run, which a share link points at; `users/{uid}` is the player's leaderboard
 * entry: their callsign and bests. The boards are queries over `users`.
 */
export function createFirebaseBackend(config: CloudConfig): CloudBackend {
  const app = initializeApp(config.options)
  const auth = getAuth(app)
  // The local cache keeps writes made offline and sends them when the network is back.
  const db = initializeFirestore(app, { localCache: persistentLocalCache() })
  if (config.emulators) {
    connectAuthEmulator(auth, AUTH_EMULATOR, { disableWarnings: true })
    connectFirestoreEmulator(db, ...FIRESTORE_EMULATOR)
  }

  return {
    async signIn() {
      await auth.authStateReady()   // a returning player is already signed in
      const user = auth.currentUser ?? (await signInAnonymously(auth)).user
      return user.uid
    },
    async loadBests(uid) {
      const snap = await getDoc(doc(db, 'users', uid))
      const data = snap.data()
      return data ? { best: Number(data.bestDistance) || 0, bestCrew: Number(data.bestCrew) || 0 } : null
    },
    async saveBests(uid, bests, callsign) {
      await setDoc(doc(db, 'users', uid), {
        callsign, bestDistance: bests.best, bestCrew: bests.bestCrew, updatedAt: serverTimestamp(),
      })
    },
    async saveRun(uid, run, callsign) {
      const ref = await addDoc(collection(db, 'runs'), {
        userId: uid, callsign, createdAt: serverTimestamp(), appVersion: __APP_VERSION__, ...run,
      })
      return ref.id
    },
    async loadRun(runId) {
      const data = (await getDoc(doc(db, 'runs', runId))).data()
      if (!data) return null
      return {
        callsign: String(data.callsign),
        outcome: data.outcome === 'won' ? 'won' : 'over',
        distance: Number(data.distance) || 0,
        level: Number(data.level) || 1,
        rescued: Number(data.rescued) || 0,
      }
    },
    async loadBoard(kind, size) {
      const field = BOARD_FIELD[kind]
      const snap = await getDocs(query(collection(db, 'users'), where(field, '>', 0), orderBy(field, 'desc'), limit(size)))
      return snap.docs.map(d => ({ uid: d.id, callsign: String(d.get('callsign')), value: Number(d.get(field)) || 0 }))
    },
    async countAbove(kind, value) {
      const snap = await getCountFromServer(query(collection(db, 'users'), where(BOARD_FIELD[kind], '>', value)))
      return snap.data().count
    },
  }
}

import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth'
import {
  addDoc, collection, connectFirestoreEmulator, doc, getCountFromServer, getDoc, getDocs, initializeFirestore,
  limit, orderBy, persistentLocalCache, query, serverTimestamp, setDoc, where,
} from 'firebase/firestore'
import type { CloudConfig } from './config'
import type { RunEnd } from '../game/types'
import type { CloudBackend } from './resultsSync'

// Ports match the "emulators" block in firebase.json.
const AUTH_EMULATOR = 'http://127.0.0.1:9199'
const FIRESTORE_EMULATOR = ['127.0.0.1', 8180] as const

// The field of a `users` document that the board is ranked by. Not the name
// used under earlier rules (`bestScore`): those scores are not comparable, so
// entries that only have the old field are simply not on the board.
const BEST = 'best'

// How the best run ended, as stored beside it; null for an entry without it.
function endOf(get: (field: string) => unknown): RunEnd | null {
  const outcome = get('bestOutcome'), level = Number(get('bestLevel'))
  if ((outcome !== 'won' && outcome !== 'over') || !level) return null
  return { outcome, level, finalDistance: Number(get('bestFinal')) || 0 }
}

/**
 * The Firebase side of the cloud. Document shapes are enforced by firestore.rules:
 * `runs/{id}` holds one finished run, which a share link points at; `users/{uid}` is the player's leaderboard
 * entry: their callsign, best score and how that run ended. The board is a query over `users`.
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
    async loadBest(uid) {
      const snap = await getDoc(doc(db, 'users', uid))
      // An entry from under earlier rules has no best of this kind: treat it as none.
      return snap.exists() ? { best: Number(snap.get(BEST)) || 0, end: endOf(f => snap.get(f)) } : null
    },
    async saveBest(uid, best, end, callsign) {
      await setDoc(doc(db, 'users', uid), {
        callsign, [BEST]: best, bestOutcome: end.outcome, bestLevel: end.level, bestFinal: end.finalDistance,
        updatedAt: serverTimestamp(),
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
        score: Number(data.score) || 0,
        saved: Number(data.saved) || 0,
        distance: Number(data.distance) || 0,
      }
    },
    async loadBoard(size) {
      const snap = await getDocs(query(collection(db, 'users'), where(BEST, '>', 0), orderBy(BEST, 'desc'), limit(size)))
      return snap.docs.map(d => ({ uid: d.id, callsign: String(d.get('callsign')), value: Number(d.get(BEST)) || 0, end: endOf(f => d.get(f)) }))
    },
    async countAbove(value) {
      const snap = await getCountFromServer(query(collection(db, 'users'), where(BEST, '>', value)))
      return snap.data().count
    },
  }
}

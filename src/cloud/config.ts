import type { FirebaseOptions } from 'firebase/app'

export interface CloudConfig {
  options: FirebaseOptions
  /** Talk to the local Firebase emulators instead of a real project. */
  emulators: boolean
}

type Env = Record<string, string | boolean | undefined>

/**
 * Reads the Firebase config from Vite's env. Returns null when the cloud should
 * stay off: in tests, or when the config is missing or incomplete. The game
 * then runs with on-device bests only.
 */
export function readFirebaseConfig(env: Env): CloudConfig | null {
  if (env.MODE === 'test') return null
  const get = (key: string) => {
    const value = env[`VITE_FIREBASE_${key}`]
    return typeof value === 'string' && value ? value : undefined
  }
  const projectId = get('PROJECT_ID')
  if (!projectId) return null

  if (get('EMULATORS') === 'true') {
    return { emulators: true, options: { projectId, apiKey: get('API_KEY') ?? 'demo-api-key' } }
  }

  const apiKey = get('API_KEY'), authDomain = get('AUTH_DOMAIN'), appId = get('APP_ID')
  if (!apiKey || !authDomain || !appId) return null
  return {
    emulators: false,
    options: {
      apiKey, authDomain, projectId, appId,
      storageBucket: get('STORAGE_BUCKET'),
      messagingSenderId: get('MESSAGING_SENDER_ID'),
    },
  }
}

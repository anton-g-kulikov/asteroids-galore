import { expect, test } from 'vitest'
import { readFirebaseConfig } from '../../src/cloud/config'

const full = {
  MODE: 'production',
  VITE_FIREBASE_API_KEY: 'key',
  VITE_FIREBASE_AUTH_DOMAIN: 'x.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'x',
  VITE_FIREBASE_STORAGE_BUCKET: 'x.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '1',
  VITE_FIREBASE_APP_ID: '1:1:web:1',
}

test('CFG-01 no values: the cloud is off', () => {
  expect(readFirebaseConfig({ MODE: 'production' })).toBeNull()
})

test('CFG-02 a complete config is passed through; a partial one turns the cloud off', () => {
  expect(readFirebaseConfig(full)).toEqual({
    emulators: false,
    options: {
      apiKey: 'key', authDomain: 'x.firebaseapp.com', projectId: 'x',
      storageBucket: 'x.appspot.com', messagingSenderId: '1', appId: '1:1:web:1',
    },
  })
  expect(readFirebaseConfig({ ...full, VITE_FIREBASE_APP_ID: '' })).toBeNull()
})

test('CFG-03 with the emulator flag only the project ID is needed', () => {
  const cfg = readFirebaseConfig({ MODE: 'development', VITE_FIREBASE_EMULATORS: 'true', VITE_FIREBASE_PROJECT_ID: 'demo-x' })
  expect(cfg?.emulators).toBe(true)
  expect(cfg?.options.projectId).toBe('demo-x')
  expect(cfg?.options.apiKey).toBeTruthy()
  expect(readFirebaseConfig({ MODE: 'development', VITE_FIREBASE_EMULATORS: 'true' })).toBeNull()
})

test('CFG-04 the cloud is always off in test mode', () => {
  expect(readFirebaseConfig({ ...full, MODE: 'test' })).toBeNull()
})

import { registerSW } from 'virtual:pwa-register'
import { createUpdater, type Updater } from './updates'

/**
 * Registers the service worker that lets the game load offline. A new version
 * is downloaded in the background and waits; it takes over on the start
 * screen (see updates.ts), or by itself at the next launch.
 */
export function startServiceWorker(): Updater {
  const updater = createUpdater(() => void updateSW(true))
  const updateSW = registerSW({
    onNeedRefresh: () => updater.found(),
    onRegisterError: error => console.warn('Service worker registration failed', error),
  })
  return updater
}

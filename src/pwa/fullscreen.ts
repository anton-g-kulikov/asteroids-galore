// Installed on Android with `display: fullscreen`, Chrome sometimes lays the
// page out below where the status bar was, leaving that strip of the window
// unpainted (the page's own background is black everywhere it reaches). Asking
// for fullscreen on the page itself makes the browser lay it over the whole
// screen. Browsers allow that only on a tap or a key, so the first one asks.
// In a browser tab nothing is asked: that would surprise a player who only
// opened a link. Where the Fullscreen API is missing (iPhone), nothing happens.

export interface FullscreenEnv {
  readonly fullscreenEnabled: boolean
  readonly fullscreenElement: unknown
  /** True when the page runs in this display mode (`matchMedia('(display-mode: …)')`). */
  displayMode(mode: 'fullscreen' | 'standalone'): boolean
  /** Asks for fullscreen on the whole page. */
  request(): Promise<void>
}

export function createFullscreenKeeper(env: FullscreenEnv): { tap(): void } {
  let refused = false
  return {
    tap() {
      if (refused || !env.fullscreenEnabled || env.fullscreenElement) return
      if (!env.displayMode('fullscreen') && !env.displayMode('standalone')) return
      try {
        env.request().catch(() => { refused = true })
      } catch {
        refused = true
      }
    },
  }
}

/** The page's own environment. */
export function browserFullscreen(): FullscreenEnv {
  return {
    get fullscreenEnabled() { return !!document.fullscreenEnabled },
    get fullscreenElement() { return document.fullscreenElement },
    displayMode: mode => !!window.matchMedia?.(`(display-mode: ${mode})`).matches,
    request: () => document.documentElement.requestFullscreen({ navigationUI: 'hide' }),
  }
}

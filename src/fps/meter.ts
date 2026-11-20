// The frame-rate display: how many frames the screen actually draws. It has
// nothing to do with the simulation, which steps at a fixed 1/60 s whatever the
// screen does; a slow phone draws fewer frames and the game is harder to fly.

export const FPS_KEY = 'asteroids-galore-fps'

/** Over how long the frame rate is averaged, and how long the slowest frame is remembered, in seconds. */
export const FPS_WINDOW = 0.5
export const LOW_WINDOW = 3

export interface FpsReading { fps: number; low: number }

export interface FrameMeter {
  /** Called once per frame drawn, with the real time since the frame before. */
  frame(dt: number): void
  /** Frames per second over the last half second, and the slowest single frame of the last 3 s as a rate. */
  reading(): FpsReading | null
}

export function createFrameMeter(): FrameMeter {
  let now = 0
  let frames: { at: number; dt: number }[] = []
  return {
    frame(dt) {
      if (!(dt > 0)) return
      now += dt
      frames.push({ at: now, dt })
      frames = frames.filter(f => f.at > now - LOW_WINDOW - 1e-9)
    },
    reading() {
      if (!frames.length) return null
      const recent = frames.filter(f => f.at > now - FPS_WINDOW + 1e-9)
      const time = recent.reduce((s, f) => s + f.dt, 0)
      return {
        fps: Math.round(recent.length / time),
        low: Math.round(1 / Math.max(...frames.map(f => f.dt))),
      }
    },
  }
}

export interface FpsSwitch { readonly on: boolean; toggle(): void }

/** Off by default; remembered on the device. */
export function createFpsSwitch(storage: Pick<Storage, 'getItem' | 'setItem'> | null): FpsSwitch {
  let on = false
  try { on = storage?.getItem(FPS_KEY) === '1' } catch { /* storage blocked: off */ }
  return {
    get on() { return on },
    toggle() {
      on = !on
      try { storage?.setItem(FPS_KEY, on ? '1' : '0') } catch { /* kept for this visit only */ }
    },
  }
}

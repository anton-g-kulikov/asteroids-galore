// The frame rate a run was flown at, saved with the run so slow devices show up
// in the data (the owner's word, 2026-11-22). Like the meter, it counts frames
// the screen drew and never touches the simulation. Only flight counts: the fly-ins
// and the missions, not the stops between them or the end screen.

export interface RunFps { fpsAvg: number; fpsLow: number }

export interface RunFrames {
  /** A run has started: forget the last one. */
  start(): void
  /** Once per frame drawn, with the real time since the frame before, and whether the ship is flying. */
  frame(dt: number, flying: boolean): void
  /** The run's average frames per second in flight, and its slowest whole second; null before any flight. */
  result(): RunFps | null
}

export function createRunFrames(): RunFrames {
  let frames = 0, time = 0                // the whole run's flight
  let winFrames = 0, winTime = 0          // the second being counted
  let low = Infinity                      // the slowest finished second, in frames per second
  return {
    start() { frames = 0; time = 0; winFrames = 0; winTime = 0; low = Infinity },
    frame(dt, flying) {
      if (!flying || !(dt > 0)) return
      frames++; time += dt
      winFrames++; winTime += dt
      if (winTime >= 1 - 1e-9) {           // a second (or a little more, after a long frame) is done
        low = Math.min(low, winFrames / winTime)
        winFrames = 0; winTime = 0
      }
    },
    result() {
      if (!frames) return null
      const avg = Math.round(frames / time)
      return { fpsAvg: avg, fpsLow: low === Infinity ? avg : Math.round(low) }
    },
  }
}

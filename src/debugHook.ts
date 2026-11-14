import { scoreOf } from './game/score'
import { skipLevel } from './game/simulation'
import { spawnDilemma, spawnRescue } from './game/spawn'
import type { Game } from './game/types'

/**
 * Read-only state and a few helpers on `window.__game`, used by the automated
 * checks and for poking at the game from the console.
 */
export function createDebugHook(g: Game) {
  return {
    get state() { return g.state },
    get score() { return scoreOf(g) },
    get distance() { return g.distance },
    get speed() { return g.speed },
    get asteroids() { return g.asteroids },
    get saved() { return g.saved },
    get lost() { return g.lost },
    get missed() { return g.missed },
    get wells() { return g.wells },
    get level() { return g.level },
    get onboard() { return g.onboard },
    get wormhole() { return g.wormhole },
    get wormTimer() { return g.wormTimer },
    get drops() { return g.drops },
    get results() { return g.results },
    get slowmo() { return g.slowmo },
    get shields() { return g.shields },
    get grace() { return g.grace },
    ship: g.ship,
    skipLevel() { skipLevel(g) },
    fill(n: number) { g.onboard = n },
    spawnRescue() { spawnRescue(g) },
    spawnDilemma() { spawnDilemma(g) },
  }
}

declare global {
  interface Window { __game?: ReturnType<typeof createDebugHook> }
}

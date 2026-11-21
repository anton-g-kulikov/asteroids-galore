import { expect, test } from 'vitest'
import { createFullscreenKeeper, type FullscreenEnv } from '../../src/pwa/fullscreen'

function env(mode: 'fullscreen' | 'standalone' | 'browser', opts: { enabled?: boolean; refuse?: boolean; throws?: boolean } = {}) {
  const asked: string[] = []
  const e: FullscreenEnv & { fullscreenElement: unknown } = {
    fullscreenEnabled: opts.enabled ?? true,
    fullscreenElement: null,
    displayMode: m => m === mode,
    request: () => {
      asked.push('ask')
      if (opts.throws) throw new Error('not allowed')
      if (opts.refuse) return Promise.reject(new Error('refused'))
      e.fullscreenElement = {}
      return Promise.resolve()
    },
  }
  return { e, asked }
}

test('FULL-01 installed as an app, the first tap asks for fullscreen, and again only after leaving it', async () => {
  for (const mode of ['fullscreen', 'standalone'] as const) {
    const { e, asked } = env(mode)
    const keeper = createFullscreenKeeper(e)
    keeper.tap()
    expect(asked).toEqual(['ask'])
    keeper.tap(); keeper.tap()
    expect(asked).toEqual(['ask'])                       // in fullscreen: not asked again
    e.fullscreenElement = null                            // the app left it (a system gesture, say)
    keeper.tap()
    expect(asked).toEqual(['ask', 'ask'])
  }
})

test('FULL-01 in a browser tab, without the Fullscreen API, or when refused, nothing happens', async () => {
  const tab = env('browser'); createFullscreenKeeper(tab.e).tap()
  expect(tab.asked).toEqual([])
  const iphone = env('standalone', { enabled: false }); createFullscreenKeeper(iphone.e).tap()
  expect(iphone.asked).toEqual([])
  const refused = env('fullscreen', { refuse: true }); const k = createFullscreenKeeper(refused.e)
  k.tap(); await Promise.resolve(); await Promise.resolve()
  k.tap()
  expect(refused.asked).toEqual(['ask'])                  // refused once: not pestered on every tap
  const throws = env('fullscreen', { throws: true })
  expect(() => createFullscreenKeeper(throws.e).tap()).not.toThrow()
})

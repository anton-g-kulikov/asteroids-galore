import { afterEach, expect, test } from 'vitest'
import { outlined, setPlainZero, text, zeroNeedsSlash } from '../../src/render/text'

// A context that records what is drawn; every character is 10 px wide.
function recorder() {
  const lines: number[][] = []
  let path: number[] = []
  const ctx = {
    font: '', textAlign: 'left' as CanvasTextAlign, fillStyle: '', strokeStyle: '', lineWidth: 1, lineCap: 'butt', lineJoin: 'miter', shadowColor: '', shadowBlur: 0,
    fillText() {}, strokeText() {}, save() {}, restore() {}, beginPath() { path = [] },
    moveTo(x: number, y: number) { path.push(x, y) }, lineTo(x: number, y: number) { path.push(x, y) }, stroke() { lines.push(path) },
    measureText: (s: string) => ({ width: s.length * 10 }),
  }
  return { ctx: ctx as unknown as CanvasRenderingContext2D, lines }
}

afterEach(() => setPlainZero(null))

test('ZERO-01 where the device font draws a plain zero, every 0 gets a slash inside its own glyph; elsewhere nothing is added', () => {
  setPlainZero(true)
  const r = recorder()
  text(r.ctx, 'm00n', 100, 50, 20, '#5ff5ff', 'center')               // drawn from x 80 to 120: the zeros at 90 and 100
  expect(r.lines).toHaveLength(2)
  for (const [k, l] of r.lines.entries()) {
    const gx = 90 + k * 10
    expect(l[0]).toBeGreaterThan(gx); expect(l[2]).toBeLessThan(gx + 10)  // inside the glyph
    expect(l[1]).toBeGreaterThan(l[3])                                     // bottom left to top right
  }
  const title = recorder()
  outlined(title.ctx, 'LIGHTB0AT', 0, 50, 40)
  expect(title.lines).toHaveLength(1)
  setPlainZero(false)
  const none = recorder()
  text(none.ctx, 'm00n', 100, 50, 20, '#5ff5ff')
  expect(none.lines).toHaveLength(0)
})

test('ZERO-02 without a page to draw on, the font is left alone', () => {
  expect(zeroNeedsSlash()).toBe(false)
})

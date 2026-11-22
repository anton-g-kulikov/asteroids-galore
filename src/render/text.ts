const FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Roboto Mono", monospace'

/** Makes what is drawn next glow in its own colour. `glow(ctx)` turns it off. */
export function glow(ctx: CanvasRenderingContext2D, color = '', blur = 0): void {
  ctx.shadowColor = color || 'transparent'
  ctx.shadowBlur = blur
}

let plainZero: boolean | null = null

/** For checks: decide whether zeros need the game's slash, or `null` to look again. */
export function setPlainZero(v: boolean | null): void { plainZero = v }

/**
 * Whether this device's monospace draws its zero with nothing in the middle. Apple's and Windows' fonts
 * slash or dot it; Android's does not, so the game slashes it there itself (m00n, LIGHTB0AT). Checked
 * once, by drawing a zero and looking for ink at its centre. Without a page (the checks) it is false.
 */
export function zeroNeedsSlash(): boolean {
  if (plainZero !== null) return plainZero
  plainZero = false
  try {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const x = c.getContext('2d', { willReadFrequently: true })
    if (!x) return plainZero
    x.font = `700 48px ${FONT}`
    x.textAlign = 'center'
    x.textBaseline = 'alphabetic'
    x.fillStyle = '#ffffff'
    x.fillText('0', 32, 50)
    const m = x.measureText('0'), top = 50 - (m.actualBoundingBoxAscent || 34), mid = Math.round((top + 50) / 2)
    const px = x.getImageData(28, mid - 4, 8, 8).data
    let ink = 0
    for (let i = 3; i < px.length; i += 4) ink = Math.max(ink, px[i])
    plainZero = ink < 40
  } catch { /* no canvas: leave the font alone */ }
  return plainZero
}

/** Draws a slash through every 0 in `str`, as just drawn with the context's font and alignment at (x, y). */
function slashZeros(ctx: CanvasRenderingContext2D, str: string, x: number, y: number, size: number, color: string, width: number): void {
  if (!str.includes('0') || !zeroNeedsSlash()) return
  const w = ctx.measureText(str).width, a = ctx.textAlign
  const left = a === 'center' ? x - w / 2 : a === 'right' || a === 'end' ? x - w : x
  const gw = ctx.measureText('0').width, h = size * 0.7
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  for (let i = str.indexOf('0'); i >= 0; i = str.indexOf('0', i + 1)) {
    const gx = left + ctx.measureText(str.slice(0, i)).width
    ctx.beginPath()
    ctx.moveTo(gx + gw * 0.28, y - h * 0.12)
    ctx.lineTo(gx + gw * 0.72, y - h * 0.88)
    ctx.stroke()
  }
  ctx.restore()
}

export function text(
  ctx: CanvasRenderingContext2D, str: string, x: number, y: number, size: number, color: string,
  align: CanvasTextAlign = 'center', weight = 700,
): void {
  ctx.font = `${weight} ${Math.round(size)}px ${FONT}`
  ctx.textAlign = align
  ctx.fillStyle = color
  glow(ctx, color, size * 0.45)
  ctx.fillText(str, x, y)
  slashZeros(ctx, str, x, y, size, color, Math.max(1, size * 0.09 * weight / 700))
  glow(ctx)
}

/**
 * A word drawn the way the ship is: black inside, an outline of light with a
 * glow. Used for the title. Always centred on `x`.
 */
export function outlined(
  ctx: CanvasRenderingContext2D, str: string, x: number, y: number, size: number, color = '#5ff5ff', weight = 800,
): void {
  ctx.font = `${weight} ${Math.round(size)}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(1.5, size * 0.038)
  ctx.strokeStyle = color
  glow(ctx, color, size * 0.25)
  ctx.strokeText(str, x, y)        // the glow, from the outline
  glow(ctx)
  ctx.fillStyle = '#000000'
  ctx.fillText(str, x, y)          // black inside, so the grid does not show through
  ctx.strokeText(str, x, y)        // the line again, crisp over the fill
  slashZeros(ctx, str, x, y, size, color, ctx.lineWidth)
}

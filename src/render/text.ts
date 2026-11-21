const FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Roboto Mono", monospace'

/** Makes what is drawn next glow in its own colour. `glow(ctx)` turns it off. */
export function glow(ctx: CanvasRenderingContext2D, color = '', blur = 0): void {
  ctx.shadowColor = color || 'transparent'
  ctx.shadowBlur = blur
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
}

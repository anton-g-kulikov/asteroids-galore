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

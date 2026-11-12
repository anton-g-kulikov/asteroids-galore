const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

export function text(
  ctx: CanvasRenderingContext2D, str: string, x: number, y: number, size: number, color: string,
  align: CanvasTextAlign = 'center', weight = 700,
): void {
  ctx.font = `${weight} ${Math.round(size)}px ${FONT}`
  ctx.textAlign = align
  ctx.fillStyle = color
  ctx.fillText(str, x, y)
}

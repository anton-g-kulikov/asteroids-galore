export function buzz(pattern: number | number[]): void {
  if (navigator.vibrate) navigator.vibrate(pattern)
}

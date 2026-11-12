// Steering state: which side of the screen is held, by key or by thumb.

export interface Input {
  key(side: 'left' | 'right', down: boolean): void
  /** A pointer went down at `x` on a screen `width` wide. */
  pointer(id: number, x: number, width: number): void
  /** Sliding a thumb across the middle switches direction without lifting. */
  movePointer(id: number, x: number, width: number): void
  release(id: number): void
  clear(): void
  /** -1 left, 1 right, 0 straight. Both sides held = hold course. */
  steer(): number
}

export function createInput(): Input {
  const pointers = new Map<number, -1 | 1>()   // pointerId -> left side | right side
  const keys = { left: false, right: false }
  const sideOf = (x: number, width: number) => x < width / 2 ? -1 : 1

  return {
    key(side, down) { keys[side] = down },
    pointer(id, x, width) { pointers.set(id, sideOf(x, width)) },
    movePointer(id, x, width) { if (pointers.has(id)) pointers.set(id, sideOf(x, width)) },
    release(id) { pointers.delete(id) },
    clear() { pointers.clear(); keys.left = keys.right = false },
    steer() {
      let l = keys.left, r = keys.right
      for (const side of pointers.values()) { if (side < 0) l = true; else r = true }
      return (r ? 1 : 0) - (l ? 1 : 0)
    },
  }
}

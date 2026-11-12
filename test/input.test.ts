import { expect, test } from 'vitest'
import { createInput } from '../src/game/input'

test('INP-01 keys and pointers steer left, right, or hold course', () => {
  const i = createInput()
  expect(i.steer()).toBe(0)
  i.key('left', true)
  expect(i.steer()).toBe(-1)
  i.key('right', true)
  expect(i.steer()).toBe(0)
  i.key('left', false)
  expect(i.steer()).toBe(1)
  i.key('right', false)

  i.pointer(1, 40, 400)
  expect(i.steer()).toBe(-1)
  i.pointer(2, 300, 400)
  expect(i.steer()).toBe(0)   // both thumbs down
})

test('INP-02 sliding across the middle switches side; releasing clears', () => {
  const i = createInput()
  i.pointer(1, 40, 400)
  i.movePointer(1, 260, 400)
  expect(i.steer()).toBe(1)
  i.movePointer(7, 10, 400)   // a pointer that is not down is ignored
  expect(i.steer()).toBe(1)
  i.release(1)
  expect(i.steer()).toBe(0)
})

test('INP-03 losing focus clears all held input', () => {
  const i = createInput()
  i.key('left', true)
  i.pointer(1, 300, 400)
  i.clear()
  expect(i.steer()).toBe(0)
})

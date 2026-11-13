import { expect, test, vi } from 'vitest'
import { shareIdFromPath, shareMessage, shareResult, shareUrl } from '../../src/cloud/share'
import type { RunResult } from '../../src/game/runSummary'

const lost: RunResult = { outcome: 'over', score: 1128, distance: 564, level: 3, saved: 3, lost: 1, missed: 0, durationSeconds: 40 }
const won: RunResult = { ...lost, outcome: 'won', level: 4, saved: 14, lost: 0, score: 7896 }

test('SHARE-01 the run ID comes from /s/{id}', () => {
  expect(shareIdFromPath('/s/Ab3dEf6hIj9kLm2nOp5q')).toBe('Ab3dEf6hIj9kLm2nOp5q')
  expect(shareIdFromPath('/s/Ab3dEf6hIj9kLm2nOp5q/')).toBe('Ab3dEf6hIj9kLm2nOp5q')
  for (const path of ['/', '/s/', '/s', '/x/Ab3dEf6hIj9kLm2nOp5q', '/s/a/b', '/s/../users', '/s/has space']) {
    expect(shareIdFromPath(path)).toBeNull()
  }
})

test('SHARE-02 the link and the message', () => {
  expect(shareUrl('https://example.test', 'abc123')).toBe('https://example.test/s/abc123')
  // both messages lead with the crew saved and give the score, not the distance
  expect(shareMessage(lost)).toContain('3 crew')
  expect(shareMessage(lost)).toContain('1,128')
  expect(shareMessage(won)).toContain('14 crew')
  expect(shareMessage(won)).toContain('7,896')
  expect(shareMessage(lost) + shareMessage(won)).not.toContain('564')
})

test('SHARE-03 the share sheet is used when there is one', async () => {
  const share = vi.fn(async () => {})
  const writeText = vi.fn(async () => {})
  await expect(shareResult({ share, clipboard: { writeText } }, 'text', 'https://x/s/1')).resolves.toBe('shared')
  expect(share).toHaveBeenCalledWith({ title: 'Asteroids Galore', text: 'text', url: 'https://x/s/1' })

  share.mockRejectedValueOnce(Object.assign(new Error('cancelled'), { name: 'AbortError' }))
  await expect(shareResult({ share, clipboard: { writeText } }, 'text', 'https://x/s/1')).resolves.toBe('shared')
  expect(writeText).not.toHaveBeenCalled()
})

test('SHARE-04 without a share sheet the link is copied', async () => {
  const writeText = vi.fn(async () => {})
  await expect(shareResult({ clipboard: { writeText } }, 'text', 'https://x/s/1')).resolves.toBe('copied')
  expect(writeText).toHaveBeenCalledWith('https://x/s/1')

  writeText.mockRejectedValueOnce(new Error('denied'))
  await expect(shareResult({ clipboard: { writeText } }, 'text', 'https://x/s/1')).resolves.toBe('failed')
  await expect(shareResult({}, 'text', 'https://x/s/1')).resolves.toBe('failed')
})

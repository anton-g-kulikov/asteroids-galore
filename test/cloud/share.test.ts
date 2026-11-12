import { expect, test, vi } from 'vitest'
import { shareIdFromPath, shareMessage, shareResult, shareUrl } from '../../src/cloud/share'
import type { RunResult } from '../../src/game/runSummary'

const lost: RunResult = { outcome: 'over', distance: 564, level: 3, rescued: 2, missed: 0, durationSeconds: 40 }
const won: RunResult = { ...lost, outcome: 'won', level: 4, rescued: 14 }

test('SHARE-01 the run ID comes from /s/{id}', () => {
  expect(shareIdFromPath('/s/Ab3dEf6hIj9kLm2nOp5q')).toBe('Ab3dEf6hIj9kLm2nOp5q')
  expect(shareIdFromPath('/s/Ab3dEf6hIj9kLm2nOp5q/')).toBe('Ab3dEf6hIj9kLm2nOp5q')
  for (const path of ['/', '/s/', '/s', '/x/Ab3dEf6hIj9kLm2nOp5q', '/s/a/b', '/s/../users', '/s/has space']) {
    expect(shareIdFromPath(path)).toBeNull()
  }
})

test('SHARE-02 the link and the message', () => {
  expect(shareUrl('https://example.test', 'abc123')).toBe('https://example.test/s/abc123')
  expect(shareMessage(lost)).toContain('564 pc')
  expect(shareMessage(lost)).not.toMatch(/crew|rescued/i)
  expect(shareMessage(won)).toContain('564 pc')
  expect(shareMessage(won)).toContain('14')
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

import { expect, test } from 'vitest'
import { ADJECTIVES, CALLSIGN_PATTERN, NOUNS, callsignFor } from '../../src/cloud/callsign'

test('CALL-01 the same account always gets the same callsign', () => {
  expect(callsignFor('lAvUVF7Gtacxi0EpDi8yBFV83MHz')).toBe(callsignFor('lAvUVF7Gtacxi0EpDi8yBFV83MHz'))
  const many = new Set(Array.from({ length: 200 }, (_, i) => callsignFor(`user-${i}`)))
  expect(many.size).toBeGreaterThan(190)
})

test('CALL-02 every callsign is two capital words and two digits', () => {
  for (const word of [...ADJECTIVES, ...NOUNS]) expect(word).toMatch(/^[A-Z]{3,9}$/)
  expect(new Set(ADJECTIVES).size).toBe(ADJECTIVES.length)
  expect(new Set(NOUNS).size).toBe(NOUNS.length)
  for (let i = 0; i < 500; i++) expect(callsignFor(`u${i}`)).toMatch(CALLSIGN_PATTERN)
  expect(CALLSIGN_PATTERN.source).toBe('^[A-Z]{3,9} [A-Z]{3,9} [0-9]{2}$')   // the same pattern is in firestore.rules
})

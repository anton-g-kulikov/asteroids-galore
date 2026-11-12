// Players never type a name. Each account gets a callsign made from its ID,
// so the same account always flies under the same one.

export const ADJECTIVES = [
  'COSMIC', 'LUNAR', 'SOLAR', 'STELLAR', 'ORBITAL', 'ASTRAL', 'DISTANT', 'SILENT',
  'SWIFT', 'BRAVE', 'LUCKY', 'STEADY', 'DARING', 'NIMBLE', 'BRIGHT', 'QUIET',
  'ROGUE', 'GOLDEN', 'SILVER', 'CRIMSON', 'AZURE', 'AMBER', 'FROZEN', 'BLAZING',
  'DRIFTING', 'WANDERING', 'RESTLESS', 'PATIENT', 'ELECTRIC', 'MAGNETIC', 'RADIANT', 'HIDDEN',
]

export const NOUNS = [
  'OTTER', 'FOX', 'HERON', 'FALCON', 'LYNX', 'BADGER', 'MARTEN', 'OSPREY',
  'COMET', 'NEBULA', 'QUASAR', 'PULSAR', 'METEOR', 'AURORA', 'ECLIPSE', 'ZENITH',
  'PILOT', 'RANGER', 'DRIFTER', 'VOYAGER', 'COURIER', 'SCOUT', 'TUGBOAT', 'BEACON',
  'KESTREL', 'MAGPIE', 'PUFFIN', 'WALRUS', 'TORTOISE', 'PANGOLIN', 'HEDGEHOG', 'SPARROW',
]

/** The form every callsign takes. firestore.rules accepts exactly this pattern. */
export const CALLSIGN_PATTERN = /^[A-Z]{3,9} [A-Z]{3,9} [0-9]{2}$/

// FNV-1a: small, stable, and spreads similar IDs apart.
function hash(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 0x01000193)
  return h >>> 0
}

/** For example `COSMIC OTTER 42`. */
export function callsignFor(uid: string): string {
  const h = hash(uid)
  const adjective = ADJECTIVES[h % ADJECTIVES.length]
  const noun = NOUNS[Math.floor(h / ADJECTIVES.length) % NOUNS.length]
  const number = Math.floor(h / (ADJECTIVES.length * NOUNS.length)) % 100
  return `${adjective} ${noun} ${String(number).padStart(2, '0')}`
}

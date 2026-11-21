// Draws the app icons in the game's vector glow look: the ship in lines of
// light, flying up through the violet grid with a rock passing by. Writes SVGs to public/ and renders the PNGs with ImageMagick.
// Run with `npm run icons` after changing the ship or the look.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BG = '#000000'
const LINE = '#5ff5ff'

// A glow every renderer draws the same way (ImageMagick ignores SVG filters):
// the shapes' outlines again, wider and fainter each time, under the shapes.
function halo(color, width, spread, shapes) {
  const rings = [1, 2, 3, 4, 5, 6, 7, 8].map(i =>
    `<g stroke-width="${(width + 2 * spread * (i / 8) ** 1.6).toFixed(2)}">${shapes}</g>`).join('')
  return `<g fill="none" stroke="${color}" stroke-opacity=".075" stroke-linejoin="round" stroke-linecap="round">${rings}</g>`
}

// The ship as drawHull in src/render/sprites.ts draws it, nose up, centred on
// (0, 0): black inside, lines of light, a full crew of four in ship 1's seats.
function ship(r, { seats = true, line = 0.09 } = {}) {
  const p = (...xy) => xy.map(v => +(v * r).toFixed(2)).join(' ')
  const n = v => (v * r).toFixed(2)
  const dots = seats ? [[-0.18, 0.35], [0.18, 0.35], [-0.18, -0.01], [0.18, -0.01]]
    .map(([x, y]) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.144)}"/>`).join('') : ''
  const flame = `<path d="M${p(-0.32, 0.75)} L${p(0, 2.0)} L${p(0.32, 0.75)} Z"/>`
  const hull = `<path d="M${p(0, -0.2)} L${p(1.15, 0.95)} L${p(0.3, 0.7)} L${p(-0.3, 0.7)} L${p(-1.15, 0.95)} Z"/>
      <path d="M${p(0, -1.35)} Q${p(0.55, -0.2)} ${p(0.42, 0.85)} L${p(-0.42, 0.85)} Q${p(-0.55, -0.2)} ${p(0, -1.35)} Z"/>`
  return `
    ${halo('#ffe66b', 0, r * 0.3, flame)}<g fill="#ffe66b">${flame}</g>
    ${halo(LINE, r * line, r * 0.3, hull)}
    <g fill="${BG}" stroke="${LINE}" stroke-width="${n(line)}" stroke-linejoin="round">${hull}</g>
    <path fill="${LINE}" d="M${p(0, -1.143)} Q${p(0.12, -0.892)} ${p(0.191, -0.649)} Q${p(0, -0.489)} ${p(-0.191, -0.649)} Q${p(-0.12, -0.892)} ${p(0, -1.143)} Z"/>
    ${halo('#5dffa0', 0, r * 0.1, dots)}<g fill="#5dffa0">${dots}</g>`
}

// A rock as drawRockBody draws it: dark inside, a bright outline, craters as thin rings.
function rock(x, y, r) {
  const pts = [1, 0.86, 1.04, 0.8, 0.98, 0.9, 1.06, 0.84, 0.95, 1.02].map((k, i, a) => {
    const t = (i / a.length) * Math.PI * 2
    return `${(x + Math.cos(t) * r * k).toFixed(1)},${(y + Math.sin(t) * r * k).toFixed(1)}`
  })
  const body = `<polygon points="${pts.join(' ')}"/>`
  return `${halo('#9fb4b0', r * 0.1, r * 0.3, body)}
    <g fill="#2b3634" stroke="#9fb4b0" stroke-width="${(r * 0.1).toFixed(1)}" stroke-linejoin="round">${body}</g>
    <g fill="none" stroke="#9fb4b0" stroke-opacity=".6" stroke-width="${(r * 0.06).toFixed(1)}">
      <circle cx="${x - r * 0.3}" cy="${y - r * 0.15}" r="${r * 0.22}"/>
      <circle cx="${x + r * 0.28}" cy="${y + r * 0.3}" r="${r * 0.14}"/>
    </g>`
}

/** `scale` shrinks the artwork towards the centre, for the maskable icon's safe zone. */
function icon({ size = 512, scale = 1, rounded = false, details = true } = {}) {
  const c = size / 2, k = size / 512 * scale
  // The grid always fills the whole icon, centred, at the artwork's scale.
  const grid = []
  if (details) {
    const step = 64 * k
    for (let v = c - step / 2 - Math.ceil(c / step) * step; v < size; v += step) {
      grid.push(`<path d="M${v.toFixed(1)} 0V${size}M0 ${v.toFixed(1)}H${size}"/>`)
    }
  }
  const stars = details ? [[70, 90, 2.5], [430, 70, 2], [400, 300, 2.5], [90, 400, 2], [150, 230, 1.6], [360, 440, 1.8], [250, 40, 1.5]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#7fa8a2"/>`).join('') : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG}"${rounded ? ` rx="${size * 0.22}"` : ''}/>
  <g stroke="#968cff" stroke-opacity=".3" stroke-width="${(2 * k).toFixed(2)}">${grid.join('')}</g>
  <g transform="translate(${c} ${c}) scale(${k}) translate(-256 -256)">
    ${stars}
    ${details ? rock(392, 160, 46) : ''}
    <g transform="translate(256 222)">${ship(118, details ? {} : { seats: false, line: 0.14 })}</g>
  </g>
</svg>
`
}

const out = 'public/icons'
// The favicon ships as SVG; the other SVGs are only the source of the PNGs.
writeFileSync('public/favicon.svg', icon({ size: 64, rounded: true, details: false }))
const work = mkdtempSync(join(tmpdir(), 'icons-'))
writeFileSync(`${work}/icon.svg`, icon())
writeFileSync(`${work}/icon-maskable.svg`, icon({ scale: 0.78 }))   // everything inside the central 80% circle

const png = (src, size, dest) =>
  execFileSync('magick', ['-background', 'none', '-density', '384', src, '-resize', `${size}x${size}`, '-strip', `PNG32:${dest}`])
png(`${work}/icon.svg`, 192, `${out}/icon-192.png`)
png(`${work}/icon.svg`, 512, `${out}/icon-512.png`)
png(`${work}/icon-maskable.svg`, 512, `${out}/icon-maskable-512.png`)
png(`${work}/icon.svg`, 180, `${out}/apple-touch-icon.png`)
rmSync(work, { recursive: true })
console.log('icons written to public/')

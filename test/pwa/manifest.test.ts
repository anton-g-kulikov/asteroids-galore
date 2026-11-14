import { existsSync, readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { manifest } from '../../src/pwa/manifest'

const root = new URL('../../', import.meta.url)
const publicFile = (src: string) => new URL(`public/${src.replace(/^\//, '')}`, root)
const html = readFileSync(new URL('index.html', root), 'utf8')

// Width and height from a PNG's header.
function pngSize(file: URL): [number, number] {
  const b = readFileSync(file)
  expect(b.subarray(1, 4).toString()).toBe('PNG')
  return [b.readUInt32BE(16), b.readUInt32BE(20)]
}

test('PWA-01 the manifest describes a full-screen, portrait game in its own colours', () => {
  expect(manifest.name).toBe('Asteroids Galore')
  expect(manifest.short_name).toBe('Asteroids')
  expect(manifest.start_url).toBe('/')
  expect(manifest.scope).toBe('/')
  expect(manifest.display).toBe('fullscreen')
  expect(manifest.orientation).toBe('portrait')
  const themeColor = /<meta name="theme-color" content="([^"]+)">/.exec(html)?.[1]
  expect(manifest.theme_color).toBe(themeColor)
  expect(manifest.background_color).toBe(themeColor)
})

test('PWA-02 every icon exists at its stated size', () => {
  const icons = manifest.icons ?? []
  for (const icon of icons) {
    expect(icon.type).toBe('image/png')
    expect(existsSync(publicFile(icon.src)), icon.src).toBe(true)
    const [w, h] = pngSize(publicFile(icon.src))
    expect(`${w}x${h}`).toBe(icon.sizes)
  }
  const has = (sizes: string, purpose: string) => icons.some(i => i.sizes === sizes && (i.purpose ?? 'any') === purpose)
  expect(has('192x192', 'any')).toBe(true)
  expect(has('512x512', 'any')).toBe(true)
  expect(has('512x512', 'maskable')).toBe(true)
})

test('PWA-03 index.html links a home-screen icon for iOS and a favicon', () => {
  const touch = /<link rel="apple-touch-icon" href="([^"]+)">/.exec(html)?.[1]
  const favicon = /<link rel="icon" [^>]*href="([^"]+)"/.exec(html)?.[1]
  expect(touch).toBeDefined()
  expect(favicon).toBeDefined()
  expect(pngSize(publicFile(touch!))).toEqual([180, 180])
  expect(existsSync(publicFile(favicon!))).toBe(true)
})

test('PWA-04 Hosting never caches the service worker or the manifest', () => {
  const hosting = JSON.parse(readFileSync(new URL('firebase.json', root), 'utf8')).hosting
  // Firebase Hosting globs: ** crosses folders, * does not, @(a|b) is one of a list.
  const glob = (source: string) => new RegExp('^' + source
    .replace(/[.]/g, '\\.')
    .split('**').map(part => part.replace(/\*/g, '[^/]*')).join('.*')
    .replace(/@\(([^)]+)\)/g, '($1)') + '$')
  const noCache = (path: string) => hosting.headers.some((h: { source: string; headers: { key: string; value: string }[] }) =>
    glob(h.source).test(path) && h.headers.some(x => x.key === 'Cache-Control' && /no-cache/.test(x.value)))
  for (const path of ['/sw.js', '/registerSW.js', '/workbox-1a2b3c.js', '/manifest.webmanifest']) {
    expect(noCache(path), path).toBe(true)
  }
  expect(noCache('/assets/index-abc.js')).toBe(false)   // hashed assets keep their long cache
})

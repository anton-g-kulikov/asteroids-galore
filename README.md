# Asteroids Galore

A small top-down space dodger for phones. No shooting — just flying.

**Play:** https://anton-g-kulikov.github.io/asteroids-galore/

This is a prototype. Everything lives in one file, `index.html`, with no dependencies and no build step.

## Controls

- **Touch:** hold the left side of the screen to fly left, the right side to fly right. Holding both keeps the ship straight; sliding a thumb across the middle switches direction.
- **Keyboard:** arrow keys or A / D. Space or Enter starts a run.

## Run locally

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

## Publishing

The site is served by GitHub Pages from the `main` branch, root folder. Each push to `main` redeploys in about a minute.

## Design notes

How the game works under the hood — mechanics, level numbers, tuning constants and the debug hook — is written up in [DESIGN.md](DESIGN.md). The game leaves most of that for players to discover, so the file is full of spoilers.

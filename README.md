# Asteroids Galore

A small top-down space dodger for phones. No shooting — you steer a ship through a field of random asteroids, rescue stranded crews, and bend gravity to move the rocks around.

**Play:** https://anton-g-kulikov.github.io/asteroids-galore/

This is a prototype. Everything lives in one file, `index.html`, with no dependencies and no build step.

## Controls

- **Touch:** hold the left side of the screen to fly left, the right side to fly right. Holding both keeps the ship straight; sliding a thumb across the middle switches direction.
- **Keyboard:** arrow keys or A / D. Space or Enter starts a run.

## What the player is told

Deliberately very little. The start screen shows only the title, the best distance and the two control arrows. Rescues, the level exit and gravity are left for the player to discover. The sections below describe how they work, so treat them as spoilers.

## Parsecs and rescues

There are two separate results, both explained on the end screen:

- **Parsecs (pc)** — pure distance flown. It grows faster as the level speeds up. The best distance is saved on the device.
- **Rescued / missed** — crew picked up, and crew that drifted off the bottom of the screen unrescued (including anyone left behind because the ship was full). Rescues add nothing to the parsec count.

## Levels

There are 4 levels; finishing the fourth shows the mission-complete screen.

| Level | Parsecs to fly | Seats | Steering speed | Ship size |
|---|---|---|---|---|
| 1 | 350 | 0 (asteroids only) | 100% | 1× |
| 2 | 450 | 4 | 92% | 1.15× |
| 3 | 550 | 8 | 85% | 1.3× |
| 4 | 650 | 16 | 78% | 1.5× |

- A level's goals are met once its parsec target is flown **and** at least 20 seconds have passed. The bar under the parsec count shows progress towards the target.
- The asteroid speed ramp restarts at every level, so the rocks behave the same each time while the ship gets bigger (larger hitbox) and slower to steer.
- Entering a new level delivers the crew on board, emptying the seats.

### Leaving a level

Levels do not end on their own. When the goals are met, an unlabelled wormhole drifts down the screen at a random position. Flying into it moves to the next level. If it is missed, the next one appears 15–30 seconds later with no warning, and the level keeps getting faster in the meantime.

## Rescue missions

From level 2, some asteroids carry 1–3 stranded crew inside a pulsing green `SOS` ring. Flying inside the ring without touching the rock picks them up. One appears every 5–8 seconds.

- **Capacity:** the ship takes only as many people as it has free seats; the rest stay on the rock. When the ship is full the rings turn grey and read `SHIP FULL`.
- **Showing capacity:** seats are drawn on the ship's hull as dots that turn green as they fill, and repeated as a row of pips with a `CREW n/N` count under the progress bar.

### Two crews at once

Every third rescue is a pair on screen together, in different columns, one following just above the other: 2 people on an open rock, or 4 on a rock with a small rock on each side. Which comes first and which side each is on are random.

Nothing forbids saving both. The vertical gap between them is calculated from the ship's current top speed so that the dash from the first to the second falls just short, and these rocks fall faster than ordinary rescue rocks.

## Gravity

A faint grid behind the stars shows spacetime.

- **Digging a well:** keeping the ship in one spot bends the grid towards it — the lines pinch in, brighten and turn purple — and asteroids start falling into the well. It reaches full depth after 6 seconds.
- **What pulls harder:** more time parked, a heavier ship (later levels, more crew aboard) and higher flight speed.
- **Wells stay where they were dug:** moving away leaves the well behind. It keeps drawing asteroids towards the old spot while it relaxes over about 4 seconds, and a fresh well starts from zero under the ship.

The intended use is as a tool: park to gather rocks, then dart away so they fall into the place you left. Rescue rocks are pulled like any other; the wormhole is not affected.

## Run locally

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

## Publishing

The site is served by GitHub Pages from the `main` branch, root folder. Each push to `main` redeploys in about a minute.

## Tuning

The main numbers sit in the `Tuning` block at the top of the script in `index.html`:

| Constant | Meaning |
|---|---|
| `SPEED_RAMP`, `MAX_SPEED` | How fast a level speeds up, and the cap |
| `LEVEL_MIN_TIME` | Minimum seconds in a level before the wormhole can appear |
| `levelTarget` | Parsecs to fly per level |
| `levelCapacity` | Seats per level |
| `levelHandling` | Steering speed per level |
| `shipRadius` | Ship size per level |
| `LAST_LEVEL` | Number of levels |
| `WELL_TIME` | Seconds parked for the deepest gravity well |
| `DILEMMA_EVERY` | Every Nth rescue is a two-crew pair |

A few more live next to the code they affect:

- **Gravity strength:** the `520` and the `0.7` exponent in the pull calculation in `update` (overall strength, and how soon a shallow well bites).
- **Two-crew difficulty:** the `0.78` in `spawnDilemma` (lower makes saving both harder).
- **Wormhole wait after a miss:** `rand(15, 30)` in `update`.

## Debug hook

`window.__game` exposes read-only state (`state`, `level`, `score`, `rescued`, `missed`, `onboard`, `wells`, `wormhole`, `asteroids`, `ship`) and a few helpers used by the automated checks: `skipLevel()` meets the current level's goals immediately, `fill(n)` sets the crew on board, and `spawnRescue()` / `spawnDilemma()` spawn rescue rocks on demand.

## Status

Built and checked with scripted browser runs on an emulated phone; difficulty and feel are still being tuned by hand. Ideas discussed but not built:

- letting gravity wells pull the wormhole;
- asteroids destroying each other when they collide inside a well;
- a bonus for rocks that fall into an abandoned well.

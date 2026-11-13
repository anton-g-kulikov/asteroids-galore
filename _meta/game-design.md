# Asteroids Galore — design notes

**Spoilers.** The game explains almost nothing on purpose. If you want to discover it by playing, stop here and play first.

## Principle: show, don't tell

The game teaches through what happens on screen, not through text. When the player needs to notice something, the game changes how it looks or behaves — a ring pulses, the grid bends, time slows — instead of printing a hint. New features should follow the same rule: if it needs a caption to be understood, find a way to show it instead.

## What the player is told

Deliberately very little. The start screen shows only the title, the best distance and the two control arrows. Levels start without a banner — the only sign is the level counter in the corner and a flash on arrival. Rescues, the level exit and gravity are left for the player to discover. This file describes how they work.

## Parsecs and rescues

The end screen shows two groups, titled `DISTANCE` and `CREW`. Each keeps its own best, saved on the device, and shows `NEW BEST!` when it is beaten.

- **Parsecs (pc)** — pure distance flown, with the same figure in light-years below it. It grows faster as the level speeds up. The best distance counts on any run, finished or not.
- **Rescued / missed** — crew picked up, and crew that drifted off the bottom of the screen unrescued (including anyone left behind because the ship was full). Rescues add nothing to the parsec count. The crew best is the most people rescued in a finished mission; a run that ends in a crash never sets it.

### The twist on the end screen

Crew only count as rescued if the mission is finished.

- **All four levels cleared:** `N RESCUED` in green, `N MISSED` in red.
- **Ship destroyed:** the same number is shown as `N WENT DOWN WITH THE SHIP` in orange, with `N MISSED` in grey — everyone picked up during the run was lost with the ship.

During play the counters still read `RESCUED` and `MISSED`; the player only learns this by crashing.

### Leaderboards

Below the summary, each end screen shows one board, when the game is connected to the cloud:

- **Ship destroyed:** `TOP DISTANCE` — the five longest best distances.
- **All four levels cleared:** `TOP CREW` — the five highest crew bests. This follows the twist above: crew only count in a finished mission, so the crew board only appears after one.

Players are listed by callsign: two words and a number, generated from the player's anonymous account, so nobody types a name and the same account always keeps the same one. The player's own row is gold, which is also how they learn their callsign. A player outside the top five gets a sixth row with their rank. A player with no best on that board is not listed.

The board is refreshed when a run ends, and the player's row always uses the best the game holds right now. Offline, or before the first board has loaded, the end screen simply has no board.

### Sharing a run

Once the run on an end screen has been saved, a `SHARE` pill appears in the top right corner. A tap on it shares a link and does not start a new run; a tap anywhere else restarts as before. Where the device has no share sheet the link is copied and the pill reads `COPIED` for two seconds. Offline, or without the cloud, there is no pill.

Whoever opens the link gets the ordinary start screen with the shared run under the title: the callsign in gold, the distance, and one line for how it ended — `MISSION COMPLETE · N RESCUED` for a finished mission, `REACHED LEVEL N` for a lost one. A lost run deliberately says nothing about crew, so the twist on the end screen is not given away. The message that travels with the link follows the same rule.

## Shields

Each level starts with 3 shields (`SHIELDS`). They are shown in two places, with the same shape: as arcs stacked ahead of the ship's nose, and as a row of arcs under the best distance, where spent ones turn faint. There is no caption.

- **Taking a hit:** hitting a rock burns one shield — the outermost arc disappears. The run carries on where it is: same level, same parsecs, same crew on board, same speed.
- **The rock that hit** is destroyed. Any crew on it count as missed.
- **Getting clear:** the ship cannot be hit for 2 seconds (`GRACE`). The shields blink for that time, not the ship, and the arc that was just burnt flickers out beyond them. It can still pick up crew and enter the wormhole.
- **Refill:** entering a new level through the wormhole restores all 3.
- **No shields left:** the ship flies bare, and the next hit destroys it and ends the run with the game-over screen. So a level allows 3 hits and the 4th is fatal.

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

From level 2, some asteroids carry stranded crew inside a pulsing green `SOS` ring. Flying inside the ring without touching the rock picks them up.

Most rocks carry one person (60%), some carry two (32%), and three is a rarity (8%) — set by `crewSize` in `src/game/spawn.ts`.

They are deliberately sparse, so the seats fill over the whole level and not in its first moments. The first appears 4 seconds into a level, then:

| Level | Seconds between crews | Roughly how many per level |
|---|---|---|
| 2 | 11–15 | 3 |
| 3 | 9–13 | 3–4 |
| 4 | 8–11 | 4–5 |


- **Capacity:** the ship takes only as many people as it has free seats; the rest stay on the rock. When the ship is full the rings turn grey and lose their `SOS` label; nothing spells out why.
- **Showing capacity:** seats are drawn on the ship's hull as dots that turn green as they fill, and repeated as a row of pips with a `CREW n/N` count under the progress bar.

### Two crews at once

Every third rescue is a pair on screen together, in different columns, one following just above the other: 1 person on an open rock, or 2 on a rock with a small rock on each side. Which comes first and which side each is on are random.

There is no caption for this. As the first crew comes into view at the top of the screen, the whole game drops into slow motion for a moment (`SLOW_TIME` real seconds, down to `SLOW_SCALE` of normal speed) so the player has time to see that there are two crews. The ship slows with everything else, so the slow motion gives time to look, not extra time to fly.

Nothing forbids saving both. The vertical gap between them is calculated from the ship's current top speed so that the dash from the first to the second falls just short, and these rocks fall faster than ordinary rescue rocks.

## Gravity

A faint grid behind the stars shows spacetime.

- **Digging a well:** keeping the ship in one spot bends the grid towards it — the lines pinch in, brighten and turn purple — and asteroids start falling into the well. It reaches full depth after 6 seconds.
- **What pulls harder:** more time parked, a heavier ship (later levels, more crew aboard) and higher flight speed.
- **Where the centre is:** just ahead of the ship's nose (`WELL_AHEAD` ship radii above its centre), not under it. Rocks pulled in gather in front of the ship and then sweep down through it, so sitting in a deep well is dangerous.
- **Wells stay where they were dug:** moving away leaves the well behind. It keeps drawing asteroids towards the old spot while it relaxes over about 4 seconds, and a fresh well starts from zero at the ship.

The intended use is as a tool: park to gather rocks, then dart away so they fall into the place you left. Rescue rocks are pulled like any other; the wormhole is not affected.

## Tuning

The main numbers sit in `src/game/tuning.ts`:

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
| `WELL_AHEAD` | How far above the ship the well's centre sits, in ship radii |
| `WELL_PULL` | How hard a well pulls rocks in, before ship mass and flight speed are applied |
| `SHIELDS`, `GRACE` | Shields per level, and seconds of protection after losing one |
| `rescueGap` | Seconds between stranded crews, per level |
| `DILEMMA_EVERY` | Every Nth rescue is a two-crew pair |
| `SLOW_TIME`, `SLOW_SCALE` | Length and depth of the slow motion when a two-crew pair appears |

A few more live next to the code they affect:

- **How soon a shallow well bites:** the `0.7` exponent in the pull calculation in `update` in `src/game/simulation.ts`. Overall strength is `WELL_PULL`.
- **Two-crew difficulty:** the `0.78` in `spawnDilemma` in `src/game/spawn.ts` (lower makes saving both harder).
- **Wormhole wait after a miss:** `rand(15, 30)` in `src/game/simulation.ts`.

## Debug hook

`window.__game` (built in `src/debugHook.ts`) exposes read-only state (`state`, `level`, `score`, `rescued`, `missed`, `onboard`, `wells`, `wormhole`, `slowmo`, `shields`, `grace`, `asteroids`, `ship`) and a few helpers used by the automated checks: `skipLevel()` meets the current level's goals immediately, `fill(n)` sets the crew on board, and `spawnRescue()` / `spawnDilemma()` spawn rescue rocks on demand.

## Status

Difficulty and feel are still being tuned by hand. What is planned next is tracked in `project-task-list.md`; how the game is tested is in `../test/test-documentation.md`.

# Asteroids Galore — design notes

**Spoilers.** The game explains almost nothing on purpose. If you want to discover it by playing, stop here and play first.

## Principle: show, don't tell

The game teaches through what happens on screen, not through text. When the player needs to notice something, the game changes how it looks or behaves — a ring pulses, the grid bends, time slows — instead of printing a hint. New features should follow the same rule: if it needs a caption to be understood, find a way to show it instead.

## What the player is told

Deliberately very little. The start screen shows only the title, the best score and the two control arrows. Levels start without a banner — the only sign is the mission counter in the corner and a flash on arrival; between them a results screen shows what the last one added. Rescues, the level exit and gravity are left for the player to discover. This file describes how they work.

## The score

Saving the stranded crew is what the game is about, and the score says so: **score = parsecs flown × crew saved**. Flying far with nobody saved scores nothing.

- **Saved** means delivered. Crew picked up sit in the ship's seats and count for nothing yet. Flying into a wormhole delivers everyone on board: they are saved for good, and only then do they multiply the score.
- **Lost with the ship.** If the ship is destroyed, the crew on board go down with it, and they are taken off the crew that count: `score = parsecs × (saved − lost)`, never below zero. Crew delivered at earlier wormholes stay saved, but losing a full ship can cancel them out.
- **Missed** crew — those who drifted off the bottom of the screen, including anyone left behind because the ship was full — do not change the score. They show in the share of crew saved.
- **Parsecs** are pure distance. They grow faster as the level speeds up, so staying in a level after its wormhole has appeared keeps adding distance, at rising risk.

None of this is explained to the player. It is shown:

- **During a run** there is one big number at a time. With crew on board it is green with a plus, `+700`: what they are worth right now — parsecs × crew on board — which is what the next wormhole will bank and what a crash will lose; it grows as the ship flies on. With the seats empty it is the score, in white. Before anything is banked and with nobody aboard there is no number at all, never a `0`. `SAVED` and `MISSED` are counted in the corner; the seats on the ship and the pips under the progress bar show who is on board and still at risk.
- **On the end screen** a table lists every mission played and a `TOTAL` row — distance and crew saved — whose two numbers multiply to the score printed below it, with the best right under the score. Crew who were not saved have a section of their own, `NOT SAVED`: `3 WENT DOWN WITH THE SHIP` in orange if anyone did, and the number missed (see [Between levels](#between-levels)).

There is one best, the highest score, saved on the device; the end screen shows `NEW BEST!` when it is beaten.

### Leaderboard

When the game is connected to the cloud and the board has loaded, both end screens show a `LEADERBOARD` pill in the top left corner, mirroring `SHARE` on the right. A tap on it opens the leaderboard over the end screen and does not start a new run. The next tap, or Space, Enter or Escape, goes back to the end screen; that does not start a run either.

The leaderboard is `TOP SCORES`: the ten highest best scores. Players are listed by callsign: two words and a number, generated from the player's anonymous account, so nobody types a name and the same account always keeps the same one. The player's own row is gold, which is also how they learn their callsign. A player outside the top ten gets an extra row with their rank. A player whose best is 0 is not listed.

The board is refreshed when a run ends, and the player's row always uses the best the game holds right now. Offline, or before the first board has loaded, there is simply no pill.

### Sharing a run

Once the run on an end screen has been saved, a `SHARE` pill appears in the top right corner. A tap on it shares a link and does not start a new run; a tap anywhere else restarts as before. Where the device has no share sheet the link is copied and the pill reads `COPIED` for two seconds. Offline, or without the cloud, there is no pill.

Whoever opens the link gets the ordinary start screen with the shared run under the title: the callsign in gold, the score, and one line under it — `ALL MISSIONS COMPLETE · N SAVED` for a finished run, `N SAVED · D pc` for a lost one. The message that travels with the link leads with the crew saved and gives the score, not the distance.

## Shields

Each level starts with 3 shields (`SHIELDS`). They are shown in two places, with the same shape: as arcs stacked ahead of the ship's nose, and as a row of arcs under the best score, where spent ones turn faint. There is no caption.

- **Taking a hit:** hitting a rock burns one shield — the outermost arc disappears. The run carries on where it is: same level, same parsecs, same crew on board, same speed.
- **The rock that hit** is destroyed. Only asteroids hit: planetoids are harmless (see [Rescue missions](#rescue-missions)).
- **Getting clear:** the ship cannot be hit for 2 seconds (`GRACE`). The shields blink for that time, not the ship, and the arc that was just burnt flickers out beyond them. It can still pick up crew and enter the wormhole.
- **Refill:** entering a new level through the wormhole restores all 3.
- **No shields left:** the ship flies bare, and the next hit destroys it and ends the run with the game-over screen. So a level allows 3 hits and the 4th is fatal.

## Levels

There are 4 levels. **The player knows them as missions:** everything on screen says `MISSION` — the counter in the corner (`MISSION 2/4`), the results screen between them, and `ALL MISSIONS COMPLETE` at the end. The code and these notes keep the word level.

Finishing the fourth shows the all-missions-complete screen.

| Level | Parsecs to fly | Seats | Steering speed | Ship size |
|---|---|---|---|---|
| 1 | 350 | 2 | 100% | 1× |
| 2 | 450 | 4 | 92% | 1.15× |
| 3 | 550 | 8 | 85% | 1.3× |
| 4 | 650 | 16 | 78% | 1.5× |

- A level's goals are met once its parsec target is flown **and** at least 20 seconds have passed. The bar under the score shows progress towards the target.
- The asteroid speed ramp restarts at every level, so the rocks behave the same each time while the ship gets bigger (larger hitbox) and slower to steer.
- Entering a new level delivers the crew on board: they are saved, the seats are emptied, and the score jumps.

### Leaving a level

Levels do not end on their own. When the goals are met, an unlabelled wormhole drifts down the screen at a random position. Flying into it delivers the crew on board and moves to the next level; the wormhole at the end of level 4 delivers the last crew and finishes the mission. If it is missed, the next one appears 15–30 seconds later with no warning, and the level keeps getting faster in the meantime.

### Between levels

Flying into the wormhole of levels 1 to 3 stops the game on a results screen: `MISSION N COMPLETE`, then two rows under the headings `DISTANCE`, `SAVED` and `SCORE`. Each row reads as a sum: parsecs, times crew saved (written `×2`), equals a score.

- **`MISSION`** — the mission just finished, on its own: `484 pc  ×2  968`. The mission number is only in the title.
- **`TOTAL`** — the whole run so far, brighter and larger: `868 pc  ×4  3,472`. This is the score that counts.

The total is not the missions' scores added together: every parsec of the run multiplies every crew saved in it, so the total grows faster than the rows do. Showing both sums side by side is what makes that visible. Missed crew are not part of either sum, so they get a line of their own under the table, `4 MISSED`, for that mission.

Both end screens, under `ALL MISSIONS COMPLETE` or `GAME OVER`, show a table instead: one dim row per mission played, with its number, and a bright `TOTAL` row for the whole run, with the same columns in the same order. The total row is the sum itself: its distance times its `×N` is the score printed below. The score is not the sum of the rows: every parsec of the run multiplies every crew saved in it. After a crash the unfinished mission has a row too, whose saved column shows the crew who went down with the ship as `−3` in orange instead of a multiplier; the total's crew is saved minus lost. The score follows with no sum line under it, since the total row already is the sum; then `NEW BEST!` or the best; then the `NOT SAVED` section with the crew lost with the ship and the run's `N MISSED`.

The screen between levels stays until the player taps (or presses Space or Enter); a tap in its first 0.7 seconds is ignored so a held thumb does not skip it. Nothing moves on and no distance is flown while it is up. The next level then starts with full shields. The last wormhole goes straight to the all-missions-complete screen.

## Rescue missions

Stranded crew are found on planetoids: round, banded and coloured (teal, rust or blue), so they never look like one of the grey asteroids. A planetoid with crew on it sits inside a pulsing green `SOS` ring. Flying inside the ring picks them up; they are saved at the next wormhole (see [The score](#the-score)).

On level 1 every planetoid has a single person, and they come one at a time. From level 2, most carry one person (60%), some carry two (32%), and three is a rarity (8%) — set by `crewSize` in `src/game/spawn.ts`.

A planetoid is harmless. The ship can fly straight across one: it does not break and costs no shield. Only asteroids do damage.

They are deliberately sparse, so the seats fill over the whole level and not in its first moments. The first appears 4 seconds into a level, then:

| Level | Seconds between crews | Roughly how many per level |
|---|---|---|
| 1 | 11–15 | 2–3 |
| 2 | 11–15 | 3 |
| 3 | 9–13 | 3–4 |
| 4 | 8–11 | 4–5 |


- **Capacity:** the ship takes only as many people as it has free seats; the rest stay on the planetoid. When the ship is full the rings turn grey and lose their `SOS` label; nothing spells out why.
- **Showing capacity:** seats are drawn on the ship's hull as dots that turn green as they fill, and repeated as a row of pips with a `CREW n/N` count under the progress bar.

### Two crews at once

From level 2, every third rescue is a pair on screen together, in different columns, one following just above the other: 1 person on an open planetoid, or 2 on a planetoid with a small asteroid on each side. Level 1 has no pairs. Which comes first and which side each is on are random.

There is no caption for this. As the first crew comes into view at the top of the screen, the whole game drops into slow motion for a moment (`SLOW_TIME` real seconds, down to `SLOW_SCALE` of normal speed) so the player has time to see that there are two crews. The ship slows with everything else, so the slow motion gives time to look, not extra time to fly.

Nothing forbids saving both. The vertical gap between them is calculated from the ship's current top speed so that the dash from the first to the second falls just short, and these planetoids fall faster than ordinary ones.

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

`window.__game` (built in `src/debugHook.ts`) exposes read-only state (`state`, `level`, `score`, `distance`, `saved`, `lost`, `missed`, `onboard`, `wells`, `wormhole`, `slowmo`, `shields`, `grace`, `asteroids`, `ship`) and a few helpers used by the automated checks: `skipLevel()` meets the current level's goals immediately, `fill(n)` sets the crew on board, and `spawnRescue()` / `spawnDilemma()` spawn rescue rocks on demand.

## Status

Difficulty and feel are still being tuned by hand. What is planned next is tracked in `project-task-list.md`; how the game is tested is in `../test/test-documentation.md`.

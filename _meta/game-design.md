# Asteroids Galore — design notes

**Spoilers.** The game explains almost nothing on purpose. If you want to discover it by playing, stop here and play first.

## Principle: show, don't tell

The game teaches through what happens on screen, not through text. When the player needs to notice something, the game changes how it looks or behaves — a ring pulses, the grid bends, time slows — instead of printing a hint. New features should follow the same rule: if it needs a caption to be understood, find a way to show it instead.

## What the player is told

Deliberately very little. The start screen shows only the title, the best score and the two control arrows. Levels start without a banner — the only sign is the mission counter in the corner and a flash on arrival; between them a results screen shows what the last one added. Rescues, the level exit and gravity are left for the player to discover. This file describes how they work.

## The score

Saving the stranded crew is what the game is about, and the score says so. Every mission is scored on its own, **parsecs flown in it × crew saved in it, less 10% for each crew member left behind**, and the run's score is its missions added up. Flying far with nobody saved scores nothing.

- **Saved** means delivered. Crew picked up sit in the ship's seats and count for nothing yet. Flying into a wormhole delivers everyone on board: they are saved for good, and only then do they multiply that mission's parsecs.
- **Per mission.** Parsecs only multiply the crew of their own mission. Staying on mission 1 to pile up distance multiplies two seats and nothing saved later, so it buys little; distance is worth most on the late missions, where the ship carries more and flying is hardest.
- **Missed** crew — those who drifted off the bottom of the screen, including anyone left behind because the ship was full — each take 10% (`MISS_PERCENT`) off that mission's score, down to nothing at ten. A ship that lingers with full seats watches crews drift past, so this is also what makes farming parsecs a losing trade.
- **Lost with the ship.** If the ship is destroyed, the unfinished mission saved nobody and costs its own parsecs times the crew who went down with it. That is taken off what earlier missions banked; the run never goes below zero.
- **Parsecs** are pure distance. They grow faster as the level speeds up, so staying in a level after its wormhole has appeared keeps adding distance, at rising risk.

None of this is explained to the player. It is shown:

- **During a run** there is one big number at a time. With crew on board it is green with a plus, `+700`: what they are worth right now — this mission's parsecs × crew on board, less what the mission has missed — which is what the next wormhole will bank; it grows as the ship flies on and drops when a crew drifts past. With the seats empty it is the score, in white. Before anything is banked and with nobody aboard there is no number at all, never a `0`. `SAVED` and `MISSED` are counted in the corner; the seats on the ship and the pips under the progress bar show who is on board and still at risk.
- **On the end screen** a table lists every mission played as a sum of its own — distance, crew saved, what the missed cost, score — and the run's score, which is those scores added up, is printed below it with the best right under it. Crew who were not saved have a section of their own, `NOT SAVED`: `3 WENT DOWN WITH THE SHIP` in orange if anyone did, and the number missed (see [Between levels](#between-levels)).

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
| 1 | 500 | 2 | 100% | 1× |
| 2 | 750 | 4 | 92% | 1.15× |
| 3 | 1,250 | 8 | 85% | 1.3× |
| 4 | 2,000 | 16 | 78% | 1.5× |

- A level's goals are met once its parsec target is flown **and** at least 20 seconds have passed. The bar under the score shows progress towards the target.
- Speed restarts at 1× on every level and follows progress, not the clock: it rises in a straight line with the parsecs flown and reaches 2.3× (`TARGET_SPEED`) at the level's target, whatever the level's length. A long level is no faster at its end than a short one; what changes is the ship, which gets bigger (larger hitbox) and slower to steer.
- Past the target speed keeps rising at the same rate, up to 4.5×. A player who stays on until twice the target is flown (`GEAR_AT`) is in second gear from then on: speed gains another 0.1× every second on top, up to 9×. Nothing says so on screen: the rocks just keep getting faster.
- Entering a new level delivers the crew on board: they are saved, the seats are emptied, and the score jumps.

### Leaving a level

Levels do not end on their own. When the goals are met, an unlabelled wormhole drifts down the screen at a random position. Flying into it delivers the crew on board and moves to the next level; the wormhole at the end of level 4 delivers the last crew and finishes the mission. If it is missed, the next one appears 15–30 seconds later with no warning, and the level keeps getting faster in the meantime.

### Between levels

Flying into the wormhole of levels 1 to 3 stops the game on a results screen: `MISSION N COMPLETE`, then a table under the headings `DISTANCE`, `SAVED`, `MISSED` and `SCORE`.

- **`MISSION`** — the mission just finished, as a sum that reads left to right: `484 pc  ×2  2 (−20%)  774`. Parsecs, times crew saved, less 10% for each crew member missed, shown as the count and what it cost (a dash when none were), equals its score. The mission number is only in the title.
- **`TOTAL`** — the run's score so far, brighter and larger: the missions added up.

Both end screens, under `ALL MISSIONS COMPLETE` or `GAME OVER`, show the same table with one row per mission played, numbered, and no total row: the score printed below is the rows added up. After a crash the unfinished mission has a row too: its saved column shows the crew who went down with the ship as `−3` in orange instead of a multiplier, and its score is negative, `−348`. Then `NEW BEST!` or the best; then the `NOT SAVED` section with the crew lost with the ship and the run's `N MISSED`.

The screen between levels stays until the player taps (or presses Space or Enter); a tap in its first 0.7 seconds is ignored so a held thumb does not skip it. Nothing moves on and no distance is flown while it is up. The next level then starts with full shields. The last wormhole goes straight to the all-missions-complete screen.

## Rescue missions

Stranded crew are found on planetoids: round, banded and coloured (teal, rust or blue), so they never look like one of the grey asteroids. A planetoid with crew on it sits inside a pulsing green `SOS` ring. Flying inside the ring picks them up; they are saved at the next wormhole (see [The score](#the-score)).

On level 1 every planetoid has a single person, and they come one at a time. On level 2 most carry one person (60%), some carry two (32%), and three is a rarity (8%). On level 3 most carry two (50%) or three (35%), and on level 4 they carry two (30%), three (40%) or four (30%) — set by `crewSize` in `src/game/spawn.ts`.

A planetoid is harmless. The ship can fly straight across one: it does not break and costs no shield. Only asteroids do damage.

They are deliberately sparse, so the seats fill over the whole level and not in its first moments. A run opens with rocks alone: the first planetoid of mission 1 appears at the 200 pc mark (`FIRST_RESCUE`). On later missions the first appears 4 seconds in. After that:

| Level | Seconds between crews | Roughly how many per level | People on a planetoid |
|---|---|---|---|
| 1 | 11–15 | 2 | 1 |
| 2 | 15–20 | 3 | mostly 1, sometimes 2, rarely 3 |
| 3 | 15–20 | 5 | mostly 2–3 |
| 4 | 15–20 | 7 | 2–4 |

Later levels have more seats, so their planetoids carry more people, not more planetoids: the sky stays sparse and the seats can still fill by about the time the wormhole shows. A two-crew pair is always 1 and 2 people.


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

## Planned: missions beyond 4

**Not built yet.** This is the plan for taking the run past 4 missions. The tasks are in `project-task-list.md`. It replaces an earlier plan for levels 5–10 that was written before missions were scored one by one.

### What the first four missions already settle

- **Seats can fill.** Planetoids carry more people on later missions, so a ship can leave mission 4 full.
- **Lingering is a bounded gamble.** Parsecs multiply only their own mission's crew, every crew member left behind costs that mission 10%, and second gear starts at twice the target.
- **Length does not mean speed.** Speed follows progress, so a long mission ends no faster than a short one.

What still runs out at 4:

- **The ship cannot keep growing.** `shipRadius` has values only up to level 5, and `levelHandling` reaches its 0.5 floor around level 9. A bigger, slower ship every mission cannot be what makes later missions harder.
- **Crew weigh almost nothing.** In `shipMass` each person adds 0.02 to a base of 1.0–1.7, and mass counts only for the well dug while parked. Nobody can feel it.

So later missions get harder through new things happening, not through a clumsier ship. Each mission adds one new thing, the way rescues and two-crew pairs were added earlier, and each has to be readable with no caption.

### Decide first: how long a run is

Four missions take about five minutes. Ten at growing lengths would take 15–20, which is long for a phone game where one crash ends the run. The plan below assumes **6 or 7 missions**; the number, and the parsec targets past 2,000, are to be settled by playing before anything else is built.

| Mission | New thing |
|---|---|
| 5 | Dead stars: fixed gravity wells that pull the ship too, shown on the grid |
| 6 | Failing rescues: the `SOS` ring shrinks, and the crew are missed when it closes |
| 7 | Wrecked stations carrying 4–8 crew |
| last | A wormhole that drifts sideways, and asteroids crossing at an angle |

Crew weight is not on this list because it is not tied to one mission: see below.

### Before larger crews: a missed penalty that scales

A flat 10% per person works while planetoids carry 1–4 people. One missed station of 8 would cost 80% of a mission. Before stations are added, the penalty becomes a share of the crew on offer in that mission: missing half of them costs the same whether the mission offered 6 people or 30. The results table keeps showing the count and what it cost.

### Crew make the ship heavy

From the mission where it is introduced, the ship's size and steering come from the crew on board, not from the mission number. An empty ship is nimble, a full one big and slow, and delivering crew at the wormhole shrinks it back. The player sees the ship swell, so no caption is needed.

- **It replaces two tables.** `shipRadius` and `levelHandling` per level go away, which removes the ceiling they hit at levels 5 and 9.
- **It can come early.** It needs no new object, so it could start at mission 3 or 4 and need not wait for the new missions.
- **It sharpens the trade the score already makes.** More crew multiply the mission's parsecs and make every further parsec harder to fly.

Dropped from the earlier plan: a loaded ship pulling asteroids while moving. The parked well is already a gravity effect the player has to learn, and a second one that follows the ship would be hard to read and to tune.

### Dead stars, failing rescues, stations, the finale

- **Dead stars:** a dark point with a fixed, deep well around it that pulls the ship as well as the asteroids. The grid already shows wells, so it needs nothing new on screen.
- **Failing rescues:** on some planetoids the `SOS` ring shrinks over time. When it closes, the crew are missed.
- **Wrecked stations:** larger than a planetoid, just as harmless, carrying 4–8 people. Seats stop doubling after mission 4 and grow by a fixed step (20, 24 …). The seat dots on the ship and the pips under the progress bar do not fit more than 16 as drawn, so the seat display is part of this step.
- **Finale:** the wormhole drifts sideways as it falls, and some asteroids cross the screen at an angle instead of falling straight.

### Parked ideas

Kept for later, only if the game turns out to need them:

- **Shooting** (holding both sides fires straight up). It turns a dodger into a shooter partway through a run, there is no way to discover it without a caption, it makes lingering safer, and it is the largest thing to build.
- **Shield drops** from shot asteroids. They depend on shooting, make the game easier, and reward staying to collect them. A run has three shields per mission and that is deliberate.
- Asteroids that split into fragments, dark patches of space that hide rocks, and two wormholes with different risks to choose between.

### What going past 4 touches outside the game

- **Firestore rules:** `firestore.rules` accepts only levels 1–4 and requires level 4 for a won run. The rules and their tests change together with `LAST_LEVEL`.
- **Leaderboard:** longer runs score far above 4-mission ones, so old bests stop being comparable. The board is reset when the number of missions changes.
- **Mission counter and tables:** `MISSION N/4` follows `LAST_LEVEL`, and the end-screen table gets a row per mission, which needs checking on short phones.
- **Golden traces:** anything that changes missions 1–4 (crew weight, seats) means regenerating `test/fixtures/golden-traces.json`.

## Tuning

The main numbers sit in `src/game/tuning.ts`:

| Constant | Meaning |
|---|---|
| `TARGET_SPEED`, `MAX_SPEED` | Speed on reaching a level's parsec target, and where first gear stops |
| `GEAR_AT`, `GEAR_RAMP`, `TOP_SPEED` | Multiple of the level's target at which second gear unlocks, how fast it climbs, and its cap |
| `MISS_PERCENT` | Per cent of a mission's score lost for each crew member left behind |
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
| `FIRST_RESCUE` | Parsecs into a run before the first planetoid appears |
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

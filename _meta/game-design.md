# Asteroids Galore — design notes

**Spoilers.** The game explains almost nothing on purpose. If you want to discover it by playing, stop here and play first.

## Principle: show, don't tell

The game teaches through what happens on screen, not through text. When the player needs to notice something, the game changes how it looks or behaves — a ring pulses, the grid bends, time slows — instead of printing a hint. New features should follow the same rule: if it needs a caption to be understood, find a way to show it instead.

## Direction

Agreed on 2026-11-14. The game is a **competitive endurance dodger**: played for a place on one global board, the way Tetris is.

- **Easy to pick up, hard to master.** Two inputs, nothing to read, and a first run that gets somewhere. The depth is in reading the field at speed and in choosing what to take and what to leave.
- **Random, not memorised.** There are no fixed courses and no timer: it is not a speedrun. Luck comes in many small rolls and never in one large one, so over a run the better player wins.
- **Seven missions.** Missions 1–4 are the game most players play, about five minutes. Missions 5–7 are for competing, and mission 7 has no end of its own: the player decides when to go home.
- **One global board** of best scores, for all time.

Four missions are built. The rest is in [Planned: the seven-mission run](#planned-the-seven-mission-run).

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

## Planned: the seven-mission run

**Not built yet.** Everything above this heading describes the game as it plays today. This section describes where it is going, as agreed on 2026-11-14. The tasks are in `project-task-list.md`. It replaces the earlier plan, "missions beyond 4".

Numbers marked *to tune* were worked out on paper, not by playing. What has not been agreed yet is listed under [Still open](#still-open).

### What changes from today

| | Today | Planned |
|---|---|---|
| Missions | 4, and the fourth ends the run | 7, and the seventh ends when the player goes home or the ship is destroyed |
| Crew left behind | 10% each, down to nothing at ten | Each takes 10% of what is still at risk, and at most 75% is ever at risk |
| Ship destroyed | The unfinished mission costs its parsecs × the crew aboard, taken off the banked score | The unfinished mission scores nothing; everything banked is kept |
| Speed past the target | The same slope up to 4.5×, then second gear up to 9× | One slope in every mission: no second gear, and no ceiling a player can survive |
| A missed wormhole | Back after a random 15–30 seconds | Back after a wait dealt from a shuffled set |
| Shields | 3 per mission | Refilled every mission; drops on missions 5 and 6; on mission 7 only by turning down the way home |

### The missions

| Mission | Parsecs to fly | Seats | Shield drops |
|---|---|---|---|
| 1–4 | as today | 2, 4, 8, 16 | none |
| 5 | 2,000 | 20 | 6 |
| 6 | 2,000 | 24 | 4 |
| 7 | 2,000 to the first wormhole, then open | 32 | one beside every wormhole |

- **Missions 1–4** stay as they are and take about five minutes. They are the whole game for most players.
- **Missions 5–7** are for competing. Reaching mission 7 takes roughly eight to nine minutes.
- **What makes 5–7 harder** is *to tune*. The candidates are a starting speed above 1× (1.4×, 1.8× and 2.2× are the first guess), fewer shield drops each mission, and the new things listed under [New things in missions 5–7](#new-things-in-missions-57).
- **Seats** stop doubling after mission 4. Mission 7 has 32 so that the ship does not fill: every crew member left behind there is the player's own miss, and every rescue both raises the multiplier and avoids a penalty.
- **The seat display** (dots on the hull, pips under the progress bar) does not fit more than 16 as drawn, so it changes together with the seats.

### Crew left behind

A mission's score stays parsecs × crew saved, less a share for the crew left behind. What changes is the share, in every mission:

**kept share = 1 − cap × (1 − 0.9^missed)**, with a cap of 75% (*to tune*).

Each crew member left behind takes 10% of what is still at risk, and at most the cap is ever at risk.

| Missed | 1 | 2 | 3 | 5 | 10 | 20 | any number |
|---|---|---|---|---|---|---|---|
| Kept | 93% | 86% | 80% | 69% | 51% | 34% | never below 25% |

- **Why a cap.** Today ten missed crew leave nothing, so staying on always ends at zero. With a cap the penalty runs out while the parsecs keep growing, so a player who stays long enough outruns it.
- **It replaces the penalty that scaled with the crew on offer**, planned earlier for wrecked stations. Under this formula a missed station of 8 costs 43% of a mission, not 80%.
- **In code** `MISS_PERCENT` becomes two numbers: the rate (10%) and the cap.

### Staying on

Staying in a mission after its target is flown is a gamble with a known shape: the score dips first and climbs later. The model below is for a full ship, where every crew that arrives is missed (about 3 people every 17.5 seconds), with the planned speed slope. The score is shown against leaving at the target.

| Seconds past the target | Parsecs | Speed | Cap 50% | Cap 75% | Cap 85% | Cap 95% |
|---|---|---|---|---|---|---|
| 0 | 2,000 | 2.3× | 1.00 | 1.00 | 1.00 | 1.00 |
| 30 | 2,762 | 2.8× | 1.09 | 0.95 | 0.89 | 0.83 |
| 60 | 3,688 | 3.4× | 1.23 | 0.93 | 0.81 | 0.68 |
| 90 | 4,813 | 4.1× | 1.44 | 0.96 | 0.76 | 0.57 |
| 120 | 6,181 | 5.0× | 1.72 | 1.04 | 0.76 | 0.49 |
| 150 | 7,843 | 6.1× | 2.09 | 1.18 | 0.81 | 0.44 |

- **Cap 50%:** staying pays from the first second. There is no decision, only survival.
- **Cap 75%:** the score is 7% down after a minute and level again after about 108 seconds, at 4.7×. Past that it climbs quickly.
- **Cap 85%:** level again only after about 200 seconds, at 8.6×, which nobody survives.
- **Cap 95%:** never.

This dip is what makes lingering a gamble once second gear is gone. In missions 1–6 it asks a player to risk the rest of the run for a small gain, so only mission 7 really invites it.

One condition: no mission may level off at a speed a player can survive for ever. Speed keeps rising with the parsecs flown.

### When the ship is destroyed

The mission in flight scores nothing, and the crew on board are lost with it. Everything banked by earlier missions is kept. The deduction used today goes away.

- **The end-screen table** shows the unfinished mission's row with the crew who went down and no score, not a negative one.
- **Mission 7 is where this bites.** Missions 1–6 are safe once delivered, so the whole gamble sits in what mission 7 has built up, and that grows the longer the player stays.

### Mission 7: the way home

Mission 7 has no end of its own. Its wormhole is the way home: flying in delivers the crew, ends the run and records the score. Letting it pass means climbing on.

- **Wormhole or shield.** Every wormhole in mission 7 arrives with a shield arc in the same row on the opposite side, equally easy to reach. The wormhole ends the run, so nobody can take both. Which side each is on is random.
- **The only shields in mission 7** are these. A shield is the reward for turning down the way home.
- **It is sharpest when it should be.** On three shields a player ignores both and flies on. On none, it is go home with what there is, or take one more hit and keep climbing. At the most shields a ship can hold the arc offers nothing.
- **No caption.** Both shapes are known by mission 7. The slow motion of the two-crew pair announces the first offer (*to confirm by playing*).
- **What ends a run.** Shield offers arrive at a steady pace in seconds while speed keeps rising, so sooner or later the hits outnumber the shields.

### Wormhole rhythm

Wormholes stay random from moment to moment and equal for everyone over time, the way modern Tetris deals pieces.

- **The first wormhole of a mission** appears as soon as the target is flown and 20 seconds have passed, as today.
- **A missed wormhole** comes back after a wait dealt from a fixed set, in a random order, reshuffled when the set runs out: 16, 19, 22, 25 and 28 seconds (*to tune*). Nobody can predict the next wait, and over every five wormholes everyone has waited the same 110 seconds.
- **Position** stays random across the middle of the field.
- **One rule for all missions.** In missions 1–6 a missed wormhole returns on this rhythm; in mission 7 each one arrives with a shield opposite.

The average wait is the main dial for how long a mission 7 run lasts.

### Shields

Every mission starts with at least 3, as today. What is new is that more can be found.

| Mission | Shields at the start | Drops |
|---|---|---|
| 1–4 | 3 | none |
| 5 | at least 3 | 6 |
| 6 | at least 3 | 4 |
| 7 | at least 3 | one beside every wormhole |

- **A drop** is a shield arc drifting down the field, the same shape as the arcs on the ship. Flying through it adds a shield.
- **Fewer each mission, on purpose.** Mission 5 teaches the higher speeds with a cushion; mission 7 leaves the ship nearly bare.
- **The same for everyone.** The count is fixed, drops are spaced evenly by distance, and only their position is random. "Up to 6" is how many a player manages to take, not how many appear.
- **In the first two-thirds of a mission.** A shield just before the refill is worth nothing.
- **A ship holds at most 5.** Spares carry into the next mission, and the refill tops up to at least 3. Clean flying in missions 5 and 6 buys a better start in mission 7.

**Shield or crew.** Some drops arrive the way the two-crew pair does, as a choice: 2 crew, 3 crew or a shield, with no way to reach them all. The right answer depends on the ship: on one shield take the shield, on three take the crew. For this to be a choice the ship must not be full when it comes, so the crew on offer in missions 5 and 6 stay a little below the 20 and 24 seats.

Shield drops used to be a parked idea, because they made the game easier and rewarded staying on. Both are now intended: the count is fixed and falls each mission, and in mission 7 staying on is the game.

### Crew make the ship heavy

From the mission where it is introduced, the ship's size and steering come from the crew on board, not from the mission number. An empty ship is nimble, a full one big and slow, and delivering crew at the wormhole shrinks it back. The player sees the ship swell, so no caption is needed.

- **Today crew weigh almost nothing.** In `shipMass` each person adds 0.02 to a base of 1.0–1.7, and mass counts only for the well dug while parked. Nobody can feel it.
- **It replaces two tables.** `shipRadius` and `levelHandling` per level go away, which removes the ceiling they hit at levels 5 and 9.
- **It can come early.** It needs no new object, so it could start at mission 3 or 4 and need not wait for the new missions.
- **It sharpens the trade the score already makes.** More crew multiply the mission's parsecs and make every further parsec harder to fly. In mission 7, with 32 seats, that is the trade the whole mission turns on.

Dropped from an earlier plan: a loaded ship pulling asteroids while moving. The parked well is already a gravity effect the player has to learn, and a second one that follows the ship would be hard to read and to tune.

### New things in missions 5–7

Carried over from the earlier plan and not yet looked at again under the new direction (see [Still open](#still-open)):

- **Dead stars (mission 5):** a dark point with a fixed, deep well around it that pulls the ship as well as the asteroids. The grid already shows wells, so it needs nothing new on screen.
- **Failing rescues (mission 6):** on some planetoids the `SOS` ring shrinks over time. When it closes, the crew are missed.
- **Wrecked stations (mission 7):** larger than a planetoid, just as harmless, carrying 4–8 people.
- **Angled asteroids and a wormhole that drifts sideways:** planned for the last mission.

### The global board

One board of best scores, for all time, as today.

- **When the choice to go home bites:** when the run in hand is already ahead of the player's own best. A run below it has nothing to lose, which is how a record chase works.
- **Players will gamble deeper than the model says,** because a failed attempt costs only that run. The cap and the wait between wormholes are tuned from what players do on runs that are ahead of their best.
- **Each row could show how the run ended** and how far it went, for example `HOME · 5,400 pc` or `LOST · 7,100 pc` (not agreed yet).

An all-time board needs three things the game does not have yet:

- **Scores that can be checked.** Today they are trusted from the client. The plan is seeded randomness and a recording of the inputs, replayed on a server before a score is listed.
- **The same game on every device.** Today the frame time varies and is clamped at 0.05 seconds, so under 20 frames a second the game runs in slow motion; and the field is sized from the window, so resizing it changes the game. Both need fixing: a fixed step, and a field of one fixed shape.
- **Settled rules.** Any change to the balance after launch needs a new board, so the board is reset once, when these rules land.

### Keeping luck small

- Wormhole waits are shuffled, not rolled.
- Shield drops are a fixed count at an even spacing.
- Crew sizes, rocks and positions stay random: they are many small rolls and even out over a run.

### How we will know it works

Starting targets, *to tune*:

- **Pick-up:** a new player with no explanation finishes mission 1 within three tries, and a first run lasts over a minute with one rescue delivered.
- **Nobody outlasts the game:** the best player is destroyed by the difficulty, within roughly 10–15 minutes.
- **A long tail:** top scores sit about ten times above the median, and the record keeps rising for weeks.
- **Skill over luck:** one player's five best runs fall within about 30% of each other.
- **Fair deaths:** players blame themselves, not the game.

### How to tune it

1. **Record every run:** where it ended, whether the player went home or was destroyed, and the shields at each wormhole.
2. **Aim the model at real survival.** At the point where staying on pays back, strong players should survive about half the time. If nearly everyone stays, raise the cap or lengthen the waits; if nobody does, do the reverse.
3. **Find the speed wall before players do.** A scripted pilot in the tests can sweep speeds and show where survival collapses.

### Still open

Proposed but not agreed, or not yet decided:

- **Missions 5–7:** whether the targets stay at 2,000 parsecs, and the starting speeds.
- **Shields held:** at most 5 with spares carried over, or every mission starting at exactly 3.
- **Missions 1–6 when the ship is destroyed:** agreed for mission 7; assumed here for all missions.
- **The new things in missions 5–7:** whether objects first seen so late suit a competition most players never reach that far in. A wormhole that drifts sideways also clashes with a shield placed evenly opposite it, and stations of 4–8 people may fill mission 7's 32 seats sooner than intended.
- **The board rows** showing how a run ended.
- **The end screen for going home:** whether it keeps the title `ALL MISSIONS COMPLETE`.
- **The numbers marked to tune:** the cap, the set of waits, and how many shield drops arrive as a choice.

### Parked and set aside

Kept for later, only if the game turns out to need them:

- **Shooting** (holding both sides fires straight up). It turns a dodger into a shooter partway through a run, there is no way to discover it without a caption, it makes lingering safer, and it is the largest thing to build.
- Asteroids that split into fragments, dark patches of space that hide rocks, and two wormholes with different risks to choose between.

Considered on 2026-11-14 and not taken:

- **A speedrun game** with fixed courses, a timer and speed the player controls. The game is about endurance and score, not time.
- **Destruction costing half of everything banked.** The cost of staying on is the crew left behind, and destruction costs the mission in flight.
- **Weekly boards or a career total** in place of the all-time board.

### What this touches outside the game

- **Firestore rules:** `firestore.rules` accepts only levels 1–4 and requires level 4 for a won run. With 7 missions a won run is one that went home from mission 7. The rules and their tests change together with `LAST_LEVEL`.
- **Saved runs:** a run needs to record how it ended and how far mission 7 went, for the board and for tuning.
- **Leaderboard:** scores under the new rules are not comparable with today's. The board is reset once, when they land.
- **Mission counter and tables:** `MISSION N/4` follows `LAST_LEVEL`, and the end-screen table gets up to seven rows, which needs checking on short phones.
- **Share text:** `ALL MISSIONS COMPLETE · N SAVED` describes a run that went home.
- **Golden traces:** the score rules, the speed slope and the fixed step all change missions 1–4, so `test/fixtures/golden-traces.json` is regenerated with each.

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

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

All seven missions are built, with starting values that are still to be tuned by playing. What was decided and why, and what is still open, is in [The seven-mission run](#the-seven-mission-run).

## What the player is told

Deliberately very little. The start screen shows only the title, the best score, the two control arrows and, small at the foot, the version and the seed of the next run (`v0.3.2 · SEED 4F2A9C`). Levels start without a banner — the only sign is the mission counter in the corner and a flash on arrival; between them a results screen shows what the last one added. Rescues, the level exit and gravity are left for the player to discover. This file describes how they work.

## The score

Saving the stranded crew is what the game is about, and the score says so. Every mission is scored on its own, **parsecs flown in it × crew saved in it, less a share for the crew left behind**, and the run's score is its missions added up. Flying far with nobody saved scores nothing.

- **Saved** means delivered. Crew picked up sit in the ship's seats and count for nothing yet. Flying into a wormhole delivers everyone on board: they are saved for good, and only then do they multiply that mission's parsecs.
- **Per mission.** Parsecs only multiply the crew of their own mission. Staying on mission 1 to pile up distance multiplies two seats and nothing saved later, so it buys little; distance is worth most on the late missions, where the ship carries more and flying is hardest.
- **Missed** crew are those who drifted off the bottom of the screen while the ship had a seat for them, and those thrown off the ship by a hit (see [Shields](#shields)). Crew who pass a ship with no free seat are never counted, and a full ship is sent none (see [A full ship sees no crew](#a-full-ship-sees-no-crew)). Each one counted takes 10% (`MISS_RATE`) of what is still at risk, and at most 75% (`MISS_CAP`) is ever at risk: the share kept is `1 − 0.75 × (1 − 0.9^missed)`. One missed keeps 93%, three 80%, ten 51%, and no number of them takes a mission below 25%. See [Crew left behind](#crew-left-behind) for why.
- **Lost with the ship.** If the ship is destroyed, the mission in flight scores nothing and the crew on board are lost with it. Everything banked by earlier missions is kept; nothing is taken off.
- **Parsecs** are pure distance. They grow faster as the level speeds up, so staying in a level after its wormhole has appeared keeps adding distance, at rising risk.

None of this is explained to the player. It is shown:

- **During a run** there is one big number at a time. With crew on board it is green with a plus, `+700`: what they are worth right now — this mission's parsecs × crew on board, less what the mission has missed — which is what the next wormhole will bank; it grows as the ship flies on and drops when a crew is missed. With the seats empty it is the score, in white. Before anything is banked and with nobody aboard there is no number at all, never a `0`. `SAVED` and `MISSED` are counted in the corner; the seats on the ship and the pips under the progress bar show who is on board and still at risk.
- **On the end screen** a table lists every mission played as a sum of its own — distance, crew saved, what the missed cost, score — and the run's score, which is those scores added up, is printed below it with the best right under it. Crew who were not saved have a section of their own, `NOT SAVED`: `3 WENT DOWN WITH THE SHIP` in orange if anyone did, and the number missed (see [Between levels](#between-levels)).

There is one best, the highest score, saved on the device together with how that run ended; the end screen shows `NEW BEST!` when it is beaten. Bests from before the seven-mission rules are not comparable and are not read.

### Leaderboard

When the game is connected to the cloud and the board has loaded, both end screens show a `LEADERBOARD` pill in the top left corner, mirroring `SHARE` on the right. A tap on it opens the leaderboard over the end screen and does not start a new run. The next tap, or Space, Enter or Escape, goes back to the end screen; that does not start a run either.

The leaderboard is `TOP SCORES`: the ten highest best scores, one global board for all time. Players are listed by callsign: two words and a number, generated from the player's anonymous account, so nobody types a name and the same account always keeps the same one. Under each callsign a small line says how many missions that run finished: `FINISHED 2/7` for a run lost in mission 3. A run that reached mission 7 also says how it ended and the parsecs flown there: `FINISHED 7/7 · HOME · 5,400 pc` for a run that went home, `FINISHED 6/7 · LOST · 7,100 pc` for one destroyed in mission 7. The board then tells how far each player got and who got out in time. The player's own row is gold, which is also how they learn their callsign. A player outside the top ten gets an extra row with their rank. A player whose best is 0 is not listed.

The board starts again whenever scores stop being comparable: entries are ranked by a field whose name changes with the scoring (`best3` since the linear penalty of 2026-11-15; `best` before it, `bestScore` before that), so entries that only hold an earlier score are not listed, and a player's first new entry replaces their old one. Nothing is deleted. The best kept on the device moves to a new key at the same time.

The board is refreshed when a run ends, and the player's row always uses the best the game holds right now. Offline, or before the first board has loaded, there is simply no pill.

### Sharing a run

Once the run on an end screen has been saved, a `SHARE` pill appears in the top right corner. A tap on it shares a link and does not start a new run; a tap anywhere else restarts as before. Where the device has no share sheet the link is copied and the pill reads `COPIED` for two seconds. Offline, or without the cloud, there is no pill.

Whoever opens the link gets the ordinary start screen with the shared run under the title: the callsign in gold, the score, and one line under it — `MADE IT HOME · N SAVED` for a run that went home, `N SAVED · D pc` for a lost one. The message that travels with the link leads with the crew saved and gives the score, not the distance.

## Shields

Each level starts with at least 3 shields (`SHIELDS`), and a ship holds at most 5 (`MAX_SHIELDS`). They are shown in two places, with the same shape: as arcs stacked ahead of the ship's nose, and as a row of arcs under the best score, where spent ones turn faint. There is no caption.

- **Taking a hit:** hitting a rock burns one shield — the outermost arc disappears — and throws one crew member off the ship, if anyone is aboard. The player sees the figure tumble away from the ship and fade, a seat go dark and the `MISSED` count move; there is no caption. That person counts as one missed, and the seat is free again, so the ship gets a little lighter. With nobody aboard a hit costs only the shield. Otherwise the run carries on where it is: same level, same parsecs, same speed. See [A hit costs a crew member](#a-hit-costs-a-crew-member) for why.
- **The rock that hit** is destroyed. Only asteroids hit: planetoids are harmless (see [Rescue missions](#rescue-missions)).
- **Getting clear:** the ship cannot be hit for 2 seconds (`GRACE`). The shields blink for that time, not the ship, and the arc that was just burnt flickers out beyond them. It can still pick up crew and enter the wormhole.
- **Refill:** entering a new level through the wormhole tops the shields up to 3. Spares above 3 are kept, so clean flying in missions 5 and 6 buys a better start in mission 7.
- **No shields left:** the ship flies bare, and the next hit destroys it and ends the run with the game-over screen.

### Shield drops

More shields can be found from mission 5 on. A drop is a glowing shield arc drifting down the field, the same shape as the arcs on the ship; flying through it adds a shield.

| Mission | Shields at the start | Drops |
|---|---|---|
| 1–4 | 3 | none |
| 5 | at least 3 | 6 |
| 6 | at least 3 | 4 |
| 7 | at least 3 | one beside every wormhole |

- **The same for everyone.** The count is fixed (`shieldDrops`), drops are spaced evenly by distance over the first two-thirds of the mission (`DROPS_WITHIN`), and only their position is random. A shield just before the refill would be worth nothing.
- **Fewer each mission, on purpose.** Mission 5 teaches the higher speeds with a cushion; mission 7 leaves the ship nearly bare.
- **Shield or crew.** Every second drop (`CHOICE_EVERY`) arrives the way the two-crew pair does, as a choice in one fast row: 2 crew on one side, 3 crew on the other, and the shield in the middle between two small asteroids. The sides are too far apart to take both, and the corridor to the shield is narrow. The slow motion announces it. Which side has the 3 is random.
- **In mission 7** the only shields are the ones offered opposite each wormhole (see [Leaving a level](#leaving-a-level)).

## Levels

There are 7 levels. **The player knows them as missions:** everything on screen says `MISSION` — the counter in the corner (`MISSION 2/7`) and the results screen between them. The code and these notes keep the word level.

| Level | Parsecs to fly | Starting speed | Seats | Shield drops |
|---|---|---|---|---|
| 1 | 500 | 1× | 2 | none |
| 2 | 750 | 1× | 4 | none |
| 3 | 1,250 | 1× | 6 | none |
| 4 | 2,000 | 1× | 10 | none |
| 5 | 2,500 | 1.4× | 16 | 6 |
| 6 | 3,000 | 1.8× | 24 | 4 |
| 7 | 3,500 to the first wormhole, then open | 2.2× | 32 | one beside every wormhole |

Missions 1–4 are the game most players play, about five minutes. Missions 5–7 are for competing; their lengths and starting speeds are starting values, to be tuned by playing.

- A level's goals are met once its parsec target is flown **and** at least 20 seconds have passed. The bar under the score shows progress towards the target.
- **One speed slope.** Speed follows progress, not the clock: from the level's starting speed it rises in a straight line with the parsecs flown and has gained 1.3× (`SPEED_GAIN`) at the level's target, whatever the level's length. Past the target it keeps rising at the same rate for as long as the ship stays on. There is no second gear and no ceiling: no mission levels off at a speed a player can survive for ever.
- **Seats grow evenly.** 2, 4, 6, 10, 16, 24, 32: each mission adds about half again, with no jump in the middle and no flat stretch after it.
- **The ship is built for its seats and weighed down by its crew.** Its size comes from the mission's seats, its steering from the crew on board (see [Crew make the ship heavy](#crew-make-the-ship-heavy)).
- Entering a new level delivers the crew on board: they are saved, the seats are emptied, and the score jumps.

### Crew make the ship heavy

**Size comes from the seats.** Every mission's ship is bigger than the last (a larger hitbox), because it has more seats; it grows into its new size in the first moments of the mission. Crew coming aboard no longer change its size.

| Mission | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| Seats | 2 | 4 | 6 | 10 | 16 | 24 | 32 |
| Ship radius (`shipRadius`) | 14.3 | 15.1 | 15.8 | 17.0 | 18.5 | 20.4 | 22 |

**Steering comes from the crew.** An empty ship is nimble; every crew member aboard makes it slower to steer, and delivering them at the wormhole gives the steering back.

| Crew on board | 0 | 2 | 8 | 16 | 32 |
|---|---|---|---|---|---|
| Steering speed (`handling`) | 100% | 94% | 85% | 75% | 60% |

- Both follow the same curve in `tuning.ts`, `(n / 32)^0.7`: the first seats, and the first crew aboard, are felt the most.
- **Crew deepen the well and dig it sooner.** Each crew member adds 5% (`CREW_MASS`) to the ship's mass, which scales both the pull of the well dug while parked and how fast it forms: a full ship of 32 pulls 2.6 times as hard as an empty one and reaches full depth in 2.3 seconds, not 6 (see [Gravity](#gravity)).
- It sharpens the trade the score already makes: more crew multiply the mission's parsecs and make every further parsec harder to fly.
- Not built, on purpose: a loaded ship pulling asteroids while moving. The parked well is already a gravity effect the player has to learn.

### Leaving a level

Levels do not end on their own. When the goals are met, an unlabelled wormhole drifts down the screen at a random position across the middle of the field. Flying into it delivers the crew on board and moves to the next level.

- **A missed wormhole** comes back after a wait dealt from a fixed set, in a random order, reshuffled when the set runs out: 16, 19, 22, 25 and 28 seconds (`WORM_WAITS`). Nobody can predict the next wait, and over every five wormholes everyone has waited the same 110 seconds. The level keeps getting faster in the meantime.
- **Mission 7 has no end of its own.** Its wormhole is the way home: flying in delivers the crew, ends the run and records the score, under the title `MADE IT HOME`. Letting it pass means climbing on.
- **Wormhole or shield.** Every wormhole in mission 7 arrives with a shield arc in the same row on the opposite side, equally far from the middle. The wormhole ends the run, so nobody can take both. Which side each is on is random. These are the only shields in mission 7: a shield is the reward for turning down the way home. The slow motion of the two-crew pair announces the first offer.

### Between levels

Flying into the wormhole of levels 1 to 6 stops the game on a results screen: `MISSION N COMPLETE`, then the full table of the run so far under the headings `MISSION`, `DISTANCE`, `SAVED`, `MISSED` and `SCORE`.

- **A row per mission flown,** numbered, the one just finished last and brightest. Each is a sum that reads left to right: `484 pc  ×2  2 (−10%)  871`. Parsecs, times crew saved, less the share the missed crew cost, shown as the count and that share (a dash when none were), equals its score.
- **`TOTAL`** — the run's score so far, brighter and larger: the rows added up.

Both end screens, under `MADE IT HOME` or `GAME OVER`, show that table with one row per mission played (up to seven) and no total row: the score printed below is the rows added up. After a crash the unfinished mission has a row too: its saved column shows the crew who went down with the ship as `−3` in orange instead of a multiplier, its missed column the count without a percentage, and its score a dash: it has no sum. Then `NEW BEST!` or the best; then the `NOT SAVED` section with the crew lost with the ship and the run's `N MISSED`.

The screen between levels stays until the player taps (or presses Space or Enter); a tap in its first 0.7 seconds is ignored so a held thumb does not skip it. Nothing moves on and no distance is flown while it is up. The next level then starts with at least 3 shields. The wormhole of mission 7 goes straight to the `MADE IT HOME` screen.

## Rescue missions

Stranded crew are found on planetoids: round, banded and coloured (teal, rust or blue), so they never look like one of the grey asteroids. A planetoid with crew on it sits inside a pulsing green `SOS` ring. Flying inside the ring picks them up; they are saved at the next wormhole (see [The score](#the-score)).

On level 1 every planetoid has a single person, and they come one at a time. On level 2 most carry one person (60%), some carry two (32%), and three is a rarity (8%). On level 3 most carry two (50%) or three (35%), and from level 4 on they carry two (30%), three (40%) or four (30%) — set by `crewSize` in `src/game/spawn.ts`.

A planetoid is harmless. The ship can fly straight across one: it does not break and costs no shield. Only asteroids do damage.

They are deliberately sparse, so the seats fill over the whole level and not in its first moments. A run opens with rocks alone: the first planetoid of mission 1 appears at the 200 pc mark (`FIRST_RESCUE`). On later missions the first appears 4 seconds in. After that:

| Level | Seconds between crews | Roughly how many per level | People on a planetoid |
|---|---|---|---|
| 1 | 11–15 | 2 | 1 |
| 2 | 15–20 | 3 | mostly 1, sometimes 2, rarely 3 |
| 3 | 15–20 | 5 | mostly 2–3 |
| 4–7 | 15–20 | 7–8 to the target | 2–4 |

Later levels have more seats, so their planetoids carry more people, not more planetoids: the sky stays sparse and the seats can still fill by about the time the wormhole shows. A two-crew pair is always 1 and 2 people.


- **Capacity:** the ship takes only as many people as it has free seats; the rest stay on the planetoid. When the ship is full the rings of any planetoid still on the field turn grey and lose their `SOS` label, and no more planetoids are sent until a seat opens (see [A full ship sees no crew](#a-full-ship-sees-no-crew)); nothing spells out why.
- **The count.** `CREW n/N` is yellow while there are free seats, and so are the outlines of the empty pips; it turns green when the ship is full and swells for half a second as it does, so the change does not rest on colour alone. Yellow means a free seat and green means crew, everywhere in the HUD: the filled pips, the seat dots on the hull, the `SOS` rings and the pending score are all green.
- **Showing capacity:** seats are drawn on the ship's hull as dots that turn green as they fill, and repeated as pips with a `CREW n/N` count under the progress bar. The 20, 24 and 32 seats of missions 5–7 sit in wider rows on the hull (5 or 6 across) and in two rows of pips.

### Two crews at once

From level 2, every third rescue is a pair on screen together, in different columns, one following just above the other: 1 person on an open planetoid, or 2 on a planetoid with a small asteroid on each side. Level 1 has no pairs. Which comes first and which side each is on are random.

There is no caption for this. As the first crew comes into view at the top of the screen, the whole game drops into slow motion for a moment (`SLOW_TIME` real seconds, down to `SLOW_SCALE` of normal speed) so the player has time to see that there are two crews. The ship slows with everything else, so the slow motion gives time to look, not extra time to fly.

Nothing forbids saving both. The vertical gap between them is calculated from the ship's current top speed so that the dash from the first to the second falls just short, and these planetoids fall faster than ordinary ones.

## Gravity

A faint grid behind the stars shows spacetime.

- **Digging a well:** keeping the ship in one spot bends the grid towards it — the lines pinch in, brighten and turn purple — and asteroids start falling into the well. An empty ship's well reaches full depth after 6 seconds.
- **Crew dig it sooner:** the well forms faster by the ship's mass, 5% per crew member aboard. With 8 aboard it is at full depth after 4.3 seconds, with 16 after 3.3, with a full 32 after 2.3. A loaded ship that pauses is in a well almost at once.
- **What pulls harder:** more time parked, more crew aboard (see [Crew make the ship heavy](#crew-make-the-ship-heavy)) and higher flight speed.
- **Where the centre is:** just ahead of the ship's nose (`WELL_AHEAD` ship radii above its centre), not under it. Rocks pulled in gather in front of the ship and then sweep down through it, so sitting in a deep well is dangerous.
- **Wells stay where they were dug:** moving away leaves the well behind. It keeps drawing asteroids towards the old spot while it relaxes over about 4 seconds, and a fresh well starts from zero at the ship.

The intended use is as a tool: park to gather rocks, then dart away so they fall into the place you left. Rescue rocks are pulled like any other; the wormhole and shield drops are not affected.

## Same game on every device

Scores are compared on one board, so the game must not depend on the device.

- **One field.** The play field is always 400 × 720 units (`FIELD_W`, `FIELD_H`). The window only decides how big it is drawn: the field is scaled to fit whole and centred, with empty bars beside or above it when the window has another shape. Resizing or rotating changes the picture, never the game.
- **One step.** The game advances in steps of 1/60 second (`STEP`), however often the screen refreshes. A slow device takes several steps per frame; a 120 Hz screen takes a step every other frame. Slow motion scales the step, not the frame time. Only below 4 frames a second does the game fall behind real time.
- **One deal.** Every run is dealt from a seed (`src/game/random.ts`): rocks, crews, wormholes and waits all come from it, so the same seed and the same inputs give the same run. The seed of the first run is shown on the start screen next to the version; every later run gets a new one. Drawing (the engine flame, the screen shake, the stars) uses its own randomness and never touches the deal.
- **Not yet:** the player cannot choose a seed, the seed is not saved with the run, and inputs are not recorded, so a score still cannot be replayed and checked (see [Still open](#still-open)).

## The seven-mission run

Agreed on 2026-11-14 and built the same day, replacing the four-mission game. This section keeps the reasoning; how each piece works is described above. Numbers marked *to tune* were worked out on paper, not by playing.

### What changed from the four-mission game

| | Before | Now |
|---|---|---|
| Missions | 4, and the fourth ended the run | 7, and the seventh ends when the player goes home or the ship is destroyed |
| Crew left behind | 10% each, down to nothing at ten | 5% each in missions 1–4, then 3%, 2% and 1.5%, down to nothing |
| Ship destroyed | The unfinished mission cost its parsecs × the crew aboard, taken off the banked score | The unfinished mission scores nothing; everything banked is kept |
| Speed past the target | The same slope up to 4.5×, then second gear up to 9× | One slope in every mission: no second gear, and no ceiling |
| A missed wormhole | Back after a random 15–30 seconds | Back after a wait dealt from a shuffled set |
| Shields | 3 per mission | Topped up every mission; drops on missions 5 and 6; on mission 7 only by turning down the way home |
| Ship size and steering | From the mission number | Size from the mission's seats, steering from the crew on board |
| Frame time and field | Variable step, field sized from the window | Fixed step, fixed field |

### The missions

- **Missions 1–4** keep their lengths and take about five minutes. They are the whole game for most players. Their ships have fewer seats than before from mission 3 on (6 and 10, not 8 and 16), so they fill sooner.
- **Missions 5–7** are for competing. Each is longer than the last and starts faster, so each takes about two minutes to its target, as mission 4 does. Reaching mission 7 takes about nine minutes, and its first wormhole comes at about eleven.
- **What makes 5–7 harder:** longer missions, higher speeds from the first second, fewer shield drops each mission, and crew that make the ship heavier and deepen its well. New objects are decided after playing (see [New things in missions 5–7](#new-things-in-missions-57)).
- **Seats** grow by about half each mission. Mission 7 has 32 so that the ship does not fill early: about 21 people arrive before its first wormhole. Every crew member left behind there is the player's own miss, and every rescue both raises the multiplier and avoids a penalty.

### Crew left behind

A mission's score is parsecs × crew saved, less a share for the crew left behind. Each crew member left behind takes a fixed share of that mission's score, and the share depends on the mission:

| Mission | 1–4 | 5 | 6 | 7 |
|---|---|---|---|---|
| Each missed crew member costs (`missCost`) | 5% | 3% | 2% | 1.5% |
| Seats | 2–10 | 16 | 24 | 32 |
| The mission is worth nothing at | 20 missed | 34 | 50 | 67 |

- **The rule of thumb:** from mission 5 on, missing as many crew as the ship seats costs about half the mission (16 × 3%, 24 × 2%, 32 × 1.5% are each 48%).
- **Why it falls.** Seats grow from 2 to 32, so the chances to miss grow sixteen times; at a flat 5% each, the late missions were lost to misses. A run on 0.2.0 scored under the flat rule: mission 6, with 15 missed, lost 75% before counting hits, and mission 7, with 5 missed and 3 hits by 1,905 pc, was 40% down a little past halfway to the first way home. Under the table that mission 6 loses 30%.
- **The penalty punishes mistakes, not time.** A mission cannot end before its target, the first wormhole appears as soon as the target is flown, and a full ship is sent no crew, so waiting adds no misses.
- **Mission 7 must stay worth something,** or there is no choice between going home and staying.
- **Why not a cap.** A cap turns "worth nothing" into a fixed tax, and every miss beyond it is free: the fault the 75% cap had.
- **Still simple to read.** It is linear and has no floor other than nothing. The results table prints the count and the share, `3 (−15%)`; in mission 7 the share can end in a half, `1 (−1.5%)`, and the score is worked out from the figure that is printed.
- **Hits.** Crew thrown off by a hit count as missed at the mission's own cost. In mission 7 a hit costs 1.5% plus the seat and the shield, so what ends a long stay is running out of shields.
- **In code** it is `missCost(level)` in `tuning.ts`.

### Staying on

Staying in a mission after its target is flown is still a gamble, but its shape changed with the two rules above.

- **With free seats** it can pay: planetoids keep coming, every rescue raises the multiplier, and every parsec multiplies the crew aboard. Every planetoid not taken is a real miss.
- **With a full ship** nothing drifts past and nothing is charged. Parsecs keep multiplying a full crew, so the score only climbs, and what it costs is risk: speed keeps rising, every hit throws a crew member off and takes that mission's share off its score (5% down to 1.5%), and losing the ship loses the whole mission. A ship that is hit turns yellow and has to fill up again while the speed rises. Arriving home with a full ship is the skill.
- **In missions 1–6** this asks a player to risk the rest of the run for a larger mission score; in mission 7 it is the game.

Before these rules the price of staying on with a full ship was the crew drifting past, and this section held a model of it: with the penalty of that time the score dipped first (7% down after a minute on mission 4, 18% on mission 7) and came level again only at speeds few survive. That model no longer describes anything in the game. Whether staying on now pays too easily is settled by playing (see [Still open](#still-open)).

One condition stands: no mission may level off at a speed a player can survive for ever. Speed keeps rising with the parsecs flown.

### When the ship is destroyed

In every mission, the mission in flight scores nothing and the crew on board are lost with it. Everything banked by earlier missions is kept. The earlier deduction (parsecs × crew aboard, off the banked score) is gone: a mission-4 crash once took 8,352 off a run of 9,157.

- **The end-screen table** shows the unfinished mission's row with the crew who went down and no score, not a negative one.
- **Mission 7 is where this bites.** Missions 1–6 are safe once delivered, so the whole gamble sits in what mission 7 has built up, and that grows the longer the player stays.

### Mission 7: the way home

Mission 7 has no end of its own. Its wormhole is the way home: flying in delivers the crew, ends the run and records the score, under the title `MADE IT HOME`. Letting it pass means climbing on.

- **Wormhole or shield.** Every wormhole in mission 7 arrives with a shield arc in the same row on the opposite side, equally easy to reach. The wormhole ends the run, so nobody can take both. Which side each is on is random.
- **The only shields in mission 7** are these. A shield is the reward for turning down the way home.
- **It is sharpest when it should be.** On three shields a player ignores both and flies on. On none, it is go home with what there is, or take one more hit and keep climbing. At the most shields a ship can hold the arc offers nothing.
- **No caption.** Both shapes are known by mission 7. The slow motion of the two-crew pair announces the first offer (built so; *to confirm by playing*).
- **What ends a run.** Shield offers arrive at a steady pace in seconds while speed keeps rising, so sooner or later the hits outnumber the shields.

### Wormhole rhythm

Wormholes stay random from moment to moment and equal for everyone over time, the way modern Tetris deals pieces.

- **The first wormhole of a mission** appears as soon as the target is flown and 20 seconds have passed.
- **A missed wormhole** comes back after a wait dealt from a fixed set, in a random order, reshuffled when the set runs out: 16, 19, 22, 25 and 28 seconds (*to tune*). Nobody can predict the next wait, and over every five wormholes everyone has waited the same 110 seconds.
- **Position** stays random across the middle of the field.
- **One rule for all missions.** In missions 1–6 a missed wormhole returns on this rhythm; in mission 7 each one arrives with a shield opposite.

The average wait is the main dial for how long a mission 7 run lasts.

### Shields

Shield drops used to be a parked idea, because they made the game easier and rewarded staying on. Both are now intended: the count is fixed and falls each mission, and in mission 7 staying on is the game.

For the crew-or-shield choice to be a choice the ship must not be full when it comes, so the crew on offer in missions 5 and 6 stay a little below the 16 and 24 seats. As built, the shield is always the middle of the three and the crews are on the sides; that keeps the two crews too far apart to take both.

### Crew weight

Before, crew weighed almost nothing: each person added 0.02 to a mass of 1.0–1.7 that came from the mission number, and mass counted only for the well dug while parked. Size and steering came from two per-mission tables, which hit a ceiling at missions 5 and 9. Both tables are gone.

### New things in missions 5–7

**Decided after playing, and not built.** The seven missions are built with only what missions 1–4 already teach. New objects are added only if missions 5–7 then feel thin. The candidates, from the earlier plan:

- **Dead stars:** a dark point with a fixed, deep well around it that pulls the ship as well as the asteroids. The grid already shows wells, so it needs nothing new on screen.
- **Failing rescues:** on some planetoids the `SOS` ring shrinks over time. When it closes, the crew are missed.
- **Wrecked stations:** larger than a planetoid, just as harmless, carrying 4–8 people. In mission 7 they would fill the 32 seats sooner than intended, so they would replace planetoids, not add to them.
- **Angled asteroids:** some cross the screen at an angle instead of falling straight.
- **A wormhole that drifts sideways:** the least likely to return, because it clashes with a shield placed evenly opposite the wormhole in mission 7.

### The global board

One board of best scores, for all time.

- **When the choice to go home bites:** when the run in hand is already ahead of the player's own best. A run below it has nothing to lose, which is how a record chase works.
- **Players will gamble deeper than the model says,** because a failed attempt costs only that run. The wait between wormholes is tuned from what players do on runs that are ahead of their best.
- **Each row shows how many missions the run finished,** and for a run that reached mission 7 how it ended and how far it went there, for example `FINISHED 7/7 · HOME · 5,400 pc` or `FINISHED 6/7 · LOST · 7,100 pc`. The board then tells who got out in time.

An all-time board needs three things:

- **The same game on every device.** Built: a fixed step and a field of one fixed shape (see [Same game on every device](#same-game-on-every-device)).
- **Settled rules.** Any change to the balance after launch needs a new board. The board started again once, when these rules landed.
- **Scores that can be checked.** Not built. Scores are still trusted from the client; the rules can only check that a run is well-formed. The plan is seeded randomness and a recording of the inputs, replayed on a server before a score is listed.

### Keeping luck small

- Wormhole waits are shuffled, not rolled.
- Shield drops are a fixed count at an even spacing.
- Crew sizes, rocks and positions stay random: they are many small rolls and even out over a run.

### How we will know it works

Starting targets, *to tune*:

- **Pick-up:** a new player with no explanation finishes mission 1 within three tries, and a first run lasts over a minute with one rescue delivered.
- **Nobody outlasts the game:** the best player is destroyed by the difficulty, within roughly 15 minutes.
- **A long tail:** top scores sit about ten times above the median, and the record keeps rising for weeks.
- **Skill over luck:** one player's five best runs fall within about 30% of each other.
- **Fair deaths:** players blame themselves, not the game.

### How to tune it

1. **Record every run:** where it ended, whether the player went home or was destroyed, and the shields at each wormhole.
2. **Aim it at real survival.** Of strong players who stay on with a full ship, about half should get home with it. If nearly everyone does, staying is too cheap: raise the speed slope or lengthen the wormhole waits; if nobody does, do the reverse.
3. **Find the speed wall before players do.** A scripted pilot in the tests can sweep speeds and show where survival collapses.

### Still open

Everything here is settled by playing, not by discussion:

- **The parsecs and starting speeds of missions 5–7.**
- **What a crew member left behind costs in each mission** (5%, then 3%, 2%, 1.5%), and whether a mission should be able to fall to nothing.
- **The seats of missions 3–5** (6, 10, 16), which are fewer than before.
- **Whether staying on with a full ship pays too easily,** now that it costs only risk (see [Staying on](#staying-on)).
- **The wait before planetoids return** after a seat opens (`SEAT_WAIT`, 4 seconds).
- **Whether a hit costing a crew member is too harsh on mission 1,** where one person is half the seats.
- **The set of wormhole waits.**
- **How many shield drops arrive as a choice** between crew and a shield. Half of them is built: 3 of the 6 on mission 5 and 2 of the 4 on mission 6.
- **Scores that can be checked** and **tuning aids** (per-run records of where and how runs end, a scripted pilot that sweeps speeds): planned, not built.
- **How much each crew member deepens the well** and slows the ship.
- **Whether the first wormhole-or-shield offer needs the slow motion.**
- **New objects in missions 5–7** (see [New things in missions 5–7](#new-things-in-missions-57)).

### Parked and set aside

Kept for later, only if the game turns out to need them:

- **Shooting** (holding both sides fires straight up). It turns a dodger into a shooter partway through a run, there is no way to discover it without a caption, it makes lingering safer, and it is the largest thing to build.
- Asteroids that split into fragments, dark patches of space that hide rocks, and two wormholes with different risks to choose between.

Considered on 2026-11-14 and not taken:

- **A speedrun game** with fixed courses, a timer and speed the player controls. The game is about endurance and score, not time.
- **Destruction costing half of everything banked.** The cost of staying on is the hits, and destruction costs the mission in flight.
- **Weekly boards or a career total** in place of the all-time board.

### What this touched outside the game

- **Firestore rules:** `firestore.rules` accepts levels 1–7; a `won` run is one that went home from mission 7; a run records `finalDistance`, the parsecs flown in mission 7. **The rules must be deployed together with the client** (`firebase deploy --only firestore:rules`); GitHub Actions deploys Hosting only.
- **Leaderboard entries** hold `best3`, `bestOutcome`, `bestLevel` and `bestFinal`. The earlier `best` and `bestScore` fields are neither read nor written, which is what starts the board again.
- **Saved bests on the device** use new storage keys, so a best from the earlier rules is not uploaded to the new board.
- **End screen and share text:** `ALL MISSIONS COMPLETE` became `MADE IT HOME`, on the end screen, in the line under a shared run and in the share message.
- **Golden traces** were re-recorded: every change above alters missions 1–4 too.

## Tuning

The main numbers sit in `src/game/tuning.ts`:

| Constant | Meaning |
|---|---|
| `FIELD_W`, `FIELD_H`, `STEP` | The fixed play field and the fixed simulation step |
| `startSpeed`, `SPEED_GAIN` | Speed a level starts at, and how much it gains over the level's parsec target |
| `missCost` | Share of a mission's score that each crew member left behind takes, per mission |
| `LEVEL_MIN_TIME` | Minimum seconds in a level before the wormhole can appear |
| `levelTarget` | Parsecs to fly per level |
| `levelCapacity` | Seats per level |
| `shipRadius`, `handling`, `CREW_MASS` | Ship size for its seats; steering speed and extra mass for the crew on board |
| `LAST_LEVEL` | Number of levels |
| `WELL_TIME` | Seconds an empty ship parks for the deepest gravity well; divided by the ship's mass |
| `WELL_AHEAD` | How far above the ship the well's centre sits, in ship radii |
| `WELL_PULL` | How hard a well pulls rocks in, before ship mass and flight speed are applied |
| `SHIELDS`, `MAX_SHIELDS`, `GRACE` | Shields a level starts with at least, the most a ship holds, and seconds of protection after losing one |
| `shieldDrops`, `DROPS_WITHIN`, `CHOICE_EVERY` | Shield drops per level, the share of the level they are spread over, and how often one arrives as a choice against crew |
| `WORM_WAITS` | The set of waits dealt to missed wormholes |
| `FIRST_RESCUE` | Parsecs into a run before the first planetoid appears |
| `rescueGap` | Seconds between stranded crews, per level |
| `SEAT_WAIT` | Seconds from a seat opening on a full ship to the next planetoid |
| `DILEMMA_EVERY` | Every Nth rescue is a two-crew pair |
| `SLOW_TIME`, `SLOW_SCALE` | Length and depth of the slow motion when a two-crew pair appears |

A few more live next to the code they affect:

- **How soon a shallow well bites:** the `0.7` exponent in the pull calculation in `update` in `src/game/simulation.ts`. Overall strength is `WELL_PULL`.
- **Two-crew difficulty:** the `0.78` in `spawnDilemma` in `src/game/spawn.ts` (lower makes saving both harder).
- **The crew-or-shield row:** positions and escort spacing in `spawnChoice` in `src/game/spawn.ts`.
- **Where a mission-7 wormhole and its shield sit:** `openWormhole` in `src/game/simulation.ts`.

## Debug hook

`window.__game` (built in `src/debugHook.ts`) exposes read-only state (`state`, `seed`, `level`, `score`, `distance`, `saved`, `lost`, `missed`, `onboard`, `wells`, `wormhole`, `drops`, `results`, `slowmo`, `shields`, `grace`, `asteroids`, `ship`) and a few helpers used by the automated checks: `skipLevel()` meets the current level's goals immediately, `fill(n)` sets the crew on board, and `spawnRescue()` / `spawnDilemma()` spawn rescue rocks on demand.

## Status

Difficulty and feel are still being tuned by hand. What is planned next is tracked in `project-task-list.md`; how the game is tested is in `../test/test-documentation.md`.

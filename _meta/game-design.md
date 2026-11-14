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

Deliberately very little. The start screen shows only the title, the best score, the two control arrows and, small at the foot, the version and the seed of the next run (`v0.2.1 · SEED 4F2A9C`). Levels start without a banner — the only sign is the mission counter in the corner and a flash on arrival; between them a results screen shows what the last one added. Rescues, the level exit and gravity are left for the player to discover. This file describes how they work.

## The score

Saving the stranded crew is what the game is about, and the score says so. Every mission is scored on its own, **parsecs flown in it × crew saved in it, less a share for the crew left behind**, and the run's score is its missions added up. Flying far with nobody saved scores nothing.

- **Saved** means delivered. Crew picked up sit in the ship's seats and count for nothing yet. Flying into a wormhole delivers everyone on board: they are saved for good, and only then do they multiply that mission's parsecs.
- **Per mission.** Parsecs only multiply the crew of their own mission. Staying on mission 1 to pile up distance multiplies two seats and nothing saved later, so it buys little; distance is worth most on the late missions, where the ship carries more and flying is hardest.
- **Missed** crew are those who drifted off the bottom of the screen while the ship had a seat for them. Until a mission's wormhole has appeared, crew who pass a ship with no free seat are not counted (see [A full ship is not charged](#a-full-ship-is-not-charged)); once it has, everyone who drifts past counts. Each one counted takes 10% (`MISS_RATE`) of what is still at risk, and at most 75% (`MISS_CAP`) is ever at risk: the share kept is `1 − 0.75 × (1 − 0.9^missed)`. One missed keeps 93%, three 80%, ten 51%, and no number of them takes a mission below 25%. See [Crew left behind](#crew-left-behind) for why.
- **Lost with the ship.** If the ship is destroyed, the mission in flight scores nothing and the crew on board are lost with it. Everything banked by earlier missions is kept; nothing is taken off.
- **Parsecs** are pure distance. They grow faster as the level speeds up, so staying in a level after its wormhole has appeared keeps adding distance, at rising risk.

None of this is explained to the player. It is shown:

- **During a run** there is one big number at a time. With crew on board it is green with a plus, `+700`: what they are worth right now — this mission's parsecs × crew on board, less what the mission has missed — which is what the next wormhole will bank; it grows as the ship flies on and drops when a crew drifts past. With the seats empty it is the score, in white. Before anything is banked and with nobody aboard there is no number at all, never a `0`. `SAVED` and `MISSED` are counted in the corner; the seats on the ship and the pips under the progress bar show who is on board and still at risk.
- **On the end screen** a table lists every mission played as a sum of its own — distance, crew saved, what the missed cost, score — and the run's score, which is those scores added up, is printed below it with the best right under it. Crew who were not saved have a section of their own, `NOT SAVED`: `3 WENT DOWN WITH THE SHIP` in orange if anyone did, and the number missed (see [Between levels](#between-levels)).

There is one best, the highest score, saved on the device together with how that run ended; the end screen shows `NEW BEST!` when it is beaten. Bests from before the seven-mission rules are not comparable and are not read.

### Leaderboard

When the game is connected to the cloud and the board has loaded, both end screens show a `LEADERBOARD` pill in the top left corner, mirroring `SHARE` on the right. A tap on it opens the leaderboard over the end screen and does not start a new run. The next tap, or Space, Enter or Escape, goes back to the end screen; that does not start a run either.

The leaderboard is `TOP SCORES`: the ten highest best scores, one global board for all time. Players are listed by callsign: two words and a number, generated from the player's anonymous account, so nobody types a name and the same account always keeps the same one. Under each callsign a small line says how that run ended: `HOME · 5,400 pc` for a run that went home and `LOST · 7,100 pc` for one destroyed in mission 7, with the parsecs flown in mission 7, or `LOST · MISSION 3` for a run that never got there. The board then tells who got out in time. The player's own row is gold, which is also how they learn their callsign. A player outside the top ten gets an extra row with their rank. A player whose best is 0 is not listed.

The board started again when the seven-mission rules landed: entries are ranked by a new field (`best`), so entries that only hold a score from the earlier rules are not listed, and a player's first new entry replaces their old one.

The board is refreshed when a run ends, and the player's row always uses the best the game holds right now. Offline, or before the first board has loaded, there is simply no pill.

### Sharing a run

Once the run on an end screen has been saved, a `SHARE` pill appears in the top right corner. A tap on it shares a link and does not start a new run; a tap anywhere else restarts as before. Where the device has no share sheet the link is copied and the pill reads `COPIED` for two seconds. Offline, or without the cloud, there is no pill.

Whoever opens the link gets the ordinary start screen with the shared run under the title: the callsign in gold, the score, and one line under it — `MADE IT HOME · N SAVED` for a run that went home, `N SAVED · D pc` for a lost one. The message that travels with the link leads with the crew saved and gives the score, not the distance.

## Shields

Each level starts with at least 3 shields (`SHIELDS`), and a ship holds at most 5 (`MAX_SHIELDS`). They are shown in two places, with the same shape: as arcs stacked ahead of the ship's nose, and as a row of arcs under the best score, where spent ones turn faint. There is no caption.

- **Taking a hit:** hitting a rock burns one shield — the outermost arc disappears. The run carries on where it is: same level, same parsecs, same crew on board, same speed.
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
| 3 | 1,250 | 1× | 8 | none |
| 4 | 2,000 | 1× | 16 | none |
| 5 | 2,500 | 1.4× | 20 | 6 |
| 6 | 3,000 | 1.8× | 24 | 4 |
| 7 | 3,500 to the first wormhole, then open | 2.2× | 32 | one beside every wormhole |

Missions 1–4 are the game most players play, about five minutes. Missions 5–7 are for competing; their lengths and starting speeds are starting values, to be tuned by playing.

- A level's goals are met once its parsec target is flown **and** at least 20 seconds have passed. The bar under the score shows progress towards the target.
- **One speed slope.** Speed follows progress, not the clock: from the level's starting speed it rises in a straight line with the parsecs flown and has gained 1.3× (`SPEED_GAIN`) at the level's target, whatever the level's length. Past the target it keeps rising at the same rate for as long as the ship stays on. There is no second gear and no ceiling: no mission levels off at a speed a player can survive for ever.
- **The ship is what its crew make it.** Its size and steering come from the crew on board, not from the level (see [Crew make the ship heavy](#crew-make-the-ship-heavy)).
- Entering a new level delivers the crew on board: they are saved, the seats are emptied, and the score jumps.

### Crew make the ship heavy

An empty ship is small and nimble; every crew member aboard makes it bigger (a larger hitbox) and slower to steer, and delivering them at the wormhole shrinks it back. The player sees the ship swell, so no caption is needed.

| Crew on board | 0 | 2 | 8 | 16 | 32 |
|---|---|---|---|---|---|
| Ship radius (`shipRadius`) | 13 | 14.3 | 16.4 | 18.5 | 22 |
| Steering speed (`handling`) | 100% | 94% | 85% | 75% | 60% |

- The first crew aboard are felt the most (the curve in `tuning.ts` is `(crew / 32)^0.7`).
- **Crew deepen the well.** Each crew member adds 5% (`CREW_MASS`) to the ship's mass, which scales the pull of the well dug while parked: a full ship of 32 pulls 2.6 times as hard as an empty one.
- It sharpens the trade the score already makes: more crew multiply the mission's parsecs and make every further parsec harder to fly.
- Not built, on purpose: a loaded ship pulling asteroids while moving. The parked well is already a gravity effect the player has to learn.

### Leaving a level

Levels do not end on their own. When the goals are met, an unlabelled wormhole drifts down the screen at a random position across the middle of the field. Flying into it delivers the crew on board and moves to the next level.

- **A missed wormhole** comes back after a wait dealt from a fixed set, in a random order, reshuffled when the set runs out: 16, 19, 22, 25 and 28 seconds (`WORM_WAITS`). Nobody can predict the next wait, and over every five wormholes everyone has waited the same 110 seconds. The level keeps getting faster in the meantime.
- **Mission 7 has no end of its own.** Its wormhole is the way home: flying in delivers the crew, ends the run and records the score, under the title `MADE IT HOME`. Letting it pass means climbing on.
- **Wormhole or shield.** Every wormhole in mission 7 arrives with a shield arc in the same row on the opposite side, equally far from the middle. The wormhole ends the run, so nobody can take both. Which side each is on is random. These are the only shields in mission 7: a shield is the reward for turning down the way home. The slow motion of the two-crew pair announces the first offer.

### Between levels

Flying into the wormhole of levels 1 to 6 stops the game on a results screen: `MISSION N COMPLETE`, then a table under the headings `DISTANCE`, `SAVED`, `MISSED` and `SCORE`.

- **`MISSION`** — the mission just finished, as a sum that reads left to right: `484 pc  ×2  2 (−14%)  830`. Parsecs, times crew saved, less the share the missed crew cost, shown as the count and that share (a dash when none were), equals its score. The mission number is only in the title.
- **`TOTAL`** — the run's score so far, brighter and larger: the missions added up.

Both end screens, under `MADE IT HOME` or `GAME OVER`, show the same table with one row per mission played (up to seven), numbered, and no total row: the score printed below is the rows added up. After a crash the unfinished mission has a row too: its saved column shows the crew who went down with the ship as `−3` in orange instead of a multiplier, its missed column the count without a percentage, and its score a dash: it has no sum. Then `NEW BEST!` or the best; then the `NOT SAVED` section with the crew lost with the ship and the run's `N MISSED`.

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


- **Capacity:** the ship takes only as many people as it has free seats; the rest stay on the planetoid. When the ship is full the rings turn grey and lose their `SOS` label; nothing spells out why.
- **Showing capacity:** seats are drawn on the ship's hull as dots that turn green as they fill, and repeated as pips with a `CREW n/N` count under the progress bar. The 20, 24 and 32 seats of missions 5–7 sit in wider rows on the hull (5 or 6 across) and in two rows of pips.

### Two crews at once

From level 2, every third rescue is a pair on screen together, in different columns, one following just above the other: 1 person on an open planetoid, or 2 on a planetoid with a small asteroid on each side. Level 1 has no pairs. Which comes first and which side each is on are random.

There is no caption for this. As the first crew comes into view at the top of the screen, the whole game drops into slow motion for a moment (`SLOW_TIME` real seconds, down to `SLOW_SCALE` of normal speed) so the player has time to see that there are two crews. The ship slows with everything else, so the slow motion gives time to look, not extra time to fly.

Nothing forbids saving both. The vertical gap between them is calculated from the ship's current top speed so that the dash from the first to the second falls just short, and these planetoids fall faster than ordinary ones.

## Gravity

A faint grid behind the stars shows spacetime.

- **Digging a well:** keeping the ship in one spot bends the grid towards it — the lines pinch in, brighten and turn purple — and asteroids start falling into the well. It reaches full depth after 6 seconds.
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
| Crew left behind | 10% each, down to nothing at ten | Each takes 10% of what is still at risk, and at most 75% is ever at risk |
| Ship destroyed | The unfinished mission cost its parsecs × the crew aboard, taken off the banked score | The unfinished mission scores nothing; everything banked is kept |
| Speed past the target | The same slope up to 4.5×, then second gear up to 9× | One slope in every mission: no second gear, and no ceiling |
| A missed wormhole | Back after a random 15–30 seconds | Back after a wait dealt from a shuffled set |
| Shields | 3 per mission | Topped up every mission; drops on missions 5 and 6; on mission 7 only by turning down the way home |
| Ship size and steering | From the mission number | From the crew on board |
| Frame time and field | Variable step, field sized from the window | Fixed step, fixed field |

### The missions

- **Missions 1–4** keep their lengths and take about five minutes. They are the whole game for most players. They are a little easier than before at the start of each mission, because an empty ship is now small whatever the mission.
- **Missions 5–7** are for competing. Each is longer than the last and starts faster, so each takes about two minutes to its target, as mission 4 does. Reaching mission 7 takes about nine minutes, and its first wormhole comes at about eleven.
- **What makes 5–7 harder:** longer missions, higher speeds from the first second, fewer shield drops each mission, and crew that make the ship heavier and deepen its well. New objects are decided after playing (see [New things in missions 5–7](#new-things-in-missions-57)).
- **Seats** stop doubling after mission 4. Mission 7 has 32 so that the ship does not fill early: about 21 people arrive before its first wormhole. Every crew member left behind there is the player's own miss, and every rescue both raises the multiplier and avoids a penalty.

### Crew left behind

A mission's score is parsecs × crew saved, less a share for the crew left behind. The share, in every mission:

**kept share = 1 − cap × (1 − 0.9^missed)**, with a cap of 75% (*to tune*).

Each crew member left behind takes 10% of what is still at risk, and at most the cap is ever at risk.

| Missed | 1 | 2 | 3 | 5 | 10 | 20 | any number |
|---|---|---|---|---|---|---|---|
| Kept | 93% | 86% | 80% | 69% | 51% | 34% | never below 25% |

- **Why a cap.** With a flat 10% each, ten missed crew left nothing, so staying on always ended at zero. With a cap the penalty runs out while the parsecs keep growing, so a player who stays long enough outruns it.
- **It replaces the penalty that scaled with the crew on offer**, planned earlier for wrecked stations. Under this formula a missed station of 8 costs 43% of a mission, not 80%.
- **In code** it is two numbers, `MISS_RATE` (10%) and `MISS_CAP` (75%), so the cap is one constant to change.

### A full ship is not charged

Added on 2026-11-14, after the first runs on the seven-mission build. Every mission offers more crew than it has seats, so counting everyone who drifted past fixed most of the penalty before anyone played. In one run mission 5 offered 40 crew for 20 seats: the ship was filled and still charged 20 missed, 66% of the mission, so mission 5 paid less than mission 4. With 20 forced misses the formula is also saturated: one more careless miss costs under 1%.

- **The rule.** Crew who drift past count as missed only if the ship had a free seat for them, or if the mission's wormhole has already appeared at least once (`wormCount`, in `missedOn` in `src/game/simulation.ts`).
- **Why the wormhole is the line.** Before the first wormhole the player cannot leave, so a full ship has no choice to be charged for. Once a wormhole has shown, staying on is a choice and its price is the crew drifting past, as before. Mission 7 follows the same rule.
- **A crew bigger than the seats left.** The ship takes as many as it has seats for, and the rest are left on the planetoid. If nobody is taken, only as many as there were seats for are counted.
- **Judged when the planetoid leaves the field,** which is where the count is made. That is a fraction of a second after it passes the ship; judging at the ship would need every planetoid to remember the seats at that moment, for no difference a player could feel.
- **Nothing on screen changes:** a full ship already sees grey rings without `SOS`, and the `MISSED` count simply does not move.
- Everything else about the penalty is unchanged: the rate, the 75% cap, and misses from the two-crew pairs and the crew-or-shield rows while there are free seats.

### Staying on

Staying in a mission after its target is flown is a gamble with a known shape: the score dips first and climbs later. The model below is for a full ship after its wormhole has appeared, where every crew that arrives is missed (about 3 people every 17.5 seconds), with the speed slope. The score is shown against leaving at the target.

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

The table is for a mission of 2,000 parsecs that starts at 1×. Longer, faster missions deepen the dip, because parsecs then grow more slowly against the crew drifting past:

| Mission, with a full ship and a 75% cap | Lowest point | Level again |
|---|---|---|
| 5 (2,500 pc from 1.4×) | 12% down after 73 seconds | after 140 seconds, at 5.6× |
| 6 (3,000 pc from 1.8×) | 15% down after 82 seconds | after 164 seconds, at 6.3× |
| 7 (3,500 pc from 2.2×) | 18% down after 89 seconds | after 182 seconds, at 6.9× |

So on these numbers staying on with a full ship does not pay back at a speed anyone survives. In mission 7 the ship is not full at the first wormhole, and staying pays while there are seats to fill; the question is what happens after that. With a cap of 65% mission 7 is level again after 96 seconds, at 5.0×. The cap, or mission 7's speed, is settled by playing.

This dip is what makes lingering a gamble once second gear is gone. In missions 1–6 it asks a player to risk the rest of the run for a small gain, so only mission 7 really invites it.

One condition: no mission may level off at a speed a player can survive for ever. Speed keeps rising with the parsecs flown.

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

For the crew-or-shield choice to be a choice the ship must not be full when it comes, so the crew on offer in missions 5 and 6 stay a little below the 20 and 24 seats. As built, the shield is always the middle of the three and the crews are on the sides; that keeps the two crews too far apart to take both.

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
- **Players will gamble deeper than the model says,** because a failed attempt costs only that run. The cap and the wait between wormholes are tuned from what players do on runs that are ahead of their best.
- **Each row shows how the run ended** and how far it went in mission 7, for example `HOME · 5,400 pc` or `LOST · 7,100 pc`. The board then tells who got out in time.

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
2. **Aim the model at real survival.** At the point where staying on pays back, strong players should survive about half the time. If nearly everyone stays, raise the cap or lengthen the waits; if nobody does, do the reverse.
3. **Find the speed wall before players do.** A scripted pilot in the tests can sweep speeds and show where survival collapses.

### Still open

Everything here is settled by playing, not by discussion:

- **The parsecs and starting speeds of missions 5–7.**
- **The cap,** and with it whether staying on in mission 7 can pay back at a speed a player survives (see [Staying on](#staying-on)).
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
- **Destruction costing half of everything banked.** The cost of staying on is the crew left behind, and destruction costs the mission in flight.
- **Weekly boards or a career total** in place of the all-time board.

### What this touched outside the game

- **Firestore rules:** `firestore.rules` accepts levels 1–7; a `won` run is one that went home from mission 7; a run records `finalDistance`, the parsecs flown in mission 7. **The rules must be deployed together with the client** (`firebase deploy --only firestore:rules`); GitHub Actions deploys Hosting only.
- **Leaderboard entries** hold `best`, `bestOutcome`, `bestLevel` and `bestFinal`. The old `bestScore` field is neither read nor written, which is what starts the board again.
- **Saved bests on the device** use new storage keys, so a best from the earlier rules is not uploaded to the new board.
- **End screen and share text:** `ALL MISSIONS COMPLETE` became `MADE IT HOME`, on the end screen, in the line under a shared run and in the share message.
- **Golden traces** were re-recorded: every change above alters missions 1–4 too.

## Tuning

The main numbers sit in `src/game/tuning.ts`:

| Constant | Meaning |
|---|---|
| `FIELD_W`, `FIELD_H`, `STEP` | The fixed play field and the fixed simulation step |
| `startSpeed`, `SPEED_GAIN` | Speed a level starts at, and how much it gains over the level's parsec target |
| `MISS_RATE`, `MISS_CAP` | Share of what is still at risk that each crew member left behind takes, and the most that is ever at risk |
| `LEVEL_MIN_TIME` | Minimum seconds in a level before the wormhole can appear |
| `levelTarget` | Parsecs to fly per level |
| `levelCapacity` | Seats per level |
| `shipRadius`, `handling`, `CREW_MASS` | Ship size, steering speed and extra mass for the crew on board |
| `LAST_LEVEL` | Number of levels |
| `WELL_TIME` | Seconds parked for the deepest gravity well |
| `WELL_AHEAD` | How far above the ship the well's centre sits, in ship radii |
| `WELL_PULL` | How hard a well pulls rocks in, before ship mass and flight speed are applied |
| `SHIELDS`, `MAX_SHIELDS`, `GRACE` | Shields a level starts with at least, the most a ship holds, and seconds of protection after losing one |
| `shieldDrops`, `DROPS_WITHIN`, `CHOICE_EVERY` | Shield drops per level, the share of the level they are spread over, and how often one arrives as a choice against crew |
| `WORM_WAITS` | The set of waits dealt to missed wormholes |
| `FIRST_RESCUE` | Parsecs into a run before the first planetoid appears |
| `rescueGap` | Seconds between stranded crews, per level |
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

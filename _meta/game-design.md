# Lightboat — design notes

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
- **Per mission.** Parsecs only multiply the crew of their own mission. Staying on mission 1 to pile up distance multiplies two seats and nothing saved later, so it buys little; distance is worth most where the ship carries more and flying is hardest.
- **Missed** crew are those who drifted off the bottom of the screen while the ship had a seat for them, and those thrown off the ship by a hit (see [Shields](#shields)). Crew who pass a ship with no free seat are never counted, and a full ship is sent none (see [A full ship sees no crew](#a-full-ship-sees-no-crew)). Each one counted takes a fixed share of the mission's score, the same in every ship (`missCost`): 5%, down to nothing. See [Crew left behind](#crew-left-behind) for why.
- **Lost with the ship.** If the ship is destroyed, the mission in flight scores nothing and the crew on board are lost with it. Everything banked by earlier missions is kept; nothing is taken off.
- **Parsecs** are pure distance. They grow faster as the level speeds up, so staying in a level after its wormhole has appeared keeps adding distance, at rising risk.

None of this is explained to the player. It is shown:

- **During a run** there is one big number at a time. With crew on board it is green with a plus, `+700`: what they are worth right now — this mission's parsecs × crew on board, less what the mission has missed — which is what the next wormhole will bank; it grows as the ship flies on and drops when a crew is missed. With the seats empty it is the score, in white. Before anything is banked and with nobody aboard there is no number at all, never a `0`. The number sits top left under `MISSION n/7`. Since the vector glow look (2026-11-20) `SAVED`, `MISSED` and the best score are not shown during play: they wait for the table between missions. The seats on the ship and the dots top right show who is on board and still at risk, and a thin bar along the foot of the field shows how far the mission's target is.
- **On the end screen** a table lists every mission played as a sum of its own — distance, crew saved, what the missed cost, score — and the run's score, which is those scores added up, is printed below it with the best right under it. Crew who were not saved have a section of their own, `NOT SAVED`: `3 WENT DOWN WITH THE SHIP` in orange if anyone did, and the number missed (see [Between levels](#between-levels)).

There is one best, the highest score, saved on the device together with how that run ended; the end screen shows `NEW BEST!` when it is beaten. Bests from before the seven-mission rules are not comparable and are not read.

### Leaderboard

When the game is connected to the cloud and the board has loaded, both end screens show a `LEADERBOARD` pill in the top left corner, mirroring `SHARE` on the right. A tap on it opens the leaderboard over the end screen and does not start a new run. The next tap, or Space, Enter or Escape, goes back to the end screen; that does not start a run either.

The leaderboard is `TOP SCORES`: the ten highest best scores, one global board for all time. Players are listed by callsign: two words and a number, generated from the player's anonymous account, so nobody types a name and the same account always keeps the same one. Under each callsign a small line names the mission that run reached, in the 00–06 naming (since 2026-11-22, the owner's choice; it was a count, `FINISHED 2/7`): `REACHED 02` for a run lost in mission 02 (level 3). A run that reached the last mission also says how it ended and the parsecs flown there: `REACHED 06 · HOME · 5,400 pc · 12 SEATS` for a run that went home, `REACHED 06 · LOST · 7,100 pc · 4 SEATS` for one destroyed in it. The seats are those of the ship chosen for mission 7 (see [The choice](#the-choice)); an entry saved before ships were recorded leaves them out. The board then tells how far each player got, who got out in time and in what. The player's own row is gold, which is also how they learn their callsign. A player outside the top ten gets an extra row with their rank. A player whose best is 0 is not listed.

The board starts again whenever scores stop being comparable: entries are ranked by a field whose name changes with the scoring (`best6` since the three ships of 2026-11-20; `best5` before it, from the ship numbers of the same day; `best4`, from the five ships of 2026-11-16; `best3` from the linear penalty of 2026-11-15; `best` and `bestScore` earlier), so entries that only hold an earlier score are not listed, and a player's first new entry replaces their old one. Nothing is deleted. The best kept on the device moves to a new key at the same time.

The board is refreshed when a run ends, and the player's row always uses the best the game holds right now. Offline, or before the first board has loaded, there is simply no pill.

### Sharing a run

Once the run on an end screen has been saved, a `SHARE` pill appears in the top right corner. A tap on it shares a link and does not start a new run; a tap anywhere else restarts as before. Where the device has no share sheet the link is copied and the pill reads `COPIED` for two seconds. Offline, or without the cloud, there is no pill.

Whoever opens the link gets the ordinary start screen with the shared run under the title: the callsign in gold, the score, and one line under it — `MADE IT HOME · N SAVED` for a run that went home, `N SAVED · D pc` for a lost one. The message that travels with the link leads with the crew saved and gives the score, not the distance.

## Shields

Each level starts with at least 3 shields (`SHIELDS`), and a ship holds at most 5 (`MAX_SHIELDS`). They are shown as arcs stacked ahead of the ship's nose. Until the vector glow look (2026-11-20) a row of arcs in the HUD repeated them; now the ship is the only place. There is no caption.

- **Taking a hit:** hitting a rock burns one shield — the outermost arc disappears — and throws one crew member off the ship, if anyone is aboard. The player sees the figure tumble away from the ship and fade, a seat go dark and the `MISSED` count move; there is no caption. That person counts as one missed, and the seat is free again, so the ship gets a little lighter. With nobody aboard a hit costs only the shield. Otherwise the run carries on where it is: same level, same parsecs, same speed. See [A hit costs a crew member](#a-hit-costs-a-crew-member) for why.
- **The rock that hit** is destroyed. Only asteroids hit: planetoids are harmless (see [Rescue missions](#rescue-missions)).
- **Getting clear:** the ship cannot be hit for 2 seconds (`GRACE`). The shields blink for that time, not the ship, and the arc that was just burnt flickers out beyond them. It can still pick up crew and enter the wormhole.
- **Refill:** entering a new level through the wormhole tops the shields up to 3. Spares above 3 are kept, so clean flying in missions 4 to 6 buys a better start in mission 7.
- **No shields left:** the ship flies bare, and the next hit destroys it and ends the run with the game-over screen.

### Shield drops

More shields can be found from mission 4 on. A drop is a glowing shield arc drifting down the field, the same shape as the arcs on the ship; flying through it adds a shield.

| Mission | Shields at the start | Drops |
|---|---|---|
| 1–3 | 3 | none |
| 4 | 3 | 2 |
| 5 | at least 3 | 6 |
| 6 | at least 3 | 4 |
| 7 | at least 3 | one beside every wormhole |

- **The same for everyone.** The count is fixed (`shieldDrops`), drops are spaced evenly by distance over the first two-thirds of the mission (`DROPS_WITHIN`), and only their position is random. A shield just before the refill would be worth nothing.
- **Mission 4 introduces them.** Its two drops come at a third and two-thirds of the way to the target, at the slow starting speed: the first is a plain shield, the second is the crew-or-shield row. A player meets both before mission 5, where the speed makes them matter, and can start mission 5 with a spare.
- **Fewer each mission from 5 on, on purpose.** Mission 5 teaches the higher speeds with a cushion; mission 7 leaves the ship nearly bare.
- **Shield or crew.** Every second drop (`CHOICE_EVERY`) arrives the way the two-crew pair does, as a choice in one fast row: 2 crew on one side, 3 crew on the other, and the shield in the middle between two small asteroids. The sides are too far apart to take both, and the corridor to the shield is narrow. The slow motion announces it. Which side has the 3 is random.
- **In mission 7** the only shields are the ones offered opposite each wormhole (see [Leaving a level](#leaving-a-level)).

## Levels

There are 7 levels. **The player knows them as missions:** everything on screen says `MISSION` — the counter in the corner (`MISSION 01/06`) and the results screen between them. The code and these notes keep the word level.

**Since 2026-11-22 the missions are named 00 to 06** (the owner's word), to match the moons m00n to m06n (see [Story](#story)). Built in the game as it is now: the counter in flight reads `MISSION 00/06` (the owner chose it over `MISSION 00` alone, which the Game Designer preferred because a fraction reads as progress), the stop's title `MISSION 01 COMPLETE`, the results tables name each row 00 to 06, and the board names the mission a run reached. In these notes "level" stays the code's count, 1 to 7, and a mission number from 1 to 7 means that level; mission 00 is level 1. The sections written before the rename are not renumbered.

| Level | Parsecs to fly | Starting speed | Shield drops | Ship choice after it |
|---|---|---|---|---|
| 1 | 500 | 1× | none | none: mission 2 is flown in the same ship |
| 2 | 750 | 1× | none | keep, or the next ship up |
| 3 | 1,250 | 1× | none | none |
| 4 | 2,000 | 1× | 2 | keep, or the next ship up |
| 5 | 2,500 | 1.4× | 6 | none |
| 6 | 3,000 | 1.8× | 4 | the fleet: any ship flown in this run |
| 7 | 3,500 to the first wormhole, then open | 2.2× | one beside every wormhole | — |

Missions 1–4 are the game most players play, about five minutes. Missions 5–7 are for competing; their lengths and starting speeds are starting values, to be tuned by playing.

- A level's goals are met once its parsec target is flown **and** at least 20 seconds have passed. The bar under the score shows progress towards the target.
- **One speed slope.** Speed follows progress, not the clock: from the level's starting speed it rises in a straight line with the parsecs flown and has gained 1.3× (`SPEED_GAIN`) at the level's target, whatever the level's length. Past the target it keeps rising at the same rate for as long as the ship stays on. There is no second gear and no ceiling: no mission levels off at a speed a player can survive for ever.
- **The mission does not decide the ship.** Parsecs, starting speed, shield drops, the wormhole rhythm and how many people a planetoid carries belong to the mission. Seats, size, steering and the cost of a missed crew member belong to the ship, which the player chooses between missions (see [Three ships](#three-ships)).
- Entering a new level delivers the crew on board: they are saved, the seats are emptied, and the score jumps.

### Crew make the ship heavy

Size and steering belong to the ship (see [The ships](#the-ships)): crew coming aboard change neither. What the crew change is the ship's mass.

- **Crew deepen the well and dig it sooner.** Each crew member adds 5% (`CREW_MASS`) to the ship's mass, which scales both the pull of the well dug while parked and how fast it forms: a full ship of 32 pulls 2.6 times as hard as an empty one and reaches full depth in 2.3 seconds, not 6 (see [Gravity](#gravity)).
- **A new ship grows into its size** in the first moments of the mission, not in one jump.
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

The screen between levels stays until the player taps (or presses Space or Enter); a tap in its first 0.7 seconds is ignored so a held thumb does not skip it. Nothing moves on and no distance is flown while it is up. After missions 2 to 6 the tap is also the choice of ship for the next mission (see [The choice](#the-choice)): the ships on offer stand under the table and there is no `TAP TO CONTINUE`. The next level then starts with at least 3 shields. The wormhole of mission 7 goes straight to the `MADE IT HOME` screen.

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

Later missions' planetoids carry more people, not more planetoids, so the sky stays sparse. This follows the mission, not the ship: a small ship in a late mission fills from one or two planetoids. A two-crew pair is always 1 and 2 people.


- **Capacity:** the ship takes only as many people as it has free seats; the rest stay on the planetoid. When the ship is full the rings of any planetoid still on the field turn grey and lose their `SOS` label, and no more planetoids are sent until a seat opens (see [A full ship sees no crew](#a-full-ship-sees-no-crew)); nothing spells out why.
- **The count.** `CREW n/N` is yellow while there are free seats, and so are the outlines of the empty pips; it turns green when the ship is full and swells for half a second as it does, so the change does not rest on colour alone. Yellow means a free seat and green means crew, everywhere in the HUD: the filled pips, the seat dots on the hull, the `SOS` rings and the pending score are all green.
- **Showing capacity:** seats are drawn on the ship's hull as dots that turn green as they fill (a free seat is an empty pale circle, a taken one a glowing green disc, so the two differ in shape as well as colour), and repeated top right as a `CREW n/N` count with one dot per seat under it. The pilot's glass is a small copy of the nose's own shape set inside it, and the block of seats sits midway between the glass and the tail. Every ship's seats are a full rectangle on the hull: 2 × 2, 2 × 4 and 3 × 4 (across × rows) for the three ships.

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
| Crew left behind | 10% each, down to nothing at ten | 5% each, down to nothing at twenty |
| Ship destroyed | The unfinished mission cost its parsecs × the crew aboard, taken off the banked score | The unfinished mission scores nothing; everything banked is kept |
| Speed past the target | The same slope up to 4.5×, then second gear up to 9× | One slope in every mission: no second gear, and no ceiling |
| A missed wormhole | Back after a random 15–30 seconds | Back after a wait dealt from a shuffled set |
| Shields | 3 per mission | Topped up every mission; drops on missions 4, 5 and 6; on mission 7 only by turning down the way home |
| Ship size and steering | From the mission number | From the ship, which the player chooses between missions |
| Frame time and field | Variable step, field sized from the window | Fixed step, fixed field |

### The missions

- **Missions 1–4** keep their lengths and take about five minutes. They are the whole game for most players. A player who always upgrades flies them with 2, 2, 4 and 8 seats.
- **Missions 5–7** are for competing. Each is longer than the last and starts faster, so each takes about two minutes to its target, as mission 4 does. Reaching mission 7 takes about nine minutes, and its first wormhole comes at about eleven.
- **What makes 5–7 harder:** longer missions, higher speeds from the first second, fewer shield drops each mission, and crew that make the ship heavier and deepen its well. New objects are decided after playing (see [New things in missions 5–7](#new-things-in-missions-57)).
- **Seats** are the ship's: 4, 6, 8, 12 or 18. About 21 people arrive before mission 7's first wormhole, so the 18-seat ship fills only near the end of that stretch: until then every crew member left behind is the player's own miss, and every rescue both raises the multiplier and avoids a penalty. A smaller ship fills sooner, and is then sent no crew.

### Crew left behind

A mission's score is parsecs × crew saved, less a share for the crew left behind. Each crew member left behind takes 5% of that mission's score, in every ship and every mission, and a mission is worth nothing at 20 missed.

- **One figure, on the owner's word** (2026-11-20, 0.4.2). From 0.3.2 the cost fell in the late missions, and from 0.4.0 in the two biggest ships (3% and 1.5%), so that missing as many crew as the ship seats cost about half the mission. That was set for 16 and 32 seats. Since 0.4.2 the cost is 5% everywhere again.
- **What it means for the bigger ships.** A missed shipful costs 20% of the mission in the 4-seater, 40% in the 8-seater and 60% in the 12-seater, and a hit costs 5% plus the seat and the shield. Misses weigh more in the ships with more seats to miss, which is one more reason to stop climbing. Flown by the scripted pilot at a flat 5%, this is what made the 18-seater of 0.4.2 never worth taking (see [Fewer ships, and other stops](#fewer-ships-and-other-stops)).
- **The earlier worry.** A run on 0.2.0 scored under a flat 5% lost 75% of mission 6 with 15 missed out of 24 seats. To watch for when playing.
- **The penalty punishes mistakes, not time.** A mission cannot end before its target, the first wormhole appears as soon as the target is flown, and a full ship is sent no crew, so waiting adds no misses.
- **Mission 7 must stay worth something,** or there is no choice between going home and staying.
- **Why not a cap.** A cap turns "worth nothing" into a fixed tax, and every miss beyond it is free: the fault the 75% cap had.
- **Still simple to read.** It is linear and has no floor other than nothing. The results table prints the count and the share, `3 (−15%)`, and the score is worked out from the figure that is printed.
- **Hits.** Crew thrown off by a hit count as missed, at the same 5%.
- **In code** it is `missCost(ship)` in `tuning.ts`: the same figure for every ship, kept per ship so that it can be tuned.

### Staying on

Staying in a mission after its target is flown is still a gamble, but its shape changed with the two rules above.

- **With free seats** it can pay: planetoids keep coming, every rescue raises the multiplier, and every parsec multiplies the crew aboard. Every planetoid not taken is a real miss.
- **With a full ship** nothing drifts past and nothing is charged. Parsecs keep multiplying a full crew, so the score only climbs, and what it costs is risk: speed keeps rising, every hit throws a crew member off and takes 5% off that mission's score, and losing the ship loses the whole mission. A ship that is hit turns yellow and has to fill up again while the speed rises. Arriving home with a full ship is the skill.
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

Shield drops used to be a parked idea, because they made the game easier and rewarded staying on. Both are now intended: the count is fixed and falls each mission from 5 on, and in mission 7 staying on is the game.

For the crew-or-shield choice to be a choice the ship must not be full when it comes, so the ship must have a free seat: a ship that is full when the row is due gets it as a plain shield. With the small ships this now happens often in the late missions. As built, the shield is always the middle of the three and the crews are on the sides; that keeps the two crews too far apart to take both.

### Crew weight

Before, crew weighed almost nothing: each person added 0.02 to a mass of 1.0–1.7 that came from the mission number, and mass counted only for the well dug while parked. Size and steering came from two per-mission tables, which hit a ceiling at missions 5 and 9. Both tables are gone. Since 0.4.0 size and steering are the ship's own (see [The ships](#the-ships)); crew add only mass.

### New things in missions 5–7

**Decided after playing, and not built.** The seven missions are built with only what missions 1–4 already teach. New objects are added only if missions 5–7 then feel thin. The candidates, from the earlier plan:

- **Dead stars:** a dark point with a fixed, deep well around it that pulls the ship as well as the asteroids. The grid already shows wells, so it needs nothing new on screen.
- **Failing rescues:** on some planetoids the `SOS` ring shrinks over time. When it closes, the crew are missed.
- **Wrecked stations:** larger than a planetoid, just as harmless, carrying 4–8 people. In mission 7 they would fill the biggest ship sooner than intended, so they would replace planetoids, not add to them.
- **Angled asteroids:** some cross the screen at an angle instead of falling straight.
- **A wormhole that drifts sideways:** the least likely to return, because it clashes with a shield placed evenly opposite the wormhole in mission 7.

### The global board

One board of best scores, for all time.

- **When the choice to go home bites:** when the run in hand is already ahead of the player's own best. A run below it has nothing to lose, which is how a record chase works.
- **Players will gamble deeper than the model says,** because a failed attempt costs only that run. The wait between wormholes is tuned from what players do on runs that are ahead of their best.
- **Each row names the mission the run reached** (in the 00–06 naming since 2026-11-22; it was a count, `FINISHED 6/7`), and for a run that reached the last mission how it ended and how far it went there, for example `REACHED 06 · HOME · 5,400 pc` or `REACHED 06 · LOST · 7,100 pc`. The board then tells who got out in time.

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
- **What a crew member left behind costs** (5% in every ship), whether the big ships need less, and whether a mission should be able to fall to nothing.
- **The three ships' seats, sizes and steering,** and everything under [What has to hold](#what-has-to-hold-to-check-by-playing). The numbers are the third set, chosen with a scripted pilot (see [Three ships](#three-ships)); no person has played them.
- **Two-crew pairs in the clumsy ships.** The gap between the two rows grows as steering slows, up to a ceiling of 240 field units. By the formula the 12-seater reaches the ceiling at about 3.0× speed and the 8-seater at about 3.5×, which is late in missions 6 and 7; faster than that, saving both is harder than in the 4-seater.
- **Whether staying on with a full ship pays too easily,** now that it costs only risk (see [Staying on](#staying-on)).
- **The wait before planetoids return** after a seat opens (`SEAT_WAIT`, 4 seconds).
- **Whether a hit costing a crew member is too harsh on mission 1,** where one person is a quarter of the seats.
- **The set of wormhole waits.**
- **How many shield drops arrive as a choice** between crew and a shield. Half of them is built: 1 of the 2 on mission 4, 3 of the 6 on mission 5 and 2 of the 4 on mission 6.
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
- **Leaderboard entries** hold `best6`, `bestOutcome`, `bestLevel`, `bestFinal` and `bestShip`. The earlier `best5`, `best4`, `best3`, `best` and `bestScore` fields are neither read nor written, which is what starts the board again.
- **Saved bests on the device** use new storage keys, so a best from the earlier rules is not uploaded to the new board.
- **End screen and share text:** `ALL MISSIONS COMPLETE` became `MADE IT HOME`, on the end screen, in the line under a shared run and in the share message.
- **Golden traces** were re-recorded: every change above alters missions 1–4 too.

## Five ships and a choice between missions

Agreed on 2026-11-15 and built the same day (0.4.0). The ships' seats, sizes and steering were replaced on 2026-11-20 (0.4.2); why is in [Ship numbers that make stopping a choice](#ship-numbers-that-make-stopping-a-choice). Later that day the five ships became three with two stops: see [Three ships](#three-ships). **The ship table and the stops in this section are those of 0.4.2 and are kept as history;** the picker, the fleet screen and what follows the ship are as built today. Every number here is *to tune* by playing: none of it has been played by a person yet.

Seats are the multiplier, and a small ship is nimble. Until 0.4.0 the mission decided which the player got. Now the player decides, mission by mission: take the bigger ship, or keep the small one and fly further in it. Every run starts in the smallest ship and nothing is unlocked from one run to the next, so the board stays a board of skill.

### The five ships

As in 0.4.2; today's ships are in [The ships](#the-ships).

| Ship | Seats | Seat grid | Size (radius) | Steering | A crew member left behind costs |
|---|---|---|---|---|---|
| 1 | 4 | 2 × 2 | 13 | 100% | 5% |
| 2 | 6 | 2 × 3 | 15 | 90% | 5% |
| 3 | 8 | 2 × 4 | 18 | 78% | 5% |
| 4 | 12 | 3 × 4 | 22 | 64% | 5% |
| 5 | 18 | 3 × 6 | 27 | 50% | 5% |

In 0.4.0 and 0.4.1 the ships had 2, 4, 8, 16 and 32 seats, radius 13 to 23, and steering from 100% down to 60% in even steps.

- **Each upgrade adds about half again the crew,** and the big ships are much clumsier. With doubled seats the bigger ship was always right.
- **Size and steering belong to the ship.** Steering no longer comes from the crew on board, so the player gets exactly what the picker shows. Crew on board still deepen the well and dig it sooner (`CREW_MASS`).
- **Big differences in size and steering, on purpose.** Before the ships, a step up the seven per-mission ships added 5–10% in size, and the steering depended only on the crew aboard.
- **Every seat grid is a complete rectangle** (seats across × rows). Before, the front rows of missions 4, 6 and 7 were part-filled and set to the left.
- **In code:** `shipSeats`, `shipGrid`, `shipRadius`, `handling` and `missCost` in `tuning.ts`, all keyed by the ship.

### The choice

As in 0.4.2; today's stops are in [The stops](#the-stops).

| Stop | What the player sees |
|---|---|
| After mission 1 | The results, as today |
| After missions 2, 3, 4 and 5 | The results, and a choice: keep the ship, or take the next one up |
| After mission 6 | The results, and the fleet: any ship flown in this run |

- **One step at a time, and no going back** until the fleet before mission 7.
- **A declined upgrade is gone for the run.** There are four stops and four steps, so declining once puts ship 5 out of reach for that run. That gives declining a lasting cost.
- **Missions 1 and 2 are both flown in ship 1.** A player who always upgrades flies 4, 4, 6, 8, 12 and 18 seats in missions 1–6.
- **Mission 7 is flown in any ship the run has flown,** a smaller one included. A run that never upgraded has one ship, so it gets no choice there.

### How it is shown

- **No extra screen.** The results screen between missions already waits for a tap. The two ships stand side by side under the table, the current one on the left and the next one on the right, each in a frame. A tap anywhere on the left half of the field keeps the ship; a tap on the right half upgrades. Those are the two inputs the player already has. On a keyboard, the left and right arrows; Space and Enter do nothing there, so nobody declines or upgrades by habit.
- **No caption and no prompt.** More seat dots and a bigger hull say what the choice is. The ships are drawn at one scale and stand on one line, without a flame. The frames breathe once a tap counts, after the usual 0.7 seconds.
- **The fleet** before mission 7 is the ships flown in this run in a row, smallest on the left, each in its own share of the field's width; a tap in a ship's column chooses it. The ship in use has the heavy white frame. On a keyboard the arrows move that mark and Space or Enter chooses.
- **It fits.** After mission 6 the six rows, the total and the row of ships end above the ship waiting at the foot of the field.
- The early stops have an obvious answer and teach the picker before it matters.

### What follows the ship, and what stays with the mission

- **With the ship:** seats, size and steering. What a crew member left behind costs is 5% in every ship (see [Crew left behind](#crew-left-behind)).
- **With the mission:** parsecs, starting speed, shield drops, the wormhole rhythm, and how many people a planetoid carries. So a small ship in a late mission fills from one or two planetoids, in about 20 seconds, and then meets none.

### Why

- **The score already trades the two evenly:** 6 seats over 5,000 parsecs is 12 seats over 2,500.
- **A full ship that stays on is charged nothing** (see [Staying on](#staying-on)), so flying further is how the nimble ship scores.
- **Mission 7 gets a real loadout decision.** About 22 crew arrive before its first way home. That is more than the 12-seater holds, so a pilot who misses few flies the last stretch with a full ship.

### What has to hold, to check by playing

- **Declining is sometimes right.** A decline lowers the crew ceiling for the rest of the run by one ship. If nobody ever declines at a stop, the ships differ too little there.
- **No ship is always best in mission 7.**
- **A small ship in a late mission is still a game.** Once it is full there are no planetoids, only rocks, until a hit opens a seat.
- **Mission 1 never fills its ship:** it offers two or three single crew and ship 1 seats four, so `CREW n/4` stays yellow there.

### What it touched

- **The game state** holds the ship in use (`shipType`) and, in the fleet, the ship marked (`pick`). The biggest ship reached needs no field: the fleet is the ships in the run's results. `offer` in `game.ts` says which ships a stop offers; `tryStart` and `chooseSide` in `simulation.ts` take the answer.
- **The choice is an input.** Each mission's result carries its ship, and a saved run carries the list (`ships`, one per mission reached) and the ship it ended in (`ship`). With the seed, that list says what was played. The Firestore rules require both and check that every run starts in ship 1.
- **The board row** of a run that reached mission 7 names the seats of the ship it flew there; the entry stores it as `bestShip` (0 when not recorded).
- **Scores changed.** The same flying scores differently than under 0.3.x. Whether the board starts again is the player-owner's call; as deployed it was not restarted.

## Ship numbers that make stopping a choice

Agreed and built on 2026-11-20 (0.4.2). It replaced the seats, sizes and steering of the five ships; the stops, the picker and the fleet stayed as built. The same day's measurements under a flat 5% led to [Three ships](#three-ships), which replaced these numbers; this section is kept for the measurements.

### What was wrong with 0.4.1

Tested with a scripted pilot flying whole runs of the 0.4.1 code from a seed, 200–300 runs per strategy at three skill levels (expert, strong, average).

- **The first three upgrades were forced.** Stopping at 8 seats scored 66% of the best for an expert and 74% for a strong pilot; stopping at 4 seats, 39% and 47%.
- **The nimble ship that flies further did not exist.** Never upgrading scored 16% of the best, and staying on in a small ship scored less than leaving on time.
- **Only the last step was a decision:** 16 seats and 32 seats were within 5% of each other.
- **Why.** Doubling the seats is worth more than agility buys (the expert got home 89% of the time in the 32-seater and 97% in the 8-seater), and parsecs cannot be doubled cheaply, because speed gains 1.3× over every target length.
- **Declining late always beats declining early:** the bigger multipliers are kept for longer and the ceiling is the same. So the real decision is where to stop climbing.

### The numbers

| Ship | Seats | Seat grid | Size (radius) | Steering | A crew member left behind costs |
|---|---|---|---|---|---|
| 1 | 4 | 2 × 2 | 13 | 100% | 5% |
| 2 | 6 | 2 × 3 | 15 | 90% | 5% |
| 3 | 8 | 2 × 4 | 18 | 78% | 5% |
| 4 | 12 | 3 × 4 | 22 | 64% | 5% |
| 5 | 18 | 3 × 6 | 27 | 50% | 5% |

- **A crew member left behind costs 5% in every ship,** on the owner's word (see [Crew left behind](#crew-left-behind)).
- **Seats grow by about half** from ship to ship, not double.
- **The big ships are clumsier** than in 0.4.1 (radius 20 and 23, steering 70% and 60%).
- **Both are needed.** Flatter seats alone left stopping at ship 3 at 85%; clumsier ships alone, at 78%.

### What the pilot scored with them

Flown with the numbers as built, 5% for every ship. The best score from stopping at each ship, as a share of the best in the row:

| Pilot | Stop at ship 5 (18 seats) | Ship 4 (12) | Ship 3 (8) | Ship 2 (6) | Ship 1 (4) |
|---|---|---|---|---|---|
| Expert | 87% | 100% | 100% | 85% | 61% |
| Strong | 70% | 91% | 100% | 87% | 68% |
| Average | 75% | 80% | 100% | 93% | 72% |

- **Two plans compete at the top.** For the expert: stop at 8 seats and stay on from mission 4 (116,000, home 92% of the time), or stop at 12 seats and do the same (115,500, home 68%).
- **The 18-seater is never the best pick.** It costs the expert 13% and the others 25–30%. At 5% each, a ship that seats more and is hit more loses more to misses, on top of being clumsier.
- **The best ship no longer moves with skill:** 8 seats for the average and the strong pilot, 8 or 12 for the expert.
- **The cost of a missed crew member decides this.** With 4% and 2.8% for ships 4 and 5 the three biggest ships were within 2% for the expert; with 3% and 1.5% the 18-seater was the expert's best, the 12-seater the strong pilot's and the 8-seater the average pilot's.

### Fewer ships, and other stops

Flown the same day with 5% for every ship, to see whether five ships are needed:

| Setup | Expert: 18 / 12 / 8 seats | Strong | Average |
|---|---|---|---|
| Five ships, offers after missions 2, 3, 4, 5 (as built) | 87 / 100 / 100% | 70 / 91 / 100% | 75 / 80 / 100% |
| Four ships (4, 8, 12, 18), offers after 2, 4, 5 | 90 / 99 / 100% | 71 / 92 / 100% | 78 / 83 / 100% |
| Four ships, offers after 2 and 4, the next ship offered with the fleet after 6 | 94 / 99 / 100% | 92 / 92 / 100% | 83 / 83 / 100% |
| Three ships (8, 12, 18), offers after 4 and 5 | 88 / 100 / 98% | 73 / 96 / 100% | 80 / 89 / 100% |

- **The 6-seater adds nothing.** Four ships give the same decisions as five.
- **Offers after 2, 4 and 6** keep the biggest ship for mission 7 only, so picking it wrongly costs less.
- **Three ships starting at 8 seats** cost the casual game little: the average pilot finished mission 4 in 45% of runs against 49%, which is within the noise. What they lose is the obvious first upgrade that teaches the picker, and the ship growing in the first five minutes.
- **Three ships of 4, 8 and 16 seats** leave no choice: the 8-seater wins at every level.

**Gentler big ships do not rescue the 18-seater.** Four ships on the 2, 4, 6 rhythm were flown again with the sizes and steering of 0.4.1 (radius 13, 17.5, 20, 23; steering 100, 80, 70, 60%), still at 5% each:

| Pilot | 12 seats, best plan | 8 seats, best plan | Flying the 18-seater in mission 7 |
|---|---|---|---|
| Expert | 133,900 (staying on from mission 4, home 82%) | 121,000 (the same, home 95%) | 114,900, against 115,000 for the 12-seater flown the same way |
| Strong | 69,000 (leaving on time, home 35%) | 69,500 (leaving on time, home 68%) | 63,100, against 69,000 |
| Average | 20,000 | 21,900 | 20,000, the same |

- **Why.** A full ship is sent no crew, so a small ship that fills early is out of reach of the miss cost for the rest of the mission. A ship with more seats stays open to it longer, and at a flat 5% that costs more than the extra seats earn.
- **With these gentler numbers the 8- and 12-seaters make a real pair:** the best ship is 8 seats for the average pilot, either for the strong one (the 12-seater scores the same and gets home half as often), and 12 for the expert.
- **So under a flat 5% the ladder that works is three ships: 4, 8 and 12 seats,** with the gentler sizes and steering, offers after missions 2 and 4, and the fleet after mission 6. One obvious upgrade teaches the picker; the second is a decision.

### What it costs, and what is not known

- **Scores fall by about 20%,** and are not comparable with those on the board. Whether the board starts again is the player-owner's call.
- **The board started again with these numbers** (`best5`), so rows of 0.4.1 runs, whose stored ship number would now name different seats, are no longer listed.
- **Ship 1 has 4 seats** and mission 1 offers two or three crew, so its count never turns green there.
- **The first two upgrades stay obvious.**
- **Two-crew pairs are harder in ships 4 and 5 at speed** (see [Still open](#still-open)).
- **The saved-crew label crosses the ship frames for a moment.** `18 SAVED` rises from the bigger hull through the foot of the frames for about a second after a wormhole.
- **A pilot is not a person.** It never parks to dig a well and flies every mission the same way. Differences under about 3% are noise. Also tried and not taken: a flatter top alone (2, 4, 8, 14, 24), and half the speed slope past the target, which raised every score by about 12% and left the spread as it was.

## Three ships

Agreed on 2026-11-20 and built the same day, not yet deployed. It replaces the five ships of 0.4.2 with three and halves the stops. The picker, the fleet and the 5% for a crew member left behind stay as built. The measurements behind it are in [Fewer ships, and other stops](#fewer-ships-and-other-stops).

### The ships

| Ship | Seats | Seat grid | Size (radius) | Steering | A crew member left behind costs |
|---|---|---|---|---|---|
| 1 | 4 | 2 × 2 | 13 | 100% | 5% |
| 2 | 8 | 2 × 4 | 17.5 | 80% | 5% |
| 3 | 12 | 3 × 4 | 20 | 70% | 5% |

- **The 6-seater and the 18-seater are gone.** The 6-seater added no decision, and at 5% each the 18-seater was never the best pick at any skill level.
- **The 8- and 12-seaters are gentler** than in 0.4.2, where they were radius 18 and 22 with steering 78% and 64%. These are the size and steering 0.4.1 gave its third and fourth ships.
- **In code:** `SHIPS` is 3 and `shipSeats`, `shipGrid`, `shipRadius`, `handling` and `missCost` in `tuning.ts` hold three entries each.

### The stops

| Stop | What the player sees |
|---|---|
| After missions 1, 3 and 5 | The results, and `TAP TO CONTINUE` |
| After missions 2 and 4 | The results, and a choice: keep the ship, or take the next one up |
| After mission 6 | The results, and the fleet: any ship flown in this run |

- **The stops have their own list,** `CHOICES = [2, 4]` in `tuning.ts`; `offer` in `game.ts` offers the next ship up only there. It replaces `FIRST_CHOICE`, which offered at every stop from mission 2 on.
- **A player who always upgrades** flies 4, 4, 8, 8, 12 and 12 seats in missions 1–6, then chooses among all three for mission 7.
- **A declined upgrade is still gone for the run:** two stops, two steps. A player who declines after mission 2 is offered the 8-seater again after mission 4, and the 12-seater is then out of reach.
- **The fleet holds at most three ships** and offers nothing new: one column each, so a third of the width for three ships and a half for two.
- **The picker, the fleet screen and everything after the mission are unchanged.** With fewer ships on offer the cards are drawn a little larger.

### Why

- **One obvious upgrade, one decision.** The step to 8 seats after mission 2 teaches the picker. The step to 12 after mission 4 is the one that depends on the player: the pilot's best ship was 8 seats at average skill, either at strong skill, and 12 for the expert.
- **Risk against score.** For the strong pilot the 12-seater scored the same as the 8-seater and got home half as often (35% against 68%), with a higher top end.
- **Staying on stays a second axis.** The expert in the 12-seater scored 133,900 staying on from mission 4 (home 82%) and 115,000 leaving on time (home 98%).

### What it touched

- **The Firestore rules** accept ships 1–3 in a run's `ships` and `bestShip` 0–3 on a board entry. A 0.4.2 client still running on someone's phone can no longer save a run flown in ships 4 or 5.
- **The board starts again** (`best6`, and the best on the device moves to the `-v6` keys), on the player-owner's word. Stored ship numbers changed meaning (ship 2 was 6 seats and is now 8, ship 3 was 8 and is now 12), so a 0.4.2 row would have named the wrong seats. Those rows are no longer listed; nothing is deleted, and a player's first new entry replaces their old one.
- **Scores rise** and are not comparable with 0.4.2: the expert's best plan scored 133,900 against 116,000.
- **Golden traces** were recorded again. The mission run first differs on the stop after mission 2, where the offered ship is now the 8-seater; the other three runs never reach a stop and are unchanged.
- **Tests:** TUNE-02 to TUNE-04, SHIP-02 to SHIP-09, SHIP-11, HUD-15, HUD-16 and RULES-10 describe three ships. Older tests that named ships 4 and 5, or ship 2 as 6 seats, were moved onto the new ships without changing what they check.

### What is not known

- **It was measured inside the four-ship run,** as the plans that never take the 18-seater. That is the same game as this ladder, but the ladder has not been flown as its own setup.
- **Nobody has played it.** The pilot never parks to dig a well and flies every mission the same way. The stop screens were checked by drawing them with the game's own code, not on a phone.

## Sound and effects

Asked for by the owner on 2026-11-20. Step 1 of the [order of work](#order-of-work), the sound effects and the mute control, is built and live since 0.4.5; the rest is a proposal.

### What the game did before sound

| Event | On screen | On a phone that vibrates |
|---|---|---|
| Crew saved | Green dots fly from the planetoid to the ship, and `×n` rises | Short buzz |
| Ship full | The crew count turns green and pulses | Nothing |
| Crew left behind | Only the `MISSED` count changes | Nothing |
| Hit by a rock | Sparks, the screen shakes, a crew member tumbles away, the shields blink | Double buzz |
| Shield picked up | Cyan sparks | Short buzz |
| Two crews, or a crew-or-shield row | Slow motion | Nothing |
| Wormhole appears | The wormhole itself | Nothing |
| Wormhole entered, next mission | A violet flash over the field | Double buzz |
| Ship destroyed | Sparks and a longer shake | Long buzz |
| Made it home | A violet flash | Longest buzz |
| Speed rising | The stars stretch | Nothing |

- **The costliest event is silent.** A crew member left behind takes 5% of the mission and shows only as a digit changing in the corner.
- **Nothing announces a wormhole,** which appears at the top of the field while the player watches the rocks near the ship.

### Rules for every sound and effect

- **They say what happened, with no words.** A sound or an effect that needs a caption is the wrong one (see [Principle: show, don't tell](#principle-show-dont-tell)).
- **They never change the deal.** Today's sparks, the crew beam and the engine flame are made inside the simulation and draw from the seeded numbers. That is the same on every device, but a new effect made the same way would change every run dealt after it and the golden traces. New effects are made in the drawing code with `Math.random`, and sound is played from events the simulation reports.
- **Nothing hides a rock.** No effect is brighter than a rock's outline or drawn over one, and no sound masks the hit.
- **Everything works with the sound off.** Each event is still readable on screen. Many people play a phone in silence.
- **The look is on trial.** A "vector glow" look is being tried on its own branch; effects are drawn in whichever look is kept, so they wait for that choice.

### Sound effects

Two sets, both built. **v2** is what the game plays once Tone.js has loaded, a moment after the first tap: every event on copies of the soundtrack's own instruments, on notes of the chord the music is on. **v1**, the first set, plays until then, so the effects are never silent, and stays for comparison on the listening page ("Keep current SFX as v.1", the owner's word).

#### v2 · on the soundtrack's instruments

Built on 2026-11-21 and live since 0.4.8, from the sketch the owner approved after listening ("Yes, send v2"). What each event plays is in `src/audio/scored.ts` (no audio needed, so it is tested); the instruments are in `src/music/effects.ts`. They are separate copies of the music's pad, bass, kick, snare, hat, arpeggio and lead, plus a sine bell for the save, on the effects' own output (0.5, with a small reverb of 2.2 s). So a sound is the same whichever music layers are in, and with the music switched off.

The chord is the one the music is playing at that moment; with the music not loaded, switched off or silent, it is A minor. "Root" and "fifth" are that chord's notes in the octave nearest the target the sketch gives.

| Event | Sound as built |
|---|---|
| Crew saved | The chord itself on the bell, 0.22 s, one inversion higher for each seat. The 4- and 8-seaters start an octave above the pad, the 12-seater at the pad's octave, so every ship's last seat ends near the same top. Several at once roll 60 ms apart |
| Ship full | The pad plays the chord's voicing an octave up for 0.5 s, and the lead holds the root on top for 0.6 s. It starts 0.12 s after the last save |
| Crew left behind | Since 2026-11-21, "sad piano notes" (the owner): for each crew member two notes on the lead's piano (its own instance on the effects' output, −3 dB, a 0.5 send to their reverb, no echo), the first for 0.2 s, the second 0.16 s later and held 0.7 s, a step lower; the pairs step down the A-minor scale, F5–E5, D5–C5, B4–A4, a fourth starting again an octave lower, 0.32 s apart. Fixed in the key, not the chord: the falling half step sits over all four. Each event starts again from F–E. A crew member thrown off by a hit has no cue of their own since 2026-11-21: the hit's chord marks it (they still count as missed) |
| Hit by a rock | Since 2026-11-21, to stand out from the drums (the owner: a chord, not the lead's dropping note): the pad stabs the chord's root, fifth and octave, lower, longer and louder for a bigger rock (radius 14 to 50: rooted nearest MIDI 52, 0.2 s, velocity 0.7, down to nearest 45, 0.45 s, velocity 1; the target moves with the radius and the root is the nearest to it); the bass an octave under it slides down 5 semitones over the same length (velocity 0.5 to 0.8); the shield cracks on the arpeggio, from the root nearest MIDI 93 down two octaves in 0.09 s, 0.02 s after the hit, over before the last-shield warning. No kick or snare |
| The last shield taken | The same, with two arpeggio notes falling a fifth, at 0.12 and 0.24 s |
| Shield picked up | The arpeggio's root, fifth and octave, 0.06 s apart |
| Wormhole on the field | The bass on the root for 0.35 s with a soft kick under it, every 0.9 s, from quiet at the top of the field to loud near the ship |
| Wormhole entered | Ten chord notes climbing on the arpeggio, 0.055 s apart and growing louder, while the lead slides two octaves up; it cuts what is still playing |
| Ship destroyed | Since 2026-11-21, "basically the sound of a hit" (the owner): the biggest hit, held, the pad's root, fifth and octave rooted nearest MIDI 45 for 0.9 s and the bass an octave under it sliding down an octave over 1.1 s at velocity 0.8, with no shield crack; it cuts what is still playing, and the music fades out under it into the game-over bass |
| Made it home | The whole band on A major: the pad, the bass on A, a roll up the arpeggio and the lead on high A |
| Keep or upgrade, fleet | A hat tick and one arpeggio note: ship 1 the root, ship 2 five semitones lower, ship 3 two octaves lower; moving the fleet's mark is quieter |
| Slow motion | Every v2 sound plays lower by the music's whole semitones (up to 5), so it stays in tune with it |

- **Nothing on the beat.** The sketch could make the slower sounds wait for the next eighth note; that is off, as the owner has not chosen it.
- **Two fixes over the sketch.** The kick's and snare's decay are set for every trigger, so a pulse after an explosion gets its own short kick. No instrument starts two notes at the same instant: each start is at least 30 ms after the last (60 ms for the bell).
- **Settled 2026-11-21:** a hit was being taken for the drum beat, so it became a chord. **Still open:** whether the wormhole's pulse is taken for the bass line.

#### v1 · the set before

Built on 2026-11-20 with the Web Audio API, no files: each sound is a handful of numbers in `SOUNDS` in `src/audio/sounds.ts`, with `SAVE_STEP`, `MISSED_GAP`, `HIT`, `CLICK_PITCH`, `PULSE` and `MASTER`. A square blip per crew member saved, climbing a whole tone per seat; a major chord when the ship fills; a low falling note per crew member left behind or thrown off; a noise burst and thud sized by the rock, with a crackle for the shield and warning beeps on the last; a rising sweep for a shield; a low pulse for a wormhole; a sweep up into it; an explosion that closes into a rumble; a held chord for home; a click per ship chosen. Slow motion lowers its sounds by the game's time scale.

#### For both

- **The deal does not change.** The simulation only appends events (`src/game/events.ts`); it never reads them back, and they draw nothing from the seeded numbers. The sound code reads the events, the slow motion, where the wormhole is and the music's chord, and writes nothing back. The golden traces are unchanged.
- **Trying them by ear:** `npm run dev` and open `/audition.html`, which has a button for every event and a switch between v2 and v1. Start the music's run there to hear v2 on chords other than A minor. In the game itself, `__sound.play('save')` and `__sound.event({ kind: 'missed', count: 3 })` in the console play v1's sounds.

### Music

Built on 2026-11-21 and live since 0.4.8. Made in code with Tone.js (`tone` 15.1.22, MIT), on the owner's word, from the sketch the owner listened to: no audio files. Every musical number is the sketch's, carried over as it was, in one place: `src/music/score.ts`. The sketch is kept in `_meta/sound-page.html`: the music, the lead's melody editor and every sound effect on one page, to open in a browser and tune by ear before a change is built.

- **The start screen and the fly-in** (2026-11-21, the owner's word): the start screen is silent until the note is tapped there; that tap starts the whole soundtrack at 96 BPM (`MUSIC.menuBpm`; the owner asked for it slower than the first 110, and confirmed 96 after hearing it on the sound page) with the pad's filter as bright as at 2× (`MUSIC.menuSpeed`), with every layer whatever its speed threshold, each still waiting its turn: pad, bass and drums at bar 1, the arpeggio at bar 5, the lead at bar 9 on its first turn, then its 32 bars, pause and turns as in a run; no sixteenth hats, which follow the run's speed (the owner's word; it replaced the pad-alone drone of 0.4.9, a brief 2.8× and then a 2× without the lead) instead of switching the music off, and switches it on if it was off. Every mission starts with the ship flying in from below the field for 1.2 s, at the centre and perfectly straight, every time: nothing of the last mission's position, drift or bank is kept, and its gravity well starts afresh (the owner's word, 2026-11-21); nothing of the mission runs until it arrives. The music starts with the first mission's fly-in, so Tone.js loads and the soundtrack and effects come up under it, and music already playing carries on into the run, its layers leaving at their chord changes as the speed drops to the run's. The note and the speaker are on every screen that waits for a tap: the start screen, the stops between missions and the end screens, where they sit in the bottom right corner.
- **One synthwave loop** in A minor, Am–F–C–G two bars each. The game's save and home chords are C major, so the music shares their notes.
- **Layers by speed** (`g.speed`): the pad always; the bass from 1.3× in mission 1, and from mission 2 on from the start of the mission, whatever the speed: it comes in at the first bar line instead of waiting for a chord change (the owner's word; `MUSIC.bassFromMission`). The drums from 1.7×, the arpeggio from 2.0×, sixteenth-note hats from 2.8×. A layer comes in or leaves only at a chord change, every two bars, and leaves only 0.05× below where it came in, so it does not flicker. The pad and bass duck under the kick.
- **Each layer waits for the one under it** (the owner's word, 2026-11-21): the arpeggio comes in only after the drums have played at least 4 bars, and the lead only after the arpeggio has played at least 4 bars (`MUSIC.layerWait`). From a standstill at full speed, and on the start screen: drums at bar 1, arpeggio at bar 5, lead at bar 9.
- **The lead comes in last.** A slow melody on top, sixteen bars in two halves, in A4–G5, as the owner wrote it in the sketch's melody editor; the first half ends on four half-bar notes, D5 C5 B4 C5 (rewritten by the owner on 2026-11-21 after 0.4.11, in place of a held D5 with B4 and G4), and the second on a held D5. **It is a piano, and its entries take turns** (the owner's word, 2026-11-21, after trying piano, guitar and violin: "Use the piano, scratch everything else"). The piano is synthesized: a string tone with eight harmonics that rings on (the harmonics are what make it audible in the low octave), under a short bright FM hammer strike, with no glide, so notes ring over each other. Its body is at −4 dB and its hammer at −10 dB, balanced on a meter against the other layers (the owner: "balance lead volume with other tracks"), and confirmed by ear on the sound page; it had been the loudest layer by 3 dB. Each time the melody is played through (16 bars) takes the next of three turns (`MUSIC.leadTurns`; the owner's word, 2026-11-21, read per pass after the first build played the low octave twice in a row): two octaves down (A2–G3) through the long reverb (an echo of three quarters of a beat into a 7 s hall), then one octave down (A3–G4) through the longer echo (repeats one and a half beats apart that take long to die, into a 3 s room, 1 dB up to match), twice, then round again. A 32-bar stretch is two passes, so stretches go 1 2, then 3 1, then 2 3; a pass cut short by the lead leaving still counts. The count carries across missions and the start screen, and each run starts at the first turn. It is never played as written in A4–G5 any more. **The melody starts from its first bar whenever the lead comes in** (a fix, 2026-11-21: it used to follow the loop, so an entry at the loop's second half began mid-melody and the fade landed on its bars 7–8); so the fade falls on bars 15–16 of the second time through, as the owner asked. Both chains are built when the music loads and stay up, so one pass's tail rings on into the next. **The echoes keep time with the music** (the owner: the fixed echoes sounded strange at 96 BPM, better pulsing as at 110), changed on the tempo's 0.5 BPM steps like the arpeggio's, with room for 2.5 s. Crew left behind plays on a copy of this piano since 2026-11-21; ship full, entering a wormhole and made it home still borrow the old synth lead's voice: the owner has not asked for them to change. **To check on a phone:** two convolution reverbs (7 s and 3 s) are new work for its audio thread; listen for crackle and watch the frame-rate reading. It needs 2.2×, the arpeggio having played at least 4 bars, and the first bar of an eight-bar half, so the melody always starts from its top. In missions 1–4 the speed reaches 2.2× only about two seconds before the target, so the lead mostly plays for players who stay on; in missions 5–7 it comes in during the mission.
- **The lead plays at most 32 bars at a stretch,** two passes of its melody, on the owner's word. It fades to silence over bars 31–32 (`MUSIC.leadFade`), so the fade ends with the stretch instead of reaching into the next pass, then rests for 16 bars before coming back from the top of a half under its usual rules. The 16-bar rest is a first guess (`MUSIC.leadBars`, `MUSIC.leadPause`). Leaving early because the speed dropped starts the count afresh.
- **Tempo:** 96 BPM at 1×, +14 BPM per 1×, at most 140; 90 BPM between missions.
- **A rest:** at most once in every 16 bars, always in the last of them, one layer among bass, drums and arpeggio drops out for that bar and is back on the next downbeat. Only a layer that has played at least 16 bars since it came in can rest, never the same layer twice running, chosen at random from those ready (`MUSIC.restEvery`, `MUSIC.restAfter`). So each new instrument is heard for a while before it rests, on the owner's word. The lead never rests this way. The randomness is `Math.random`, never the run's seeded numbers.
- **Slow motion:** the tempo drops to 60% and a low-pass closes to 700 Hz over 0.2 s, and both come back over the last 0.45 s. New notes play up to 5 semitones lower, following the game's time scale.
- **Through a run:** silent on the start screen; a run starts it. A wormhole drops all but the pad over 0.5 s, and the stop between missions plays the pad alone at 90 BPM with its filter closed. The next mission flies on from there. A destroyed ship fades it out over 1.5 s under the destroyed sound, the tempo ramping to 60 BPM in one ramp, and the game-over screen then plays its own bass alone (2026-11-21, the owner's word): a separate saw bass with a slow filter and a long release, at −8 dB with its own echo, one note every 24 sixteenths (6 s), the first 8 sixteenths (2 s) after the loss, 2.4 s long, on A1, F1, C2 and G1 in turn, until the next run starts. The sound effects there follow its root. The 6 s gap and the order are the Music Producer's reading of "very infrequent". The way home still fades it over 2.5 s under the home chord, with nothing after.
- **Level:** the music's own bus at −12 dB, then a limiter at −1 dB. The sound effects keep their own level.
- **Its own switch.** A note icon just left of the sound-effects speaker, on the start screen, the stops between missions and the end screens, with a slash when off; `N` on a keyboard. It is independent of the sound-effects mute, as the owner asked: either can be off while the other plays. On by default, remembered on the device.
- **Loaded after the game.** Tone.js and the music are one chunk of 263 KB (65 KB gzipped); the game's own code is 49 KB (19 KB gzipped). It is loaded only after the first tap has started the audio, and the game plays without music until it arrives. It shares the sound effects' audio context, so the same tap starts both and leaving the page pauses both. The service worker caches it with the rest, so it plays offline.
- **It changes the music only when that is heard.** Tone.js keeps every tempo change for the whole session, so the tempo and the echoes change only when the tempo has moved 0.5 BPM, and the pad filter when it has moved 3%. Slow motion schedules its two ramps at once when it starts. A simulated 12-minute run schedules fewer than 400 tempo changes, and a new run starts the tempo's history afresh.
- **Nothing in the simulation changes.** The music reads the game's state, speed, slow motion and the events the sound effects hear (`src/music/conductor.ts`), and the golden traces are unchanged.
- **Hearing it outside a run:** `npm run dev` and open `/audition.html`. It has a run that speeds up by itself or is set by hand, slow motion, a wormhole, the next mission, a destroyed ship, home and the music switch, all through the game's own conductor. `__music()` in the console there reports the transport, the tempo and how many tempo changes Tone.js is holding.

### Effects to add

| Event | Effect |
|---|---|
| Crew left behind | The planetoid's ring turns red and fades as it leaves the foot of the field |
| Ship full | A pulse on the hull, to match the count in the corner |
| Wormhole appears | The stars near it bend towards it, as the grid does for a well |
| Wormhole entered | The stars streak to a point before the flash |
| Shield lost | The front arc breaks into pieces that fly off |
| Seat filled | The crew beam ends on the seat that turns green |

Screen shake, the flash, the sparks and the stretching stars stay as they are.

### Controls and limits

- **A mute control,** built: a small speaker in the top right corner of the start screen and of the results screens between missions, waves when sound is on and a cross when muted, with no word. A tap on it only toggles sound: it does not start a run, choose a ship or move on. `M` on a keyboard toggles it anywhere, during a run too. The choice is remembered on the device. One mute covers everything; whether music gets its own is open.
- **Where it is not:** in flight, where a tap steers, and on the end screens, whose top corners hold the leaderboard and share buttons. A phone player can mute at any stop between missions, but not while flying.
- **Where the browser has no Web Audio** there is no sound and no icon.
- **Sound starts with the first tap or key.** Browsers block audio before the player touches the page.
- **Leaving the page** suspends the sound; coming back resumes it, unless it is muted.
- **Vibration stays** as it is and plays with the sounds.
- **Flashes and shake** are already in the game; a way to reduce them for players who ask their device for less motion is open.
- **Drawn outside the drawing code.** The icon is drawn by `src/audio/muteButton.ts` after the frame, so `src/render` does not change.

### Order of work

1. Sound effects and the mute control: no files, and they close the two silent events. **Built on 2026-11-20.**
2. The effects for a crew member left behind and for the wormhole.
3. Music, once a track exists. **Built on 2026-11-21 in code with Tone.js**, from the owner's sketch, instead of a track.

### Not decided

- Steps 2 and 3: the effects and the music are proposed, not agreed.
- How each sound should sound. The first set was made without anyone hearing it; the owner tunes it by ear.
- Who makes the track, and what it should sound like.
- Whether the first sounds wait for the look to be chosen.

## Frame rate display and new icons

Asked for by the owner on 2026-11-20. Both are built and live since 0.4.7 (2026-11-21).

- **Why.** The vector-glow look went live in 0.4.4 without its frame rate being checked on a phone. The game steps at a fixed rate whatever the screen does, but a phone that draws few frames is harder to fly.
- **A frame rate control on the start screen (live since 0.4.7).** The owner's words: "add a frame rate control to the start screen and show it if switched on". Built as a switch for a display, not a limiter:
  - **The switch** is a small gauge, a dial with a needle and no word, in the top left corner of the start screen. It mirrors the mute speaker in the top right: the same row, size and brightness, and cyan while on. A tap on it only flips the switch and does not start a run. It is off by default and remembered on the device.
  - **The reading,** when on, is shown on every screen, in flight included, as for example `58 FPS · LOW 41`. It is small monospace text in the star colour, in the bottom left corner just above the progress bar, below the ship. The first number is frames drawn per second over the last half second; `LOW` is the slowest single frame of the last 3 seconds as a rate, which shows a stutter. Drawn on every kind of screen, it overlaps nothing: the play field has a fixed shape, so a short phone scales it rather than rearranging it.
  - **It counts frames drawn,** not simulation steps, which stay at a fixed 1/60 s. A gap of a second or more, such as the tab coming back, is not counted as a frame. Nothing in the simulation changes. With the switch off a frame is drawn as before, apart from the gauge itself on the start screen.
  - **In code:** `src/fps/meter.ts` (the meter and the switch) and `src/fps/fpsButton.ts` (the gauge and the reading), drawn after the frame like the mute speaker, so `src/render` does not change.
- **The logo and the favicon are redrawn in the vector-glow look (live since 0.4.7).** The app icons (`public/icons`) and `public/favicon.svg` show the ship as the game draws it: a black hull in cyan lines of light with a cyan cockpit glass set inside the nose and a yellow flame, on the black field. The large icons also show ship 1's four seats full (green dots), the violet grid and a few stars (the rock was taken out on 2026-11-21, for the name Lightboat); the favicon is the ship alone with a heavier line, so it reads at 16 px. The glow is drawn as wider, fainter copies of each outline, because ImageMagick ignores SVG filters. `npm run icons` redraws them. A phone that has the game installed keeps its old icon until the phone refreshes it.
- **Still open:** whether the owner also wants a way to cap or lower the frame rate; this builds only the display.

**Saved with each run since 2026-11-22** (the owner's word). Every run saved to Firestore carries `fpsAvg`, the frames drawn per second over its flight, and `fpsLow`, its slowest whole second. Flight is the fly-ins and the missions, not the stops or the end screen. The reading on screen does not need to be on. It shows which devices struggle, for example with the piano's two reverbs. The rules take both fields or neither, so an older client still saves. Nothing reads them in the game yet; they are for looking at the data.

## Story

Proposed on 2026-11-21 and agreed in outline by the owner. Rewritten the same day for the game's new name, Lightboat (see [The name Lightboat](#the-name-lightboat)) and for a story mode beside arcade. On 2026-11-22 the owner decided what was mined (light0re), gave each mission a moon of its own (`m00n` to `m06n`), numbered the missions to match, made the Pilot the captain of the *Lantern*, made the *Lantern* a freighter carrying light0re with three lightboats, and set the mode's rules of play. The owner's words on all of these are in [Planned: story mode rules](#planned-story-mode-rules). **Not built.** Everything that is said is in `story-script.md`, in its fourth draft, which the owner has not yet read.

This section uses mission numbers 00 to 06. Older parts of these notes count missions and levels from 1, so mission 00 here is level 1 there.

### Two ways to play

- **Arcade** is the game as built: seven missions, one run, the board. It stays wordless.
- **Story** is the same flying under rules of its own, with the story told on screens of its own. It has no score. It counts people: on Earth, left behind, and dead.
- **Is there enough to build a story mode?** The frame, the rules of play and a fourth draft of the script are here. What is missing: the owner's read of the script, the numbers the rules leave open (how many people each moon holds, what a return trip is like), and the mode's screens, which have not been drawn.

### The title

- **The word is real.** Dictionary.com gives "lightboat" as a small lightship, an Americanism from 1825–35; Wiktionary gives it as a vessel that carries a light as an aid to navigation. A lightship is moored where the water is dangerous so that others can find their way past.
- **Proposed: a lightboat is the kind of boat, not one ship.** A lightboat is the small boat a freighter carries, drawn in lines of light so that the people it comes for can see it. The Lantern carries three, of 4, 8 and 12 seats, and its captain flies one. So the title names what the player flies, whichever ship they choose.
- **All three readings hold:** a boat of light, a light boat (the 4-seater is the lightest, and the Pilot may keep it), and one letter from "lifeboat".
- **The dictionary sense is kept for the ending.** A lightship holds its place at the hazard. In mission 06 the captain who lets the way home pass, to fill more seats, does that for a while. The Foreman does it for good: the night shift holds the drill until the boat is through, and is never among the saved. *That the Foreman stays is the writer's choice.*
- **A fourth reading, from the freighter.** A lighter is the real word for a boat that carries cargo between a ship and the shore. On a freighter that hauls light0re, the lighters are lightboats: cargo boats, lit by what they carry, pressed into a rescue. *The writer's proposal, on the Producer's suggestion.*
- **The alternatives:** the title names the Pilot's one ship (then the 8- and 12-seaters need a word of their own), or the freighter (then the game is named after the ship the player never flies).

### The premise

- **Seven moons.** Decided by the owner on 2026-11-22: there is one mined moon per mission, numbered `m00n` to `m06n` (see [The moons' names](#the-moons-names)). One company opened them in that order, so `m00n` is the oldest and most mined out, and `m06n` is the working mine. Nine hours ago they began to break up. The grey asteroids are their rubble. The coloured planetoids are the pieces people were living and working on.
- **What was mined: light0re.** Agreed by the owner on 2026-11-22, who named it. It is spelled with a zero, the owner's spelling, and never capitalised. The moons' cores held an ore that stores light. Everything in the game that is drawn in light is made of it: the lines of a lightboat's hull and the shield arcs. A moon was not mined for something in its rock: it was taken apart for its core, which is the owner's word for it, "harvested".
- **The *Lantern* is a freighter.** The owner's words: "Lantern is a freight ship it carries lightore from other side of the galaxy and get sos signal (doesn't now how many moons broke), diverts to save crew from the first, learns that there's more". Its hold is full of light0re from another mine, bound for Earth. It is too big to enter the fields, so it keeps outside the chain of moons and waits on the far side of every wormhole. It has no crew, only its captain: the owner's words are "Lantern has no crew, only the captain". So the ship speaks with its own voice.
- **The Pilot is the *Lantern*'s captain,** addressed by mission control by the player's generated callsign, and as "Captain" by the people aboard. In missions 00 to 05 the captain flies the boat from the ship and is never aboard it.
- **Three lightboats, and only three.** They are the freighter's own boats, of 4, 8 and 12 seats. A boat destroyed is gone for the rest of the story, with the people aboard it.
- **What the captain knows.** At the start, one moon and one distress call. Each further moon is learned from the people brought out of the one before. The story never names a moon the captain has not been told about.
- **Mission control** is on Earth: the freight line's control room. It tasks the rescue, because the *Lantern* is the nearest ship, and it answers for the cargo. *That the two are one voice is the writer's proposal.*
- **The list.** The mining company sends mission control a list of who was on its moons. It covers `m00n` to `m03n`. On paper `m04n`, `m05n` and `m06n` are worked by machines alone. The night shift, who were sent there to run the drill past its limit, are on nobody's list.
- **The ore, and the turn.** After `m03n` the ship is full: the people brought out, and the hold of light0re. Mission control says that is every moon on the list and another ship is on its way. The captain either goes home with the ore and the people, for the commission and the fame, or drops the ore to make room. The owner's words: "go home with ore and saved crew (and earn commission and fame) and say that someone next will be able to save remaining crew, or drop the ore, make room for more people".
- **Room for all.** With the ore dropped, the *Lantern* has room for everyone on the first six moons and no more: the owner's decision ("Yes, room for all"). It is full only if nobody on `m00n` to `m05n` was left behind and nobody died in a lost boat. It never has room for the people of `m06n`.
- **The captain's part in it.** The cargo in the hold is the same ore these people were sent to dig. Nobody says so until the Foreman does, once, near the end.
- **Earth** is home. The people brought aboard wait on the *Lantern* to be taken there.
- **The drill.** A gravity drill at `m06n` is still running. The richest light0re was at the core, so the drill went deeper than a moon can stand. It broke `m06n`, and its pull is taking the six older moons apart too: they had already been hollowed out. It bends the grid and pulls everything in faster the nearer the boat gets to it.
- **The wormholes** are the mine's haul roads from moon to moon, opened by the drill to move light0re down the chain. They still open, but on no timetable any more. The road out of `m06n` is the one the light0re left by, and it leads to Earth. This is the story's reason for a wormhole leading to the next moon, and for nobody knowing when the next one comes. Agreed by the owner on 2026-11-22.
- **What the night shift is doing.** They stayed at the drill on purpose, holding it back so that the others had time. They can slow it but not stop it: it runs faster the longer it goes. This is the story's reason for speed rising for as long as the boat stays, with no ceiling in mission 06. An earlier draft had the drill speed up for every one of them taken out. The game has no such rule (speed follows the distance flown), and a player would read it as a reason to rescue fewer, so the story does not say it.
- **The last boat.** After mission 05 the *Lantern* has taken everyone it is going to. It cannot wait for `m06n`: the road out of that moon leads to Earth, not back to the ship. No other ship will reach `m06n` in time, and the captain knows it. The captain either takes the ship home, or sends it home alone on automatic and stays behind with one lightboat, aboard it for the first time, to try for the people of `m06n`. There are more of them than the boat has seats.
- **A ship sent home alone is lost 2 times in 10.** The owner's words: "sending Lantern home on automated mode is also a risk, small, but in a rare ending something goes wrong with automation and it never reaches the Earth – captain/pilot knows the result only if succeds with final mission", and then the number: "let's make it 2/10, rare ending when Lantern is lost during auto flight home". So staying stakes the people already saved for a boatload more. A *Lantern* its captain takes home always arrives.

### The voices

- **Control** is mission control, one person on the freight line's desk for the whole night. By the book: it tasks the rescue, answers for the cargo, and holds the company's list. Its change of heart is the story's main arc, and it starts with the cargo: "That cargo is not yours to cut. I didn't see it", then "Nothing I have covers this. Your ship", then "I'm starting a new page", then "I can't order you into that boat. I won't order you out."
- **The *Lantern*** speaks for itself: boats, room, cargo. It never gives an opinion. It has no crew to speak for it.
- **The First** is the first person the captain brings aboard, whoever that turns out to be. They take the radio and keep the names of who is still out. They want everyone brought out. Until someone is aboard, the *Lantern* gives the counts.
- **The Foreman** is the night shift's, heard faintly from mission 04. The Foreman wants the boat to turn back, and is never among the saved. *The writer's choice.*
- **Other survivors** speak once, after the first trip to their moon, and sign by what they did and the moon they were on, not by name. Each one's line is also how the captain learns of the next moon, or of what lies behind the chain.

### The seven missions

Each mission is flown at one moon, further down the chain and nearer the drill. The second name is what its people call it; those names are the writer's. A moon holds more people than the boat seats, so each takes a first trip and then as many return trips as the captain chooses.

| Mission | Where, and who is there | What is told there | What it gives a reason for |
|---|---|---|---|
| 00 | `m00n`, the Edge: the survey crew who sent the call | The briefing: one moon, one distress call. The first thanks, and word of `m01n`. The First takes the radio. Control explains the choice to go back or go on, once | Single crew, one at a time |
| 01 | `m01n`, the Drift: rig crews on neighbouring pieces | A rig hand whose other rig is still out there. The company's list arrives: four manned moons. The eight is ready | Two crews at once; the first choice of boat |
| 02 | `m02n`, the Works: shift crews in twos and threes | A shift hand tells of the drill at `m06n`. The haul roads. The ship cuts cargo into shields, and Control looks away | The grid and the wells; the wormholes; shield drops |
| 03 | `m03n`, the Town: families | **The turn.** The ship is full. Control: bring cargo and people home, another ship is coming. The First: the night shift is on nobody's list, and two days is a long time. The captain goes home with the ore, or drops it | Missions 00–03 against 04–06; the second choice of boat |
| 04 | `m04n`, the Fall: the night shift's outer crews | "We were the automation." The Foreman is heard for the first time: turn back. Control starts a new page | The higher speed; the dropped ore as shields |
| 05 | `m05n`, the Throat: the last crews the Foreman sent out | **The second turn.** The ship reports who is aboard, and that sent home alone it is lost one time in five. The First: no other ship will reach `m06n` in time. The captain takes the ship home, or stays with one boat | The *Lantern* leaving; the last choice of boat |
| 06 | `m06n`, the Heart: the drill's own crew | The captain is aboard, alone, with more people to reach than seats. An ending | The open-ended last mission; the way home |

- **Older moons first.** `m00n` was mined out long ago and has the fewest people on it; `m06n` is where the work is. This is the story's reason for later moons holding more people, and for mission 06 starting faster: it is at the drill. In story, missions 04 and 05 start at mission 03's speed (the owner's decision), so only mission 06 starts faster; no line depends on it.
- **The shields are the cargo.** In mission 03 the ship cuts light0re from its hold into shields. In missions 04 and 05 the shields are the dropped ore itself, drifting into the fields ahead of the boat and thinning out. None reach `m06n`. This follows the Producer's suggestion and the Engineer's proposal, and costs nothing in play. The lines give no counts, so they do not depend on `shieldDrops`.
- **The shield beside every wormhole in mission 06** is raw light0re, torn out of the core by the drill where it tears space. Nobody sent it: the way home and the shield are born together, one each side.

### Draft lines

Everything that is said in a first playthrough is in `story-script.md`, now in its fourth draft. The lines are kept there only, so that there is one copy to revise. The briefing, as a sample:

> CONTROL TO LANTERN
> You are the nearest ship to a distress call.
> A mined moon, m00n, has broken up.
> There are people alive on the pieces.
> Your ship is too big to go in. Its boats fit.
> Show them a light. Bring out all you can.

### Endings

Eight, with their lines in `story-script.md`. Each closes on three counts: on Earth, left behind, dead.

| Ending | When |
|---|---|
| The commission | The captain takes the *Lantern* home after `m03n` with the ore: cargo delivered, commission paid, the papers have the callsign. Then one of two tellings, picked by chance: another freighter went in and brought out some of the night shift, or it came too late |
| Past the list | The captain drops the ore, goes past the list, and goes home with the *Lantern* after `m05n`. There is no commission |
| A full ship | As "Past the list", with every place on the *Lantern* taken. Earned, not rare |
| The empty rail | The captain drops the ore, goes on, and loses the last of the three boats before mission 06. The *Lantern* goes home with its captain aboard |
| Home | The captain stays, flies mission 06 and comes out by the road to Earth |
| The light that stayed | As "Home", when the *Lantern* left full and every seat of the last boat is full too. The best a captain can do |
| Lightboat | Rare, and picked by chance. The captain comes home from mission 06, and the *Lantern*, sent home alone, never arrived. It replaces "Home" or "The light that stayed" |
| Lost at the Heart | The last boat is destroyed in mission 06. The captain and the people aboard it die. Nobody speaks, and nothing is told that the captain could not know |

- **The commission is told, since there is no score.** It is paid in one ending and named as lost in the three where the ore was dropped and the captain went home: "No commission."
- **A full *Lantern* is what the two best endings ask for.** It means everyone on the first six moons is aboard: nobody left behind, and nobody dead in a lost boat. So a captain who lost a boat with people in it cannot reach either of them in that playthrough.
- **Going home with the ore is not the bad ending.** The owner's words: "Going home early shouldn't be a 'bad' ending; at least half the time, that ending should indicate that another freighter took on the mission to save some of the remaining crew and received the same fame and commission." So at least half the time mission control's "another ship is on its way" turns out true, and the captain's choice was a fair one. Chance picks the telling, through the drawing's randomness and never the run's seed. It comes 60 times in 100.
- **Three endings come without flying mission 06,** and none is written as a failure. "The commission" is the captain who did what was asked and was paid for it. "Past the list" and "A full ship" are the captain who gave up the cargo for people nobody listed, and then would not stake them on the last moon.
- **Going home after `m05n` is the rational decision, and the story says so.** By the numbers, staying stakes everyone aboard at one in five for at most twelve more. The owner's words: "if the captain does the math a decides not to risk already saved crew and sacrifice mo6n crew – that should be at least aknowledged (if not praised) as a rational decision". It is acknowledged from three sides: the Foreman ("You turned back. Good."), mission control, which goes by the book ("You wouldn't stake them at one in five. It's the order I'd have given."), and the First, whose life was the stake ("I wanted you to go. I'm alive because you didn't.").
- **Staying is a choice made against the sum.** The two endings for a captain who stayed and came through open with mission control's "The sum said go home. You stayed.", said as neither blame nor praise. In "Lightboat" nobody says the captain was told the odds: that exception is the writer's, and the owner has not ruled on it.
- **Running out of boats is an ending of its own, "The empty rail".** Under the rules as decided (returns not limited, story missions 04 and 05 starting at mission 03's speed), the Engineer's headless check of 2026-11-22 found that one average captain in four loses all three boats before mission 06; strong and expert captains almost never do. That average captain saves about 45 of the 70 people on the first six moons, leaves about 18 behind and loses about 10 in boats. So for ordinary players this is a common way for the story to end, and it is written with the same care as the others: "You flew until the rail was empty." If the ore is still aboard, which is rare, the story goes to "The commission" instead, without the papers and with the commission paid "less three boats".
- **A full *Lantern* is earned, not rare.** The owner decided that going back is not limited ("Don't limit; it's a risk assessment decision from a captain/pilot"). In the Engineer's check an expert who keeps going back leaves nobody behind in about two stories in three. Every seat of the last boat full is also usual for a good pilot. So "A full ship" and "The light that stayed" are what good flying earns.
- **The odds,** both the owner's numbers. The second freighter comes 60 times in 100. The *Lantern* sent home alone is lost 2 times in 10.
- **Nobody can save everyone at `m06n`.** There is one trip, and more people than seats. The Foreman is among those who stay.
- **The ending called "Lightboat"** takes the game's name: the one boat that came home. Only mission control speaks in it, because the First was aboard the ship. The chance does not depend on how the captain flew. The owner agreed the name and the rule on 2026-11-22: "Yes to "Lightboat" ending, keep the risk for all". So a captain with a full *Lantern* is not spared, and the best-flown story can end with the most people lost.
- **The risk is told before the choice,** as a plain figure, since the ship gives no opinions: "Sent home alone, it is lost one time in five." Without that the ending would be a trap.
- **Whoever speaks at the end is far away:** mission control on Earth, the First on the *Lantern* on its way there, and the Foreman at `m06n`.

### The moons' names

Decided by the owner on 2026-11-22, in the owner's words "m00n, m01n, m02n, etc", with one moon per mission.

| Mission | 00 | 01 | 02 | 03 | 04 | 05 | 06 |
|---|---|---|---|---|---|---|---|
| Moon | `m00n` | `m01n` | `m02n` | `m03n` | `m04n` | `m05n` | `m06n` |
| Level, in the code and the rest of these notes | 1 | 2 | 3 | 4 | 5 | 6 | 7 |

- **The zero stands for the letter o,** as in light0re. `m00n` reads as "moon", which is why the count starts at zero; the others are the same word with the number counting up.
- **Always lower case.** In the HUD's capitals, `M00N` loses the look. *To see on screen.*
- **A mission has its moon's number.** Decided by the owner on 2026-11-22 ("rename missions 00, 01, etc"): missions are 00 to 06, always two digits, so mission 00 is flown at `m00n` and the two numbers never differ.
- **On screen the rename is built** (2026-11-22, by the Game Engineer; not yet released). The counter in flight reads `MISSION 00/06`, the stop between missions `MISSION 01 COMPLETE`, and the rows of the results tables run 00 to 06. Underneath, levels, saved runs, the rules and share links still count 1 to 7.
- **The board now names a place, not a count.** A row says the mission a run reached, `REACHED 02`, and for the last mission `REACHED 06 · HOME` or `LOST`; it replaced `FINISHED n/7`. For the story this reads as how far down the chain of moons each pilot got, which is what a roll of pilots would record.
- **Where the numbers appear:** the premise, the briefing, the survivors' signatures ("Survey crew, m00n") and a few lines. Whether a moon's number is shown during flight is a choice below.
- **"etc".** The story uses seven moons. Whether the company has more elsewhere is left open.
- **Dropped:** Galore, and the five names proposed on 2026-11-21 (Tallow, Harrow, Kessler, Lode, Marrow).

### Choices for the owner

Decided by the owner on 2026-11-22, with the rules of play in [Planned: story mode rules](#planned-story-mode-rules):

- The story has a screen of its own, with up to three transmissions.
- Going home after mission 03 is offered.
- The choice of boat is told.
- The wormholes are the mine's haul roads, and the list stops at `m03n`.
- The Pilot is the *Lantern*'s captain, and flying mission 06 is the captain's choice.
- There is no score in story mode.
- The *Lantern* is a freighter carrying light0re, and it is full after mission 03 unless the ore is dropped.
- It carries three lightboats, and only three.
- It has no crew, only the captain.
- With the ore dropped it has room for everyone on the first six moons.
- Going home with the ore is not the bad ending: 60 times in 100 another freighter goes in.
- No other ship can reach `m06n` in time, and a *Lantern* sent home alone runs a risk.
- The ending where the ship never arrives is called "Lightboat", and the risk applies to every captain.
- Going back to a moon is not limited.
- The story is in the first person: a captain who dies is told nothing more, and neither is the player.
- The second freighter comes 60 times in 100.
- The *Lantern* sent home alone is lost 2 times in 10.
- Going home after mission 05 is acknowledged as the rational decision.
- The endings for staying say the captain was told the odds and went anyway (the owner's "yes!"). The wording is still a draft.
- Story missions 04 and 05 start at mission 03's speed.

Still open on the story's side. "Proposed" is the writer's suggestion, not a decision. The open rules and numbers are in the rules section.

| Choice | Options | Proposed |
|---|---|---|
| Which ship the title names | The kind of boat; the captain's one ship; the freighter | The kind of boat. The owner once wrote "Lightship" for the last boat; it is taken here as the lightboat |
| Who mission control is | The freight line's control room, which both tasks the rescue and answers for the cargo; or two voices, a rescue authority and the cargo's owner | One voice. It keeps the stops short and gives Control something to give up |
| Where the shields come from | Cut from the cargo, then the dropped ore drifting in; or no shields once the ore is gone | Cut from the cargo, then the dropped ore |
| Whether the Foreman can be saved | Never; or in the best ending | Never |
| The board | No score means story runs cannot be ranked with arcade's; a roll of the player's own, or nothing | A roll of the player's own: the three counts, and the eight endings shown as lamps, lit when reached |
| Whether taking the night shift out speeds the drill | Not a rule today: speed follows the distance flown. Add it as a rule of story mode; or leave the story silent about it | Silent, as the script is. Adding it is a rules and balance question, and it would give a reason to rescue fewer |
| A second playthrough | The same story again; or a telling that knows it has been read | The briefing is skipped, and the First's lines change because the captain already knows what the list leaves out |
| Which mode a new player meets | Arcade on the first tap, story as a second entry on the start screen; or story first | Arcade on the first tap. It keeps "nothing to read" true for the game most players meet |
| Whether arcade carries any of the story | Nothing; or the title and one line | Nothing but the title |
| Where a moon's name is shown | The mission's number already is the moon's. `m00n` itself: only on the story's screens; or also in flight, beside or in place of the word `MISSION`, and then in arcade too | Only on the story's screens, until it has been seen on screen |
| What each moon's people call it | Keep the second names (the Edge to the Heart); or numbers only | Keep them, in survivors' mouths only |
| Tone | Dry and warm, as drafted; or lighter | Dry and warm |

### Rules for the writing

- **Why, never how.** The story gives the captain a reason to fly. It never teaches rings, steering, seats or shields. Rescues, the wormhole and gravity are still left to be discovered.
- **Nothing to read while flying.** Lines appear only where the game has stopped.
- **Three states, and the story never blurs them.** People still on a moon are still there for as long as the *Lantern* is. Once the captain goes on they are left behind. Only people aboard a destroyed boat are dead. The First keeps all three on the list.
- **First person.** The owner's words: "this is a first-person POV story; if the protagonist dies, they won't know how the whole story unfolded." Nothing is said that the captain could not hear or know, and nothing at all is said after the captain's death.
- **Nobody speaks of what the captain has not been told.** The captain starts with one moon and one distress call, and learns of each further moon from the one before.
- **No score in any line.** What is counted aloud is people.
- **Lines answer what happened.** The counts are filled in by the game, and there are blocks for a return trip, a moon emptied, a boat destroyed and a trip that brought nobody.
- **Who calls the Pilot what.** Mission control uses the callsign. The people aboard say "Captain". The Foreman says "Lightboat".
- **The choice of line never touches the deal.** It uses the drawing's randomness, not the run's seed.
- **Short.** A transmission is a sender and at most three short lines, and a screen holds at most three transmissions. A line is about 48 characters, the Producer's estimate of what fits across the field, to be measured once the screen is drawn.

### Not decided

Besides the choices above:

- **The script.** The fourth draft is waiting for the owner. It is about 40 transmissions against 15 to 20 minutes of flying, which may be too much to read. The changed lines for a second playthrough are not written.
- **How the lines look:** capitals like the rest of the HUD, or sentence case so that they read as a voice; shown at once or typed out.
- **A sound for a transmission,** and whether the voices differ in sound. The Composer's to propose.
- **The screens.** None is drawn: the story's screen, the choice to go back or go on, the start screen with two modes, the roll.

When this is built, [What the player is told](#what-the-player-is-told) and [Direction](#direction) need rewriting.

## Planned: story mode rules

Decided by the owner on 2026-11-22. **Not built, and arcade is not changed by any of it.** These are the rules of play for the story mode. The story itself is in [Story](#story) and `story-script.md`, which were written before these rules and have to follow them.

### The owner's words

> In the story mode:
> – it doesn't send the saved crew off the ship
> – if you miss someone on the mission, you choose to fight for them or go to the next moon
> – all crew aboard the Lanter wait to be transferred back to Earth
> – there's no score counter, only saved crew matters
> – the Pilot is never aboard, except for the final mission
> – the final mission results in permadeath for the pilot and the crew on board the Lightboat, but people saved (on Lantern) reach their destination (and those skipped in previous missions are left behind)

Asked what happens to the people aboard a lightboat destroyed in missions 00 to 05:

> they die, and the pilot can still fly again to rescue skipped crew only, so each moon has fixed amount of crew, always bigger than current lightboat
>
> Lantern (mothership) has almost limited capacity too, that's why you as a Pilot fly the last mission yourself – Lantern goes full to the Earth, but you have the last ship to try to use to rescue the last moon crew

And, to three questions with options: a hit costs only a shield; in the final mission the Pilot dies only if the boat is destroyed; going back for people is a short return with only them in the field.

On who the Pilot is:

> So, the Pilot is the Lantern captain, tasked by the mission control to rescue as much crew as possbile.

On how the *Lantern* goes home:

> They send full Lantern back to Earth in the automated mode, and risk (or not) with the last remaining Lightship to rescue the last moon crew

On what the *Lantern* is, and the reason to go home after mission 03 (asked "What's the reason to leave early after mission 3?"):

> Lantern is a freight ship it carries lightore from other side of the galaxy and get sos signal (doesn't now how many moons broke), diverts to save crew from the first, learns that there's more, but after 3d mission it's already full. So the choice is to go home with ore and saved crew (and earn commission and fame) and say that someone next will be able to save remaining crew, or drop the ore, make room for more people.

On the boats, added a moment later:

> and yes, there are only three lightboats on board Lantern

On the ending for going home with the ore:

> Going home early shouldn't be a 'bad' ending; at least half the time, that ending should indicate that another freighter took on the mission to save some of the remaining crew and received the same fame and commission.

On the choice after mission 05:

> going home after m05n is a real choice:
> – it's already known that nobody will be quick enough
> – but sending Lantern home on automated mode is also a risk, small, but in a rare ending something goes wrong with automation and it never reaches the Earth – captain/pilot knows the result only if succeds with final mission.

On three points the producer listed as open (the odds of the second freighter and of the *Lantern* being lost; whether the player is told the ship's fate when the captain dies; whether going back is limited):

> 1. 60/40 each
> 2. No, this is a first-person POV story; if the protagonist dies, they won't know how the whole story unfolded.
> 3. Don't limit; it's a risk assessment decision from a captain/pilot.

After the headless check, on gentler missions 04 and 05, keeping the check's harness, and the odds for the *Lantern* on automatic:

> 1. yes, gentler missions 04 and 05
> 2. yes, in the repo
> 3. ok, let's make it 2/10, rare ending when Lantern is lost during auto flight home

Told that at 2 in 10, by the numbers, going home after mission 05 is the better choice for every captain:

> Yes, and if the captain does the math a decides not to risk already saved crew and sacrifice mo6n crew – that should be at least aknowledged (if not praised) as a rational decision

### The rules

| | Missions 00 to 05 | Mission 06 |
|---|---|---|
| Where the Pilot is | On the *Lantern*, flying the lightboat from there | Aboard the last lightboat |
| A hit | Costs a shield and nothing else: nobody is thrown off | The same |
| A lightboat destroyed | The people aboard die. The Pilot flies again, for those still on the moon | The Pilot and the people aboard die, and the story ends. There is no flying again |
| Where the saved go | To the *Lantern*, where they wait to be taken to Earth | Home, with the Pilot, by the way out |

- **The Pilot is the *Lantern*'s captain.** Mission control gave the task: rescue as many people as possible. The captain flies the lightboats from the *Lantern*, and in mission 06 goes in the last one.
- **Every moon holds a fixed number of people, always more than the lightboat in use seats.** So no moon is cleared in one trip.
- **After a trip, the Pilot chooses.** If people are still on the moon, the Pilot either goes back for them or goes on to the next moon. Going back is a short flight with only those people in the field. Those still there when the Pilot goes on are left behind for good.
- **The *Lantern* has no crew, only the captain** (the owner, 2026-11-22: "Lantern has no crew, only the captain"). In the script the ship speaks with its own voice.
- **The *Lantern* is a freighter** carrying light0re from the other side of the galaxy. It picks up a distress signal, does not know how many moons have broken, and diverts to the first. It learns of the others as it goes.
- **The *Lantern* carries three lightboats, and only three.** Read as: a lightboat destroyed is gone for the rest of the story, which was the Engineer's option B.
- **With its cargo aboard, the *Lantern* is full after mission 03.** The captain then chooses: go home with the ore and the people saved, for the commission and the fame, telling themselves that someone else will come for the rest; or drop the ore and make room for more people. This is the reason the choice after mission 03 exists.
- **Going home with the ore is not a bad ending.** At least half the time it tells that another freighter took on the rescue, saved some of the people still out there, and earned the same fame and commission. The rest of the time it does not. Which it is, is chance, not something the captain did.
- **With the ore dropped, the *Lantern* has room for everyone on the first six moons, and no more** (the owner's "Yes, room for all", 2026-11-22). There is never room for the people of `m06n`. After mission 05 the captain sends it back to Earth on automatic, with whoever is aboard. Nobody has to be left in command of it.
- **Mission 06 is the captain's choice.** The captain either goes home with the *Lantern*, or stays with the last lightboat and risks it for the people of the last moon. That is why mission 06 is flown in person.
- **The choice after mission 05 costs something either way.** Going home with the *Lantern* is safe for everyone aboard, and it is known by then that no other ship can reach `m06n` in time, so its people are lost. Staying sends the *Lantern* home on automatic, which carries a small risk: in a rare ending the automation fails and the ship never reaches Earth.
- **The captain learns what became of the *Lantern* only by surviving mission 06.** A captain who dies there is never told, and neither is the player: the story is told in the first person.
- **Going back is not limited.** How often to return to a moon is the captain's own judgement of the risk.
- **The odds.** The second freighter comes 60 times in 100. The *Lantern* sent home on automatic is lost 2 times in 10, and the captain is told the figure.
- **Going home after mission 05 is the rational choice, and the story says so.** At 2 in 10, staying risks on average more people than the last boat can bring out. The owner keeps it that way: a captain who does the sum and goes home is at least acknowledged for it, if not praised. Staying for `m06n` is a choice made against the numbers. The endings for staying say so: the captain was told the odds and went anyway (agreed by the owner, 2026-11-22: "yes!").
- **Story missions 04 and 05 start at mission 03's speed,** not at arcade's 1.4× and 1.8×. In the headless check this cut the share of average captains who lose all three boats from 45% to 25%, and changed nothing for good pilots.
- **The ending where the ship is lost is called "Lightboat"** (the Writer's proposal, agreed by the owner on 2026-11-22: "Yes to 'Lightboat' ending"). It replaces whichever ending the captain had earned by coming through mission 06.
- **The risk is the same for every captain** (the owner: "keep the risk for all"). A captain with a full *Lantern* is not spared, so the best-flown story can lose the most people.
- **This replaces the earlier rule** that whoever is on the *Lantern* always reaches Earth: that now holds when the captain goes home with it, and almost always when it goes alone.
- **There is no score.** What counts is people: saved, left behind, and dead.

Agreed the same day, from the script's assumptions: the story has its own screen with up to three transmissions; going home after mission 03 is offered; the choice of boat is told; the wormholes are the mine's haul roads and the *Lantern*'s list stops at `m03n`.

### What follows, to be checked

These are the producer's readings, not the owner's words.

- **Not everyone at `m06n` can be saved.** There is one trip, in a boat of at most twelve seats, to a moon that holds more people than that.
- **Arcade's costs are switched off in story:** the crew member thrown off by a hit, the share of the score a missed crew member takes, the score and the board.
- **A missed crew member is no longer lost at once.** They stay on the moon until the Pilot goes back for them or goes on.
- **The story changed with it.** The script's fourth draft has the captain flying from the ship until mission 06, the *Lantern* going home on automatic, endings that count people, and Earth as the name of home.
- **The voices changed with it.** In the script's third draft, orders and the list come from mission control, the people aboard answer to the captain, and the *Lantern* goes home on automatic with nobody left in command.

### Where the script and the proposed numbers disagree (2026-11-22)

The script's third draft and the Engineer's proposal were written side by side. All four are decided:

| Question | The script assumes | The Engineer proposes |
|---|---|---|
| The *Lantern*'s room: **decided, room for all** | It is full when it leaves `m05n`, and not before. Its rare ending needs nobody left behind on the first six moons | Room for 56 of the 70 people there. Superseded: the room is the six moons' total, 70 with the proposed counts |
| Going back: **decided, not limited** | As often as needed, until the moon is empty | At most two returns per moon. Superseded |
| A destroyed boat: **decided, three boats** | Replaced: the story does not count boats. Superseded | Three boats, and a lost one is gone (its recommendation) |
| Who is on the *Lantern*: **decided, the captain alone** | Nobody but the captain: the ship speaks for itself | Not addressed |

Also open in the script: whether its rare ending allows people to have died in lost boats, and what is said if the *Lantern* fills before `m05n`.

### The freighter and its ore: what is not yet settled (2026-11-22)

The producer's readings of the owner's words above, and the questions they raise:

- **"After 3d mission"** is read as after mission 03, at `m03n`, where the choice to go home was already agreed. With the Engineer's proposed counts the first four moons hold 36 people, so the hold beside the ore has room for 36.
- **A captain who left people behind** reaches that point with places free. Whether the choice is still put then, or only when the hold fills, is a rule to decide.
- **Mission control.** The owner earlier made the Pilot "the Lantern captain, tasked by the mission control". A freighter that answers a distress signal can still be tasked by mission control once it answers; The Writer proposes one voice: the freight line's control room, which tasks the rescue because the *Lantern* is the nearest ship and also answers for the cargo.
- **The shields.** In the script the *Lantern* cuts its own light0re into the shields it sends into the field. If the ore is dropped after mission 03, where the shields of missions 04 and 05 come from needs an answer. The Writer and the Engineer both propose the answer that costs nothing in play: the dropped ore is what drifts into the field.
- **What going home with the ore gives.** There is no score, so commission and fame can only be told: in the ending and on the roll.
- **Three boats, and the last one.** What happens when the third boat is lost before mission 06, and which boat can be flown when: today the 8- and 12-seaters are only offered after missions 01 and 03. The Engineer's answer was that a captain who loses the big boat flies a smaller one and leaves more behind.
- **The spelling.** The owner wrote "lightore" here; these notes keep light0re, the spelling the owner gave earlier.

- **The check's harness is kept in the repo,** on the owner's word, so the numbers can be flown again when a rule changes.

### Not decided

- **The numbers:** how many people each moon holds. The *Lantern*'s room follows from them: it is their total for `m00n` to `m05n`, so it cannot fill before the end of mission 05.
- **A return flight:** how long it is, how fast, with what shields, and whether the Pilot can go back more than once.
- **Going home after mission 03 and after mission 05.** Both are now ways to end the story without flying mission 06; how the two differ is the Writer's to propose.
- **The boats:** whether a destroyed lightboat is one fewer for the rest of the story, and whether the choice of a bigger boat after missions 01 and 03 stays as in arcade.
- **What the screen shows** with no score, and with nobody in the cockpit.

These are rules and balance questions for the Game Engineer to propose and the owner to decide: see the proposal below.


### The Engineer's proposal for the numbers (2026-11-22)

**A proposal for the owner to decide on. Nothing is built, and arcade is not changed.** "Measured" means a headless run of today's arcade code (40 seeds per mission, a ship that can neither fill nor be destroyed, flown to each mission's target). Everything else is reasoning, or a guess where it says so. Nothing has been played.

**What today's game offers, measured.** People who appear in a mission before its target is reached:

| Mission (level) | 00 (1) | 01 (2) | 02 (3) | 03 (4) | 04 (5) | 05 (6) | 06 (7) |
|---|---|---|---|---|---|---|---|
| People offered, average (range) | 2 (2–2) | 6 (5–8) | 12 (9–15) | 28 (24–31) | 39 (33–42) | 33 (29–37) | 23 (18–27) |
| Seconds to the target | 32 | 48 | 80 | 128 | 126 | 126 | 125 |

So arcade's planetoids cannot simply be reused. Mission 00 offers only 2 people before its target, in a 4-seat boat, while missions 03 to 05 offer two to three times what a boat holds. **In story the planetoids are dealt from the moon's own count:** a trip deals out the people still on the moon over its length, at the same gaps as arcade, and a moon that is empty sends no more.

**Proposed numbers**

| Question | Proposal | Why |
|---|---|---|
| 1. People on each moon | m00n 6, m01n 7, m02n 11, m03n 12, m04n 16, m05n 18, m06n 20 | Always more than the biggest boat that can be flown there (4, 4, 8, 8, 12, 12, 12), by 2 to 8, so every moon needs a second trip and later moons need it more. 70 people on m00n to m05n, 90 in all |
| 2. The *Lantern*'s room | **Decided by the owner, 2026-11-22:** with its cargo of ore aboard, the people of m00n to m03n (36 with these counts); with the ore dropped, all six moons (70). ~~56~~ | 36 is exactly what the first four moons hold, so a captain who saved everyone is full after mission 03, as the owner's account has it |
| 2b. The choice after mission 03 | **Proposed:** always put after mission 03, whatever the count: go home with the ore and those saved (an ending), or drop the ore and go on. There is no going on with the ore aboard. With the ore dropped, the *Lantern* can only fill when the last person on m05n is aboard, and then no more planetoids are sent | A fixed point is simpler than "when the hold fills": a captain who left people behind would otherwise carry a few free places into m04n, which holds 16, and never be asked. It also keeps the agreed choice of going home after mission 03 |
| 3. A return flight | A third of the mission's target (m00n 170 pc, up to m05n 1,000 pc). It starts at the speed the trip ended at and keeps the shields the boat had left: no top-up, no shield drops. Only the moon's remaining people are dealt, on planetoids of 1 to 3, evenly over the flight. Up to **two returns per moon** | The stake is real: shields carried over from a hard trip make a return risky, and a boat destroyed there kills those aboard. Two returns let a careful player clear a moon, but each return spends shields the next moon could have used |
| 4. The first trip | Deals the whole moon over the mission's length. A full boat is sent no more planetoids, so the people left are those the seats could not take plus those missed | No separate quota is needed: the moon's count and the seats decide it |
| 5. The boats | **Decided by the owner: three lightboats, a destroyed one gone** (option B below). Rules proposed below | The owner: "there are only three lightboats on board Lantern" |
| 6. Mission 06 | 20 people at m06n, one trip, the 12-seater at best. The way out opens when the boat is full or the target is reached, whichever is first. Target 2,000 pc rather than arcade's 3,500 | At most 12 of 20 come home, as the rules require. A full boat may leave at once: its people are what is at stake, and making a full boat fly on only adds a way to lose them |
| 7. Missions, speeds, shield drops | **Decided by the owner, 2026-11-22, after the headless check: missions 04 and 05 start at mission 03's speed (1×) in story;** arcade is untouched. Otherwise as first proposed: as in arcade for 00 to 05: the same targets, starting speeds and shield drops. The thrown-off crew member and the missed-crew cost are off, as the rules say | One set of numbers to balance. Story is already gentler, since a hit never costs a person |
| 8. On screen | In flight: `MISSION 02` top left; `ABOARD 3/8` and the seat dots top right; `ON m02n 5` under them. On the stop: `ON THE LANTERN 31/56`, `LEFT ON m02n 4`, `LOST 2`, and two choices: `GO BACK FOR 4` and `GO ON TO m03n` | No score anywhere. The *Lantern*'s room is only on the stop: in flight what matters is the boat and the moon |

**5. The boats** (the owner chose B on 2026-11-22; A is kept for the record)

- **A. Boats are never lost.** A destroyed boat is replaced; the cost is the people aboard. The upgrades after missions 01 and 03 and the fleet after 05 stay as in arcade. Simple, and a crash costs people, not the rest of the story.
- **B. The *Lantern* carries three boats, and a destroyed one is gone.** You start in the 4-seater; the 8- and 12-seaters are offered after missions 01 and 03 as now. The fleet after 05 is whatever boats are left. Losing all three ends the story before mission 06. "The last remaining Lightship" becomes literal: a careless player may reach mission 06 with only the 4-seater, or with none. Harder, and every crash matters twice.

**Proposed rules for the three boats:**

- **All three are aboard from the start, offered as in arcade:** the 4-seater from mission 00, the 8-seater from the stop after mission 01, the 12-seater from the stop after mission 03. This keeps every moon's count above the boat that can fly there.
- **A lost boat is gone for the rest of the story,** with the people aboard.
- **If the only boat on offer is lost,** the next one up is released at once. For example, the 4-seater lost at m00n means the return and mission 01 are flown in the 8-seater. That boat then clears a small moon in one trip, which breaks "always more than the boat" for that moon. I would accept that: it is a consolation after a loss, not a reward.
- **The fleet after mission 05 is the boats left.** With none left there is no mission 06: the *Lantern* goes home with whoever is aboard.
- **All three lost before mission 05** ends the story at once, the same way.
- **To measure before building:** how often an average captain loses all three before m06n. With hits costing only a shield, a boat is lost only when its shields run out, so I would guess rarely before mission 04 and often in missions 04 and 05, where arcade's pilots die most. This is a guess. The headless check on returns can count boats lost at the same time.

**Shields after the ore is dropped:** the drops of missions 04 and 05 (six and four) stay as they are, with the dropped ore as what drifts into the field, as the Producer suggested to the Writer. The alternative, no drops once the ore is gone, would make the choice cost shields. But missions 04 and 05 start at 1.4× and 1.8× and are already the hardest, and the choice already costs the captain the commission. I would not add the cost.

**What does not hold, or needs a decision**

- **"The Lantern goes full" is true only for good play.** With fixed counts and limited room, a weak player sends it home part-empty. The script should not promise it full.
- **Going home after mission 03** is now the ore choice (row 2b). It sends home a *Lantern* holding at most 36, the first four moons; the ore's commission is what the captain gains by it.
- **Arcade's choice rows** (2 crew, 3 crew or a shield) would deal people from the moon. Choosing the shield leaves those people on the moon for a return, which is consistent.
- **A destroyed boat in missions 00 to 05:** the rules say the Pilot "flies again, for those still on the moon". I read that as the return flight, offered at once, counting against the two returns.

**What a headless check could settle before building:** done on 2026-11-22, see below.

### Headless check of the story rules (2026-11-22)

**Measured, not played.** On the owner's go-ahead: the proposed rules laid over the real game in a test harness outside the game's code. No screens, and nothing in the game changed. 300 stories per pilot per case, 6,300 stories in all.

**The pilots:** the Game Producer's scripted pilot from the ship balance work, adapted to today's game. Expert, strong and average differ in how late they notice rocks, how slowly they react and how often they lapse. A pilot is not a person: it never parks to dig a well. Differences under about 3% are noise.

**The rules as flown:**
- The moons hold 6, 7, 11, 12, 16, 18 and 20 people. The *Lantern* holds 36 with the ore, 70 without; this pilot always drops the ore after mission 03.
- A hit costs only a shield. There are three boats and a lost one is gone; the next one up is released if the only one on offer is lost.
- The moon's people are dealt onto each flight's planetoids and nowhere else.
- A return is the last third of the mission's target, at that stretch's speed, with the shields left and no drops.
- The pilot goes back while people are left, up to the limit, and only with 2 or more shields (except after a crash, when a new boat goes back).
- Mission 06 is flown at arcade's length, with the way out opening as soon as the boat is full. That is a small difference from the proposed 2,000 pc.

**1. Running out of boats** (stories that reach mission 06 with 3, 2 or 1 boats left, or that end early with none):

| Case | Expert | Strong | Average |
|---|---|---|---|
| Never going back | 97 / 3 / 0, none out | 84 / 16 / 0, none out | 16 / 44 / 29, **12% out** |
| At most two returns (as proposed) | 93 / 7 / 0, none out | 66 / 26 / 6, 1% out | 7 / 23 / 29, **41% out** |
| Returns as often as needed | 92 / 8 / 0, none out | 65 / 27 / 7, 1% out | 5 / 21 / 28, **45% out** |
| Two returns, missions 04 and 05 at mission 03's speeds | 93 / 7 / 0, none out | 73 / 23 / 2, 2% out | 18 / 34 / 28, **21% out** |
| **Returns as often as needed, missions 04 and 05 at mission 03's speeds** (run after the owner chose unlimited returns) | 92 / 8 / 0, none out | 73 / 22 / 3, 1% out | 16 / 33 / 26, **25% out** |

**The Producer's worry is real for average captains.** Under the rules as proposed, four in ten run out of boats, mostly at m05n (21% of all average stories end there) and m04n (9%). Average pilots lose a boat on the first trip of m05n in more than half of stories (0.56 boats per story, against 0.15 or less on any other moon). That is the mission that starts at 1.8×. Strong and expert pilots almost never run out.

**2. Returns**

| | Expert | Strong | Average |
|---|---|---|---|
| Returns per story (two-return limit) | 10.2 | 9.0 | 5.9 |
| Moons cleared, of 6: two returns / as needed | 4.9 / 5.7 | 4.0 / 4.8 | 2.1 / 2.7 |
| Boats lost per 100 returns | 0.5 | 2.7 | 13.8 |

Returns are close to free for good pilots and costly for average ones: one return in seven costs an average pilot a boat, with those aboard. Two fixes were tried on the average and strong pilots:
- **Going back only with full shields (3):** fewer average captains run out (30%), but fewer are saved (36.5 on the *Lantern*, from 39.5).
- **Topping returns up to 3 shields:** worse. The pilot goes back more often, and 53% run out.

The loss is not mainly on returns; it is mission 05's speed.

**3. The loophole** (crashing the empty 4-seater at m00n to fly m00n and m01n in the 8-seater) **does not pay.** Experts save 68.1 against 68.0 playing straight, strong pilots 61.9 against 62.5. Average pilots save fewer (33.3 against 39.5), and 68% then run out of boats. A spare boat is worth more than the extra seats. No rule is needed against it.

**4. The counts at the end** (two-return limit; with returns as needed in brackets)

| | Expert | Strong | Average |
|---|---|---|---|
| On the *Lantern*, of 70 | 68.0 (68.9) | 62.5 (63.4) | 39.5 (39.0) |
| Left behind | 1.8 (0.9) | 5.6 (4.7) | 18.9 (19.4) |
| Dead | 0.2 | 2.5 | 12.8 |
| Brought home from m06n, of 20 | 11.9 | 10.5 | 3.5 (6.0 of those who reach it) |
| *Lantern* full after mission 03 (36) | 33% (72%) | 12% (28%) | 0% |
| *Lantern* full after mission 05 (70) | 26% (66%) | 4% (12%) | 0% |

Never going back saves about 44 for good pilots, so returns are worth about 20 people to them. Returns as often as needed change the people saved by less than one, but double how often the *Lantern* is full. The script's rare ending, nobody left behind, is reached by two in three expert stories with unlimited returns, and one in four with two. That is not rare for an expert.

**5. Length:** 15 to 16 minutes of flight for expert and strong pilots with returns, at most about 20; 11 minutes without returns; 12 to 13 for average pilots, whose stories often end early. Stops and story screens are not counted.

*"As often as needed" was flown with a cap of six returns per moon; no pilot came near it on a moon that still held people it could reach.*

With gentler missions and unlimited returns (the owner's choice): on the *Lantern* 68.8 / 64.2 / 45.1 of 70, left behind 1.1 / 4.8 / 17.8, dead 0.3 / 1.7 / 10.3, home from m06n 11.9 / 10.7 / 3.9, the *Lantern* full after mission 05 in 66% / 15% / 0% of stories; at most about 19 minutes of flight.

**What I would now propose**

- **Missions 04 and 05 gentler in story:** **decided by the owner** ("yes, gentler missions 04 and 05"). Start them at mission 03's speed (1×) rather than 1.4× and 1.8×. That halves how often average captains run out (41% to 21%) and costs good pilots nothing. Mission 06 can stay at 2.2×: it is the optional, all-or-nothing one.
- **Returns:** ~~at most two per moon~~ **decided by the owner: not limited** ("it's a risk assessment decision from a captain/pilot"). With gentler missions, a quarter of average captains then run out of boats (45% at arcade speeds).
- **Average captains still run out one time in four, even with gentler missions.** If that is too often, the next lever is a fourth boat, or a boat lost only when it had people aboard. I have not measured either.

The harness is in the repo on the owner's word, in `sim/story/`: `storySim.ts` holds the rules and the pilot, and `npm run sim:story` flies the decided rules (`SIM_RUNS` stories per pilot, 100 by default, about half a second each) and writes a summary to `sim/story/out/summary.md`. It is typechecked and linted with the game but does not ship and does not run with `npm test`. The *Lantern* lost on automatic (2 in 10, decided by the owner) is story chance outside the flight rules, so it is not in the harness.

**What was not measured:**
- people who park to dig wells
- the stops and story screens
- the ore kept (this pilot always drops it)
- mission 06 at the proposed 2,000 pc
- the *Lantern*'s crew question

## The name Lightboat

Decided by the owner on 2026-11-21: the game is called **Lightboat**. "Asteroids Galore" was a temporary, technical name from the start. The name was chosen on a search of public databases, ahead of any trademark attorney's search (see [Still open](#still-open-for-the-name)). Renamed in 0.5.0 wherever a player sees the name; the address and what the game keeps on the device keep the old one (see "What the rename touched").

### Why this name

- **It reads three ways,** all true of the game: a boat of light (the ship is drawn in lines of light), a light boat (the small, nimble ship the player may keep), and one letter from "lifeboat" (the rescue).
- **It works without the story,** and it sits well with the story's rescue tender, the *Lantern*.
- **In the story the first reading is literal.** The lines of a lightboat's hull are made of light0re, the light-storing ore the moon was mined for (the owner's word for it, 2026-11-22; see [Story](#story)).
- **The old name carries a risk.** "Asteroids" is a long-standing Atari trademark for video games, and stores act on trademark complaints.
- **It is a rare real word** for a small lightship, a vessel that carries a light as an aid to navigation. The Game Writer found it in Dictionary.com (an Americanism of 1825–35) and in Wiktionary; it was not found as an entry of its own in Merriam-Webster.

### What the check found (2026-11-21)

A search of public databases, not legal clearance.

| Where | Result |
|---|---|
| App Store (US, UK, Germany), Google Play (US), Steam, itch.io | No game or app with the name |
| USPTO | No results, live or dead |
| TMview (EU, UK, US, WIPO and other offices) | Three marks containing the word: two in China (software services; lighting) and one in Japan |
| Domains free | lightboat.app, lightboat.dev, lightboat.game, lightboatgame.com, playlightboat.com |
| Domains taken | lightboat.com (for sale through a broker), lightboat.games, lightboat.net, lightboat.io |

- **A Beijing game studio trades as LightBoat Innovations** (轻舟创游, lightboat.games, founded 2023). Nothing was found under its name on the Western stores. It makes a release in China awkward.
- **Japan has a registered mark,** LIGHTBOAT combined with the letters LW, held by Lightworks Corp. of Tokyo until 2032. Its goods include video game programs and application software.
- **Two entertainment companies use the name:** Lightboat Media in London and Lightboat Entertainment in Australia, both in children's content. Neither makes games.
- **Not checked:** social media handles, unregistered use, and applications too recent to be indexed.

### What the rename touched (0.5.0)

Renamed, because players see it:

- **The start screen title:** the word drawn as `LIGHTB0AT`, with a digit zero in place of the O (the owner: "let's try 0 instead of O", kept cyan with its glow), outlined in the ship's cyan line of light (`#5ff5ff`), black inside so the grid does not show through, one colour, 58 units at weight 800, centred with its baseline a third of the way down plus 26: the owner's choice from the Game Designer's three designs ("C, but without a ship"). It replaces the two lines `ASTEROIDS` over `GALORE`. The zero is the device font's own, so it is slashed on Apple devices and may be dotted or plain elsewhere; the Game Designer has offered the owner a drawn zero to make it the same everywhere. Only the drawn title has the zero: the page, the app's name, the share text and the README spell it Lightboat.
- **The page:** its title, the canvas label and the Apple home-screen title, all `Lightboat`.
- **The installed app:** name and short name `Lightboat`. A phone that already has the app keeps showing the old name until it refreshes the app's details, which can take a day or a reinstall: a stale name is not a failed deploy.
- **The share message and its title:** "Made it home in Lightboat: …" and "I saved … crew in Lightboat …".
- **The README and the heading of these notes.**

Kept, because nobody reads them or changing them would break something:

- **The web address and the Firebase project** (`asteroids-galore.web.app`). A project id cannot be changed, and shared links must keep working; a new address would need a custom domain or a second Hosting site redirecting the old one. The README says why the address still carries the old name.
- **The keys of what is kept on the device** (`asteroids-galore-best-v6` and its end key, the mute, music and frame-rate switches), so no player loses a best or a setting.
- **The package name, the folder, the Firestore fields and the emulator project.**
- **The app icons** carry no text.

Searched for anywhere else the old name could reach a player: the page description and the manifest's description name no game, and there are no social preview tags or error messages with the name. Checked by a test (NAME-01) and in a browser at desktop and phone width.

### Still open for the name

- **A trademark attorney's search** in the countries of release, before a store release or any money spent on the name.
- **Japan and China.** Whether they matter enough to settle the registered mark and the Beijing studio first.
- **The web address.** It keeps the old name; which domain to take, and when, is undecided.

## Tuning

The main numbers sit in `src/game/tuning.ts`:

| Constant | Meaning |
|---|---|
| `FIELD_W`, `FIELD_H`, `STEP` | The fixed play field and the fixed simulation step |
| `startSpeed`, `SPEED_GAIN` | Speed a level starts at, and how much it gains over the level's parsec target |
| `missCost` | Share of a mission's score that each crew member left behind takes: 5% in every ship |
| `LEVEL_MIN_TIME` | Minimum seconds in a level before the wormhole can appear |
| `levelTarget` | Parsecs to fly per level |
| `SHIPS`, `CHOICES` | Number of ships, and the missions after which the next one up is offered |
| `shipSeats`, `shipGrid`, `shipRadius`, `handling` | Per ship: seats, their rectangle on the hull, size and steering speed |
| `CREW_MASS` | Extra mass for each crew member on board |
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

`window.__game` (built in `src/debugHook.ts`) exposes read-only state (`state`, `seed`, `level`, `score`, `distance`, `saved`, `lost`, `missed`, `onboard`, `shipType`, `wells`, `wormhole`, `drops`, `results`, `slowmo`, `shields`, `grace`, `asteroids`, `ship`) and a few helpers used by the automated checks: `skipLevel()` meets the current level's goals immediately, `fill(n)` sets the crew on board, and `spawnRescue()` / `spawnDilemma()` spawn rescue rocks on demand.

## Status

Difficulty and feel are still being tuned by hand. What is planned next is tracked in `project-task-list.md`; how the game is tested is in `../test/test-documentation.md`.

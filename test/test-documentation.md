# Test Documentation

Tests run with Vitest and live under `test/`.

- `npm test` — everything that needs no emulator.
- `npm run test:rules` — the Firestore rules tests in `test/rules/`, run inside the Firestore emulator (needs Java).

## Strategy

The game is a real-time canvas simulation driven by `Math.random`, so most behaviour is checked as a whole: a scripted pilot plays seeded runs against a fake browser, and the result is compared with a recorded trace. Small pure pieces also have direct unit tests.

## Golden traces — `test/golden.test.ts`

- **What is compared:** every 20 frames, the game state read through `window.__game` (state, level, shields, score, crew counts, ship position and size, asteroid count and positions, wells, wormhole, shield drops, slow motion) and a hash of every canvas call and property set made since the previous sample.
- **How a run is driven:** `test/helpers/harness.ts` fakes `window`, `document`, the 2D context, `localStorage`, `performance` and `requestAnimationFrame`, seeds `Math.random`, and steps frames at 60 fps. A scripted pilot presses keys, flies into wormholes, takes the bigger ship at every stop between missions (right arrow; Enter in the fleet), and uses the debug hook to skip levels and spawn rescues so that every level, shield drops, the two-crew pair, a run that goes home and a game over are all reached. One frame of the fake screen is one fixed step of the game.
- **Where the expected values came from:** `test/fixtures/golden-traces.json` was first recorded from the single-file prototype at commit `33025ec` and has been re-recorded with every intended change to the game since, last for the seven-mission run.
- **When the game changes on purpose:** re-record with `UPDATE_GOLDEN=1 npm test` and review the diff of the fixture.

| ID | Case | Status |
|---|---|---|
| GOLD-01 | Seed 1: pilot plays through all seven missions and goes home | passing |
| GOLD-02 | Seed 2: pilot steers at random, loses shields, game over and retry | passing |
| GOLD-03 | Seed 5: two-crew pairs spawned on demand, slow motion, full ship | passing |
| GOLD-04 | Seed 4: touch input instead of keys, with window resizes mid-run that must not change the game | passing |
| GOLD-05 | Each scenario reaches the states it is meant to cover (guards against a trace that tests nothing) | passing |

## Unit tests

| ID | File | Case | Status |
|---|---|---|---|
| TUNE-01 | `tuning.test.ts` | Parsec target per level is 500, 750, 1250, 2000, 2500, 3000, 3500; there are 7 levels | passing |
| TUNE-02 | `tuning.test.ts` | Three ships with 4, 8 and 12 seats, each in a full rectangle (2 × 2, 2 × 4, 3 × 4); a bigger ship is offered after missions 2 and 4 only | passing |
| TUNE-03 | `tuning.test.ts` | Steering speed belongs to the ship: 100%, 80%, 70% | passing |
| TUNE-04 | `tuning.test.ts` | Ship radius belongs to the ship: 13, 17.5, 20, each step more than 10% bigger | passing |
| TUNE-05 | `tuning.test.ts` | Gap between crews is 11–15 s on level 1 and 15–20 s on levels 2 to 7 | passing |
| TUNE-06 | `tuning.test.ts` | One speed slope: every level gains 1.3× over its target from its starting speed (1× on levels 1–4, then 1.4×, 1.8×, 2.2×) and keeps rising past it; no second gear and no ceiling | passing |
| TUNE-07 | `tuning.test.ts` | Shields: 3 to start, 5 at most; 2 drops on level 4, 6 on level 5, 4 on level 6, none elsewhere | passing |
| TUNE-08 | `tuning.test.ts` | The field is 400 × 720, the step 1/60 s, and the wormhole waits 16, 19, 22, 25, 28 s | passing |
| SPAWN-01 | `spawn.test.ts` | Stranded crew are on planetoids; plain rocks carry nobody | passing |
| SPAWN-02 | `spawn.test.ts` | On level 1 every planetoid has a single crew | passing |
| SPAWN-03 | `spawn.test.ts` | A two-crew pair is two planetoids (1 and 2 crew) with two plain rocks as escorts | passing |
| SPAWN-04 | `spawn.test.ts` | Level 1 never shows a two-crew pair, even when one is due; level 2 does | passing |
| SPAWN-05 | `spawn.test.ts` | Flying across a planetoid costs no shield, leaves it whole and picks up its crew; a rock costs a shield and is destroyed | passing |
| SPAWN-06 | `spawn.test.ts` | The first planetoid of a run appears at the 200 pc mark, not before | passing |
| SPAWN-07 | `spawn.test.ts` | Planetoids carry more crew on later levels: 1 on level 1, 1–3 on levels 2 and 3 (more on 3), 2–4 on levels 4 to 7 | passing |
| LEVEL-01 | `levels.test.ts` | Flying into a wormhole stops on the results screen, delivers the crew, and records the level's saved, missed and distance | passing |
| LEVEL-02 | `levels.test.ts` | The results screen waits for a tap, ignores one in its first 0.7 s, flies no distance while up, and then starts the next level with 3 shields | passing |
| LEVEL-03 | `levels.test.ts` | Each level's row counts from where that level began | passing |
| LEVEL-04 | `levels.test.ts` | The wormhole of mission 7 is the way home: it ends the run as `won`, delivers the crew and saves the best with how the run ended; the wormholes of missions 4 and 6 lead to a results screen | passing |
| LEVEL-06 | `levels.test.ts` | A destroyed ship loses only the mission in flight: its row has nobody saved and the crew lost, and the best saved is what earlier missions banked, with nothing taken off | passing |
| LEVEL-05 | `levels.test.ts` | A new run starts with no results | passing |
| LEVEL-07 | `levels.test.ts` | Speed keeps rising with the parsecs flown, far past the target: no second gear and no ceiling | passing |
| LEVEL-08 | `levels.test.ts` | A missed wormhole returns after a wait dealt from the shuffled set: each of the five waits exactly once in every five; the first wormhole of a level does not wait | passing |
| LEVEL-09 | `levels.test.ts` | In mission 7 every wormhole arrives with a shield in the same row, mirrored on the opposite side and too far to take both, on a random side; in missions 1–6 the wormhole comes alone | passing |
| LEVEL-10 | `levels.test.ts` | A shield drop adds a shield, up to 5; spares carry into the next mission, and a ship with fewer than 3 is topped up to 3 | passing |
| LEVEL-11 | `levels.test.ts` | Mission 4 offers 2 shields, mission 5 offers 6 and mission 6 offers 4, evenly spaced by distance over the first two-thirds; every second one is a row of 2 crew, 3 crew and the shield between two rocks; missions 3 and 7 have no such drops | passing |
| LEVEL-12 | `levels.test.ts` | Crew do not change the ship's size or its steering: empty, half full and full, the same ship is as big and moves as far to the side; they only add mass | passing |
| LEVEL-17 | `levels.test.ts` | The bigger the crew, the sooner the well forms: time parked counts by the ship's mass, so the well is at full depth after 6 seconds empty and 2.3 seconds with 32 aboard, and is deeper after one second with every step up in crew | passing |
| SHIP-01 | `ships.test.ts` | Every run starts in ship 1 (4 seats, radius 13), whatever the last run flew | passing |
| SHIP-02 | `ships.test.ts` | After missions 1, 3 and 5 nothing is on offer, in any ship: a tap anywhere or a key moves on in the same ship; a steering key alone does not | passing |
| SHIP-03 | `ships.test.ts` | After missions 2 and 4 the ship in use and the next one up are on offer: a tap on the left half keeps, on the right half upgrades (the middle counts as right, taps outside the field as the nearer side); Space and Enter do nothing; the left and right arrows keep and upgrade | passing |
| SHIP-04 | `ships.test.ts` | A choice made in the first 0.7 seconds of the screen is ignored, by tap or by key | passing |
| SHIP-05 | `ships.test.ts` | One step at a time: a player who always upgrades flies ships 1, 1, 2, 2, 3, 3 (4, 4, 8, 8, 12, 12 seats) in missions 1–6 | passing |
| SHIP-06 | `ships.test.ts` | A declined upgrade is gone for the run: declining after mission 2 is offered the 8-seater again after mission 4 and ends with ship 3 out of the fleet; there is no way back down before the fleet | passing |
| SHIP-07 | `ships.test.ts` | After mission 6 the fleet is every ship flown in the run and nothing new; a tap in a ship's column chooses it, a smaller one included; a run that never upgraded has nothing to choose and any tap or key moves on | passing |
| SHIP-08 | `ships.test.ts` | In the fleet the arrows move a mark that starts on the ship in use and stops at either end; Space or Enter takes the marked ship | passing |
| SHIP-09 | `ships.test.ts` | Seats, size and steering are the ship's in whatever mission it flies: each bigger ship moves less far to the side, ship 3 at 70% of ship 1; a new ship grows into its size over the first moments | passing |
| SHIP-10 | `ships.test.ts` | A ship takes only as many crew as it seats: a 4-seat ship in mission 6 takes 4 of 6 from a planetoid, and the two it had no seat for are not missed | passing |
| SHIP-11 | `ships.test.ts` | Each mission's result carries its ship, and the finished run carries the list, the unfinished mission included, and the ship it ended in | passing |
| LEVEL-13 | `levels.test.ts` | Mission 5 starts at 1.4× | passing |
| LEVEL-14 | `levels.test.ts` | Crew who drift past a full ship are never counted as missed, before the mission's wormhole or after it; of a crew bigger than the free seats only as many as there were seats for are counted; with free seats they always count | passing |
| LEVEL-15 | `levels.test.ts` | A full ship is sent no planetoids: no single rescue and no two-crew pair when one is due, and a crew-or-shield row arrives as a plain shield drop; when a seat opens the next planetoid follows after 4 seconds, not at once | passing |
| LEVEL-16 | `levels.test.ts` | A hit that burns a shield throws one crew member off the ship: one fewer on board, one more missed, a figure drifting away, and not counted as lost with the ship; with nobody aboard it costs only the shield; with no shield left it destroys the ship as before | passing |
| FIELD-01 | `levels.test.ts` | The play field is always 400 × 720; a window only scales and centres it | passing |
| SEED-01 | `levels.test.ts` | A run is dealt from its seed: the same seed and inputs give the same rocks, whatever was dealt before; another seed gives another run | passing |
| SEED-02 | `levels.test.ts` | The seed on the start screen is the one the first run uses; every run after it gets a new one | passing |
| REC-01 | `records.test.ts` | The best score loads from storage; missing or unreadable storage gives 0 | passing |
| REC-02 | `records.test.ts` | A higher score is saved and reported as new, with how that run ended; an equal or lower one is not and leaves the saved ending alone; a missing or damaged ending reads as a plain lost run | passing |
| REC-03 | `records.test.ts` | Bests saved under earlier rules (distance, crew, the four-mission score, the seven-mission score before the flat 5% penalty, the five ships of 0.4.x) are not read as a score | passing |
| REC-04 | `records.test.ts` | A storage that throws on write does not break the run | passing |
| REC-05 | `records.test.ts` | A best from the cloud raises the local best and is stored with how it ended; a lower one is ignored; neither counts as a new best | passing |
| INP-01 | `input.test.ts` | Left, right, both (hold course) and neither, for keys and pointers | passing |
| INP-02 | `input.test.ts` | Sliding a pointer across the middle switches side; releasing clears it | passing |
| INP-03 | `input.test.ts` | Losing focus clears all held input | passing |
| TIME-01 | `timeScale.test.ts` | No slow motion: scale is 1 | passing |
| TIME-02 | `timeScale.test.ts` | Slow motion eases in over 0.2 s to 0.3 and back out over 0.45 s | passing |
| SUM-01 | `runSummary.test.ts` | A lost run: outcome `over`, what its finished missions banked with nothing taken off for the crash, whole parsecs, the ship it ended in and the ship of each mission | passing |
| SCORE-01 | `runSummary.test.ts` | A mission scores its own whole parsecs times its own crew saved; nobody saved, or no distance, scores 0 | passing |
| SCORE-02 | `runSummary.test.ts` | A destroyed ship loses only the mission in flight: that mission scores 0 and takes nothing off the others | passing |
| SCORE-03 | `runSummary.test.ts` | Each crew member left behind takes 5% of the mission's score in every ship and every mission, down to nothing at 20 missed; a missed shipful costs 60% in ship 4 and 90% in ship 5 | passing |
| SCORE-04 | `runSummary.test.ts` | The run's score is its missions added up: parsecs do not multiply another mission's crew | passing |
| SCORE-05 | `runSummary.test.ts` | Crew on board are worth this mission's parsecs so far, less what it has missed | passing |
| SUM-02 | `runSummary.test.ts` | A run that went home has outcome `won`, scores its missions added up, and records the parsecs flown in mission 7; so does a run lost in mission 7 | passing |
| CFG-01 | `cloud/config.test.ts` | No `VITE_FIREBASE_*` values: the cloud is off | passing |
| CFG-02 | `cloud/config.test.ts` | A complete config is passed through; a partial one turns the cloud off | passing |
| CFG-03 | `cloud/config.test.ts` | With the emulator flag only the project ID is needed | passing |
| CFG-04 | `cloud/config.test.ts` | The cloud is always off in test mode | passing |
| SYNC-01 | `cloud/resultsSync.test.ts` | On start: signs in, and a cloud best higher than the local one is absorbed together with how that run ended | passing |
| SYNC-02 | `cloud/resultsSync.test.ts` | On start: a local best higher than the cloud's is uploaded | passing |
| SYNC-03 | `cloud/resultsSync.test.ts` | A finished run is saved under the signed-in user | passing |
| SYNC-04 | `cloud/resultsSync.test.ts` | The best is uploaded after a run only when it improved | passing |
| SYNC-05 | `cloud/resultsSync.test.ts` | A failed sign-in is retried at the next run; nothing throws | passing |
| SYNC-06 | `cloud/resultsSync.test.ts` | A failed save is reported to the log and does not throw | passing |
| CALL-01 | `cloud/callsign.test.ts` | The same account always gets the same callsign; different accounts usually differ | passing |
| CALL-02 | `cloud/callsign.test.ts` | Every possible callsign is two capital words and two digits, in the form the rules accept | passing |
| BOARD-01 | `cloud/leaderboard.test.ts` | Rows are ranked 1..n from the highest value, cut to the limit | passing |
| BOARD-02 | `cloud/leaderboard.test.ts` | The player's row uses their current best and how it ended, not the stale values from the server, and is marked | passing |
| BOARD-03 | `cloud/leaderboard.test.ts` | A player outside the top is added last with rank = players above + 1 | passing |
| BOARD-04 | `cloud/leaderboard.test.ts` | A player with no best yet is not listed; an empty board gives no rows | passing |
| SYNC-07 | `cloud/resultsSync.test.ts` | Bests are saved together with how the run ended and the player's callsign | passing |
| SYNC-08 | `cloud/resultsSync.test.ts` | The board is delivered after start, and again after a run with the new best in place | passing |
| SYNC-09 | `cloud/resultsSync.test.ts` | A board that fails to load is logged; the run is still saved | passing |
| HUD-01 | `render/hud.test.ts` | With a board loaded, both end screens show a `LEADERBOARD` link and not the board itself; no other screen shows the link | passing |
| HUD-02 | `render/hud.test.ts` | An end screen is a table with a row per mission (distance, crew saved as a multiplier, the crew missed and what they cost as a percentage, score) and no total row; the score they add up to with the best right under it; then a `NOT SAVED` section. The title of a run that went home is `MADE IT HOME`. A crash row shows the crew lost, the missed without a percentage and a dash for its score, and takes nothing off the total; seven rows are listed for a full run; the percentage is the mission's own (3 missed read −15%, −9%, −6% and −4.5% in missions 4 to 7) | passing |
| HUD-03 | `render/hud.test.ts` | With no board, or an empty one, there is no link and no board | passing |
| SHARE-01 | `cloud/share.test.ts` | `/s/{id}` gives the run ID; other paths, and IDs with odd characters, give none | passing |
| SHARE-02 | `cloud/share.test.ts` | The link is `origin/s/{id}`; the message leads with the crew saved (or with `Made it home`) and gives the score, not the distance | passing |
| SHARE-03 | `cloud/share.test.ts` | Uses the share sheet when there is one; a cancelled sheet is not an error and copies nothing | passing |
| SHARE-04 | `cloud/share.test.ts` | Without a share sheet the link is copied; with neither, or when copying fails, the result is `failed` | passing |
| SYNC-10 | `cloud/resultsSync.test.ts` | A run is saved with the player's callsign, and `submit` resolves with the run's ID | passing |
| SYNC-11 | `cloud/resultsSync.test.ts` | When the save fails `submit` resolves with null | passing |
| SYNC-12 | `cloud/resultsSync.test.ts` | A shared run is loaded by ID; a missing run or a failure gives null | passing |
| HUD-04 | `render/hud.test.ts` | The `SHARE` button is drawn on both end screens only when a link is ready; it reads `COPIED` right after a copy | passing |
| HUD-05 | `render/hud.test.ts` | The button sits inside the play field, in the top right corner | passing |
| HUD-06 | `render/hud.test.ts` | The start screen shows a shared run: callsign, score, and `MADE IT HOME` with the crew saved for a run that went home, crew saved and distance for a lost one | passing |
| HUD-07 | `render/hud.test.ts` | The start screen draws the title, the controls, the prompt and, at the foot, the version and the seed of the next run as six characters (`v0.4.3 · SEED 4F2A9C`); no other screen shows the seed | passing |
| HUD-11 | `render/hud.test.ts` | The leaderboard screen replaces the end screen: `TOP SCORES`, every row with rank, callsign, score and how many missions the run finished; a run that reached mission 7 also says how it ended, its parsecs there and the seats of its ship (left out for an entry without a ship); a way back | passing |
| HUD-12 | `render/hud.test.ts` | The leaderboard link sits top left, clear of the share button, and is big enough to tap | passing |
| HUD-10 | `render/hud.test.ts` | Between levels, under `MISSION N COMPLETE`: the same table as the end screens, a numbered row for every mission flown so far and `TOTAL`; `TAP TO CONTINUE` only when no ships are on offer | passing |
| HUD-09 | `render/hud.test.ts` | During a run only one number shows: what the crew on board are worth (this mission's parsecs × on board, less the share the crew missed in it cost) while anyone is aboard, otherwise the score; no `0` | passing |
| HUD-08 | `render/hud.test.ts` | During a run the big number is the score (nothing is shown while it is 0 and nobody is on board), with `SAVED` and `MISSED` counts; the distance is not the headline | passing |
| HUD-13 | `render/hud.test.ts` | The mission counter is out of 7; the shield row shows 3 arcs, or as many as the ship holds when it has spares | passing |
| HUD-14 | `render/hud.test.ts` | `CREW n/N` is yellow while there are free seats and green when the ship is full, and is drawn larger for a moment when it fills | passing |
| HUD-15 | `render/hud.test.ts` | After missions 2 and 4 the ship in use and the next one up stand under the table, each inside its own half of the field, drawn with their seats; no caption, no prompt; at every stop and in the fleet the biggest hull on offer fits its frame, across and nose to tail; after missions 1, 3 and 5 there are no ships and the prompt is shown | passing |
| HUD-16 | `render/hud.test.ts` | The fleet after mission 6: a row of the ships flown (at most three), each inside its own share of the width and wide enough to tap, ending above the waiting ship; the ship marked has the heavy frame; a run with one ship gets the prompt instead | passing |
| PWA-01 | `pwa/manifest.test.ts` | Manifest: name, short name, start URL and scope `/`, full screen, portrait, and the same dark colour as the page's `theme-color` | passing |
| PWA-02 | `pwa/manifest.test.ts` | Every manifest icon exists in `public/` as a PNG of the stated size; there are 192 and 512 px `any` icons and a 512 px `maskable` one | passing |
| PWA-03 | `pwa/manifest.test.ts` | `index.html` links an `apple-touch-icon` (180 px PNG) and a favicon, and both files exist | passing |
| PWA-04 | `pwa/manifest.test.ts` | Hosting serves `sw.js`, `registerSW.js`, `workbox-*.js` and the manifest with `no-cache` | passing |
| UPD-01 | `pwa/updates.test.ts` | Only the start screen allows an update; play, the stop between missions and the end screens do not | passing |
| UPD-02 | `pwa/updates.test.ts` | An update found during a run waits, and is applied once, as soon as the game is on the start screen | passing |
| UPD-03 | `pwa/updates.test.ts` | With no update waiting nothing is applied, on any screen | passing |

## Firestore rules — `test/rules/firestore.rules.test.ts`

| ID | Case | Status |
|---|---|---|
| RULES-01 | A signed-in player can create a well-formed run of their own: lost, lost in mission 7, or gone home from mission 7 | passing |
| RULES-02 | A run for another user, or without sign-in, is refused | passing |
| RULES-03 | Malformed runs are refused: extra field, missing field, negative distance, level 0 or 8, a run that went home from any mission but 7, mission-7 parsecs on a run that ended earlier or exceeding the whole run or fractional, a client-set time, a badly formed callsign | passing |
| RULES-08 | A run's score cannot exceed its distance times crew saved, and cannot be negative or fractional; a run that went home cannot have crew lost | passing |
| RULES-09 | A leaderboard entry written under earlier rules (only `bestScore`, or the five ships' `best5`) counts as 0 and can be replaced by one of the new kind (`best6`), which then cannot go down | passing |
| RULES-10 | A run must say which ship each mission was flown in: a list of ships 1–3, one per mission reached, starting with ship 1, whose last entry is the ship the run ended in; a board entry must carry `bestShip`, 0–3 | passing |
| RULES-04 | Runs cannot be changed or deleted; anyone can read a run by its ID; nobody can list runs | passing |
| RULES-05 | A player can create and update their own entry (best score, how that run ended, callsign), not another player's; anyone can read entries and query the board, signed in or not | passing |
| RULES-06 | The best score cannot go down; malformed entries are refused, including the old score field, an ending that does not hold together (home from a mission other than 7, level 8, mission-7 parsecs on an earlier mission) or is missing, and a missing or badly formed callsign | passing |
| RULES-07 | Everything else is closed | passing |

## Checked by hand

- Three ships (2026-11-20, v0.4.3): the stops after missions 2, 3 and 4, a run that declined at mission 2, and the fleet of three and of two, drawn headlessly with the game's own render code (the browser pane was hidden, which pauses the game): the ships stand inside their frames, mission 3 shows only the prompt, the fleet's heavy frame is on the ship in use, and nothing reaches the waiting ship. **Not checked:** on a phone or by hand; how the 8- and 12-seaters feel.
- New ship numbers (2026-11-20, v0.4.2), on the dev server with the game driven through the debug hook and synthetic taps: mission 1 shows `CREW 0/4` and its results read as before; upgrading at every stop reaches ship 5; after mission 5 ships 4 and 5 stand inside their frames; the five-ship fleet fits above the waiting ship; in mission 6 the 18 pips sit in two rows of nine and ship 5 stops 35 field units from the edge. Seen: the `18 SAVED` label rises through the foot of the fleet's frames for about a second. **Not checked:** on a phone or by hand; how any ship feels; a two-crew pair flown in ship 5.
- Five ships (2026-11-15, v0.4.0), on the dev server with the game driven through the debug hook and synthetic taps: after mission 1 a tap moves on in ship 1; after mission 2 the two framed ships appear under the table and a tap on the right upgrades; upgrading at every stop reaches the five-ship fleet after mission 6, which fits above the waiting ship with ship 5 marked; a tap in the middle column starts mission 7 in ship 3 with 8 seats. **Not checked:** on a phone, by hand, or with a real thumb; how any ship feels to fly; saving a run with ships to the live Firestore.
- The PWA on the production build (`npm run build && npm run preview`, 2026-11-14): the manifest and service worker are found and the page is controlled; with the preview server stopped the game reloads, a run starts, and a share link opens. An update published mid-run waited without reloading; on the start screen a waiting update applied and reloaded into the new version. **Not seen:** a waiting update applying on relaunch with the pane visible, and installing on a real phone.

- The seven-mission run in a browser against the emulators (2026-11-14), driven by script through the debug hook: shield drops appear on mission 5 and add a shield, the crew-or-shield row arrives with slow motion, the run goes home from mission 7, the run is saved as `won` with its mission-7 parsecs, and the leaderboard entry holds the best and how it ended. Seen by eye: the play screen on missions 1 and 5 and the game-over screen. **Not seen by eye:** the two-row crew pips, the mission-7 offer, the seven-row end screen and the board rows.
- Anonymous sign-in and the two writes against the emulators in a browser (`npm run emulators`, then `npm run dev`): one `runs` document per finished run, and `users/{uid}` holding the best score and callsign.
- The board on both end screens at phone size, with seeded players in the emulator: own row highlighted inside the top 5 and added below it when outside.
- Sharing in a browser against the emulators: the button appears after the run is saved, a tap on it copies the link and does not restart, and opening the link shows the run on the start screen.

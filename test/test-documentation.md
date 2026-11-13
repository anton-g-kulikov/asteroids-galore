# Test Documentation

Tests run with Vitest and live under `test/`.

- `npm test` — everything that needs no emulator.
- `npm run test:rules` — the Firestore rules tests in `test/rules/`, run inside the Firestore emulator (needs Java).

## Strategy

The game is a real-time canvas simulation driven by `Math.random`, so most behaviour is checked as a whole: a scripted pilot plays seeded runs against a fake browser, and the result is compared with a recorded trace. Small pure pieces also have direct unit tests.

## Golden traces — `test/golden.test.ts`

- **What is compared:** every 20 frames, the game state read through `window.__game` (state, level, shields, score, crew counts, ship position, asteroid count and positions, wells, wormhole, slow motion) and a hash of every canvas call and property set made since the previous sample.
- **How a run is driven:** `test/helpers/harness.ts` fakes `window`, `document`, the 2D context, `localStorage`, `performance` and `requestAnimationFrame`, seeds `Math.random`, and steps frames at 60 fps. A scripted pilot presses keys, flies into wormholes, and uses the debug hook to skip levels and spawn rescues so that every level, the two-crew pair, a win and a game over are all reached.
- **Where the expected values came from:** `test/fixtures/golden-traces.json` was recorded from the single-file prototype at commit `33025ec`, so a match means the refactor changed neither behaviour nor drawing.
- **When the game changes on purpose:** re-record with `UPDATE_GOLDEN=1 npm test` and review the diff of the fixture.

| ID | Case | Status |
|---|---|---|
| GOLD-01 | Seed 1: pilot plays through the levels to a finished mission | passing |
| GOLD-02 | Seed 2: pilot steers at random, loses shields, game over and retry | passing |
| GOLD-03 | Seed 3: two-crew pairs spawned on demand, slow motion, full ship | passing |
| GOLD-04 | Seed 4: touch input instead of keys, with a window resize mid-run | passing |
| GOLD-05 | Each scenario reaches the states it is meant to cover (guards against a trace that tests nothing) | passing |

## Unit tests

| ID | File | Case | Status |
|---|---|---|---|
| TUNE-01 | `tuning.test.ts` | Parsec target per level is 350, 450, 550, 650 | passing |
| TUNE-02 | `tuning.test.ts` | Seats per level are 2, 4, 8, 16 and never exceed 32 | passing |
| TUNE-03 | `tuning.test.ts` | Steering speed falls 8% per level and never below 50% | passing |
| TUNE-04 | `tuning.test.ts` | Ship radius grows per level and scales with the base unit | passing |
| TUNE-05 | `tuning.test.ts` | Gap between crews is 11–15 s on levels 1 and 2, 9–13 s on level 3, 8–11 s on level 4 | passing |
| SPAWN-01 | `spawn.test.ts` | Stranded crew are on planetoids; plain rocks carry nobody | passing |
| SPAWN-02 | `spawn.test.ts` | On level 1 every planetoid has a single crew | passing |
| SPAWN-03 | `spawn.test.ts` | A two-crew pair is two planetoids (1 and 2 crew) with two plain rocks as escorts | passing |
| SPAWN-04 | `spawn.test.ts` | Level 1 never shows a two-crew pair, even when one is due; level 2 does | passing |
| SPAWN-05 | `spawn.test.ts` | Flying across a planetoid costs no shield, leaves it whole and picks up its crew; a rock costs a shield and is destroyed | passing |
| LEVEL-01 | `levels.test.ts` | Flying into a wormhole stops on the results screen, delivers the crew, and records the level's saved, missed and distance | passing |
| LEVEL-02 | `levels.test.ts` | The results screen waits for a tap, ignores one in its first 0.7 s, flies no distance while up, and then starts the next level with full shields | passing |
| LEVEL-03 | `levels.test.ts` | Each level's row counts from where that level began | passing |
| LEVEL-04 | `levels.test.ts` | The last wormhole finishes the mission with no results screen | passing |
| LEVEL-06 | `levels.test.ts` | A destroyed ship adds a row for the unfinished level: nobody saved, the crew lost with the ship, and what was missed and flown in it | passing |
| LEVEL-05 | `levels.test.ts` | A new run starts with no results | passing |
| REC-01 | `records.test.ts` | The best score loads from storage; missing or unreadable storage gives 0 | passing |
| REC-02 | `records.test.ts` | A higher score is saved and reported as new; an equal or lower one is not | passing |
| REC-03 | `records.test.ts` | The old distance and crew bests are not read as a score | passing |
| REC-04 | `records.test.ts` | A storage that throws on write does not break the run | passing |
| REC-05 | `records.test.ts` | A best from the cloud raises the local best and is stored; a lower one is ignored; neither counts as a new best | passing |
| INP-01 | `input.test.ts` | Left, right, both (hold course) and neither, for keys and pointers | passing |
| INP-02 | `input.test.ts` | Sliding a pointer across the middle switches side; releasing clears it | passing |
| INP-03 | `input.test.ts` | Losing focus clears all held input | passing |
| TIME-01 | `timeScale.test.ts` | No slow motion: scale is 1 | passing |
| TIME-02 | `timeScale.test.ts` | Slow motion eases in over 0.2 s to 0.3 and back out over 0.45 s | passing |
| SUM-01 | `runSummary.test.ts` | A lost run: outcome `over`, score, whole parsecs, level reached, crew saved, lost and missed, seconds played | passing |
| SCORE-01 | `runSummary.test.ts` | The score is whole parsecs times crew saved; nobody saved, or no distance, scores 0 | passing |
| SCORE-02 | `runSummary.test.ts` | Crew lost with the ship are taken off the crew saved, never below zero | passing |
| SUM-02 | `runSummary.test.ts` | A finished mission has outcome `won` and scores parsecs times crew saved | passing |
| CFG-01 | `cloud/config.test.ts` | No `VITE_FIREBASE_*` values: the cloud is off | passing |
| CFG-02 | `cloud/config.test.ts` | A complete config is passed through; a partial one turns the cloud off | passing |
| CFG-03 | `cloud/config.test.ts` | With the emulator flag only the project ID is needed | passing |
| CFG-04 | `cloud/config.test.ts` | The cloud is always off in test mode | passing |
| SYNC-01 | `cloud/resultsSync.test.ts` | On start: signs in, and a cloud best higher than the local one is absorbed | passing |
| SYNC-02 | `cloud/resultsSync.test.ts` | On start: a local best higher than the cloud's is uploaded | passing |
| SYNC-03 | `cloud/resultsSync.test.ts` | A finished run is saved under the signed-in user | passing |
| SYNC-04 | `cloud/resultsSync.test.ts` | The best is uploaded after a run only when it improved | passing |
| SYNC-05 | `cloud/resultsSync.test.ts` | A failed sign-in is retried at the next run; nothing throws | passing |
| SYNC-06 | `cloud/resultsSync.test.ts` | A failed save is reported to the log and does not throw | passing |
| CALL-01 | `cloud/callsign.test.ts` | The same account always gets the same callsign; different accounts usually differ | passing |
| CALL-02 | `cloud/callsign.test.ts` | Every possible callsign is two capital words and two digits, in the form the rules accept | passing |
| BOARD-01 | `cloud/leaderboard.test.ts` | Rows are ranked 1..n from the highest value, cut to the limit | passing |
| BOARD-02 | `cloud/leaderboard.test.ts` | The player's row uses their current best, not the stale value from the server, and is marked | passing |
| BOARD-03 | `cloud/leaderboard.test.ts` | A player outside the top is added last with rank = players above + 1 | passing |
| BOARD-04 | `cloud/leaderboard.test.ts` | A player with no best yet is not listed; an empty board gives no rows | passing |
| SYNC-07 | `cloud/resultsSync.test.ts` | Bests are saved together with the player's callsign | passing |
| SYNC-08 | `cloud/resultsSync.test.ts` | The board is delivered after start, and again after a run with the new best in place | passing |
| SYNC-09 | `cloud/resultsSync.test.ts` | A board that fails to load is logged; the run is still saved | passing |
| HUD-01 | `render/hud.test.ts` | With a board loaded, both end screens show a `LEADERBOARD` link and not the board itself; no other screen shows the link | passing |
| HUD-02 | `render/hud.test.ts` | An end screen is a table (a row per mission and a `TOTAL` row, distance then crew saved as a multiplier), the score with the best right under it and no sum line, then a `NOT SAVED` section with the crew lost with the ship and the crew missed; nobody saved scores 0 | passing |
| HUD-03 | `render/hud.test.ts` | With no board, or an empty one, there is no link and no board | passing |
| SHARE-01 | `cloud/share.test.ts` | `/s/{id}` gives the run ID; other paths, and IDs with odd characters, give none | passing |
| SHARE-02 | `cloud/share.test.ts` | The link is `origin/s/{id}`; the message leads with the crew saved and gives the score, not the distance | passing |
| SHARE-03 | `cloud/share.test.ts` | Uses the share sheet when there is one; a cancelled sheet is not an error and copies nothing | passing |
| SHARE-04 | `cloud/share.test.ts` | Without a share sheet the link is copied; with neither, or when copying fails, the result is `failed` | passing |
| SYNC-10 | `cloud/resultsSync.test.ts` | A run is saved with the player's callsign, and `submit` resolves with the run's ID | passing |
| SYNC-11 | `cloud/resultsSync.test.ts` | When the save fails `submit` resolves with null | passing |
| SYNC-12 | `cloud/resultsSync.test.ts` | A shared run is loaded by ID; a missing run or a failure gives null | passing |
| HUD-04 | `render/hud.test.ts` | The `SHARE` button is drawn on both end screens only when a link is ready; it reads `COPIED` right after a copy | passing |
| HUD-05 | `render/hud.test.ts` | The button sits inside the play field, in the top right corner | passing |
| HUD-06 | `render/hud.test.ts` | The start screen shows a shared run: callsign, score, and `ALL MISSIONS COMPLETE` with the crew saved for a finished one, crew saved and distance for a lost one | passing |
| HUD-07 | `render/hud.test.ts` | With no shared run the start screen draws nothing extra | passing |
| HUD-11 | `render/hud.test.ts` | The leaderboard screen replaces the end screen: `TOP SCORES`, every row with rank, callsign and score, and `TAP TO GO BACK`; with no board the end screen stays | passing |
| HUD-12 | `render/hud.test.ts` | The leaderboard link sits top left, clear of the share button, also on a small phone, and is big enough to tap | passing |
| HUD-10 | `render/hud.test.ts` | Between levels, under `MISSION N COMPLETE`: a `MISSION` row and a `TOTAL` row, each with distance, crew saved as a multiplier and the score they make; then the mission's missed count and `TAP TO CONTINUE` | passing |
| HUD-09 | `render/hud.test.ts` | During a run only one number shows: what the crew on board are worth (`+parsecs × on board`) while anyone is aboard, otherwise the score; no `0` | passing |
| HUD-08 | `render/hud.test.ts` | During a run the big number is the score (nothing is shown while it is 0 and nobody is on board), with `SAVED` and `MISSED` counts; the distance is not the headline | passing |

## Firestore rules — `test/rules/firestore.rules.test.ts`

| ID | Case | Status |
|---|---|---|
| RULES-01 | A signed-in player can create a well-formed run of their own | passing |
| RULES-02 | A run for another user, or without sign-in, is refused | passing |
| RULES-03 | Malformed runs are refused: extra field, missing field, negative distance, level 5, a win below the last level, a client-set time, a badly formed callsign | passing |
| RULES-08 | A run's score must equal its distance times (saved − lost), or 0 when that is not positive; a finished mission cannot have crew lost | passing |
| RULES-09 | A leaderboard entry written before scores existed can be replaced by a scored one, which then cannot go down | passing |
| RULES-04 | Runs cannot be changed or deleted; anyone can read a run by its ID; nobody can list runs | passing |
| RULES-05 | A player can create and update their own entry (best score and callsign), not another player's; anyone can read entries, signed in or not | passing |
| RULES-06 | The best score cannot go down; malformed entries are refused, including the old distance and crew fields, including a missing or badly formed callsign | passing |
| RULES-07 | Everything else is closed | passing |

## Checked by hand

- Anonymous sign-in and the two writes against the emulators in a browser (`npm run emulators`, then `npm run dev`): one `runs` document per finished run, and `users/{uid}` holding the best score and callsign.
- The board on both end screens at phone size, with seeded players in the emulator: own row highlighted inside the top 5 and added below it when outside.
- Sharing in a browser against the emulators: the button appears after the run is saved, a tap on it copies the link and does not restart, and opening the link shows the run on the start screen.

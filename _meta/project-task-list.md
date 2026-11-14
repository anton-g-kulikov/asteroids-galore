# Project Task List

## Current status

The game is built from typed modules with Vite, has automated tests and Firebase Hosting config, saves finished runs to Firestore under an anonymous account, shows leaderboards with generated callsigns, and shares runs as links. This works against the local emulators. It is live at https://asteroids-galore.web.app; every push to `main` deploys Hosting through GitHub Actions.

## Next

The seven-mission competitive run, as planned in `game-design.md` under "Planned: the seven-mission run" (agreed 2026-11-14). Roughly in this order; each step should be playable on its own. What is still undecided is listed there under "Still open".

- **The same game on every device:** a fixed simulation step in place of the variable frame time, and a play field of one fixed shape in place of one sized from the window. Regenerate the golden traces.
- **Score rules:** crew left behind cost `1 − cap × (1 − 0.9^missed)` with a cap of 75%, replacing the flat `MISS_PERCENT`; a destroyed ship loses only the mission in flight, with no deduction from the banked score. Update the results tables, the pending score on the HUD, the run summary and the share text.
- **One speed slope:** remove second gear and the 4.5× ceiling (`MAX_SPEED`, `GEAR_AT`, `GEAR_RAMP`) so speed keeps rising with the parsecs flown in every mission.
- **Shuffled wormhole waits:** a missed wormhole returns after a wait dealt from a shuffled set (16, 19, 22, 25, 28 seconds), replacing `rand(15, 30)`.
- **Crew weight:** ship size and steering come from crew on board instead of the level, replacing `shipRadius` and `levelHandling`. Can land before the new missions.
- **Seven missions:** raise `LAST_LEVEL` to 7; extend `levelTarget`, `rescueGap`, `crewSize` and the seats (20, 24, 32) with a seat display that fits them; settle the starting speeds of missions 5–7 by playing. Update `firestore.rules` (level range, what a won run is) with their tests. Check the seven-row end-screen table on a short phone.
- **Mission 7, the way home:** its wormhole ends the run and records the score; letting it pass means flying on. Save how each run ended and how far mission 7 went.
- **Shields:** a ship holds at most 5, spares carry over, each mission refills to at least 3. Drops on mission 5 (6) and mission 6 (4), fixed in number and evenly spaced; some arrive as a choice between 2 crew, 3 crew and a shield. In mission 7 a shield arrives opposite every wormhole.
- **New things in missions 5–7:** dead stars, failing rescues, wrecked stations, angled asteroids and the drifting wormhole. Decide first whether they still belong (see "Still open").
- **The board:** reset it when the new rules land; show how each run ended.
- **Scores that can be checked:** seeded randomness, a recording of the inputs, and a server that replays a run before listing its score.
- **Tuning aids:** per-run records of where and how runs end, and a scripted pilot in the tests that sweeps speeds to find where survival collapses.
- Update the as-built sections and the tuning table in `game-design.md` as each piece lands, and move it out of the "Planned" section.
- **Parked:** shooting (see the design notes for why).

## Known gaps

- A run that ends before the first successful sign-in (for example, first visit while offline) is not saved to the cloud; its bests are uploaded at the next start.
- Scores are sent by the client, so the rules can only check that they are well-formed, not that they were really flown. Anyone willing to call the API by hand can put themselves on top of the leaderboard.
- On the mission-complete screen the ship is still drawn, and on short phones (under about 700 px tall) it can sit behind the lower rows of the crew board.
- Share links show the same generic preview in every chat app; a preview per result needs server rendering (a Cloud Function).
- Two accounts can be given the same callsign (there are about 100,000 combinations).
- The game does not play the same on every device. The frame time varies and is clamped at 0.05 seconds, so under 20 frames a second it runs in slow motion; and the play field is sized from the window, so resizing it changes the game. Both matter once scores are compared on one board.

## Done

- Score = parsecs × crew saved (2026-11-13): crew are saved when delivered through a wormhole, crew on board when the ship is destroyed are taken off the score, level 1 has 2 seats, one best and one `TOP SCORES` board. The leaderboard starts again: entries hold `bestScore` and the old `bestDistance` / `bestCrew` fields are no longer written or read. **The new Firestore rules must be deployed together with the new client** (`firebase deploy --only firestore:rules`); GitHub Actions deploys Hosting only.
- Deploys from GitHub (2026-11-12): repository secrets set, with a `github-action-deploy` service account on the Firebase project; CI installs Java 21 for the rules tests.
- First Firebase deploy (2026-11-12): project `asteroids-galore`, Firestore in `nam5` with the rules, anonymous sign-in, Hosting at https://asteroids-galore.web.app. Checked live: a run is saved, appears on the board, and its share link opens the game showing it.
- Sharing a result as a link: `SHARE` button on the end screens, `/s/{runId}` links that open the game with the run on the start screen. Checked in a browser against the emulators, with the clipboard path; the phone share sheet has not been tried on a real device.
- Leaderboard with generated callsigns: top 5 by distance on the game-over screen and by crew on the mission-complete screen, own row highlighted and ranked. Checked in a browser against the emulators with seeded players.
- Anonymous login and saved results: silent sign-in on load, one `runs` document per finished run, bests in `users/{uid}` and restored from there, Firestore rules with emulator tests, local development against the emulators. Checked in a browser against the emulators.
- Refactor to the usual stack: modules under `src/`, Vite, TypeScript, Vitest, ESLint, Firebase Hosting config and a deploy workflow. Scripted runs match the prototype (commit `33025ec`) in game state and in every canvas call. No gameplay or visual change.
- Prototype: four levels, lives, rescues, two-crew choices, gravity wells, end screen (see `game-design.md`)

# Project Task List

## Current status

The game is built from typed modules with Vite, has automated tests and Firebase Hosting config, saves finished runs to Firestore under an anonymous account, shows leaderboards with generated callsigns, and shares runs as links. This works against the local emulators. It is live at https://asteroids-galore.web.app; every push to `main` deploys Hosting through GitHub Actions.

## Next

Missions beyond 4, as planned in `game-design.md` under "Planned: missions beyond 4". Roughly in this order; each step should be playable on its own.

- **Decide first:** how many missions a run has (6 or 7 is the working assumption) and their parsec targets, by playing.
- **Missed penalty that scales:** replace the flat `MISS_PERCENT` per person with a share of the crew on offer in the mission; keep the count and its cost in the results table.
- **Crew weight:** ship size and steering come from crew on board instead of the level, replacing `shipRadius` and `levelHandling`. Can land before the new missions.
- **More missions:** raise `LAST_LEVEL`, extend `levelTarget`, `rescueGap`, `crewSize` and the seat table, and update `firestore.rules` (level range, won means the last level) with their tests. Reset the leaderboard. Check the end-screen table on a short phone.
- **Dead stars (mission 5):** fixed wells that pull the ship too.
- **Failing rescues (mission 6):** `SOS` rings that shrink and close.
- **Wrecked stations (mission 7):** harmless rescue objects with 4–8 crew; seats grow by a fixed step past 16, with a seat display that fits them.
- **Finale:** sideways-drifting wormhole, angled asteroids.
- Update the levels table and the tuning table in `game-design.md` as each piece lands, and move it out of the "Planned" section.
- **Parked:** shooting and shield drops (see the design notes for why).

## Known gaps

- A run that ends before the first successful sign-in (for example, first visit while offline) is not saved to the cloud; its bests are uploaded at the next start.
- Scores are sent by the client, so the rules can only check that they are well-formed, not that they were really flown. Anyone willing to call the API by hand can put themselves on top of the leaderboard.
- On the mission-complete screen the ship is still drawn, and on short phones (under about 700 px tall) it can sit behind the lower rows of the crew board.
- Share links show the same generic preview in every chat app; a preview per result needs server rendering (a Cloud Function).
- Two accounts can be given the same callsign (there are about 100,000 combinations).

## Done

- Score = parsecs × crew saved (2026-11-13): crew are saved when delivered through a wormhole, crew on board when the ship is destroyed are taken off the score, level 1 has 2 seats, one best and one `TOP SCORES` board. The leaderboard starts again: entries hold `bestScore` and the old `bestDistance` / `bestCrew` fields are no longer written or read. **The new Firestore rules must be deployed together with the new client** (`firebase deploy --only firestore:rules`); GitHub Actions deploys Hosting only.
- Deploys from GitHub (2026-11-12): repository secrets set, with a `github-action-deploy` service account on the Firebase project; CI installs Java 21 for the rules tests.
- First Firebase deploy (2026-11-12): project `asteroids-galore`, Firestore in `nam5` with the rules, anonymous sign-in, Hosting at https://asteroids-galore.web.app. Checked live: a run is saved, appears on the board, and its share link opens the game showing it.
- Sharing a result as a link: `SHARE` button on the end screens, `/s/{runId}` links that open the game with the run on the start screen. Checked in a browser against the emulators, with the clipboard path; the phone share sheet has not been tried on a real device.
- Leaderboard with generated callsigns: top 5 by distance on the game-over screen and by crew on the mission-complete screen, own row highlighted and ranked. Checked in a browser against the emulators with seeded players.
- Anonymous login and saved results: silent sign-in on load, one `runs` document per finished run, bests in `users/{uid}` and restored from there, Firestore rules with emulator tests, local development against the emulators. Checked in a browser against the emulators.
- Refactor to the usual stack: modules under `src/`, Vite, TypeScript, Vitest, ESLint, Firebase Hosting config and a deploy workflow. Scripted runs match the prototype (commit `33025ec`) in game state and in every canvas call. No gameplay or visual change.
- Prototype: four levels, lives, rescues, two-crew choices, gravity wells, end screen (see `game-design.md`)

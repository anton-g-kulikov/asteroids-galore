# Project Task List

## Current status

The game is built from typed modules with Vite, has automated tests and Firebase Hosting config, saves finished runs to Firestore under an anonymous account, shows leaderboards with generated callsigns, and shares runs as links. This works against the local emulators. It is live at https://asteroids-galore.web.app; every push to `main` deploys Hosting through GitHub Actions.

## Next

The seven-mission run is built (see `game-design.md`). What is left of that plan, and what is settled only by playing, is listed there under "Still open".

- **Play-test and tune missions 5–7:** their parsecs and starting speeds, the 75% cap on the missed-crew penalty (`MISS_CAP`), the set of wormhole waits, how many shield drops arrive as a choice, and how much each crew member slows the ship and deepens the well.
- **Scores that can be checked:** saving each run's seed, a recording of the inputs, and a server that replays a run before listing its score. The fixed step, the fixed field and seeded randomness it depends on are in place; the rest is not started.
- **Tuning aids:** per-run records of where and how runs end and the shields at each wormhole, and a scripted pilot in the tests that sweeps speeds to find where survival collapses. Not started; runs already record how they ended and how far mission 7 went.
- **New things in missions 5–7:** decided after playing, and only if missions 5–7 feel thin. Candidates: dead stars, failing rescues, wrecked stations, angled asteroids.
- **Look at the late missions on a real phone:** the 32-seat hull and pip rows, the seven-row end-screen table and the board rows were checked by tests and by a scripted run, not by eye.
- **Old leaderboard entries** in the live `users` collection hold only `bestScore`; they are no longer listed and can be deleted.
- **Parked:** shooting (see the design notes for why).

## Known gaps

- A run that ends before the first successful sign-in (for example, first visit while offline) is not saved to the cloud; its bests are uploaded at the next start.
- Scores are sent by the client, so the rules can only check that they are well-formed, not that they were really flown. Anyone willing to call the API by hand can put themselves on top of the leaderboard.
- On the mission-complete screen the ship is still drawn, and on short phones (under about 700 px tall) it can sit behind the lower rows of the crew board.
- Share links show the same generic preview in every chat app; a preview per result needs server rendering (a Cloud Function).
- Two accounts can be given the same callsign (there are about 100,000 combinations).
- On a window that is not 5:9 the play field leaves empty bars: above and below it on a tall phone, beside it on a wide screen.
- A 120 Hz screen shows the game at 60 steps a second, without smoothing between steps.

## Done

- The seven-mission competitive run (2026-11-14): 7 missions with mission 7's wormhole as the way home; the missed-crew penalty with a 75% cap; a destroyed ship loses only the mission in flight; one speed slope with no second gear or ceiling; shuffled wormhole waits; shields topped up to 3, at most 5, with drops on missions 5 and 6 (half as a crew-or-shield choice) and a shield opposite every wormhole in mission 7; ship size, steering and well depth from the crew on board; a fixed 1/60 s step and a fixed 400 × 720 field; board rows that say how the run ended. The board starts again: entries are ranked by `best`, bests on the device use new keys. **The new Firestore rules must be deployed together with the new client.**
- Score = parsecs × crew saved (2026-11-13): crew are saved when delivered through a wormhole, crew on board when the ship is destroyed are taken off the score, level 1 has 2 seats, one best and one `TOP SCORES` board. The leaderboard starts again: entries hold `bestScore` and the old `bestDistance` / `bestCrew` fields are no longer written or read. **The new Firestore rules must be deployed together with the new client** (`firebase deploy --only firestore:rules`); GitHub Actions deploys Hosting only.
- Deploys from GitHub (2026-11-12): repository secrets set, with a `github-action-deploy` service account on the Firebase project; CI installs Java 21 for the rules tests.
- First Firebase deploy (2026-11-12): project `asteroids-galore`, Firestore in `nam5` with the rules, anonymous sign-in, Hosting at https://asteroids-galore.web.app. Checked live: a run is saved, appears on the board, and its share link opens the game showing it.
- Sharing a result as a link: `SHARE` button on the end screens, `/s/{runId}` links that open the game with the run on the start screen. Checked in a browser against the emulators, with the clipboard path; the phone share sheet has not been tried on a real device.
- Leaderboard with generated callsigns: top 5 by distance on the game-over screen and by crew on the mission-complete screen, own row highlighted and ranked. Checked in a browser against the emulators with seeded players.
- Anonymous login and saved results: silent sign-in on load, one `runs` document per finished run, bests in `users/{uid}` and restored from there, Firestore rules with emulator tests, local development against the emulators. Checked in a browser against the emulators.
- Refactor to the usual stack: modules under `src/`, Vite, TypeScript, Vitest, ESLint, Firebase Hosting config and a deploy workflow. Scripted runs match the prototype (commit `33025ec`) in game state and in every canvas call. No gameplay or visual change.
- Prototype: four levels, lives, rescues, two-crew choices, gravity wells, end screen (see `game-design.md`)

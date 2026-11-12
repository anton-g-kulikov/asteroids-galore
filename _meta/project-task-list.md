# Project Task List

## Current status

The game is built from typed modules with Vite, has automated tests and Firebase Hosting config, saves finished runs to Firestore under an anonymous account, shows leaderboards with generated callsigns, and shares runs as links. This works against the local emulators. It is not deployed to Firebase yet: the Firebase project does not exist (the Google account is at its project quota).

## Before the first Firebase deploy

- Create the Firebase project and add `.firebaserc`
- Enable Anonymous sign-in and create the Firestore database in the Firebase console; deploy the rules (`firebase deploy --only firestore:rules`)
- Add the `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID` and `VITE_FIREBASE_*` secrets to the GitHub repository
- Turn off GitHub Pages: the repository root is no longer a playable page, so the old link breaks as soon as this is pushed to `main`

## Next

- Nothing queued beyond the first deploy.

## Known gaps

- A run that ends before the first successful sign-in (for example, first visit while offline) is not saved to the cloud; its bests are uploaded at the next start.
- Scores are sent by the client, so the rules can only check that they are well-formed, not that they were really flown. Anyone willing to call the API by hand can put themselves on top of the leaderboard.
- On the mission-complete screen the ship is still drawn, and on short phones (under about 700 px tall) it can sit behind the lower rows of the crew board.
- Share links show the same generic preview in every chat app; a preview per result needs server rendering (a Cloud Function).
- Two accounts can be given the same callsign (there are about 100,000 combinations).

## Done

- Sharing a result as a link: `SHARE` button on the end screens, `/s/{runId}` links that open the game with the run on the start screen. Checked in a browser against the emulators, with the clipboard path; the phone share sheet has not been tried on a real device.
- Leaderboard with generated callsigns: top 5 by distance on the game-over screen and by crew on the mission-complete screen, own row highlighted and ranked. Checked in a browser against the emulators with seeded players.
- Anonymous login and saved results: silent sign-in on load, one `runs` document per finished run, bests in `users/{uid}` and restored from there, Firestore rules with emulator tests, local development against the emulators. Checked in a browser against the emulators.
- Refactor to the usual stack: modules under `src/`, Vite, TypeScript, Vitest, ESLint, Firebase Hosting config and a deploy workflow. Scripted runs match the prototype (commit `33025ec`) in game state and in every canvas call. No gameplay or visual change.
- Prototype: four levels, lives, rescues, two-crew choices, gravity wells, end screen (see `game-design.md`)

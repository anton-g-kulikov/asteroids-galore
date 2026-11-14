# Asteroids Galore

A small top-down space dodger for phones. No shooting — just flying.

**Play:** https://asteroids-galore.web.app

The game is drawn on a single canvas, on a play field of one fixed shape that is scaled to fit the window, and advances in fixed steps, so it plays the same on every device. It is written in TypeScript, built with Vite, tested with Vitest, and hosted on Firebase Hosting. Finished runs are saved to Firestore under an anonymous Firebase account, the end screens show a leaderboard, and a run can be shared as a link; there is no login screen and no name to type.

## Controls

- **Touch:** hold the left side of the screen to fly left, the right side to fly right. Holding both keeps the ship straight; sliding a thumb across the middle switches direction.
- **Keyboard:** arrow keys or A / D. Space or Enter starts a run.

## Run locally

Use the Node version in `.nvmrc`.

```bash
npm install
npm run emulators
npm run dev
```

`npm run dev` talks to the local Firebase emulators (Auth and Firestore), never to a real project; the settings are in `.env.development`. The emulators need Java, and their UI is at http://localhost:4100. If they are not running the game still plays and keeps bests on the device only.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with live reload |
| `npm run emulators` | Starts the Auth and Firestore emulators |
| `npm test` | Runs the tests once (`npm run test:watch` to keep them running) |
| `npm run test:rules` | Runs the Firestore rules tests inside the emulator |
| `npm run lint` | ESLint |
| `npm run build` | Type-checks, then builds to `dist/` |
| `npm run preview` | Serves the built `dist/` |
| `npm run deploy` | Lint, all tests, build, then deploy Hosting, the Firestore rules and the auth providers |

## Layout

```text
index.html          page shell; loads src/main.ts
src/main.ts         wires the canvas, input events and the frame loop
src/game/           rules and state: tuning, spawning, simulation, input, saved bests
src/render/         drawing: playfield, sprites, HUD and end screens
src/cloud/          Firebase: config, anonymous sign-in, saving runs and bests, callsigns, leaderboards, share links
firestore.rules     who may read and write what
src/debugHook.ts    window.__game, used by the tests
test/               tests, helpers, recorded traces, and test-documentation.md
_meta/              game design notes and the task list
```

## Saved results

On load the game signs in anonymously in the background. When a run ends it writes one document to `runs` and keeps the player's best score, and how that run ended, in `users/{uid}`; a best saved there is restored if the device's storage was cleared. The document shapes are enforced by `firestore.rules`.

## Leaderboard

Each account gets a callsign generated from its ID, such as `COSMIC OTTER 42`; nobody types a name. `users/{uid}` doubles as the player's leaderboard entry and is public to read.

Both end screens have a `LEADERBOARD` link that opens `TOP SCORES`: the top 10 by best score, each with a line saying how that run ended. There are seven missions. Each scores its parsecs times the crew saved in it, less a share for the crew left behind, and the score is the missions added up, so a long flight with nobody saved scores nothing. The wormhole of mission 7 is the way home: it ends the run, and the player decides when to take it.

The player's own row is gold. If it is outside the top 10 it is added below with its rank. How the board behaves is described in [_meta/game-design.md](_meta/game-design.md).

The game never waits for the cloud. With no config, no network or a failed sign-in it plays the same and keeps bests on the device.

## Sharing

Once a run is saved, the end screen shows a `SHARE` button in the top right corner. It opens the device's share sheet with a link, or copies the link where there is no share sheet.

The link is `/s/{runId}`. It opens the game with that run on the start screen: the callsign, the score, and the crew saved. Firebase Hosting serves `index.html` for `/s/**` (see `firebase.json`), and anyone holding a run's ID can read that run.

Chat apps show the same generic preview for every link; a preview per result would need server rendering.

## Publishing

The game is served by Firebase Hosting from `dist/` (see `firebase.json`).

- **Project:** `asteroids-galore` (see `.firebaserc`). Firestore lives in `nam5`. Anonymous sign-in is switched on from `firebase.json` (`auth.providers`), so `firebase deploy --only auth` restores it.
- **Config:** a production build reads the `VITE_FIREBASE_*` values listed in `.env.example`. Put them in `.env.production.local` for a build by hand; `firebase apps:sdkconfig WEB` prints them.
- **By hand:** `npm run deploy`. This needs a `.firebaserc` naming the Firebase project, and `firebase login`.
- **From GitHub:** `.github/workflows/deploy.yml` lints, tests and builds on every pull request, and also deploys Hosting on every push to `main`. It needs these repository secrets: `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`, and the six `VITE_FIREBASE_*` values. It does not deploy the Firestore rules; do that with `firebase deploy --only firestore:rules`.

The steps left before GitHub can deploy are listed in [_meta/project-task-list.md](_meta/project-task-list.md).

## Design notes

How the game works under the hood — mechanics, level numbers, tuning constants and the debug hook — is written up in [_meta/game-design.md](_meta/game-design.md). The game leaves most of that for players to discover, so the file is full of spoilers.

## Working on the code

This repository uses the [metacoding](https://www.npmjs.com/package/metacoding) workflow: scope is written down in `_meta/project-task-list.md` and test cases in `test/test-documentation.md` before code changes. Run `metacoding init --vendor claude-code` to install the skill locally; its files are git-ignored.

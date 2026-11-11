# Asteroids Galore

A tiny top-down space dodger. No shooting — just steer through a field of random asteroids that keeps getting faster.

- **Touch:** hold the left side of the screen to fly left, the right side to fly right.
- **Keyboard:** arrow keys or A / D.

Score grows with distance flown; your best is saved on the device.

## Rescue missions

Some asteroids carry stranded crew, marked with a green `SOS` ring. Fly inside the ring — without hitting the rock — to pick them up for 25 points per person.

Every so often two crews appear on screen together, in different columns, one following just above the other: 2 people on an open rock, or 4 on a rock wedged between two others. Nothing forbids saving both, but the gap is sized so the dash from one to the other falls just short.

## Run

It's a single file with no dependencies — open `index.html`, or serve the folder:

```
python3 -m http.server 8000
```

The HUD counts crew rescued and crew missed (those that drifted off screen unrescued).

## Levels

There are 4 levels; finishing the fourth completes the mission.

Once you have earned a level's points target (350 on level 1, +150 per level) **and** survived at least 20 seconds of it, a wormhole drifts down the screen. Fly into it to travel to the next level. If you miss it, the next one appears 15–30 seconds later, unannounced and the level carries on getting faster in the meantime. The bar under the score shows points progress.

Each new level:

- delivers the crew on board and grows the ship — level 1 is asteroids only, then 4 seats on level 2, 8 on level 3, 16 on level 4 (doubling up to 32). The pips under the bar fill as people are rescued, and a full ship can't pick up more;
- draws the seats on the ship itself, as dots on the hull that turn green as they fill — the ship (and its hitbox) grows to fit them;
- makes the ship 8% slower to steer (down to half speed at most);
- restarts the asteroid speed ramp, so the rocks behave the same every level while the ship gets heavier.

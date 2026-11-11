# Asteroids Galore

A tiny top-down space dodger. No shooting — just steer through a field of random asteroids that keeps getting faster.

- **Touch:** hold the left side of the screen to fly left, the right side to fly right.
- **Keyboard:** arrow keys or A / D.

Score grows with distance flown; your best is saved on the device.

## Rescue missions

Some asteroids carry stranded crew, marked with a green `SOS` ring. Fly inside the ring — without hitting the rock — to pick them up for 25 points per person.

Every so often two crews appear at once: 2 people on an open rock, or 4 on a rock wedged between two others. Picking up one loses the other.

## Run

It's a single file with no dependencies — open `index.html`, or serve the folder:

```
python3 -m http.server 8000
```

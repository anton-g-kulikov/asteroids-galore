# Lightboat — story script, fifth draft

**Spoilers, and a draft.** Written on 2026-11-22; this draft follows the Game Producer's review of the fourth, which the owner has read. This draft follows the owner's rules for story mode and the owner's account of the *Lantern* as a freighter, both of the same day and both in "Planned: story mode rules" in `game-design.md`. **This script is being built from.** The owner told the Game Engineer to start building story mode on 2026-11-22, with this file as the source of every line. A change to a line, a sender's name, the words of a choice or the table "When each moon is named" is a change to something being built: tell the Game Engineer when one is made. The frame is the "Story" section of the same notes.

This is everything said in a first playthrough, in the order a player meets it. Nothing is said while flying: each block below is one screen, shown where the game has stopped.

No line is longer than 42 characters: the Game Designer's measure for the story's screens, chosen by the owner. Lines that carry the callsign are checked with one of 22 characters; the longest the game makes today is 21, such as WANDERING TORTOISE 42. How the screens look is in "Planned: story mode screens" in `game-design.md`: the sender in capitals, lines in sentence case, a colour per voice, typed out one transmission at a time, with the chain of moons the captain has been told about along the top.

## The story in six lines

- The *Lantern* is a freighter hauling light0re home. It hears a distress call from a mined moon and diverts. Its captain is the Pilot.
- The captain flies the ship's lightboats from the ship, never aboard them, moon after moon, learning at each one that there is another.
- After `m03n` the ship is full: people, and a hold of ore. Mission control says that is everyone, and another ship is coming.
- The captain goes home with the ore and the commission, or drops the ore to make room for people nobody listed.
- After `m05n` the ship can take no more. The captain takes it home, or sends it home alone on automatic, where it is lost one time in five, and stays with one boat for the last moon.
- `m06n` is out of the ship's range, so there the captain is aboard the boat. It is flown once. There are more people than seats, and a boat lost there is the captain's death.

## What changed from the fourth draft

All from the Game Producer's review, and one rule from the owner.

- **Why the captain is in the last boat.** `m06n` is out of the ship's range, so a boat there can only be flown from inside. The ship says so before the last choice.
- **Flying from the ship is said at the start,** in the briefing, so that mission 06 is felt as the first time aboard.
- **The three choices have their words:** what the two options are called on screen, and one line from the ship that states the stakes.
- **Coming through mission 06 with nobody aboard** has its own telling.
- **The second freighter** brings out some of everyone still there, not only the night shift.
- **Mission 06 is flown once,** the owner's rule: "m06n has to be one-and-done run, no redos".
- **Small things:** the children sleep under the chart table, not in a hold that is about to be opened to space.

## What this draft assumes

Where the rules are open, the script assumes an answer:

| Assumed | Where it shows |
|---|---|
| Mission control is the freight line's control room: it tasks the rescue, and it answers for the cargo | Every line signed `CONTROL` |
| The choice after `m03n` is always put, and there is no going on with the ore aboard (the Engineer's proposal) | [Leaving m03n](#leaving-m03n) |
| The three boats are the four, the eight and the twelve. The eight is ready on leaving `m01n` and the twelve on leaving `m03n`; if the only boat ready is lost, the next is released (the Engineer's proposal) | Leaving those moons; [When a boat is destroyed](#when-a-boat-is-destroyed) |
| With no boat left the *Lantern* goes home, to the ending for where it is | [When the last boat is lost](#when-the-last-boat-is-lost) |
| The Foreman is never among the saved | [Endings](#endings) |
| `m06n` is out of the ship's range, which is why the last boat is flown from inside | [Leaving m05n](#leaving-m05n) |

## Who speaks

The story is told in the first person. Nothing is said that the captain could not hear or know.

| Signs as | Who |
|---|---|
| `CONTROL` | Mission control, on Earth: one person on the freight line's desk for the whole night. Tasks the rescue, answers for the cargo, and goes by the book |
| `LANTERN` | The ship itself. It has no crew, only its captain (the owner's decision), so it speaks for itself. It reports boats, room and cargo, and never gives an opinion |
| `SURVEYOR, m00n` | The First: the first person the captain brings aboard, who takes the radio and keeps the names. Here that is a surveyor from `m00n`. If the first person aboard comes from a later moon, these lines are theirs and they sign by their own job and moon |
| `FOREMAN, m06n` | The night shift's foreman, heard faintly from mission 04 |
| Anyone else | A survivor who speaks once, after the first trip to their moon |

- **Until someone is aboard there is no First.** The ship then gives the count: "[N] signals still on m00n."
- **Nobody speaks of a moon the captain has not been told about.** Each is learned from the moon before it.
- `[CALLSIGN]` is the player's generated callsign. `[N]` is a number the game fills in.

## Before mission 00

> **CONTROL TO LANTERN**
> You are the ship nearest a distress call.
> A mined moon, m00n, has broken up.
> There are people alive on the pieces.
> Your ship can't go in. Fly a boat from it.
> Show them a light. Bring out all you can.

The briefing is the one block longer than three lines.

## m00n

### After the first trip to m00n

> **SURVEY HAND, m00n**
> We'd stopped looking for a light.
> Thank you, Captain.
> m01n is breaking up too.

> **SURVEYOR, m00n**
> I know who works which moon.
> Give me the radio and I'll keep the names.
> [N] still on m00n.

> **CONTROL**
> You can send the boat back for them,
> or go on to m01n while it holds.
> Your ship, your call.

The captain chooses, here and after every trip: back for the people still there, or on (see [The three choices](#the-three-choices)). Control explains the choice only this once.

### Leaving m00n

> **SURVEYOR, m00n**
> m01n is rig crews: two rigs to a seam.
> Where there's one, there's another.

> **LANTERN**
> Boat on the rail.
> m01n in range.

## m01n

### After the first trip to m01n

> **RIG HAND, m01n**
> There were two rigs on our seam.
> You came for ours.
> The other is still out there.

> **SURVEYOR, m00n**
> [N] still on m01n.
> I have their names.
> Shift crews at m02n are calling now.

### Leaving m01n

> **CONTROL**
> The mining company has sent its list.
> Four manned moons, m00n to m03n.
> The rest run themselves, it says.

> **LANTERN**
> The eight is ready.
> More seats.
> More boat to get through the rocks.

The first choice of boat follows.

## m02n

### After the first trip to m02n

> **SHIFT HAND, m02n**
> The drill at m06n went to the core
> for the last of the light0re.
> It never shut down. It's pulling us in.

> **SURVEYOR, m00n**
> [N] still on m02n.
> I have their names.

### Leaving m02n

> **SURVEYOR, m00n**
> That's why the haul roads still open.
> The drill opens them.
> Nobody's keeping the timetable now.

> **LANTERN**
> Cutting cargo light0re into shields.
> They will follow the boat in.

> **CONTROL**
> That cargo is not yours to cut.
> I didn't see it.

## m03n

### After the first trip to m03n

> **FROM THE TOWN, m03n**
> My two are asleep under your chart table.
> They want to meet whoever flies the light.

> **SURVEYOR, m00n**
> [N] still on m03n.
> I have their names.

### Leaving m03n

The turn.

> **CONTROL**
> That's every moon on the company's list.
> Bring your cargo and your people home.
> Another ship is two days out.

> **SURVEYOR, m00n**
> The night shift was sent on to m04n.
> They're on nobody's list.
> Two days is a long time out there.

Then the choice, with the ship stating the stakes:

> **LANTERN**
> [N] aboard, and a hold full of light0re.
> No room for another moon.

Going home with the ore is the ending [The commission](#the-commission). If the captain drops it:

> **CONTROL**
> That cargo is worth more than your ship.
> Nothing I have covers this.
> Your ship.

> **LANTERN**
> Hold open. Light0re away.
> It will drift in ahead of the boat.
> The twelve is ready.

- *If the eight was never taken or is lost,* the last line names the boat that is ready.

The second choice of boat follows.

## m04n

### After the first trip to m04n

> **NIGHT SHIFT, m04n**
> They told the company m04n was automated.
> We were the automation.
> They said the same of m05n.

> **SURVEYOR, m00n**
> [N] still on m04n.
> Now I have their names.

### Leaving m04n

> **FOREMAN, m06n** *(faint)*
> Lightboat, turn back.
> We're holding the drill.
> It goes when we go.

> **CONTROL**
> That signal is from m06n.
> The list has nobody at m06n.
> I'm starting a new page.

## m05n

### After the first trip to m05n

> **NIGHT SHIFT, m05n**
> The Foreman sent us out and stayed.
> Somebody has to hold it.

> **SURVEYOR, m00n**
> [N] still on m05n.
> Now I have their names.

### Leaving m05n

The second turn. The story's screen first:

> **LANTERN**
> m06n is out of range of this ship.
> A boat there must be flown from inside.
> Its one road out leads to Earth, not back.

> **FOREMAN, m06n** *(faint)*
> There are more of us than you have seats.
> The longer you stay, the faster it runs.
> Don't come.

> **SURVEYOR, m00n**
> No other ship will reach m06n in time.
> I never had their names.
> Nobody did.

Then the choice, with the ship stating the stakes (see [The three choices](#the-three-choices)):

> **LANTERN**
> [N] aboard. Room for [N] more.
> If you stay, this ship goes home alone.
> Sent home alone, it is lost one in five.

- *If everyone on the six moons is aboard,* the first line is "Full. Every place aboard is taken."

So the captain knows four things before choosing: the boat has to be flown from inside, nobody else can reach `m06n`, the captain cannot come back to the ship, and a ship sent home without its captain is lost 2 times in 10, the owner's number. The ship gives the figure and no opinion.

Going home is the ending [Past the list](#past-the-list) or, with every place taken, [A full ship](#a-full-ship). If the captain stays:

> **CONTROL**
> I can't order you into that boat.
> I won't order you out.

> **SURVEYOR, m00n**
> Take the page, Captain.
> Ask them their names.
> We'll see you on Earth.

> **LANTERN**
> Choose the boat that stays.
> The others go home with the ship.

- *If one boat is left:* "One boat left. / It stays with you."

The Lantern leaves, and mission 06 is flown with the captain aboard, once.

## The three choices

As the owner chose them on 2026-11-22. A tap only reads on; a choice is made by holding one side. Left is always back or home, right is always further in, and neither is marked as the good one. The words stand in two lines under each side.

| Choice | Left | Right |
|---|---|---|
| After a trip, while people are still on the moon | `GO BACK` / `FOR [N]` | `GO ON` / `TO m0Xn`, or `LEAVE` / `m0Xn` |
| Leaving `m03n` | `GO HOME` / `WITH THE ORE` | `DROP` / `THE ORE` |
| Leaving `m05n` | `GO HOME WITH` / `THE LANTERN` | `STAY WITH` / `THE LAST BOAT` |

- **Going back or going on is chosen on the stop itself,** under what the survivor and the First have just said. It is not a screen of its own.
- **`LEAVE` is used twice.** At `m03n` the next moon has not been named to the captain yet. At `m05n` going on does not lead to `m06n` but to the last choice.
- **The two choices that can end the story** show the ship's transmission above the picture of the Lantern: "[N] aboard, and a hold full of light0re. / No room for another moon." and "[N] aboard. Room for [N] more. / If you stay, this ship goes home alone. / Sent home alone, it is lost one in five."
- **The choice of boat** keeps arcade's picker and has no words.

## When each moon is named

The top of every story screen is the chain of moons the captain has been told about, so the order in which the lines name them decides what is drawn. No moon is flown before it is named.

| Moon | Named by | When |
|---|---|---|
| `m00n` | Control | The briefing |
| `m01n` | The survey hand | The stop at `m00n` |
| `m02n` | The First | The stop at `m01n` |
| `m03n` | Control, reading the company's list | Leaving `m01n` |
| `m06n` | The shift hand | The stop at `m02n` |
| `m04n` | The First | Leaving `m03n`, at the turn |
| `m05n` | The night shift | The stop at `m04n` |

`m06n` is named early, as where the drill is, while `m04n` and `m05n` are still unknown. So from `m02n` to `m03n` the chain has a gap in it: the captain knows something is at the far end and not what lies between. The owner chose to show it: "Yes, show the gap". So this table decides what is drawn, and it has to stay exact: moving a line that names a moon moves the picture. It was checked against the lines on 2026-11-22.

## Blocks used at any moon from m00n to m05n

### After a return trip

> **SURVEYOR, m00n**
> [N] more names crossed off.
> [N] still on m0Xn.

The captain chooses again. When nobody is left:

> **SURVEYOR, m00n**
> m0Xn is empty.
> Every name crossed off.

Going back is not limited: the owner's decision ("Don't limit; it's a risk assessment decision from a captain/pilot").

### Going on with people still there

Shown before the "Leaving" screen of that moon.

> **SURVEYOR, m00n**
> [N] left on m0Xn.
> I'm keeping their names.

### When a boat is destroyed

The captain is on the Lantern. The people aboard the boat die, and the boat is gone for the rest of the story.

> **LANTERN**
> The eight is lost.
> [N] aboard. None recovered.
> Two boats left.

- *The ship names the boat and counts what is left.* If nobody was aboard, the second line is "Nobody aboard."

> **SURVEYOR, m00n**
> I've marked them.
> [N] still on m0Xn.

- *After a second boat is lost,* the first line is "I've marked them too."

The captain then chooses as after any trip. With three boats this screen is seen at most twice; the third loss is the block below.

### When the last boat is lost

Before mission 06, with no boat left to send. Under the rules as decided, the Engineer's check found this is how the story ends for one average captain in four, and almost never for strong ones. So it is written as an ending of its own.

> **LANTERN**
> The four is lost.
> [N] aboard. None recovered.
> No boats left.

> **CONTROL**
> Nothing left to send.
> Bring them home, [CALLSIGN].

The story goes to the ending [The empty rail](#the-empty-rail). If the ore is still aboard, which is rare, it goes to "The commission" with its first block changed as noted there.

### When a trip brings nobody

> **LANTERN**
> Boat back.
> No one aboard.

## Endings

Eight. Each closes with three counts on the story's manifest: on Earth, left behind, dead.

A Lantern that the captain takes home always arrives. A Lantern sent home alone arrives 8 times in 10.

Mission 06 is flown once in a story: the owner's rule is "m06n has to be one-and-done run, no redos". However it ends, seeing another of its endings means a new story from `m00n`. And every story is told the same way from the start: there is no telling for a second playthrough. The owner's words: "no "second" playthroughs, each story starts as a new one". The captain learns which only by coming through mission 06 alive.

With the ore dropped, the Lantern has room for everyone on `m00n` to `m05n`. It is full only when nobody on those six moons was left behind and nobody died in a lost boat. The two best endings ask for that.

### The commission

The captain took the Lantern home after `m03n`, with the ore. This is not written as the bad ending: by the owner's decision, more often than not the ship that Control promised does come.

> **CONTROL**
> Cargo delivered. Commission paid in full.
> [N] people came home with it.
> The papers have your callsign.

Then one of two tellings. Chance picks, not anything the captain did.

**Another freighter went in.** 60 times in 100, the owner's number.

> **CONTROL**
> A second freighter went in after you.
> It brought out [N] of those still there.
> Same commission. Same papers.

> **SURVEYOR, m00n**
> [N] of them. Not all.
> I have their names now.

Those still there are everyone the captain left: on `m00n` to `m03n`, and the night shift beyond. On the manifest every moon's row shows who that ship brought out.

**It came too late.** 40 times in 100.

> **CONTROL**
> A second freighter went in after you.
> It was a day late.
> It found no signals.

> **SURVEYOR, m00n**
> They were on nobody's list.
> I've kept a page for them.

On the manifest the rows past `m03n` are blank, and the people left on `m00n` to `m03n` stay as left behind.

- *If the Lantern went home because its last boat was lost,* Control's first block is: "Cargo delivered. Commission paid, / less three boats. / [N] people came home with it." The papers are not mentioned.

### Past the list

The captain dropped the ore, went past the list, and went home with the Lantern after `m05n`.

By the numbers this is the better choice for every captain: staying stakes everyone aboard at one in five for at most twelve more. The owner's words: "if the captain does the math a decides not to risk already saved crew and sacrifice mo6n crew – that should be at least aknowledged (if not praised) as a rational decision". So Control, who goes by the book, says it was the right order, and the First, whose life was the stake, says what it cost and what it bought.

> **FOREMAN, m06n** *(faint)*
> Lightboat. You turned back.
> Good.

> **CONTROL**
> [N] people are coming home. No commission.
> You wouldn't stake them at one in five.
> It's the order I'd have given.

> **SURVEYOR, m00n**
> I wanted you to go.
> I'm alive because you didn't.
> The page for m06n stays blank.

### A full ship

As "Past the list", with every place on the Lantern taken. It is earned, not rare: a strong captain who keeps going back can fill the ship. The Foreman's block is the same.

> **CONTROL**
> The Lantern comes in full. No commission.
> Every name from six moons. None staked.
> It's the order I'd have given.

> **SURVEYOR, m00n**
> Six moons, and no name left on my list.
> I wanted you to go. I'm glad you didn't.
> The page for m06n stays blank.

### The empty rail

The captain dropped the ore, went on, and lost the last of the three boats before mission 06. The Lantern goes home with its captain aboard, so it arrives. For an average captain this is a common ending, and it is not written as a failure.

> **FOREMAN, m06n** *(faint; only if the Foreman has been heard)*
> Lightboat. We counted three lights.
> Nobody came further.

> **CONTROL**
> [N] people are coming home.
> You flew until the rail was empty.
> There is no commission.

> **SURVEYOR, m00n**
> [N] names I couldn't cross off.
> [N] I had to mark.
> You went back for every one you could.

### Home

The captain stayed, flew mission 06 and came out by the road to Earth.

> **FOREMAN, m06n** *(faint, as the boat leaves)*
> Your boat is lit with what we dig.
> Take them home.
> We'll hold it till you're through.

> **CONTROL**
> The sum said go home. You stayed.
> [N] people reached Earth in the Lantern.
> [N] more came in your boat.

> **SURVEYOR, m00n**
> [N] names I couldn't cross off.
> Read me the ones from m06n.

*If the boat comes through with nobody aboard,* the three blocks are:

> **FOREMAN, m06n** *(faint, as the boat leaves)*
> You came.
> Nobody else did.

> **CONTROL**
> The sum said go home. You stayed.
> [N] people reached Earth in the Lantern.
> Your boat came in empty.

> **SURVEYOR, m00n**
> [N] names I couldn't cross off.
> The page for m06n came back blank.

### The light that stayed

As "Home", when the Lantern left full and every seat of the last boat is full too. It is the best a captain can do, and it is earned, not rare. Full means the seats of whichever boat was left: with the four, that is four people. So nobody on the six moons was left behind and nobody died in a lost boat. The Foreman's block is the same.

> **CONTROL**
> The sum said go home. You stayed.
> The Lantern came in full. Your boat too.
> Welcome home, [CALLSIGN].

> **SURVEYOR, m00n**
> Six moons, and no name left on my list.
> Read me the ones from m06n.

### Lightboat

Rare: 2 times in 10 for a captain who stays and comes through. It is picked by chance, not by how the captain flew: a full Lantern runs the same risk as any other. The name and that rule are the owner's decisions of 2026-11-22. The captain stayed, flew mission 06 and came out by the road to Earth. The Lantern, sent home alone, never arrived. The Foreman's block is the same as in "Home".

> **CONTROL**
> [CALLSIGN]. You are through.
> The Lantern never reached Earth.
> The automatic failed. We don't know where.

> **CONTROL**
> [N] people came in your boat.
> Read me their names.
> I'm starting a new page.

Nobody else speaks: the First was aboard the ship. Nobody says the captain was told the odds. The player knows. This telling replaces "Home" or "The light that stayed", whichever the captain had earned. The ending takes the game's name: the one boat that came home.

### Lost at the Heart

The last boat was destroyed in mission 06. The captain and everyone aboard it are dead.

There is no story screen and no title: the manifest comes up alone. Nobody speaks. The owner's words: "this is a first-person POV story; if the protagonist dies, they won't know how the whole story unfolded." So nothing is said after the captain's death, not the fate of the Lantern and not what anyone said about the captain.

The manifest shows only what the captain knew: who was aboard the boat, who was left on the moons, who had been marked, and the people on the Lantern as on their way.

- *Cut for this reason,* and kept here in case the owner wants one voice back: the Foreman's "We saw your light go out", Control's "[CALLSIGN] is not through", and the First's "I've added your name to the list."

## The manifest

It was first called the roll. The owner renamed it on 2026-11-22, wanting a name without the sound of luck: "Manifest, rename it". A manifest lists what a ship carries, people and cargo, so the cargo line belongs on it. It is shown as part of the story's ending.

The Game Designer sketched its form: a row per moon with a mark per person, three counts, and the eight endings as lamps. The owner accepted the form with these words on it.

| Where | The words |
|---|---|
| Heading | `THE MANIFEST`, and under it `CAPTAIN [CALLSIGN]` |
| Rows | The moons' names, lower case: `m00n` to `m06n`. Only moons the captain was told about have a row |
| The three counts | `ON EARTH`, `LEFT BEHIND`, `DEAD` |
| After "Lost at the Heart" | The people on the Lantern under `ON THEIR WAY`, not `ON EARTH` |
| After "Lightboat" | The people on the Lantern under `MISSING`: nobody knows that they are dead |
| After "The commission", when the second freighter came | The people it brought out under `BY ANOTHER SHIP`, apart from `ON EARTH` |
| The cargo, one line under the counts | `COMMISSION PAID`; or `COMMISSION PAID, LESS THREE BOATS`; or `NO COMMISSION` in every ending where the ore was dropped |
| A lit lamp | The ending's name: `THE COMMISSION`, `PAST THE LIST`, `A FULL SHIP`, `THE EMPTY RAIL`, `HOME`, `THE LIGHT THAT STAYED`, `LIGHTBOAT`, `LOST AT THE HEART` |
| An unlit lamp | No name |

- **`BY ANOTHER SHIP` and `MISSING` are two more counts than the sketch has.** They keep `ON EARTH` and `DEAD` true: the first for people the captain did not bring home, the second for people nobody can account for.
- **The cargo line is the only place the commission is shown.** There is no score, so this is where it is recorded.
- **The lamps are kept, and nothing else.** The owner's words: "Keep the lamps". The game remembers across stories which endings have been reached, and no counts and no past manifests. The lamps are shown only when a story ends, and nothing in the telling depends on them: each story starts as a new one.

## What to look at when reviewing

- **The price of the ore.** The commission and the fame are told once, in "The commission", and their absence in the endings without the ore ("No commission"). Whether that is enough to make the choice after `m03n` feel like a real one.
- **Whether the turn is fair to both sides.** Control may be right that another ship will do it, and the Surveyor no longer says the night shift cannot wait, only that two days is a long time. Going home is paid and praised in both tellings.
- **Control.** It tasks the rescue and answers for the cargo, so it pulls both ways from the start. Its change runs from "That cargo is not yours to cut. I didn't see it" to "I won't order you out". Whether one voice can carry both.
- **What the captain knows.** The briefing names one moon. Each survivor's line names the next. Whether learning the chain this way is clear, when the screen already reads `MISSION 00/06`.
- **The Foreman stays.** In no ending is the Foreman saved. This is the writer's choice.
- **Going home after `m05n`.** It is acknowledged from three sides: the Foreman ("Good"), Control ("It's the order I'd have given") and the First ("I'm alive because you didn't"). Whether that reads as respect and not as consolation.
- **Staying, against the sum.** Control opens the two endings for a captain who stayed and came through with "The sum said go home. You stayed." It is meant as neither blame nor praise.
- **How the risk is told.** The ship says "lost one in five" once, before the choice. Whether a plain figure makes the choice fair, or makes most players afraid to stay.
- **How much is read.** A whole story is about 40 transmissions, roughly 110 short lines, against 15 to 20 minutes of flying (the Engineer's measure). If that is too much, the first to go would be the survivors who speak once at `m01n` and `m05n` and the First's lines on the haul roads.
- **"I've marked them."** In the Engineer's check an average captain loses about 10 people in boats; an expert under one. So some players meet this screen twice in a story and most strong ones never do.
- **Why the captain is aboard at `m06n`.** "Out of range" is the writer's answer, built on the ship's earlier "m01n in range". The last choice rests on it.
- **Nothing is held back for later.** Every story is told the same way from the briefing on, so there are no lines for a second playthrough: the owner's decision of 2026-11-22. This script is the whole of what is said.

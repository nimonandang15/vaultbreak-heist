![make.fun bounty](https://make.fun/badge/best-heist-game-20261122-0559.svg)
![rank](https://make.fun/badge/best-heist-game-20261122-0559/nimonandang15/vaultbreak-heist/rank.svg)
![reward](https://make.fun/badge/best-heist-game-20261122-0559/nimonandang15/vaultbreak-heist/reward.svg)

# VAULTBREAK — The Meridian Job

A complete, original top-down 2D heist game that plays offline in a desktop browser from its own files. One vault hall, visible in a single 1280×720 frame: Rook the thief crosses past three patrolling guards with vision cones and two sweeping security cameras, picks the Meridian Diamond from its display case, and slips out the service door before the alarm meter hits 100%.

[Play the bounty on make.fun](https://make.fun/bounty/best-heist-game-20261122-0559)

## How to play

Serve `game/` with any static server (for example `python3 -m http.server` inside `game/`) and open `index.html`.

- **WASD / arrow keys** — move
- **Shift** — sneak (slower, half as easy to spot)
- **E** — hold at the display case to pick the lock and grab the diamond
- **Click** — toss a coin lure; a nearby guard walks over to look (3 coins)
- **Q** — drop a smoke pellet; you cannot be seen inside the cloud (2 pellets)
- **F** — EMP burst; every camera goes dark for 6 seconds (1 charge)
- **M** — mute

Crates and pillars block sight and movement; dark shadow zones halve every detection rate. A guard who spots you gets suspicious, then chases; if he catches you, you are dragged back to the door and the alarm jumps +35. Win by grabbing the diamond and reaching the EXIT mat. Lose when the alarm hits 100%.

## Structure

- `game/index.html` — the page, one canvas
- `game/src/config.js` — every tuning number (speeds, cone sizes, alarm rates)
- `game/src/input.js` — keyboard + mouse state
- `game/src/world.js` — the vault hall layout, cover, shadows, collision, line of sight
- `game/src/guards.js` — patrol routes, vision cones, suspicion, chase, coin lure
- `game/src/cameras.js` — sweeping cameras and the EMP blackout
- `game/src/audio.js` — WebAudio synth sounds, no audio files
- `game/src/render.js` — all canvas drawing, HUD and overlays
- `game/src/main.js` — the game loop, alarm, tools, win/lose, and the `?shot=` staged states

`?shot=cover|patrol|alarm|loot` stages a state reachable in normal play, used only to take honest screenshots. All sound is synthesized with WebAudio; the game makes no network requests.

## License

MIT — see [LICENSE](LICENSE).

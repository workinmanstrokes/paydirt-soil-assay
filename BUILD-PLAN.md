# Paydirt: Soil & Gold Assay — Build Plan

- **Name:** Paydirt: Soil & Gold Assay
- **Tagline:** Find the hidden pay dirt and dig its gold in 60 seconds.
- **Kind:** Game — prospecting puzzle game, Web platform, free-to-play, single-screen.
- **Summary:** A playable single-screen browser prospecting game on a 6x6 dirt claim: 60 seconds, 18 energy, a Soil Probe that reads neighbouring pay dirt for 1 energy and an Assay Shovel that digs a tile for 2 energy, with 8 hidden pay-dirt tiles per claim, scoring in grams, a best-claim record, and an end report.

## Correction — read this first

- The ship snapshot for this run said the repo held only a LICENSE file. That was stale: PR #1 ("Build the Paydirt: Soil & Gold Assay game", merged 2026-11-18) had already landed a complete playable build — `index.html`, `style.css`, and `game.js`.
- This run's first push overwrote the real `index.html` with a simpler starter. That was a mistake: the starter was never read against the existing file. The follow-up commit restores `index.html` byte-for-byte to the PR #1 version and keeps only the new files from this run (`README.md`, this plan).
- The game tester's ordered loop (5 Probes, 3 Shovel digs, one 3–5-cell connected pay streak, grams/troy ounces) differs from the shipped loop (18 shared energy, probe reads a neighbour count, 8 pay-dirt tiles, grams only). That is an open decision for the maker — do not silently swap one loop for the other.

## Features (as shipped)

- Clickable 6x6 dirt-claim grid that works with mouse and touch
- 60-second countdown that starts on the player's first move and stops play at 0:00
- 8 hidden pay-dirt tiles per claim
- Soil Probe (1 energy): reads how many neighbouring tiles hold gold, breaks no ground
- Assay Shovel (2 energy): digs the tile and banks its gold in grams
- Live counts for energy, time remaining, gold collected, and pay dirt found (x/8)
- Intro sheet explaining the rules and an end report with gold assayed, pay dirt found, gold left in the ground, best claim, and Stake the next claim
- Best claim saved on the device; mute control for sound

## Stack

`index.html` + `style.css` + `game.js` — vanilla HTML, CSS, and JavaScript, no framework, build step, backend, or art assets. The game rules in `game.js` are written pure so they can also be loaded by a node test. It opens and runs in any desktop or mobile browser.

## Screens

- Main game screen — 6x6 grid, 60-second timer, energy pips, gold total, pay dirt found, and tool picker
- Intro sheet — rules and Stake the claim
- End report — gold assayed, pay dirt found, gold left in the ground, best claim, and Stake the next claim

## Entities

- Cell — grid position, probed/dug state, neighbour pay-dirt count, and gold grams
- Claim — set of 8 hidden pay-dirt tiles and their gold values
- GameRun — time remaining, energy left, and total gold
- BestClaim — best total gold in grams saved on the device

## Milestones

1. Playable build landed via PR #1 (2026-11-18): grid, timer, probe/dig loop, end report
2. README.md added with the real rules (this run)
3. Restore `index.html` to the PR #1 version after the accidental overwrite (this run)
4. Decide with the maker: keep the shipped 18-energy loop or rebuild to the tester's 5-probe/3-dig streak loop
5. Playtest with 5 people on desktop and mobile browsers, 10 timed attempts each, record whether they voluntarily replay, and keep or rework the loop before adding any shop, upgrades, or meta

## Tester context

- Previous tester score: 0.5/10, grade F — that review was written against the stale snapshot (LICENSE only) and does not describe the shipped build. Re-test against the live game before acting on its fixes.

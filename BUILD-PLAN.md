# Paydirt: Soil & Gold Assay — Build Plan

- **Name:** Paydirt: Soil & Gold Assay
- **Tagline:** Find the hidden pay streak and dig its gold in 60 seconds.
- **Kind:** Game — prospecting puzzle game, Web platform, free-to-play, single-screen.
- **Summary:** Rebuild Paydirt from concept-only (the repo held only a LICENSE file) into a playable single-file browser game: a 60-second loop on a 6x6 dirt claim where the player uses 5 Soil Probes for hot/cold hints and 3 Assay Shovel digs to uncover gold from one hidden 3–5-cell pay streak, with scoring in grams and troy ounces, a localStorage best score, a 10-line README, and a 5-person playtest before any shop or meta is added.

## Features (this build)

- Clickable 6x6 dirt-claim grid that works with mouse and touch
- 60-second countdown that stops all probing and digging at 0:00
- One hidden pay streak of 3–5 connected cells randomly seeded each run (random walk)
- 5 Soil Probes per run that reveal hot/cold for the probed cell (HOT = on the streak or adjacent to it, including diagonals; COLD = neither)
- 3 Assay Shovel digs per run that reveal that cell's gold in grams (streak cells hold 4–12 g each; other cells are barren, 0 g)
- Live counts for probes, shovels, time remaining, and gold collected
- Restart button that reseeds the streak and resets timer, tools, and score
- End screen showing total gold weighed in grams and troy ounces, best score saved in localStorage, and Play Again
- A run also ends early if probes and shovels are both exhausted

## Stack

Single self-contained `index.html` using vanilla HTML, CSS, and JavaScript — no framework, build step, backend, or art assets. It opens and runs in any desktop or mobile browser and lets one maker ship and playtest the core loop with no tooling overhead.

## Screens

- Main game screen — 6x6 grid, 60-second timer, probe/shovel counters, gold total, and Restart
- End screen — total gold weighed, best score, and Play Again

## Entities

- Cell — grid position, probed/dug state, hot/cold hint, and gold grams
- PayStreak — set of 3–5 connected hidden cells and their gold values
- GameRun — time remaining, probes left, shovels left, and total gold
- BestScore — best total gold in grams/troy ounces saved in localStorage

## Milestones

1. Land index.html skeleton: render the clickable 6x6 grid, 60-second countdown, and Restart button
2. Implement the loop: seed one hidden 3–5-cell connected pay streak, add 5 Probes for hot/cold and 3 Shovel digs for gold in grams, and stop play at 0:00
3. Add the single end screen: total gold weighed in grams and troy ounces, best score saved in localStorage, and Play Again
4. Write the 10-line README.md: probe/shovel limits, grams/troy-ounce scoring, and what a good run looks like
5. Playtest with 5 people on desktop and mobile browsers, 10 timed attempts each, record whether they voluntarily replay, and keep or rework the loop before adding any shop, upgrades, or meta

## Open questions (decisions made for this build)

- Hot vs cold: HOT = the probed cell is in the streak or adjacent to any streak cell (8-neighbourhood); COLD = neither. Documented in README.md.
- Gold per streak cell: random 4–12 g per cell (no centre weighting yet); a full 3-cell streak dig is roughly 12–36 g.
- Re-probing/digging: a cell already probed or dug cannot be probed or dug again; digging a probed cell is allowed, and a shovel dig does not reveal hot/cold.

## Tester context

- Previous tester score: 0.5/10, grade F — repo contained only a LICENSE file, so the unfinished state was everything. This build addresses fixes 1–4 (playable file, minimum loop, 10-line README, single end screen). Fix 5 (5-person playtest, 10 timed attempts each) is a human step and is NOT done by this push — record the result before adding anything else.

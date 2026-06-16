# U.S. Open Pool — Live Leaderboard

A live scoring site for an 8-team fantasy pool at the **2026 U.S. Open** (Shinnecock Hills).

- **8 teams**, 6 golfers each.
- A team's score = the **lowest 4 of its 6 golfers' total strokes**.
- Any golfer who **misses the cut** is charged **85 strokes per remaining day** (rounds 3 & 4).
- Scores come straight from **ESPN's public golf feed**, refreshed in the browser every 60 seconds.

The whole thing is a static site — no server, no API keys. It calls ESPN directly
from the browser (the endpoint allows cross-origin requests) and computes all standings client-side.

## Tech

React + Vite + TypeScript + [Mantine](https://mantine.dev). Scoring logic lives in
`src/lib/scoring.ts`; the ESPN feed wrapper is `src/lib/espn.ts`.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

## Editing the rosters

Teams live in `public/teams.json`. Each golfer is pinned to their **ESPN athlete id**
(stable across name spellings), e.g.:

```json
{ "owner": "Victor Troese",
  "players": [ { "id": "9478", "name": "Scottie Scheffler" } ] }
```

To find an id, open the ESPN scoreboard feed and search the player's name:
`https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?dates=20260618`

## Deploy to GitHub Pages

1. Create a GitHub repo and push this folder to the `main` branch.
2. In the repo: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
3. The included workflow (`.github/workflows/deploy.yml`) builds and publishes on every
   push to `main`. Your site appears at `https://<user>.github.io/<repo>/`.

No rebuild is needed during the tournament — the page pulls fresh scores from ESPN live.

## How scoring is computed

- Each round's **actual strokes** come from the feed (`linescores[].value`), including
  live partials for a round in progress.
- The **cut line** is computed from 36-hole totals as *low 60 and ties* (U.S. Open rule).
- A missed-cut golfer keeps their real R1/R2 strokes and is charged **85** for R3 and R4.
- A golfer who withdraws after a completed round, or who isn't in the field, is charged
  85 for each unposted round.
- Each team's four lowest golfer totals are summed; lowest team total leads.

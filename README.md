# MLB Calendar & Matchup Helper

This build uses MLB StatsAPI as its primary data source. No developer account, API key, or user login is required by the app.

## Data used

- Teams and team metadata
- Schedule, game status, scores and live game feed fallback
- Active MLB player directory with local search/pagination
- Season hitting and pitching stats
- Team rosters
- Standings endpoint
- Recent-form calculations derived locally from MLB game results

## Local development

```bash
npm install
npm run dev
```

Vite proxies `/mlb-api` to `https://statsapi.mlb.com/api` during development. Production uses `https://statsapi.mlb.com/api` directly unless `VITE_MLB_API_BASE_URL` is provided.

No `VITE_BALLDONTLIE_API_KEY` is used.

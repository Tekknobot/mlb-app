
# MLB Calendar & Matchup Helper (balldontlie-powered)

> Mobile-first React app (Vite + TS + Tailwind). Browse a weekly calendar of games, same-day matchups, teams, and player stats.

⚠️ **Heads up:** The included API client is wired to **balldontlie** (a basketball API). You mentioned an MLB app with a balldontlie key, so I kept the integrations generic (`/teams`, `/players`, `/games`). If your key targets a baseball-enabled endpoint that mirrors balldontlie, you're good. If you actually want **true MLB data**, swap the `Api` layer in `src/services/api.ts` to the MLB Stats API (or your provider) while keeping the rest of the UI unchanged.

---

## Quickstart

```bash
# 1) Unzip and enter
unzip mlb-calendar-bddl.zip
cd mlb-calendar-bddl

# 2) Configure env
cp .env.example .env
# put your key in VITE_BALLDONTLIE_API_KEY (if your provider requires it)
# set VITE_API_BASE_URL if different (defaults to https://api.balldontlie.io/v1)

# 3) Install & run
npm i
npm run dev
# open the printed local URL (default: http://localhost:5173)
```

## Project Structure

- `src/pages/Calendar.tsx` – Week calendar view (pulls games in a date range)
- `src/pages/Matchups.tsx` – Single-day matchup helper + team filter
- `src/pages/Teams.tsx` – Team browser
- `src/pages/Players.tsx` – Player search + stat stubs
- `src/services/api.ts` – All API calls (edit here to switch providers)
- `src/components/*` – Small, reusable UI pieces
- `tailwind.config.js` / `src/index.css` – Mobile-first styling

## Provider Swap Notes

If switching to MLB Stats API:
- Replace endpoints in `src/services/api.ts`:
  - Teams → `/api/v1/teams`
  - Games → `/api/v1/schedule` (date range support)
  - Players → `/api/v1/people` (+ stats endpoints)
- Map fields into the `Team`, `Game`, and `Player` interfaces used by the UI.
- Keep the same return shapes so pages don’t change.

## Build & Preview

```bash
npm run build
npm run preview
```

## Production Tips

- Add caching in `api.ts` for repeated weekly fetches.
- Use infinite scroll on matchups if your provider paginates heavily.
- Consider persistent state (localStorage) for favorite teams.

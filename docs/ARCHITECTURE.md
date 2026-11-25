# Architecture (BeeLab)

Purpose: explain organization and request flow of the active Cloudflare application and note legacy code.

## Active application model

- `functions/[[route]].ts` is a Cloudflare Pages function adapter that forwards all non-static requests to the Hono `app`.
- `src/index.ts` registers middleware and routes, plus worker entrypoint and scheduled handler.
- Storage uses Cloudflare D1 for data and KV for weather cache.
- Cron Triggers invoke `handleScheduled` in `src/scheduled/tasks.ts`.

```text
browser request -> Cloudflare Pages/static -> functions adapter
  -> Hono auth/CSRF middleware -> route handler
  -> D1 / KV / Telegram / weather API -> rendered Hono JSX/HTML
```

## Modules

- `src/middleware/`: session and CSRF handling.
- `src/routes/`: auth, hives, finance, analytics, pages, metadata.
- `src/db/`: D1 schema types and query helpers.
- `src/templates/`: server-rendered HTML generated as TS functions.
- `src/utils/`: crypto, validators, status, weather, Telegram, storage, flash, date helpers.
- `src/scheduled/`: status update and daily Telegram briefing tasks.

## Legacy Python implementation

Root files (`main.py`, `routes/`, `models.py`, `services.py`, `templates/`, `static/`) implement an older Flask/MySQL version with equivalent domain features. It is not the Pages entry point. Pytest tests under `tests/` target this Python app.

## Data sources

- Cloud D1 schema in `migrations/0001_initial.sql` defines users, hives, inspections, future tasks, expenses, harvests and sales.
- Query helpers in `src/db/queries.ts` use prepared D1 statements.
- Legacy Python uses SQLAlchemy models in `models.py` and MySQL via `DATABASE_URL`.

## Build pipeline

```sh
npm run build   # tsc --noEmit
npm run dev     # wrangler pages dev
npm run deploy  # wrangler pages deploy .
```

No static bundler exists beyond TypeScript type checking; Pages serves root files and Hono-rendered responses.
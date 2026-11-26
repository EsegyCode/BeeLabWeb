# BeeLab Management

Purpose: beekeeping management web application for hive records, inspections, tasks, expenses, harvest/sale tracking, analytics and Telegram briefings.

Live URL: TODO (owner). Repository status: active TypeScript/Cloudflare implementation in `src/` and `functions/`; Python Flask/MySQL implementation also remains in the repository root. License: TODO (owner).

## Key features

- Authenticated per-user hive management: create, view, delete and inspect hives.
- Quick hive actions: feeding, mite-plate scheduling, harvest status and attention.
- Calendar and future tasks for beekeeping work.
- Finance records for expenses, honey harvests and honey sales; CSV export.
- Analytics dashboard and computation of hive/display status.
- Telegram integration with weather and daily briefings.
- `/robots.txt`, `/sitemap.xml` and `/llms.txt` for public metadata.
- See [Features](docs/FEATURES.md).

## Tech stack

| Area | Technology | Notes |
| --- | --- | --- |
| Cloud app | Hono 4.6, TypeScript | `src/index.ts` and `functions/[[route]].ts` |
| Cloud runtime | Cloudflare Worker (Wrangler), D1, KV, Cron Triggers | Bindings in `src/db/schema.ts` and `wrangler.jsonc` |
| Validation/build | `tsc --noEmit` | `npm run build` |
| Legacy app | Flask, SQLAlchemy, MySQL, Jinja-style templates | Root Python files and `templates/` |
| Tools | Docker Compose, pytest | `requirements.txt`, `tests/` |

## Quick start (Cloudflare)

```sh
npm install
npm run build
npm run dev
```

`npm run dev` runs `wrangler dev`.
Production deploy: `npm run deploy` (`wrangler deploy`, same as the Cloudflare build command).

Database migrations:

```sh
npm run db:migrate:local
npm run db:migrate:remote
```

## Quick start (Python implementation)

```sh
pip install -r requirements.txt
python main.py
```

`main.py` starts Flask on `0.0.0.0:5000`. It uses MySQL through `DATABASE_URL`.

## Environment variables

Cloudflare names (from `src/db/schema.ts`): `DB`, `KV`, `SECRET_KEY` (required), `WEATHER_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `APP_NAME`, `APP_VERSION`, `APP_URL`.

Python names from `.env.example`: `SECRET_KEY`, `DATABASE_URL`, `APP_NAME`, `APP_VERSION`, `APP_URL`, `SUPPORT_EMAIL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `WEATHER_API_KEY`, `WEATHER_CITY`, `DEFAULT_TIMEZONE`, `ITEMS_PER_PAGE`, `WEATHER_CACHE_MINUTES`, `BRIEFING_HOUR`, `MAX_IMPORT_ROWS`, `FLASK_ENV`. Set these in Cloudflare dashboard or local `.dev.vars`/`.env`; values are not documented here.

## Project structure

```text
BeeLabWeb/
├── src/                  # Active TypeScript Hono app
├── functions/[[route]].ts# Pages function adapter to Hono
├── migrations/           # D1 SQLite schema
├── static/, templates/   # Legacy assets and templates
├── routes/, models.py    # Legacy Flask code
├── tests/                # Python tests
├── wrangler.toml
└── package.json
```

## Documentation

- [Features](docs/FEATURES.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Maintainer FAQ](docs/FAQ.md)
- [SEO and metadata](docs/SEO.md)
- [Changelog](docs/CHANGELOG.md)
- [Українська версія](README.uk.md)

## Deployment notes

Cloudflare Worker uses `wrangler.jsonc` with placeholder D1/KV IDs; create resources and replace IDs before release. Details in [Deployment](docs/DEPLOYMENT.md).

## Notes

The module `src/templates/*` is generated TSX/HTML output; user-facing text is embedded in route/template code. Preserve encoding of Ukrainian text. Existing ADR-style docs are under `docs/AUDIT.md` and `docs/DECISIONS.md`.
# Maintainer FAQ (BeeLab)

Purpose: practical maintenance answers for the beekeeping application.

## How do I run the app locally?

Use the active Cloud path: `npm install`, `npm run build`, `npm run dev`. For the Python version, install `requirements.txt` and run `python main.py`.

## Where is the D1 schema?

`migrations/0001_initial.sql`; TypeScript interface types are in `src/db/schema.ts`. Query helpers are in `src/db/queries.ts`.

## Where are environment names defined?

Cloud names: `src/db/schema.ts` (`Env`). Python names: `.env.example`. Set values in dashboard or local wrangler files; never store real values in docs.

## How do hive statuses work?

`src/utils/status.ts` computes status from hive fields and dates. Scheduled status update runs at 06:00 via Cloudflare Cron.

## Where are Telegram and weather integrations?

`src/utils/telegram.ts` and `src/utils/weather.ts`; scheduled briefing logic is in `src/scheduled/tasks.ts`.

## How is weather cached?

Weather uses the `KV` binding while building briefing/user weather data. Local expiration depends on calling `getWeather`.

## How do finance and exports work?

`src/routes/finance.ts` stores expenses, harvests and sales and checks honey stock before sale. `/export` generates CSV in memory in `src/routes/analytics.ts`.

## What tests exist?

Python pytest tests under `tests/` target the Flask app (auth, hives, finance, validators, smoke/static/mojibake). There are no TypeScript tests in the repository.

## What should I check after a deploy?

Login, create/view hive, add inspection, use a quick action, open calendar and finance, export CSV, verify legal pages, metadata routes and Telegram configuration if enabled.

## Why are there two implementations?

The repository contains both Python Flask/MySQL code and a Cloudflare Hono/D1 implementation. Active entry point is `functions/[[route]].ts` / `src/index.ts`; the Python app remains as legacy code.

## Common issue: placeholder database IDs

`wrangler.toml` has placeholder `database_id` and KV `id`. Create resources before deploy or local migrations fail.

## Common issue: encoding

Ukrainian text is embedded in `src/templates/*`; keep files UTF-8 and run `tests/test_templates_mojibake.py` for the legacy templates.
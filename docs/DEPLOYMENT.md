# Deployment (BeeLab)

Purpose: build, hosting and post-deploy notes for the Cloudflare application.

## Build

```sh
npm run build
npm run preview # not provided by package.json; use npm run dev instead
```

The only script entry point for build is `npm run build` (`tsc --noEmit`). Local dev uses `npm run dev` (`wrangler pages dev --compatibility-date=2024-09-23 .`).

## Hosting and output

Hosting is Cloudflare Pages, configured by `wrangler.toml`. `name` is `beelab`, `pages_build_output_dir` is `public`, and all non-static requests are forwarded to `src` through `functions/[[route]].ts`. Cron triggers are `0 6 * * *` and `0 8 * * *`.

## Database and KV

```sh
npm run db:migrate:local
npm run db:migrate:remote
```

`wrangler.toml` contains placeholder IDs for `beelab-db` (D1) and `KV`. Create resources and replace `database_id` and `id` before deploying. Binding names must remain `DB` and `KV`.

## Environment variables

Set Cloudflare variables/secrets by the names in `src/db/schema.ts`, including `SECRET_KEY`, weather and Telegram keys, app name/version and URL. Python-only deployment requires `.env` names from `.env.example`.

## Cache and data behaviour

- Weather responses are cached in KV with a minutes value from `WEATHER_CACHE_MINUTES` (Python) / environment (Cloud code uses `getWeather`).
- `/export` generates CSV at request time; no cached build artifacts.

## Post-deploy checklist

- Add a test account and one test hive in production.
- Open dashboard, `/hive/:id`, `/calendar`, `/finance`, `/analytics`.
- Test a CSV export and Telegram briefing requirements (`TELEGRAM_BOT_TOKEN`).
- Request `/robots.txt`, `/sitemap.xml`, `/llms.txt`.
- Run `npm run build` before release.
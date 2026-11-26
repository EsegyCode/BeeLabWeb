# Deployment (BeeLab)

Purpose: build, hosting and post-deploy notes for the Cloudflare application.

## Build

```sh
npm run build
npm run preview # not provided by package.json; use npm run dev instead
```

The only script entry point for build is `npm run build` (`tsc --noEmit`). Local dev uses `npm run dev` (`wrangler dev`).

## Hosting and output

Hosting is a Cloudflare Worker with static assets, configured by `wrangler.jsonc`. Worker name is `beelabweb`, entry point is `src/index.ts`, static assets directory is `./public` with binding `ASSETS`. Cron triggers are `0 6 * * *` and `0 8 * * *`. `functions/[[route]].ts` is legacy Pages routing and is not used by the Worker entry.

## Database and KV

```sh
npm run db:migrate:local
npm run db:migrate:remote
```

`wrangler.jsonc` contains placeholder IDs for `beelab-db` (D1) and `KV`. Create resources and replace `database_id` and `id` before deploying. Binding names must remain `DB` and `KV`.

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
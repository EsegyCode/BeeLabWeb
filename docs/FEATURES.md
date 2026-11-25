# Features (BeeLab)

Purpose: user-facing and technical features evidenced by the Cloudflare TypeScript app and legacy Python app.

## Accounts and sessions

- Registration (`/register`), login (`/login`), logout (`/logout`) and profile (`/profile`) in `src/routes/auth.ts`.
- Password change and profile update (city and Telegram ID).
- Session middleware and CSRF middleware in `src/middleware/auth.ts` and `src/middleware/csrf.ts`.

## Hives

- Dashboard at `/` with computed hive status and weather (`src/routes/hives.ts`).
- Add hive with validation and per-user uniqueness.
- Hive detail at `/hive/:id` with inspection history.
- Inspection records with condition, honey level, queen cells and next inspection.
- Quick actions: feeding, mite-plate scheduling, harvest status and attention; deletion of a hive.
- Calendar at `/calendar` with future tasks and task creation/completion.

## Finance

- Expense, honey harvest and sale records at `/finance`.
- Stock balance based on harvested minus sold honey.
- Totals for expenses, harvested kg, sold kg and revenue.
- CSV export endpoints at `/export?type=hives|finance`.

## Analytics and status

- Analytics page at `/analytics` with counts and totals.
- Display status computation in `src/utils/status.ts`.
- Status labels used by dashboard, hive view, calendar and analytics.

## Integrations

- Weather lookup in `src/utils/weather.ts`, using `WEATHER_API_KEY` and `KV` cache.
- Telegram messaging in `src/utils/telegram.ts`, triggered for daily briefings and weather.
- Daily cron (08:00) and status cron (06:00) in `src/scheduled/tasks.ts`.

## Metadata and legal

- `/robots.txt`, `/sitemap.xml` and `/llms.txt` in `src/routes/meta.ts`.
- `/faq`, `/about`, `/privacy`, `/terms` in `src/routes/pages.ts` and templates.
- CSV contains a UTF-8 BOM.

## Legacy Python features

Root Flask files provide equivalent/auth older app pieces: hives, finance, analytics, import/export, scheduled briefing and tests under `tests/`. They remain in the repository but do not use the Cloudflare entry point.

## Configuration touchpoints

- Hive labels, validators and limits: `src/utils/validators.ts`.
- D1 schema/migration: `migrations/0001_initial.sql`.
- Cron schedules and binding access: `wrangler.toml` and `src/db/schema.ts`.
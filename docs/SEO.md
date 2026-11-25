# SEO and Metadata (BeeLab)

Purpose: document search-engine and crawler-facing routes implemented by the app.

## Metadata routes

- `/robots.txt`: generated in `src/routes/meta.ts` with public paths and disallowed app paths.
- `/sitemap.xml`: generated list of public paths (`/login`, `/register`, `/faq`, `/about`, `/privacy`, `/terms`).
- `/llms.txt`: generated app description and public documentation links.

## Legal/content pages

Public pages are `/about`, `/faq`, `/privacy` and `/terms`, rendered from `src/templates/about.ts`, `faq.ts` and `legal.ts`.

## Privacy behaviour

App routes are disallowed in robots. Session, CSRF and rate-limiting middleware are configured in `src/middleware`. No SEO meta tags beyond these generated routes are evidenced in the TypeScript templates.

## Touchpoints

- Change public sitemap paths in `src/routes/meta.ts`.
- Change app name/version used by metadata in `src/db/schema.ts` environment type and `APP_NAME`/`APP_VERSION` bindings.
- Set canonical `APP_URL` so robots/sitemap URLs are stable.
# Decisions

- Branch all redesign work is done on `redesign`.
- Database backup saved to `backups/pre-redesign.sql`.
- Vendor assets are committed locally instead of fetched at build time for reliability in development.
- Bootstrap icon usage is backed by a committed SVG sprite under `static/vendor/bootstrap-icons`.
- `APP_NAME`, `APP_VERSION`, `SUPPORT_EMAIL` and `TELEGRAM_BOT_USERNAME` are injected through a context processor.
- Weather requests timeout after 4 seconds and cache values for `WEATHER_CACHE_MINUTES`.
- Status labels are kept as the existing literal strings while adding constants and a `status_badge` macro.
- Playwright screenshots are in docs/screenshots. Lighthouse mobile/homepage scores: Performance 90, Accessibility 92, Best Practices 96, SEO 100.
- Work continues on branch edesign-light (light theme is the default).
- Theme initial value is applied by external static/js/theme-init.js; 	heme.js keeps toggle behavior.
- Icons use local inline partials/_sprite.svg and the icon(name, cls) macro; Bootstrap Icons CSS was removed from rendered pages.
- Status presentation is centralized in macros/badges.html::status_badge.
- Destructive hive deletion uses the shared confirm modal and data-confirm instead of native confirm().
- Footer and header links point to existing application routes; legal/help pages use their dedicated templates.


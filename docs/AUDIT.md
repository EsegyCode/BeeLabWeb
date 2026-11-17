# Audit summary

- Base templates and partials contained UTF-8 text that had been stored as cp1251 mojibake; fixed in impacted partials and base layouts.
- Header, footer and base layout were the primary affected templates.
- Static vendor files are present under `static/vendor/bootstrap`, `bootstrap-icons` and `chart.js` with fixed versions.
- Bootstrap icon SVG sprite was added for local icon usage.
- CSS/JS paths in `templates/layouts/base.html` and `templates/base.html` use `url_for('static', ...)`.
- CSP is currently restricted to `'self'` for styles/scripts/fonts/images.
- Weather function now logs HTTP status codes without exposing the API key and caches per city.
- Main application pages render through Jinja templates with CSRF token meta.
# Stage 1 icon audit

## Rendering paths
- `templates/macros/icons.html` renders the only `icon(name, cls="")` macro as an inline `<svg class="icon ..."><use href="#i-{{ name }}"/></svg>`.
- The local sprite is injected once in `templates/base.html` and `templates/layouts/base.html` as `{% include "partials/_sprite.svg" %}` inside the body.
- `partials/_sprite.svg` contains `<symbol id="i-...">` entries sourced locally from Bootstrap Icons; no external sprite requests are needed.
- Flash messages, empty states, navigation, cards, tables, weather and status badges now call `{{ icon(...) }}` rather than `<i class="bi ...">`, emoji or Font Awesome markup.
- The old Flask context-processor `icon` helper in `main.py` was aligned to the same inline markup.

## Sprite verification
- Sprite file exists at `templates/partials/_sprite.svg`.
- Symbol ids use the `i-` prefix and match the names used by the `icon` macro.
- Every template-level `icon('...')` call resolves to an existing symbol, including aliases such as `hive`.
- Unknown icon names are not declared in templates; the macro still emits a reference, while verification compares calls against the symbol set.
- Icons use `fill: currentColor`, so they inherit text colour in light and dark themes.

## HTTP and CSP notes
- `Content-Security-Policy` keeps `default-src`, `script-src`, `style-src`, `font-src`, `img-src` and `connect-src` at `'self'`.
- No external icon files are requested in rendered HTML, so icon rendering no longer depends on origin-mismatched SVG references.
- Static assets documented in `tests/test_static_assets.py` must still return `200` with their expected content types.

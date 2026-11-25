# BeeLab Management (Українська)

Веб-застосунок для обліку пасіки: вулики, огляди, завдання, фінанси, аналітика, статуси і Telegram-звіти.

Активна реалізація знаходиться в `src/` та запускається через Cloudflare Pages/Hono (`npm run dev`, `npm run build`, `npm run deploy`). У репозиторії також є старіша Flask/MySQL версія (кореневі `.py`-файли і `tests/`).

## Запуск

```sh
npm install
npm run build
npm run dev
```

Бази даних:

```sh
npm run db:migrate:local
npm run db:migrate:remote
```

Змінні середовища задаються через `wrangler` Cloudflare або `.env`/`.dev.vars`, їхні імена є в README.md.

## Документація

- [English README](README.md)
- [Features](docs/FEATURES.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [FAQ](docs/FAQ.md)
// src/templates/legal.ts
import type { User } from '../db/schema';
import { renderLayout } from './layout';

export function renderPrivacy(user: User | null = null, appUrl = ''): string {
  return renderLayout({
    title: 'Політика конфіденційності',
    description: 'Політика конфіденційності сервісу BeeLab.',
    activePath: '/privacy',
    user,
    appUrl,
    content: `
      <div class="card p-4 p-md-5">
        <h1 class="h3 fw-bold mb-3" style="color:var(--bee-brown);">Політика конфіденційності</h1>
        <p class="text-muted">BeeLab збирає лише ті дані, які необхідні для роботи вашого облікового запису та ведення пасіки.</p>
        <h2 class="h5 fw-bold mt-4" style="color:var(--bee-brown);">1. Які дані зберігаються</h2>
        <p class="text-muted">Логін, хешований пароль (PBKDF2), контактна інформація за вашим бажанням, місто для відображення погоди, Telegram Chat ID для сповіщень, а також записи про вулики, огляди, завдання і фінанси.</p>
        <h2 class="h5 fw-bold mt-4" style="color:var(--bee-brown);">2. Cookie та сесії</h2>
        <p class="text-muted">Ми використовуємо лише технічні HttpOnly cookie для автентифікації сесії та захисту форм від CSRF-атак. Рекламні трекери не використовуються.</p>
        <h2 class="h5 fw-bold mt-4" style="color:var(--bee-brown);">3. Передача даних третім сторонам</h2>
        <p class="text-muted mb-0">Ваші дані не продаються і не передаються третім особам. Зовнішні запити виконуються лише до OpenWeatherMap (назва міста) та Telegram Bot API (якщо ви вказали Chat ID).</p>
      </div>
    `,
  });
}

export function renderTerms(user: User | null = null, appUrl = ''): string {
  return renderLayout({
    title: 'Умови використання',
    description: 'Умови використання веб-сервісу BeeLab.',
    activePath: '/terms',
    user,
    appUrl,
    content: `
      <div class="card p-4 p-md-5">
        <h1 class="h3 fw-bold mb-3" style="color:var(--bee-brown);">Умови використання</h1>
        <p class="text-muted">Користуючись сервісом BeeLab, ви погоджуєтеся з наведеними нижче правилами.</p>
        <h2 class="h5 fw-bold mt-4" style="color:var(--bee-brown);">1. Призначення сервісу</h2>
        <p class="text-muted">BeeLab надається «як є» для особистого та господарського обліку пасіки, планування робіт і фінансової аналітики.</p>
        <h2 class="h5 fw-bold mt-4" style="color:var(--bee-brown);">2. Відповідальність користувача</h2>
        <p class="text-muted">Ви несете відповідальність за збереження пароля від свого облікового запису та достовірність внесених даних.</p>
        <h2 class="h5 fw-bold mt-4" style="color:var(--bee-brown);">3. Доступність</h2>
        <p class="text-muted mb-0">Ми докладаємо зусиль для стабільної роботи сервісу, але рекомендуємо періодично експортувати резервні копії даних на сторінці «Аналітика».</p>
      </div>
    `,
  });
}

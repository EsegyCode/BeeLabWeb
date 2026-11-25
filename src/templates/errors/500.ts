// src/templates/errors/500.ts
import type { User } from '../../db/schema';
import { renderLayout } from '../layout';

export function render500(user: User | null = null): string {
  return renderLayout({
    title: 'Помилка сервера (500)',
    user,
    content: `
      <div class="empty-state py-5">
        <h1 class="display-4 fw-bold" style="color: var(--bee-status-danger);">500</h1>
        <p class="empty-state__title">Внутрішня помилка сервера</p>
        <p class="empty-state__text mb-4">Сталася непередбачена помилка. Спробуйте оновити сторінку пізніше.</p>
        <a href="/" class="btn btn-bee">На головну</a>
      </div>
    `,
  });
}

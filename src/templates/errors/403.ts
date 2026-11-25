// src/templates/errors/403.ts
import type { User } from '../../db/schema';
import { renderLayout } from '../layout';

export function render403(user: User | null = null): string {
  return renderLayout({
    title: 'Доступ заборонено (403)',
    user,
    content: `
      <div class="empty-state py-5">
        <h1 class="display-4 fw-bold" style="color: var(--bee-brown);">403</h1>
        <p class="empty-state__title">Доступ заборонено</p>
        <p class="empty-state__text mb-4">У вас немає прав для перегляду цієї сторінки або виконання цієї дії.</p>
        <a href="/" class="btn btn-bee">Повернутися на головну</a>
      </div>
    `,
  });
}

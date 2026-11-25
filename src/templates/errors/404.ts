// src/templates/errors/404.ts
import type { User } from '../../db/schema';
import { renderLayout } from '../layout';

export function render404(user: User | null = null): string {
  return renderLayout({
    title: 'Сторінку не знайдено (404)',
    user,
    content: `
      <div class="empty-state py-5">
        <h1 class="display-4 fw-bold" style="color: var(--bee-brown);">404</h1>
        <p class="empty-state__title">Сторінку не знайдено</p>
        <p class="empty-state__text mb-4">Можливо, цей вулик перемістили або посилання застаріло.</p>
        <a href="/" class="btn btn-bee">Повернутися на головну</a>
      </div>
    `,
  });
}

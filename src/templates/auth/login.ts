// src/templates/auth/login.ts
import type { FlashMessage } from '../../utils/flash';
import { csrfInput, esc, icon } from '../../utils/html';
import { renderLayout } from '../layout';

export interface LoginViewParams {
  csrfToken: string;
  error?: string | null;
  username?: string;
  next?: string;
  flash?: FlashMessage | null;
}

export function renderLogin(params: LoginViewParams): string {
  const { csrfToken, error, username = '', next = '/', flash } = params;

  return renderLayout({
    title: 'Вхід',
    activePath: '/login',
    flash,
    content: `
      <div class="row justify-content-center py-4">
        <div class="col-12 col-sm-10 col-md-6 col-lg-5">
          <div class="card p-4">
            <div class="text-center mb-4">
              <div class="d-inline-flex align-items-center justify-content-center rounded-circle mb-2" style="width:3.25rem;height:3.25rem;background:var(--bee-orange-light);color:var(--bee-orange);">
                ${icon('hive')}
              </div>
              <h1 class="h4 fw-bold mb-1" style="color:var(--bee-brown);">Вхід у BeeLab</h1>
              <p class="text-muted small mb-0">Керуйте пасікою зручно з будь-якого пристрою</p>
            </div>

            ${error ? `<div class="alert alert-danger mb-3" role="alert">${esc(error)}</div>` : ''}

            <form method="POST" action="/login" novalidate>
              ${csrfInput(csrfToken)}
              <input type="hidden" name="next" value="${esc(next)}">

              <div class="mb-3">
                <label for="username" class="form-label">Логін</label>
                <input type="text" class="form-control" id="username" name="username" value="${esc(username)}" required autocomplete="username" autofocus>
              </div>

              <div class="mb-4">
                <label for="password" class="form-label">Пароль</label>
                <input type="password" class="form-control" id="password" name="password" required autocomplete="current-password">
              </div>

              <button type="submit" class="btn btn-bee w-100 mb-3">
                ${icon('login')} Увійти
              </button>
            </form>

            <div class="text-center small">
              <span class="text-muted">Ще немає акаунта?</span>
              <a href="/register" class="fw-semibold text-decoration-none">Зареєструватися</a>
            </div>
          </div>
        </div>
      </div>
    `,
  });
}

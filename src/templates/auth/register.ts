// src/templates/auth/register.ts
import type { FlashMessage } from '../../utils/flash';
import { csrfInput, esc, icon } from '../../utils/html';
import { renderLayout } from '../layout';

export interface RegisterViewParams {
  csrfToken: string;
  error?: string | null;
  username?: string;
  contactInfo?: string;
  flash?: FlashMessage | null;
}

export function renderRegister(params: RegisterViewParams): string {
  const { csrfToken, error, username = '', contactInfo = '', flash } = params;

  return renderLayout({
    title: 'Реєстрація',
    activePath: '/register',
    flash,
    content: `
      <div class="row justify-content-center py-4">
        <div class="col-12 col-sm-10 col-md-6 col-lg-5">
          <div class="card p-4">
            <div class="text-center mb-4">
              <div class="d-inline-flex align-items-center justify-content-center rounded-circle mb-2" style="width:3.25rem;height:3.25rem;background:var(--bee-orange-light);color:var(--bee-orange);">
                ${icon('hive')}
              </div>
              <h1 class="h4 fw-bold mb-1" style="color:var(--bee-brown);">Реєстрація пасічника</h1>
              <p class="text-muted small mb-0">Створіть обліковий запис для обліку вуликів</p>
            </div>

            ${error ? `<div class="alert alert-danger mb-3" role="alert">${esc(error)}</div>` : ''}

            <form method="POST" action="/register" novalidate>
              ${csrfInput(csrfToken)}

              <div class="mb-3">
                <label for="username" class="form-label">Логін</label>
                <input type="text" class="form-control" id="username" name="username" value="${esc(username)}" required minlength="3" maxlength="50" autocomplete="username" autofocus>
                <div class="form-text">Латинські літери, цифри, крапка, дефіс або підкреслення (від 3 символів).</div>
              </div>

              <div class="mb-3">
                <label for="contact_info" class="form-label">Контакт (телефон або email, необов'язково)</label>
                <input type="text" class="form-control" id="contact_info" name="contact_info" value="${esc(contactInfo)}" maxlength="100">
              </div>

              <div class="mb-3">
                <label for="password" class="form-label">Пароль</label>
                <input type="password" class="form-control" id="password" name="password" required minlength="6" autocomplete="new-password">
              </div>

              <div class="mb-4">
                <label for="password_confirm" class="form-label">Підтвердження пароля</label>
                <input type="password" class="form-control" id="password_confirm" name="password_confirm" required minlength="6" autocomplete="new-password">
              </div>

              <button type="submit" class="btn btn-bee w-100 mb-3">Створити акаунт</button>
            </form>

            <div class="text-center small">
              <span class="text-muted">Вже маєте акаунт?</span>
              <a href="/login" class="fw-semibold text-decoration-none">Увійти</a>
            </div>
          </div>
        </div>
      </div>
    `,
  });
}

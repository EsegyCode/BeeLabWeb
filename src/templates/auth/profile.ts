// src/templates/auth/profile.ts
import type { User } from '../../db/schema';
import type { FlashMessage } from '../../utils/flash';
import { csrfInput, esc, icon } from '../../utils/html';
import { renderLayout } from '../layout';

export interface ProfileViewParams {
  user: User;
  csrfToken: string;
  telegramBotUsername?: string;
  error?: string | null;
  flash?: FlashMessage | null;
}

export function renderProfile(params: ProfileViewParams): string {
  const { user, csrfToken, telegramBotUsername, error, flash } = params;

  return renderLayout({
    title: 'Профіль',
    activePath: '/profile',
    user,
    flash,
    content: `
      <div class="row justify-content-center">
        <div class="col-12 col-lg-8">
          <div class="d-flex align-items-center justify-content-between mb-4">
            <h1 class="h3 fw-bold mb-0" style="color:var(--bee-brown);">${icon('user')} Налаштування профілю</h1>
            <a href="/" class="btn btn-outline-bee btn-sm">На дашборд</a>
          </div>

          ${error ? `<div class="alert alert-danger mb-4">${esc(error)}</div>` : ''}

          <div class="card p-4 mb-4">
            <h2 class="h5 fw-bold mb-3" style="color:var(--bee-brown);">Погода та Telegram-сповіщення</h2>
            <form method="POST" action="/profile">
              ${csrfInput(csrfToken)}
              <input type="hidden" name="action" value="update_profile">

              <div class="mb-3">
                <label class="form-label">Логін</label>
                <input type="text" class="form-control" value="${esc(user.username)}" disabled>
              </div>

              <div class="mb-3">
                <label for="city" class="form-label">${icon('weather')} Місто (для прогнозу погоди)</label>
                <input type="text" class="form-control" id="city" name="city" value="${esc(user.city)}" maxlength="50" required>
                <div class="form-text">Використовується для відображення температури на дашборді та у ранковому зведенні.</div>
              </div>

              <div class="mb-4">
                <label for="telegram_id" class="form-label">${icon('telegram')} Telegram Chat ID</label>
                <input type="text" class="form-control" id="telegram_id" name="telegram_id" value="${esc(user.telegram_id ?? '')}" placeholder="Наприклад: 123456789" maxlength="20">
                <div class="form-text">
                  ${
                    telegramBotUsername
                      ? `Щоб дізнатися свій ID та отримувати ранкові зведення о 08:00, напишіть боту <a href="https://t.me/${esc(telegramBotUsername)}" target="_blank" rel="noopener">@${esc(telegramBotUsername)}</a>.`
                      : 'Вкажіть числовий Telegram Chat ID для отримання щоденних нагадувань о 08:00.'
                  }
                </div>
              </div>

              <button type="submit" class="btn btn-bee">Зберегти налаштування</button>
            </form>
          </div>

          <div class="card p-4">
            <h2 class="h5 fw-bold mb-3" style="color:var(--bee-brown);">Зміна пароля</h2>
            <form method="POST" action="/profile">
              ${csrfInput(csrfToken)}
              <input type="hidden" name="action" value="change_password">

              <div class="mb-3">
                <label for="current_password" class="form-label">Поточний пароль</label>
                <input type="password" class="form-control" id="current_password" name="current_password" required autocomplete="current-password">
              </div>

              <div class="mb-3">
                <label for="new_password" class="form-label">Новий пароль</label>
                <input type="password" class="form-control" id="new_password" name="new_password" required minlength="6" autocomplete="new-password">
              </div>

              <div class="mb-4">
                <label for="confirm_password" class="form-label">Підтвердження нового пароля</label>
                <input type="password" class="form-control" id="confirm_password" name="confirm_password" required minlength="6" autocomplete="new-password">
              </div>

              <button type="submit" class="btn btn-outline-bee">Оновити пароль</button>
            </form>
          </div>
        </div>
      </div>
    `,
  });
}

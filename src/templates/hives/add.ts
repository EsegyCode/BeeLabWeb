// src/templates/hives/add.ts
import type { User } from '../../db/schema';
import type { FlashMessage } from '../../utils/flash';
import { BEE_SPECIES, HONEY_LEVELS } from '../../utils/validators';
import { csrfInput, esc, icon, todayISO } from '../../utils/html';
import { renderLayout } from '../layout';

export interface AddHiveViewParams {
  user: User;
  csrfToken: string;
  error?: string | null;
  flash?: FlashMessage | null;
  values?: Record<string, string>;
}

export function renderAddHive(params: AddHiveViewParams): string {
  const { user, csrfToken, error, flash, values = {} } = params;
  const today = todayISO();
  const currentYear = new Date().getFullYear();

  return renderLayout({
    title: 'Додати вулик',
    activePath: '/add',
    user,
    flash,
    content: `
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6">
          <div class="d-flex align-items-center justify-content-between mb-4">
            <h1 class="h3 fw-bold mb-0" style="color:var(--bee-brown);">${icon('plus')} Новий вулик</h1>
            <a href="/" class="btn btn-outline-bee btn-sm">Назад</a>
          </div>

          ${error ? `<div class="alert alert-danger mb-4">${esc(error)}</div>` : ''}

          <div class="card p-4">
            <form method="POST" action="/add">
              ${csrfInput(csrfToken)}

              <div class="mb-3">
                <label for="hive_number" class="form-label">Номер або назва вулика *</label>
                <input type="text" class="form-control" id="hive_number" name="hive_number" value="${esc(values.hive_number ?? '')}" placeholder="Наприклад: 1, 12-А, А1" required maxlength="20" autofocus>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-12 col-sm-6">
                  <label for="bee_species" class="form-label">Порода бджіл</label>
                  <select class="form-select" id="bee_species" name="bee_species">
                    ${BEE_SPECIES.map(
                      (sp) =>
                        `<option value="${esc(sp)}"${values.bee_species === sp ? ' selected' : ''}>${esc(sp)}</option>`
                    ).join('')}
                  </select>
                </div>

                <div class="col-12 col-sm-6">
                  <label for="queen_year" class="form-label">Рік народження матки</label>
                  <input type="number" class="form-control" id="queen_year" name="queen_year" value="${esc(values.queen_year ?? String(currentYear))}" min="2000" max="${currentYear + 1}">
                </div>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-12 col-sm-6">
                  <label for="install_date" class="form-label">Дата заселення *</label>
                  <input type="date" class="form-control" id="install_date" name="install_date" value="${esc(values.install_date ?? today)}" max="${today}" required>
                </div>

                <div class="col-12 col-sm-6">
                  <label for="next_inspection_date" class="form-label">Наступний огляд</label>
                  <input type="date" class="form-control" id="next_inspection_date" name="next_inspection_date" value="${esc(values.next_inspection_date ?? '')}">
                </div>
              </div>

              <div class="mb-4">
                <label for="honey_level" class="form-label">Початковий рівень меду</label>
                <select class="form-select" id="honey_level" name="honey_level">
                  ${HONEY_LEVELS.map(
                    (lvl) =>
                      `<option value="${esc(lvl)}"${(values.honey_level ?? 'Немає') === lvl ? ' selected' : ''}>${esc(lvl)}</option>`
                  ).join('')}
                </select>
              </div>

              <div class="d-flex gap-2">
                <button type="submit" class="btn btn-bee flex-grow-1">${icon('plus')} Додати вулик</button>
                <a href="/" class="btn btn-outline-bee">Скасувати</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    `,
  });
}

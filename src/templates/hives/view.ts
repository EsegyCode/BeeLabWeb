// src/templates/hives/view.ts
import type { ComputedStatus, Hive, HiveInspection, User } from '../../db/schema';
import type { FlashMessage } from '../../utils/flash';
import { statusColorClass } from '../../utils/status';
import { HONEY_LEVELS } from '../../utils/validators';
import { csrfInput, esc, icon, todayISO } from '../../utils/html';
import { renderLayout } from '../layout';

export interface HiveViewParams {
  user: User;
  hive: Hive;
  status: ComputedStatus;
  inspections: HiveInspection[];
  csrfToken: string;
  error?: string | null;
  flash?: FlashMessage | null;
}

const HONEY_PERCENT: Record<string, number> = {
  'Немає': 5,
  'Майже немає': 25,
  'Середньо': 50,
  'Велика кількість': 80,
  'Повний вулик': 100,
};

export function renderHiveView(params: HiveViewParams): string {
  const { user, hive, status, inspections, csrfToken, error, flash } = params;
  const today = todayISO();
  const badgeCls = statusColorClass(status);
  const honeyPct = HONEY_PERCENT[hive.honey_level] ?? 0;

  return renderLayout({
    title: `Вулик #${hive.hive_number}`,
    activePath: `/hive/${hive.id}`,
    user,
    flash,
    content: `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div class="d-flex align-items-center gap-3">
          <h1 class="h3 fw-bold mb-0" style="color:var(--bee-brown);">Вулик #${esc(hive.hive_number)}</h1>
          <span class="status-badge ${badgeCls}">
            ${icon(status.icon)}
            <span>${esc(status.label)}</span>
          </span>
        </div>
        <div class="d-flex gap-2">
          <a href="/" class="btn btn-outline-bee btn-sm">До пасіки</a>
          <button type="button" class="btn btn-sm btn-outline-danger" data-bs-toggle="modal" data-bs-target="#deleteSingleHiveModal">
            ${icon('trash')} Видалити
          </button>
        </div>
      </div>

      ${error ? `<div class="alert alert-danger mb-4">${esc(error)}</div>` : ''}

      <div class="row g-4">
        <!-- Left column: Info + Quick Actions -->
        <div class="col-12 col-lg-5">
          <div class="card p-4 mb-4">
            <h2 class="h5 fw-bold mb-3" style="color:var(--bee-brown);">Характеристики</h2>
            <dl class="row mb-0 small">
              <dt class="col-5 text-muted">Порода бджіл</dt>
              <dd class="col-7 fw-semibold">${esc(hive.bee_species ?? 'Інша')}</dd>

              <dt class="col-5 text-muted">Рік матки</dt>
              <dd class="col-7 fw-semibold">${hive.queen_year ? esc(hive.queen_year) : '—'}</dd>

              <dt class="col-5 text-muted">Заселення</dt>
              <dd class="col-7">${esc(hive.install_date)}</dd>

              <dt class="col-5 text-muted">Наступний огляд</dt>
              <dd class="col-7 fw-semibold">${hive.next_inspection_date ? esc(hive.next_inspection_date) : 'Не заплановано'}</dd>

              <dt class="col-5 text-muted">Остання підкормка</dt>
              <dd class="col-7">${hive.last_feeding_date ? esc(hive.last_feeding_date) : '—'}</dd>

              <dt class="col-5 text-muted">Пластини від кліща</dt>
              <dd class="col-7">${hive.mite_plate_date ? esc(hive.mite_plate_date) : '—'}</dd>
            </dl>

            <hr class="my-3">
            <div class="d-flex justify-content-between small mb-1">
              <span class="fw-semibold" style="color:var(--bee-brown);">Рівень меду</span>
              <span>${esc(hive.honey_level)}</span>
            </div>
            <div class="progress honey-progress">
              <div class="progress-bar" role="progressbar" style="width: ${honeyPct}%" aria-valuenow="${honeyPct}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card p-4">
            <h2 class="h5 fw-bold mb-3" style="color:var(--bee-brown);">Швидкі дії</h2>
            <div class="d-grid gap-2">
              <form method="POST" action="/hive/${hive.id}/quick_action">
                ${csrfInput(csrfToken)}
                <input type="hidden" name="action" value="feeding">
                <button type="submit" class="btn btn-outline-bee w-100 text-start">
                  ${icon('status-fed')} Підкормлено (нагадати через 4 дні)
                </button>
              </form>

              <form method="POST" action="/hive/${hive.id}/quick_action">
                ${csrfInput(csrfToken)}
                <input type="hidden" name="action" value="mite_plate">
                <button type="submit" class="btn btn-outline-bee w-100 text-start">
                  ${icon('status-mite')} Встановлено пластини (зняти через 21 день)
                </button>
              </form>

              <form method="POST" action="/hive/${hive.id}/quick_action">
                ${csrfInput(csrfToken)}
                <input type="hidden" name="action" value="harvest">
                <button type="submit" class="btn btn-outline-bee w-100 text-start">
                  ${icon('status-harvest')} Медозбір проведено
                </button>
              </form>

              <form method="POST" action="/hive/${hive.id}/quick_action">
                ${csrfInput(csrfToken)}
                <input type="hidden" name="action" value="attention">
                <button type="submit" class="btn btn-outline-warning w-100 text-start">
                  ${icon('status-warn')} Потребує уваги
                </button>
              </form>
            </div>
          </div>
        </div>

        <!-- Right column: New Inspection + History -->
        <div class="col-12 col-lg-7">
          <div class="card p-4 mb-4">
            <h2 class="h5 fw-bold mb-3" style="color:var(--bee-brown);">Додати огляд</h2>
            <form method="POST" action="/hive/${hive.id}/inspect">
              ${csrfInput(csrfToken)}

              <div class="row g-3 mb-3">
                <div class="col-12 col-sm-6">
                  <label for="inspection_date" class="form-label">Дата огляду *</label>
                  <input type="date" class="form-control" id="inspection_date" name="inspection_date" value="${today}" max="${today}" required>
                </div>
                <div class="col-12 col-sm-6">
                  <label for="next_inspection_date" class="form-label">Наступний огляд</label>
                  <input type="date" class="form-control" id="next_inspection_date" name="next_inspection_date">
                </div>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-12 col-sm-6">
                  <label for="inspection_honey_level" class="form-label">Рівень меду</label>
                  <select class="form-select" id="inspection_honey_level" name="inspection_honey_level">
                    ${HONEY_LEVELS.map(
                      (lvl) =>
                        `<option value="${esc(lvl)}"${hive.honey_level === lvl ? ' selected' : ''}>${esc(lvl)}</option>`
                    ).join('')}
                  </select>
                </div>
                <div class="col-12 col-sm-6 d-flex align-items-end">
                  <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" id="has_queen_cells" name="has_queen_cells" value="1">
                    <label class="form-check-label fw-semibold text-danger" for="has_queen_cells">
                      Виявлено маточники
                    </label>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label for="condition_description" class="form-label">Нотатки про стан сім'ї</label>
                <textarea class="form-control" id="condition_description" name="condition_description" rows="3" maxlength="2000" placeholder="Розплід, сила сім'ї, поведінка бджіл..."></textarea>
              </div>

              <button type="submit" class="btn btn-bee">${icon('check')} Зберегти огляд</button>
            </form>
          </div>

          <div class="card p-4">
            <h2 class="h5 fw-bold mb-3" style="color:var(--bee-brown);">Історія оглядів (${inspections.length})</h2>
            ${
              inspections.length === 0
                ? `<p class="text-muted small mb-0">Оглядів ще не зафіксовано.</p>`
                : `<div class="list-group list-group-flush">
                    ${inspections
                      .map(
                        (ins) => `
                        <div class="list-group-item px-0 py-3">
                          <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="fw-bold" style="color:var(--bee-brown);">${esc(ins.inspection_date)}</span>
                            <div class="d-flex gap-2">
                              ${
                                ins.has_queen_cells
                                  ? `<span class="status-badge status-badge-critical">МАТОЧНИКИ</span>`
                                  : ''
                              }
                              ${
                                ins.inspection_honey_level
                                  ? `<span class="status-badge status-badge-brown">${esc(ins.inspection_honey_level)}</span>`
                                  : ''
                              }
                            </div>
                          </div>
                          ${
                            ins.condition_description
                              ? `<p class="mb-1 small">${esc(ins.condition_description)}</p>`
                              : ''
                          }
                          ${
                            ins.next_inspection_date
                              ? `<small class="text-muted">Наступний огляд: ${esc(ins.next_inspection_date)}</small>`
                              : ''
                          }
                        </div>
                      `
                      )
                      .join('')}
                  </div>`
            }
          </div>
        </div>
      </div>

      <!-- Delete Single Hive Modal -->
      <div class="modal fade" id="deleteSingleHiveModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Видалення вулика #${esc(hive.hive_number)}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрити"></button>
            </div>
            <div class="modal-body">
              Ви впевнені, що хочете видалити цей вулик та всю історію його оглядів?
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-bee" data-bs-dismiss="modal">Скасувати</button>
              <form method="POST" action="/hive/${hive.id}/delete">
                ${csrfInput(csrfToken)}
                <button type="submit" class="btn btn-danger">Видалити</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `,
  });
}

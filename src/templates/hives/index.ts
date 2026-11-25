// src/templates/hives/index.ts
import type { ComputedStatus, Hive, User } from '../../db/schema';
import type { FlashMessage } from '../../utils/flash';
import { statusColorClass, statusRowClass } from '../../utils/status';
import { csrfInput, esc, icon } from '../../utils/html';
import { renderLayout } from '../layout';

export interface HiveWithStatus {
  hive: Hive;
  status: ComputedStatus;
}

export interface DashboardViewParams {
  user: User;
  hives: HiveWithStatus[];
  weatherTemp: number | null;
  csrfToken: string;
  flash?: FlashMessage | null;
}

export function renderDashboard(params: DashboardViewParams): string {
  const { user, hives, weatherTemp, csrfToken, flash } = params;

  const totalCount = hives.length;
  const warnCount = hives.filter((h) => h.status.color === 'yellow' || h.status.color === 'orange').length;
  const dangerCount = hives.filter((h) => h.status.color === 'red').length;

  const rowsHtml = hives
    .map(({ hive, status }) => {
      const badgeCls = statusColorClass(status);
      const rowCls = statusRowClass(status);
      return `
        <tr class="${rowCls}" data-hive-row data-hive-number="${esc(hive.hive_number)}" data-hive-species="${esc(hive.bee_species ?? '')}" data-hive-color="${esc(status.color)}">
          <td>
            <a href="/hive/${hive.id}" class="hive-number text-decoration-none">#${esc(hive.hive_number)}</a>
          </td>
          <td>
            <span class="status-badge ${badgeCls}">
              ${icon(status.icon)}
              <span>${esc(status.label)}</span>
            </span>
          </td>
          <td class="d-none d-md-table-cell">${esc(hive.bee_species ?? 'Інша')}</td>
          <td class="d-none d-md-table-cell">${hive.queen_year ? esc(hive.queen_year) : '—'}</td>
          <td class="d-none d-sm-table-cell">${esc(hive.honey_level)}</td>
          <td class="d-none d-lg-table-cell">${hive.next_inspection_date ? esc(hive.next_inspection_date) : '—'}</td>
          <td class="text-end text-nowrap">
            <a href="/hive/${hive.id}" class="btn btn-sm btn-outline-bee me-1" title="Переглянути">
              ${icon('eye')} <span class="d-none d-xl-inline">Огляд</span>
            </a>
            <button type="button" class="btn btn-sm btn-outline-danger" data-bs-toggle="modal" data-bs-target="#deleteHiveModal" data-hive-id="${hive.id}" data-hive-number="${esc(hive.hive_number)}" title="Видалити">
              ${icon('trash')}
            </button>
          </td>
        </tr>
      `;
    })
    .join('');

  return renderLayout({
    title: 'Пасіка — Дашборд',
    activePath: '/',
    user,
    flash,
    csrfToken,
    content: `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 class="h3 fw-bold mb-1" style="color:var(--bee-brown);">Моя пасіка</h1>
          <p class="text-muted small mb-0">Огляд стану вуликів та нагадувань на сьогодні</p>
        </div>
        <a href="/add" class="btn btn-bee">
          ${icon('plus')} Додати вулик
        </a>
      </div>

      <!-- Summary Stat Cards -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <div class="stat-card">
            <div class="stat-card-icon stat-card-icon-orange">${icon('hive')}</div>
            <div>
              <span class="stat-value">${totalCount}</span>
              <span class="stat-label">Всього вуликів</span>
            </div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="stat-card">
            <div class="stat-card-icon stat-card-icon-warn">${icon('status-warn')}</div>
            <div>
              <span class="stat-value">${warnCount}</span>
              <span class="stat-label">Потребують уваги</span>
            </div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="stat-card">
            <div class="stat-card-icon stat-card-icon-danger">${icon('status-critical')}</div>
            <div>
              <span class="stat-value">${dangerCount}</span>
              <span class="stat-label">Критично / Огляд</span>
            </div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="stat-card">
            <div class="stat-card-icon stat-card-icon-brown">${icon('weather')}</div>
            <div>
              <span class="stat-value">${weatherTemp !== null ? `${esc(weatherTemp)}°` : '—'}</span>
              <span class="stat-label">${esc(user.city)}</span>
            </div>
          </div>
        </div>
      </div>

      ${
        totalCount === 0
          ? `<div class="card">
              <div class="empty-state">
                ${icon('hive')}
                <p class="empty-state__title">На пасіці ще немає вуликів</p>
                <p class="empty-state__text mb-4">Додайте свій перший вулик, щоб почати облік оглядів, підкормки та медозбору.</p>
                <a href="/add" class="btn btn-bee">${icon('plus')} Додати перший вулик</a>
              </div>
            </div>`
          : `
            <!-- Search & Filter -->
            <div class="card p-3 mb-3">
              <div class="row g-2 align-items-center">
                <div class="col-12 col-md-7">
                  <input type="search" id="hiveSearch" class="form-control" placeholder="Пошук за номером або породою..." aria-label="Пошук вуликів">
                </div>
                <div class="col-12 col-md-5">
                  <select id="hiveStatusFilter" class="form-select" aria-label="Фільтр за статусом">
                    <option value="all">Усі статуси (${totalCount})</option>
                    <option value="red">Критичні / Прострочені (${dangerCount})</option>
                    <option value="yellow">Потребують уваги</option>
                    <option value="green">Все добре</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Hives Table -->
            <div class="card overflow-hidden">
              <div class="table-responsive">
                <table class="table table-hover hives-table mb-0">
                  <thead>
                    <tr>
                      <th>№</th>
                      <th>Статус</th>
                      <th class="d-none d-md-table-cell">Порода</th>
                      <th class="d-none d-md-table-cell">Матка</th>
                      <th class="d-none d-sm-table-cell">Мед</th>
                      <th class="d-none d-lg-table-cell">Наст. огляд</th>
                      <th class="text-end">Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml}
                  </tbody>
                </table>
              </div>
            </div>
          `
      }

      <!-- Delete Confirmation Modal -->
      <div class="modal fade" id="deleteHiveModal" tabindex="-1" aria-labelledby="deleteHiveModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="deleteHiveModalLabel">Видалення вулика</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрити"></button>
            </div>
            <div class="modal-body">
              Ви дійсно хочете видалити вулик <strong>#<span id="deleteHiveNumber"></span></strong>? Усі огляди та завдання цього вулика буде видалено безповоротно.
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-bee" data-bs-dismiss="modal">Скасувати</button>
              <form id="deleteHiveForm" method="POST" action="">
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

// src/templates/calendar.ts
import type { FutureTaskWithHive, Hive, User } from '../db/schema';
import type { FlashMessage } from '../utils/flash';
import { csrfInput, esc, icon, todayISO } from '../utils/html';
import { renderLayout } from './layout';

export interface CalendarViewParams {
  user: User;
  hives: Hive[];
  tasks: FutureTaskWithHive[];
  csrfToken: string;
  flash?: FlashMessage | null;
}

export function renderCalendar(params: CalendarViewParams): string {
  const { user, hives, tasks, csrfToken, flash } = params;
  const today = todayISO();

  return renderLayout({
    title: 'Календар завдань',
    activePath: '/calendar',
    user,
    flash,
    content: `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 class="h3 fw-bold mb-1" style="color:var(--bee-brown);">${icon('calendar')} Календар завдань</h1>
          <p class="text-muted small mb-0">Плануйте огляди, підкормку та обробку вуликів</p>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-12 col-lg-4">
          <div class="card p-4">
            <h2 class="h5 fw-bold mb-3" style="color:var(--bee-brown);">Запланувати завдання</h2>
            ${
              hives.length === 0
                ? `<p class="text-muted small mb-3">Спочатку додайте хоча б один вулик.</p>
                   <a href="/add" class="btn btn-bee btn-sm">${icon('plus')} Додати вулик</a>`
                : `<form method="POST" action="/task/add">
                    ${csrfInput(csrfToken)}
                    <div class="mb-3">
                      <label for="hive_id" class="form-label">Вулик</label>
                      <select class="form-select" id="hive_id" name="hive_id" required>
                        ${hives.map((h) => `<option value="${h.id}">Вулик #${esc(h.hive_number)}</option>`).join('')}
                      </select>
                    </div>
                    <div class="mb-3">
                      <label for="planned_date" class="form-label">Дата</label>
                      <input type="date" class="form-control" id="planned_date" name="planned_date" value="${today}" required>
                    </div>
                    <div class="mb-4">
                      <label for="task_type" class="form-label">Що потрібно зробити</label>
                      <input type="text" class="form-control" id="task_type" name="task_type" placeholder="Напр.: Огляд матки, Зняти пластини" required maxlength="120">
                    </div>
                    <button type="submit" class="btn btn-bee w-100">${icon('plus')} Додати в календар</button>
                  </form>`
            }
          </div>
        </div>

        <div class="col-12 col-lg-8">
          <div class="card p-4">
            <h2 class="h5 fw-bold mb-3" style="color:var(--bee-brown);">Активні завдання (${tasks.length})</h2>
            ${
              tasks.length === 0
                ? `<div class="empty-state py-4">
                    ${icon('calendar')}
                    <p class="empty-state__title">Немає запланованих завдань</p>
                    <p class="empty-state__text">Додайте завдання зліва, щоб не забути про важливі роботи на пасіці.</p>
                  </div>`
                : `<div class="list-group list-group-flush">
                    ${tasks
                      .map((task) => {
                        const isOverdue = task.planned_date < today;
                        const isToday = task.planned_date === today;
                        const badgeCls = isOverdue
                          ? 'status-badge-danger'
                          : isToday
                          ? 'status-badge-warn'
                          : 'status-badge-brown';
                        return `
                          <div class="list-group-item px-0 py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div>
                              <div class="d-flex align-items-center gap-2 mb-1">
                                <span class="status-badge ${badgeCls}">${esc(task.planned_date)}</span>
                                <a href="/hive/${task.hive_id}" class="fw-bold text-decoration-none" style="color:var(--bee-brown);">Вулик #${esc(task.hive_number)}</a>
                              </div>
                              <div class="small">${esc(task.task_type)}</div>
                            </div>
                            <form method="POST" action="/task/${task.id}/complete">
                              ${csrfInput(csrfToken)}
                              <button type="submit" class="btn btn-sm btn-outline-bee">
                                ${icon('check')} Виконано
                              </button>
                            </form>
                          </div>
                        `;
                      })
                      .join('')}
                  </div>`
            }
          </div>
        </div>
      </div>
    `,
  });
}

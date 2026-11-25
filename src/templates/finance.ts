// src/templates/finance.ts
import type { ExpenseLog, HoneyHarvestLog, HoneySaleLog, User } from '../db/schema';
import type { FlashMessage } from '../utils/flash';
import { EXPENSE_CATEGORIES } from '../utils/validators';
import { csrfInput, esc, icon, todayISO } from '../utils/html';
import { renderLayout } from './layout';

export interface FinanceViewParams {
  user: User;
  csrfToken: string;
  totalExpenses: number;
  totalHarvestKg: number;
  totalSoldKg: number;
  totalRevenue: number;
  expenses: ExpenseLog[];
  harvests: HoneyHarvestLog[];
  sales: HoneySaleLog[];
  error?: string | null;
  flash?: FlashMessage | null;
}

export function renderFinance(params: FinanceViewParams): string {
  const {
    user,
    csrfToken,
    totalExpenses,
    totalHarvestKg,
    totalSoldKg,
    totalRevenue,
    expenses,
    harvests,
    sales,
    error,
    flash,
  } = params;

  const today = todayISO();
  const availableHoney = Math.max(0, Math.round((totalHarvestKg - totalSoldKg) * 100) / 100);
  const netBalance = Math.round((totalRevenue - totalExpenses) * 100) / 100;

  return renderLayout({
    title: 'Фінанси та медозбір',
    activePath: '/finance',
    user,
    flash,
    extraScripts: ['/js/finance.js'],
    content: `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 class="h3 fw-bold mb-1" style="color:var(--bee-brown);">${icon('finance')} Фінанси та склад меду</h1>
          <p class="text-muted small mb-0">Облік витрат, відкачаного меду та продажів</p>
        </div>
        <a href="/analytics" class="btn btn-outline-bee btn-sm">${icon('analytics')} Аналітика та експорт</a>
      </div>

      ${error ? `<div class="alert alert-danger mb-4">${esc(error)}</div>` : ''}

      <!-- Summary Stat Cards -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <div class="stat-card">
            <div class="stat-card-icon stat-card-icon-orange">${icon('finance')}</div>
            <div>
              <span class="stat-value">${totalRevenue.toFixed(0)}</span>
              <span class="stat-label">Дохід (грн)</span>
            </div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="stat-card">
            <div class="stat-card-icon stat-card-icon-danger">${icon('expense')}</div>
            <div>
              <span class="stat-value">${totalExpenses.toFixed(0)}</span>
              <span class="stat-label">Витрати (грн)</span>
            </div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="stat-card">
            <div class="stat-card-icon stat-card-icon-brown">${icon('analytics')}</div>
            <div>
              <span class="stat-value">${netBalance.toFixed(0)}</span>
              <span class="stat-label">Баланс (грн)</span>
            </div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="stat-card">
            <div class="stat-card-icon stat-card-icon-warn">${icon('honey')}</div>
            <div>
              <span class="stat-value">${availableHoney}</span>
              <span class="stat-label">На складі (кг)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Forms Row -->
      <div class="row g-4 mb-4">
        <!-- Expense Form -->
        <div class="col-12 col-lg-4">
          <div class="card p-4 h-100">
            <h2 class="h5 fw-bold mb-3" style="color:var(--bee-brown);">${icon('expense')} Додати витрату</h2>
            <form method="POST" action="/finance">
              ${csrfInput(csrfToken)}
              <input type="hidden" name="type" value="expense">

              <div class="mb-3">
                <label for="exp_amount" class="form-label">Сума (грн) *</label>
                <input type="number" step="0.01" min="0.01" class="form-control" id="exp_amount" name="amount" required>
              </div>

              <div class="mb-3">
                <label for="exp_category" class="form-label">Категорія *</label>
                <select class="form-select" id="exp_category" name="category" required>
                  ${EXPENSE_CATEGORIES.map((cat) => `<option value="${esc(cat)}">${esc(cat)}</option>`).join('')}
                </select>
              </div>

              <div class="mb-3">
                <label for="exp_date" class="form-label">Дата *</label>
                <input type="date" class="form-control" id="exp_date" name="date" value="${today}" max="${today}" required>
              </div>

              <div class="mb-3">
                <label for="exp_desc" class="form-label">Опис</label>
                <input type="text" class="form-control" id="exp_desc" name="description" maxlength="500" placeholder="Необов'язково">
              </div>

              <button type="submit" class="btn btn-outline-bee w-100">Записати витрату</button>
            </form>
          </div>
        </div>

        <!-- Harvest Form -->
        <div class="col-12 col-lg-4">
          <div class="card p-4 h-100">
            <h2 class="h5 fw-bold mb-3" style="color:var(--bee-brown);">${icon('honey')} Збір меду</h2>
            <form method="POST" action="/finance">
              ${csrfInput(csrfToken)}
              <input type="hidden" name="type" value="harvest">

              <div class="mb-3">
                <label for="harv_kg" class="form-label">Кількість (кг) *</label>
                <input type="number" step="0.1" min="0.1" class="form-control" id="harv_kg" name="kg" required>
              </div>

              <div class="mb-3">
                <label for="harv_date" class="form-label">Дата качки *</label>
                <input type="date" class="form-control" id="harv_date" name="date" value="${today}" max="${today}" required>
              </div>

              <div class="mb-3">
                <label for="harv_note" class="form-label">Примітка (сорт меду тощо)</label>
                <input type="text" class="form-control" id="harv_note" name="note" maxlength="500" placeholder="Липа, різнотрав'я, соняшник...">
              </div>

              <button type="submit" class="btn btn-bee w-100">Додати на склад</button>
            </form>
          </div>
        </div>

        <!-- Sale Form -->
        <div class="col-12 col-lg-4">
          <div class="card p-4 h-100">
            <h2 class="h5 fw-bold mb-3" style="color:var(--bee-brown);">${icon('finance')} Продаж меду</h2>
            <form method="POST" action="/finance">
              ${csrfInput(csrfToken)}
              <input type="hidden" name="type" value="sale">

              <div class="mb-3">
                <label for="saleKg" class="form-label">Кількість (кг) * <small class="text-muted">(доступно ${availableHoney} кг)</small></label>
                <input type="number" step="0.1" min="0.1" max="${availableHoney}" class="form-control" id="saleKg" name="kg" required>
              </div>

              <div class="mb-3">
                <label for="salePrice" class="form-label">Ціна за 1 кг (грн) *</label>
                <input type="number" step="0.01" min="0.01" class="form-control" id="salePrice" name="price_per_kg" required>
              </div>

              <div class="mb-3">
                <label for="sale_date" class="form-label">Дата продажу *</label>
                <input type="date" class="form-control" id="sale_date" name="date" value="${today}" max="${today}" required>
              </div>

              <div class="mb-3">
                <label for="sale_note" class="form-label">Примітка</label>
                <input type="text" class="form-control" id="sale_note" name="note" maxlength="500" placeholder="Покупець або канал продажу">
              </div>

              <div class="d-flex justify-content-between align-items-center mb-3 small">
                <span class="text-muted">Сума до сплати:</span>
                <strong id="saleTotalPreview" style="color:var(--bee-brown);">0.00 грн</strong>
              </div>

              <button type="submit" class="btn btn-bee w-100" ${availableHoney <= 0 ? 'disabled' : ''}>Продати мед</button>
            </form>
          </div>
        </div>
      </div>

      <!-- Recent Logs -->
      <div class="row g-4">
        <div class="col-12 col-lg-4">
          <div class="card p-4">
            <h3 class="h6 fw-bold mb-3" style="color:var(--bee-brown);">Останні витрати</h3>
            ${
              expenses.length === 0
                ? '<p class="text-muted small mb-0">Витрат ще немає.</p>'
                : `<ul class="list-group list-group-flush small">
                    ${expenses
                      .map(
                        (e) => `
                        <li class="list-group-item px-0 d-flex justify-content-between align-items-start">
                          <div>
                            <div class="fw-semibold">${esc(e.category)}</div>
                            <div class="text-muted">${esc(e.date)}${e.description ? ` · ${esc(e.description)}` : ''}</div>
                          </div>
                          <span class="fw-bold text-danger">-${e.amount.toFixed(2)} грн</span>
                        </li>
                      `
                      )
                      .join('')}
                  </ul>`
            }
          </div>
        </div>

        <div class="col-12 col-lg-4">
          <div class="card p-4">
            <h3 class="h6 fw-bold mb-3" style="color:var(--bee-brown);">Останні збори меду</h3>
            ${
              harvests.length === 0
                ? '<p class="text-muted small mb-0">Зборів ще немає.</p>'
                : `<ul class="list-group list-group-flush small">
                    ${harvests
                      .map(
                        (h) => `
                        <li class="list-group-item px-0 d-flex justify-content-between align-items-start">
                          <div>
                            <div class="fw-semibold">${esc(h.note || 'Збір меду')}</div>
                            <div class="text-muted">${esc(h.date)}</div>
                          </div>
                          <span class="fw-bold text-success">+${h.kg} кг</span>
                        </li>
                      `
                      )
                      .join('')}
                  </ul>`
            }
          </div>
        </div>

        <div class="col-12 col-lg-4">
          <div class="card p-4">
            <h3 class="h6 fw-bold mb-3" style="color:var(--bee-brown);">Останні продажі</h3>
            ${
              sales.length === 0
                ? '<p class="text-muted small mb-0">Продажів ще немає.</p>'
                : `<ul class="list-group list-group-flush small">
                    ${sales
                      .map(
                        (s) => `
                        <li class="list-group-item px-0 d-flex justify-content-between align-items-start">
                          <div>
                            <div class="fw-semibold">${s.kg} кг × ${s.price_per_kg} грн</div>
                            <div class="text-muted">${esc(s.date)}${s.note ? ` · ${esc(s.note)}` : ''}</div>
                          </div>
                          <span class="fw-bold text-success">+${s.total_amount.toFixed(2)} грн</span>
                        </li>
                      `
                      )
                      .join('')}
                  </ul>`
            }
          </div>
        </div>
      </div>
    `,
  });
}

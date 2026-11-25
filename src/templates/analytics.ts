// src/templates/analytics.ts
import type { User } from '../db/schema';
import type { FlashMessage } from '../utils/flash';
import { esc, icon } from '../utils/html';
import { renderLayout } from './layout';

export interface AnalyticsViewParams {
  user: User;
  totalHives: number;
  okCount: number;
  warnCount: number;
  dangerCount: number;
  totalRevenue: number;
  totalExpenses: number;
  totalHarvestKg: number;
  totalSoldKg: number;
  flash?: FlashMessage | null;
}

export function renderAnalytics(params: AnalyticsViewParams): string {
  const {
    user,
    totalHives,
    okCount,
    warnCount,
    dangerCount,
    totalRevenue,
    totalExpenses,
    totalHarvestKg,
    totalSoldKg,
    flash,
  } = params;

  const netProfit = Math.round((totalRevenue - totalExpenses) * 100) / 100;

  const statusChartJson = JSON.stringify({
    labels: ['Все добре', 'Потребують уваги', 'Критично / Прострочено'],
    values: [okCount, warnCount, dangerCount],
  });

  const financeChartJson = JSON.stringify({
    revenue: totalRevenue,
    expenses: totalExpenses,
    profit: netProfit,
  });

  return renderLayout({
    title: 'Аналітика та звіти',
    activePath: '/analytics',
    user,
    flash,
    extraScripts: ['/vendor/chart.js/4.4.1/chart.umd.min.js', '/js/finance.js'],
    content: `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 class="h3 fw-bold mb-1" style="color:var(--bee-brown);">${icon('analytics')} Аналітика та експорт</h1>
          <p class="text-muted small mb-0">Зведена статистика пасіки та вивантаження у CSV / Excel</p>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <a href="/export?type=hives" class="btn btn-outline-bee btn-sm">${icon('export')} Експорт вуликів (CSV)</a>
          <a href="/export?type=finance" class="btn btn-bee btn-sm">${icon('export')} Експорт фінансів (CSV)</a>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-12 col-lg-6">
          <div class="card p-4 h-100">
            <h2 class="h5 fw-bold mb-3" style="color:var(--bee-brown);">Стан вуликів (${totalHives})</h2>
            ${
              totalHives === 0
                ? '<p class="text-muted small mb-0">Немає даних для побудови графіка. Додайте вулики.</p>'
                : `<div class="mx-auto" style="max-width:320px;">
                    <canvas id="hiveStatusChart" data-chart="${esc(statusChartJson)}"></canvas>
                  </div>`
            }
          </div>
        </div>

        <div class="col-12 col-lg-6">
          <div class="card p-4 h-100">
            <h2 class="h5 fw-bold mb-3" style="color:var(--bee-brown);">Фінансовий баланс (грн)</h2>
            <canvas id="financeSummaryChart" data-chart="${esc(financeChartJson)}"></canvas>
          </div>
        </div>
      </div>

      <div class="card p-4">
        <h2 class="h5 fw-bold mb-3" style="color:var(--bee-brown);">Ключові показники</h2>
        <div class="row g-3 small">
          <div class="col-6 col-md-3">
            <div class="text-muted">Зібрано меду</div>
            <div class="fs-5 fw-bold" style="color:var(--bee-brown);">${totalHarvestKg} кг</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="text-muted">Продано меду</div>
            <div class="fs-5 fw-bold" style="color:var(--bee-brown);">${totalSoldKg} кг</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="text-muted">Дохід</div>
            <div class="fs-5 fw-bold text-success">${totalRevenue.toFixed(2)} грн</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="text-muted">Чистий баланс</div>
            <div class="fs-5 fw-bold" style="color:var(--bee-orange);">${netProfit.toFixed(2)} грн</div>
          </div>
        </div>
      </div>
    `,
  });
}

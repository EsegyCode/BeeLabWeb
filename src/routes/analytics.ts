// src/routes/analytics.ts
import { Hono } from 'hono';
import type { HonoEnv } from '../types';
import { db } from '../db/queries';
import { loginRequired } from '../middleware/auth';
import { computeDisplayStatus } from '../utils/status';
import { popFlash } from '../utils/flash';
import { todayISO } from '../utils/html';
import { renderAnalytics } from '../templates/analytics';

export const analyticsRoutes = new Hono<HonoEnv>();

function csvEscape(val: unknown): string {
  const s = val == null ? '' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

analyticsRoutes.get('/analytics', loginRequired, async (c) => {
  const user = c.get('user')!;
  const today = todayISO();

  const [hivesRes, expTotal, harvTotal, soldTotal, revTotal] = await Promise.all([
    db.hives.allForUser(c.env.DB, user.id),
    db.finance.expenses.totalForUser(c.env.DB, user.id),
    db.finance.harvests.totalKgForUser(c.env.DB, user.id),
    db.finance.sales.totalKgForUser(c.env.DB, user.id),
    db.finance.sales.totalRevenueForUser(c.env.DB, user.id),
  ]);

  const hives = hivesRes.results ?? [];
  let okCount = 0;
  let warnCount = 0;
  let dangerCount = 0;

  for (const h of hives) {
    const st = computeDisplayStatus(h, today);
    if (st.color === 'red') dangerCount++;
    else if (st.color === 'yellow' || st.color === 'orange') warnCount++;
    else okCount++;
  }

  return c.html(
    renderAnalytics({
      user,
      totalHives: hives.length,
      okCount,
      warnCount,
      dangerCount,
      totalRevenue: revTotal?.total ?? 0,
      totalExpenses: expTotal?.total ?? 0,
      totalHarvestKg: harvTotal?.total ?? 0,
      totalSoldKg: soldTotal?.total ?? 0,
      flash: popFlash(c),
    })
  );
});

analyticsRoutes.get('/export', loginRequired, async (c) => {
  const user = c.get('user')!;
  const exportType = c.req.query('type') || 'hives';
  const today = todayISO();
  const BOM = '\uFEFF';

  if (exportType === 'finance') {
    const [expenses, harvests, sales] = await Promise.all([
      db.finance.expenses.recent(c.env.DB, user.id, 1000),
      db.finance.harvests.recent(c.env.DB, user.id, 1000),
      db.finance.sales.recent(c.env.DB, user.id, 1000),
    ]);

    const lines = ['Тип,Дата,Сума (грн),Кількість (кг),Категорія / Примітка'];
    for (const e of expenses.results ?? []) {
      lines.push(['Витрата', e.date, -e.amount, '', `${e.category}${e.description ? ': ' + e.description : ''}`].map(csvEscape).join(','));
    }
    for (const h of harvests.results ?? []) {
      lines.push(['Збір меду', h.date, '', h.kg, h.note ?? ''].map(csvEscape).join(','));
    }
    for (const s of sales.results ?? []) {
      lines.push(['Продаж меду', s.date, s.total_amount, s.kg, s.note ?? ''].map(csvEscape).join(','));
    }

    return new Response(BOM + lines.join('\r\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="beelab-finance-${today}.csv"`,
      },
    });
  }

  const hivesRes = await db.hives.allForUser(c.env.DB, user.id);
  const lines = ['Номер вулика,Порода,Рік матки,Дата заселення,Статус,Рівень меду,Наступний огляд'];
  for (const h of hivesRes.results ?? []) {
    const st = computeDisplayStatus(h, today);
    lines.push(
      [h.hive_number, h.bee_species ?? '', h.queen_year ?? '', h.install_date, st.label, h.honey_level, h.next_inspection_date ?? '']
        .map(csvEscape)
        .join(',')
    );
  }

  return new Response(BOM + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="beelab-hives-${today}.csv"`,
    },
  });
});

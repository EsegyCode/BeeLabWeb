// src/routes/finance.ts
import { Hono } from 'hono';
import type { HonoEnv } from '../types';
import { db } from '../db/queries';
import { loginRequired } from '../middleware/auth';
import { popFlash, setFlash } from '../utils/flash';
import { todayISO } from '../utils/html';
import {
  ValidationError,
  validateDate,
  validateDecimal,
  validateExpenseCategory,
  validateFinanceNote,
  validateHoneySaleQty,
} from '../utils/validators';
import { renderFinance } from '../templates/finance';

export const financeRoutes = new Hono<HonoEnv>();

async function loadFinanceData(d1: D1Database, userId: number) {
  const [expTotal, harvTotal, soldTotal, revTotal, expenses, harvests, sales] = await Promise.all([
    db.finance.expenses.totalForUser(d1, userId),
    db.finance.harvests.totalKgForUser(d1, userId),
    db.finance.sales.totalKgForUser(d1, userId),
    db.finance.sales.totalRevenueForUser(d1, userId),
    db.finance.expenses.recent(d1, userId, 10),
    db.finance.harvests.recent(d1, userId, 10),
    db.finance.sales.recent(d1, userId, 10),
  ]);

  return {
    totalExpenses: expTotal?.total ?? 0,
    totalHarvestKg: harvTotal?.total ?? 0,
    totalSoldKg: soldTotal?.total ?? 0,
    totalRevenue: revTotal?.total ?? 0,
    expenses: expenses.results ?? [],
    harvests: harvests.results ?? [],
    sales: sales.results ?? [],
  };
}

financeRoutes.get('/finance', loginRequired, async (c) => {
  const user = c.get('user')!;
  const data = await loadFinanceData(c.env.DB, user.id);

  return c.html(
    renderFinance({
      user,
      csrfToken: c.get('csrfToken'),
      flash: popFlash(c),
      ...data,
    })
  );
});

financeRoutes.post('/finance', loginRequired, async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const type = typeof body.type === 'string' ? body.type : '';

  try {
    if (type === 'expense') {
      const amount = validateDecimal(body.amount, { fieldName: 'Сума' });
      const category = validateExpenseCategory(body.category);
      const date = validateDate(body.date, { required: true, allowFuture: false, fieldName: 'Дата' }) ?? todayISO();
      const description = validateFinanceNote(body.description, 'Опис');
      await db.finance.expenses.create(c.env.DB, user.id, amount, category, description, date);
      setFlash(c, 'success', `Витрату ${amount.toFixed(2)} грн збережено.`);
    } else if (type === 'harvest') {
      const kg = validateDecimal(body.kg, { fieldName: 'Кількість меду' });
      const date = validateDate(body.date, { required: true, allowFuture: false, fieldName: 'Дата' }) ?? todayISO();
      const note = validateFinanceNote(body.note);
      await db.finance.harvests.create(c.env.DB, user.id, kg, date, note);
      setFlash(c, 'success', `Додано ${kg} кг меду на склад.`);
    } else if (type === 'sale') {
      const [harvTotal, soldTotal] = await Promise.all([
        db.finance.harvests.totalKgForUser(c.env.DB, user.id),
        db.finance.sales.totalKgForUser(c.env.DB, user.id),
      ]);
      const availableKg = Math.max(0, (harvTotal?.total ?? 0) - (soldTotal?.total ?? 0));
      const kg = validateHoneySaleQty(body.kg, availableKg);
      const pricePerKg = validateDecimal(body.price_per_kg, { fieldName: 'Ціна за кг' });
      const totalAmount = Math.round(kg * pricePerKg * 100) / 100;
      const date = validateDate(body.date, { required: true, allowFuture: false, fieldName: 'Дата' }) ?? todayISO();
      const note = validateFinanceNote(body.note);
      await db.finance.sales.create(c.env.DB, user.id, kg, pricePerKg, totalAmount, date, note);
      setFlash(c, 'success', `Продано ${kg} кг меду на суму ${totalAmount.toFixed(2)} грн.`);
    } else {
      throw new ValidationError('Невідомий тип фінансової операції.');
    }

    return c.redirect('/finance');
  } catch (err) {
    const message = err instanceof ValidationError ? err.message : 'Помилка збереження даних.';
    const data = await loadFinanceData(c.env.DB, user.id);
    return c.html(
      renderFinance({
        user,
        csrfToken: c.get('csrfToken'),
        error: message,
        ...data,
      }),
      400
    );
  }
});

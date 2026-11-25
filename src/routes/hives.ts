// src/routes/hives.ts
import { Hono } from 'hono';
import type { HonoEnv } from '../types';
import { db } from '../db/queries';
import { loginRequired } from '../middleware/auth';
import { computeDisplayStatus } from '../utils/status';
import { getWeather } from '../utils/weather';
import { popFlash, setFlash } from '../utils/flash';
import { addDaysISO, todayISO } from '../utils/html';
import {
  ValidationError,
  validateBeeSpecies,
  validateCondition,
  validateDate,
  validateHiveNumber,
  validateHoneyLevel,
  validateQueenYear,
  validateQuickAction,
} from '../utils/validators';
import { renderDashboard } from '../templates/hives/index';
import { renderAddHive } from '../templates/hives/add';
import { renderHiveView } from '../templates/hives/view';
import { renderCalendar } from '../templates/calendar';
import { render404 } from '../templates/errors/404';

export const hiveRoutes = new Hono<HonoEnv>();

hiveRoutes.get('/', loginRequired, async (c) => {
  const user = c.get('user')!;
  const today = todayISO();

  const [hivesRes, weatherTemp] = await Promise.all([
    db.hives.allForUser(c.env.DB, user.id),
    getWeather(user.city || 'Суми', c.env.WEATHER_API_KEY, c.env.KV),
  ]);

  const hivesWithStatus = (hivesRes.results ?? []).map((hive) => ({
    hive,
    status: computeDisplayStatus(hive, today),
  }));

  return c.html(
    renderDashboard({
      user,
      hives: hivesWithStatus,
      weatherTemp,
      csrfToken: c.get('csrfToken'),
      flash: popFlash(c),
    })
  );
});

hiveRoutes.get('/add', loginRequired, (c) => {
  const user = c.get('user')!;
  return c.html(
    renderAddHive({
      user,
      csrfToken: c.get('csrfToken'),
      flash: popFlash(c),
    })
  );
});

hiveRoutes.post('/add', loginRequired, async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(body)) {
    if (typeof v === 'string') values[k] = v;
  }

  try {
    const hiveNumber = validateHiveNumber(body.hive_number);
    const beeSpecies = validateBeeSpecies(body.bee_species);
    const queenYear = validateQueenYear(body.queen_year);
    const installDate =
      validateDate(body.install_date, { required: true, allowFuture: false, fieldName: 'Дата заселення' }) ??
      todayISO();
    const nextInspectionDate = validateDate(body.next_inspection_date, {
      required: false,
      allowFuture: true,
      fieldName: 'Наступний огляд',
    });
    const honeyLevel = validateHoneyLevel(body.honey_level || 'Немає');

    const exists = await db.hives.existsByNumber(c.env.DB, user.id, hiveNumber);
    if (exists) {
      throw new ValidationError(`Вулик №${hiveNumber} вже існує на вашій пасіці.`);
    }

    const created = await db.hives.create(c.env.DB, {
      user_id: user.id,
      hive_number: hiveNumber,
      bee_species: beeSpecies,
      queen_year: queenYear,
      install_date: installDate,
      current_status: 'all_good',
      honey_level: honeyLevel,
      last_feeding_date: null,
      mite_plate_date: null,
      next_inspection_date: nextInspectionDate,
      status_expires_at: null,
      is_first_inspection_done: 0,
    });

    setFlash(c, 'success', `Вулик #${hiveNumber} успішно додано!`);
    return c.redirect(created ? `/hive/${created.id}` : '/');
  } catch (err) {
    const message = err instanceof ValidationError ? err.message : 'Не вдалося додати вулик.';
    return c.html(
      renderAddHive({
        user,
        csrfToken: c.get('csrfToken'),
        error: message,
        values,
      }),
      400
    );
  }
});

hiveRoutes.get('/hive/:id', loginRequired, async (c) => {
  const user = c.get('user')!;
  const hiveId = Number(c.req.param('id'));
  if (!Number.isInteger(hiveId) || hiveId <= 0) {
    return c.html(render404(user), 404);
  }

  const hive = await db.hives.findByIdAndUser(c.env.DB, hiveId, user.id);
  if (!hive) {
    return c.html(render404(user), 404);
  }

  const inspectionsRes = await db.inspections.allForHive(c.env.DB, hive.id);
  const status = computeDisplayStatus(hive, todayISO());

  return c.html(
    renderHiveView({
      user,
      hive,
      status,
      inspections: inspectionsRes.results ?? [],
      csrfToken: c.get('csrfToken'),
      flash: popFlash(c),
    })
  );
});

hiveRoutes.post('/hive/:id/inspect', loginRequired, async (c) => {
  const user = c.get('user')!;
  const hiveId = Number(c.req.param('id'));
  const hive = Number.isInteger(hiveId) ? await db.hives.findByIdAndUser(c.env.DB, hiveId, user.id) : null;
  if (!hive) return c.html(render404(user), 404);

  const body = await c.req.parseBody();
  try {
    const inspectionDate =
      validateDate(body.inspection_date, { required: true, allowFuture: false, fieldName: 'Дата огляду' }) ??
      todayISO();
    const nextInspectionDate = validateDate(body.next_inspection_date, {
      required: false,
      allowFuture: true,
      fieldName: 'Наступний огляд',
    });
    const honeyLevel = validateHoneyLevel(body.inspection_honey_level || hive.honey_level);
    const condition = validateCondition(body.condition_description);
    const hasQueenCells = body.has_queen_cells === '1' || body.has_queen_cells === 'on' ? 1 : 0;

    await db.inspections.create(c.env.DB, {
      hive_id: hive.id,
      inspection_date: inspectionDate,
      condition_description: condition || null,
      has_queen_cells: hasQueenCells,
      inspection_honey_level: honeyLevel,
      next_inspection_date: nextInspectionDate,
    });

    await db.hives.updateHoneyLevel(c.env.DB, hive.id, honeyLevel);
    if (nextInspectionDate) {
      await db.hives.updateNextInspection(c.env.DB, hive.id, nextInspectionDate);
    }
    const newStatus = hasQueenCells ? 'matochniky' : 'inspected';
    await db.hives.updateStatus(c.env.DB, hive.id, newStatus, nextInspectionDate);

    setFlash(c, 'success', 'Огляд вулика збережено.');
    return c.redirect(`/hive/${hive.id}`);
  } catch (err) {
    const message = err instanceof ValidationError ? err.message : 'Помилка збереження огляду.';
    const inspectionsRes = await db.inspections.allForHive(c.env.DB, hive.id);
    return c.html(
      renderHiveView({
        user,
        hive,
        status: computeDisplayStatus(hive, todayISO()),
        inspections: inspectionsRes.results ?? [],
        csrfToken: c.get('csrfToken'),
        error: message,
      }),
      400
    );
  }
});

hiveRoutes.post('/hive/:id/quick_action', loginRequired, async (c) => {
  const user = c.get('user')!;
  const hiveId = Number(c.req.param('id'));
  const hive = Number.isInteger(hiveId) ? await db.hives.findByIdAndUser(c.env.DB, hiveId, user.id) : null;
  if (!hive) return c.html(render404(user), 404);

  const body = await c.req.parseBody();
  try {
    const action = validateQuickAction(body.action);
    const today = todayISO();

    if (action === 'feeding') {
      const checkDate = addDaysISO(today, 4);
      await db.hives.updateFeeding(c.env.DB, hive.id, today, checkDate);
      setFlash(c, 'success', `Підкормку зафіксовано. Нагадування про перевірку корму: ${checkDate}.`);
    } else if (action === 'mite_plate') {
      const removeDate = addDaysISO(today, 21);
      await db.hives.updateMitePlate(c.env.DB, hive.id, today, removeDate);
      setFlash(c, 'success', `Пластини встановлено. Зняти орієнтовно: ${removeDate}.`);
    } else if (action === 'harvest') {
      await db.hives.updateStatus(c.env.DB, hive.id, 'harvest');
      setFlash(c, 'success', 'Статус оновлено: Медозбір проведено.');
    } else if (action === 'attention') {
      await db.hives.updateStatus(c.env.DB, hive.id, 'attention');
      setFlash(c, 'warning', 'Вулик позначено як такий, що потребує уваги.');
    }

    return c.redirect(`/hive/${hive.id}`);
  } catch (err) {
    setFlash(c, 'danger', err instanceof ValidationError ? err.message : 'Невідома дія.');
    return c.redirect(`/hive/${hive.id}`);
  }
});

hiveRoutes.post('/hive/:id/delete', loginRequired, async (c) => {
  const user = c.get('user')!;
  const hiveId = Number(c.req.param('id'));
  const hive = Number.isInteger(hiveId) ? await db.hives.findByIdAndUser(c.env.DB, hiveId, user.id) : null;
  if (!hive) return c.html(render404(user), 404);

  await db.hives.delete(c.env.DB, hive.id);
  setFlash(c, 'success', `Вулик #${hive.hive_number} видалено.`);
  return c.redirect('/');
});

hiveRoutes.get('/calendar', loginRequired, async (c) => {
  const user = c.get('user')!;
  const [hivesRes, tasksRes] = await Promise.all([
    db.hives.allForUser(c.env.DB, user.id),
    db.tasks.allForUser(c.env.DB, user.id),
  ]);

  return c.html(
    renderCalendar({
      user,
      hives: hivesRes.results ?? [],
      tasks: tasksRes.results ?? [],
      csrfToken: c.get('csrfToken'),
      flash: popFlash(c),
    })
  );
});

hiveRoutes.post('/task/add', loginRequired, async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  try {
    const hiveId = Number(body.hive_id);
    const hive = Number.isInteger(hiveId) ? await db.hives.findByIdAndUser(c.env.DB, hiveId, user.id) : null;
    if (!hive) throw new ValidationError('Обраний вулик не знайдено.');

    const plannedDate = validateDate(body.planned_date, {
      required: true,
      allowFuture: true,
      fieldName: 'Дата завдання',
    });
    const taskType = typeof body.task_type === 'string' ? body.task_type.trim() : '';
    if (!taskType || taskType.length > 120) {
      throw new ValidationError('Опис завдання має містити від 1 до 120 символів.');
    }

    await db.tasks.create(c.env.DB, hive.id, plannedDate!, taskType);
    setFlash(c, 'success', 'Завдання додано до календаря.');
  } catch (err) {
    setFlash(c, 'danger', err instanceof ValidationError ? err.message : 'Не вдалося додати завдання.');
  }
  return c.redirect('/calendar');
});

hiveRoutes.post('/task/:id/complete', loginRequired, async (c) => {
  const user = c.get('user')!;
  const taskId = Number(c.req.param('id'));
  const task = Number.isInteger(taskId) ? await db.tasks.findByIdAndUser(c.env.DB, taskId, user.id) : null;
  if (!task) return c.html(render404(user), 404);

  await db.tasks.complete(c.env.DB, task.id);
  setFlash(c, 'success', 'Завдання виконано!');
  return c.redirect('/calendar');
});

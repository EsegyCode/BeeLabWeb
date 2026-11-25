// src/scheduled/tasks.ts
// Cloudflare Cron Triggers: status updates (06:00) & Telegram daily briefing (08:00)

import type { ScheduledEvent } from '@cloudflare/workers-types';
import type { Env } from '../db/schema';
import { db } from '../db/queries';
import { computeDisplayStatus } from '../utils/status';
import { sendTelegramMessage } from '../utils/telegram';
import { getWeather } from '../utils/weather';
import { todayISO } from '../utils/html';

const ATTENTION_KEYS = new Set([
  'matochniky',
  'overdue',
  'due_today',
  'due_soon',
  'remove_plates',
  'check_feed',
  'old_queen',
  'attention',
]);

export async function updateHiveStatuses(env: Env): Promise<number> {
  const today = todayISO();
  const overdueRes = await db.hives.allOverdue(env.DB, today);
  const hives = overdueRes.results ?? [];
  let updated = 0;

  for (const hive of hives) {
    const computed = computeDisplayStatus(hive, today);
    if (computed.key === 'overdue' && hive.current_status !== 'overdue') {
      await db.hives.updateStatus(env.DB, hive.id, 'overdue', null);
      updated++;
    }
  }

  return updated;
}

export async function sendDailyBriefing(env: Env): Promise<number> {
  if (!env.TELEGRAM_BOT_TOKEN) return 0;

  const today = todayISO();
  const usersRes = await db.users.allWithTelegram(env.DB);
  const users = usersRes.results ?? [];
  let sent = 0;

  for (const user of users) {
    if (!user.telegram_id) continue;

    const [hivesRes, tasksRes, temp] = await Promise.all([
      db.hives.allForUser(env.DB, user.id),
      db.tasks.todayForUser(env.DB, user.id, today),
      getWeather(user.city || 'Суми', env.WEATHER_API_KEY, env.KV),
    ]);

    const hives = hivesRes.results ?? [];
    const tasks = tasksRes.results ?? [];

    const alerts = hives
      .map((hive) => ({ hive, status: computeDisplayStatus(hive, today) }))
      .filter(({ status }) => ATTENTION_KEYS.has(status.key));

    const lines: string[] = [
      `<b>BeeLab — Зведення на ${today}</b>`,
      `Всього вуликів: <b>${hives.length}</b>`,
    ];

    if (temp !== null) {
      lines.push(`Погода (${user.city || 'Суми'}): <b>${temp > 0 ? '+' : ''}${temp}°C</b>`);
    }

    if (alerts.length > 0) {
      lines.push('');
      lines.push(`<b>Потребують уваги (${alerts.length}):</b>`);
      for (const { hive, status } of alerts.slice(0, 15)) {
        lines.push(`• Вулик #${hive.hive_number}: ${status.label}`);
      }
      if (alerts.length > 15) {
        lines.push(`…та ще ${alerts.length - 15}`);
      }
    } else {
      lines.push('');
      lines.push('Усі вулики в нормі.');
    }

    if (tasks.length > 0) {
      lines.push('');
      lines.push(`<b>Завдання на сьогодні (${tasks.length}):</b>`);
      for (const t of tasks) {
        lines.push(`• Вулик #${t.hive_number}: ${t.task_type}`);
      }
    }

    const ok = await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, user.telegram_id, lines.join('\n'));
    if (ok) sent++;
  }

  return sent;
}

export async function handleScheduled(event: ScheduledEvent, env: Env): Promise<void> {
  if (event.cron === '0 6 * * *') {
    await updateHiveStatuses(env);
  } else if (event.cron === '0 8 * * *') {
    await sendDailyBriefing(env);
  } else {
    // Fallback if triggered manually
    await updateHiveStatuses(env);
    await sendDailyBriefing(env);
  }
}

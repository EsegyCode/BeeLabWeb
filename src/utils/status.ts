// src/utils/status.ts
// Hive status computation based on dates and state

import type { Hive, ComputedStatus } from '../db/schema';

function daysDiff(dateStr: string, today: string): number {
  const a = new Date(today).getTime();
  const b = new Date(dateStr).getTime();
  return Math.floor((a - b) / (1000 * 60 * 60 * 24));
}

export function computeDisplayStatus(hive: Hive, today: string): ComputedStatus {
  const s = hive.current_status.toLowerCase();

  // 1. МАТОЧНИКИ — найвищий пріоритет
  if (s.includes('matochniky') || s.includes('маточники')) {
    return { key: 'matochniky', label: 'МАТОЧНИКИ', color: 'red', icon: 'status-critical' };
  }

  // 2. Пластини — час знімати (21 день)
  if (hive.mite_plate_date && (s.includes('mite_plate') || s.includes('пластини'))) {
    const days = daysDiff(today, hive.mite_plate_date);
    if (days >= 21) {
      return { key: 'remove_plates', label: 'Зняти пластини', color: 'red', icon: 'status-warn' };
    }
    if (days >= 18) {
      return { key: 'remove_plates', label: 'Скоро знімати пластини', color: 'yellow', icon: 'status-warn' };
    }
    return { key: 'mite_plate', label: 'Пластини встановлено', color: 'green', icon: 'status-mite' };
  }

  // 3. Перевірити корм (4 дні після підкормки)
  if (hive.last_feeding_date && (s.includes('fed') || s.includes('підкормлено'))) {
    const days = daysDiff(today, hive.last_feeding_date);
    if (days >= 4) {
      return { key: 'check_feed', label: 'Перевірити корм', color: 'yellow', icon: 'status-warn' };
    }
    return { key: 'fed', label: 'Підкормлено', color: 'green', icon: 'status-fed' };
  }

  // 4. Дата наступного огляду
  if (hive.next_inspection_date) {
    const daysUntil = daysDiff(hive.next_inspection_date, today); // negative = ще не прийшло
    const daysOverdue = daysDiff(today, hive.next_inspection_date); // positive = прострочено

    if (daysOverdue > 2) {
      return { key: 'overdue', label: `Огляд прострочено (${daysOverdue} дн.)`, color: 'red', icon: 'status-overdue' };
    }
    if (daysOverdue >= 0) {
      return { key: 'due_today', label: 'Огляд сьогодні!', color: 'red', icon: 'status-warn' };
    }
    if (daysUntil <= 2) { // 2 дні до огляду (daysUntil = -1 або -2)
      return { key: 'due_soon', label: `Скоро огляд (${Math.abs(daysUntil)} дн.)`, color: 'yellow', icon: 'status-warn' };
    }
  }

  // 5. Старість матки (3+ роки)
  const currentYear = new Date(today).getFullYear();
  if (hive.queen_year && currentYear - hive.queen_year >= 3) {
    // Якщо вже є хороший статус — додаємо попередження окремо
    // (повертаємо old_queen тільки якщо немає інших проблем)
    if (s.includes('all_good') || s.includes('все добре')) {
      return { key: 'old_queen', label: 'Матка стара (замінити)', color: 'orange', icon: 'status-warn' };
    }
  }

  // 6. Медозбір
  if (s.includes('harvest') || s.includes('медозбір')) {
    return { key: 'harvest', label: 'Медозбір проведено', color: 'green', icon: 'status-harvest' };
  }

  // 7. Оглянуто
  if (s.includes('inspected') || s.includes('оглянуто')) {
    return { key: 'inspected', label: 'Оглянуто', color: 'green', icon: 'status-ok' };
  }

  // 8. Потребує уваги
  if (s.includes('attention') || s.includes('уваги')) {
    return { key: 'attention', label: 'Потребує уваги', color: 'yellow', icon: 'status-warn' };
  }

  // 9. За замовчуванням — все добре
  return { key: 'all_good', label: 'Все добре', color: 'green', icon: 'status-ok' };
}

export function statusColorClass(status: ComputedStatus): string {
  const map: Record<string, string> = {
    green: 'status-badge-ok',
    yellow: 'status-badge-warn',
    orange: 'status-badge-warn',
    red: 'status-badge-danger',
    brown: 'status-badge-brown',
  };
  if (status.key === 'matochniky') return 'status-badge-critical';
  return map[status.color] ?? 'status-badge-ok';
}

export function statusRowClass(status: ComputedStatus): string {
  const map: Record<string, string> = {
    green: 'status-row-ok',
    yellow: 'status-row-warn',
    orange: 'status-row-warn',
    red: status.key === 'matochniky' ? 'status-row-critical' : 'status-row-danger',
    brown: '',
  };
  return map[status.color] ?? '';
}

// Для Cron задачі — масовий перерахунок статусів
export function needsStatusUpdate(hive: Hive, today: string): boolean {
  const status = computeDisplayStatus(hive, today);
  return ['overdue', 'due_today', 'remove_plates', 'check_feed', 'old_queen'].includes(status.key);
}

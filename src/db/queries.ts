// src/db/queries.ts
import type { D1Database } from '@cloudflare/workers-types';
import type { User, Hive, HiveInspection, FutureTask, FutureTaskWithHive, ExpenseLog, HoneyHarvestLog, HoneySaleLog } from './schema';

// ── Users ──────────────────────────────────────────────
export const db = {
  users: {
    findByUsername: (d1: D1Database, username: string) =>
      d1.prepare('SELECT * FROM users WHERE username = ?').bind(username).first<User>(),

    findById: (d1: D1Database, id: number) =>
      d1.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>(),

    create: (d1: D1Database, username: string, passwordHash: string, contactInfo?: string) =>
      d1.prepare(
        'INSERT INTO users (username, password_hash, contact_info) VALUES (?, ?, ?) RETURNING *'
      ).bind(username, passwordHash, contactInfo ?? null).first<User>(),

    updateProfile: (d1: D1Database, userId: number, telegramId: string | null, city: string) =>
      d1.prepare('UPDATE users SET telegram_id = ?, city = ? WHERE id = ?')
        .bind(telegramId, city, userId).run(),

    updatePassword: (d1: D1Database, userId: number, passwordHash: string) =>
      d1.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        .bind(passwordHash, userId).run(),

    allWithTelegram: (d1: D1Database) =>
      d1.prepare('SELECT * FROM users WHERE telegram_id IS NOT NULL').all<User>(),
  },

  // ── Hives ──────────────────────────────────────────────
  hives: {
    allForUser: (d1: D1Database, userId: number) =>
      d1.prepare('SELECT * FROM hives WHERE user_id = ? ORDER BY hive_number ASC').bind(userId).all<Hive>(),

    findById: (d1: D1Database, id: number) =>
      d1.prepare('SELECT * FROM hives WHERE id = ?').bind(id).first<Hive>(),

    findByIdAndUser: (d1: D1Database, id: number, userId: number) =>
      d1.prepare('SELECT * FROM hives WHERE id = ? AND user_id = ?').bind(id, userId).first<Hive>(),

    existsByNumber: (d1: D1Database, userId: number, hiveNumber: string) =>
      d1.prepare('SELECT id FROM hives WHERE user_id = ? AND hive_number = ?')
        .bind(userId, hiveNumber).first<{ id: number }>(),

    create: (d1: D1Database, data: Omit<Hive, 'id' | 'created_at'>) =>
      d1.prepare(`
        INSERT INTO hives (user_id, hive_number, bee_species, queen_year, install_date,
          current_status, honey_level, next_inspection_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *
      `).bind(
        data.user_id, data.hive_number, data.bee_species, data.queen_year,
        data.install_date, data.current_status, data.honey_level, data.next_inspection_date
      ).first<Hive>(),

    updateStatus: (d1: D1Database, id: number, status: string, expiresAt?: string | null) =>
      d1.prepare('UPDATE hives SET current_status = ?, status_expires_at = ? WHERE id = ?')
        .bind(status, expiresAt ?? null, id).run(),

    updateFeeding: (d1: D1Database, id: number, date: string, nextInspection: string) =>
      d1.prepare('UPDATE hives SET current_status = ?, last_feeding_date = ?, status_expires_at = ? WHERE id = ?')
        .bind('fed', date, nextInspection, id).run(),

    updateMitePlate: (d1: D1Database, id: number, date: string, removeDate: string) =>
      d1.prepare('UPDATE hives SET current_status = ?, mite_plate_date = ?, status_expires_at = ? WHERE id = ?')
        .bind('mite_plate', date, removeDate, id).run(),

    updateHoneyLevel: (d1: D1Database, id: number, honeyLevel: string) =>
      d1.prepare('UPDATE hives SET honey_level = ? WHERE id = ?').bind(honeyLevel, id).run(),

    updateNextInspection: (d1: D1Database, id: number, nextInspectionDate: string) =>
      d1.prepare('UPDATE hives SET next_inspection_date = ? WHERE id = ?')
        .bind(nextInspectionDate, id).run(),

    delete: (d1: D1Database, id: number) =>
      d1.prepare('DELETE FROM hives WHERE id = ?').bind(id).run(),

    countByStatus: (d1: D1Database, userId: number, pattern: string) =>
      d1.prepare('SELECT COUNT(*) as count FROM hives WHERE user_id = ? AND current_status LIKE ?')
        .bind(userId, pattern).first<{ count: number }>(),

    allOverdue: (d1: D1Database, today: string) =>
      d1.prepare('SELECT * FROM hives WHERE next_inspection_date IS NOT NULL AND next_inspection_date < ? AND current_status NOT IN (\'matochniky\')').bind(today).all<Hive>(),
  },

  // ── Inspections ───────────────────────────────────────
  inspections: {
    allForHive: (d1: D1Database, hiveId: number) =>
      d1.prepare('SELECT * FROM hive_inspections WHERE hive_id = ? ORDER BY inspection_date DESC, id DESC')
        .bind(hiveId).all<HiveInspection>(),

    create: (d1: D1Database, data: Omit<HiveInspection, 'id' | 'created_at'>) =>
      d1.prepare(`
        INSERT INTO hive_inspections (hive_id, inspection_date, condition_description, has_queen_cells, inspection_honey_level, next_inspection_date)
        VALUES (?, ?, ?, ?, ?, ?) RETURNING *
      `).bind(
        data.hive_id, data.inspection_date, data.condition_description,
        data.has_queen_cells, data.inspection_honey_level, data.next_inspection_date
      ).first<HiveInspection>(),
  },

  // ── Tasks ─────────────────────────────────────────────
  tasks: {
    allForUser: (d1: D1Database, userId: number) =>
      d1.prepare(`
        SELECT ft.*, h.hive_number
        FROM future_tasks ft
        JOIN hives h ON h.id = ft.hive_id
        WHERE h.user_id = ? AND ft.is_completed = 0
        ORDER BY ft.planned_date ASC
      `).bind(userId).all<FutureTaskWithHive>(),

    findByIdAndUser: (d1: D1Database, taskId: number, userId: number) =>
      d1.prepare(`
        SELECT ft.* FROM future_tasks ft
        JOIN hives h ON h.id = ft.hive_id
        WHERE ft.id = ? AND h.user_id = ?
      `).bind(taskId, userId).first<FutureTask>(),

    create: (d1: D1Database, hiveId: number, plannedDate: string, taskType: string) =>
      d1.prepare('INSERT INTO future_tasks (hive_id, planned_date, task_type) VALUES (?, ?, ?)')
        .bind(hiveId, plannedDate, taskType).run(),

    complete: (d1: D1Database, taskId: number) =>
      d1.prepare('UPDATE future_tasks SET is_completed = 1 WHERE id = ?').bind(taskId).run(),

    todayForUser: (d1: D1Database, userId: number, today: string) =>
      d1.prepare(`
        SELECT ft.*, h.hive_number FROM future_tasks ft
        JOIN hives h ON h.id = ft.hive_id
        WHERE h.user_id = ? AND ft.planned_date = ? AND ft.is_completed = 0
      `).bind(userId, today).all<FutureTaskWithHive>(),
  },

  // ── Finance ───────────────────────────────────────────
  finance: {
    expenses: {
      recent: (d1: D1Database, userId: number, limit = 10) =>
        d1.prepare('SELECT * FROM expense_logs WHERE user_id = ? ORDER BY date DESC, id DESC LIMIT ?')
          .bind(userId, limit).all<ExpenseLog>(),
      create: (d1: D1Database, userId: number, amount: number, category: string, description: string | null, date: string) =>
        d1.prepare('INSERT INTO expense_logs (user_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?)')
          .bind(userId, amount, category, description, date).run(),
      totalForUser: (d1: D1Database, userId: number) =>
        d1.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expense_logs WHERE user_id = ?')
          .bind(userId).first<{ total: number }>(),
    },
    harvests: {
      recent: (d1: D1Database, userId: number, limit = 10) =>
        d1.prepare('SELECT * FROM honey_harvest_logs WHERE user_id = ? ORDER BY date DESC, id DESC LIMIT ?')
          .bind(userId, limit).all<HoneyHarvestLog>(),
      create: (d1: D1Database, userId: number, kg: number, date: string, note: string | null) =>
        d1.prepare('INSERT INTO honey_harvest_logs (user_id, kg, date, note) VALUES (?, ?, ?, ?)')
          .bind(userId, kg, date, note).run(),
      totalKgForUser: (d1: D1Database, userId: number) =>
        d1.prepare('SELECT COALESCE(SUM(kg), 0) as total FROM honey_harvest_logs WHERE user_id = ?')
          .bind(userId).first<{ total: number }>(),
    },
    sales: {
      recent: (d1: D1Database, userId: number, limit = 10) =>
        d1.prepare('SELECT * FROM honey_sale_logs WHERE user_id = ? ORDER BY date DESC, id DESC LIMIT ?')
          .bind(userId, limit).all<HoneySaleLog>(),
      create: (d1: D1Database, userId: number, kg: number, pricePerKg: number, totalAmount: number, date: string, note: string | null) =>
        d1.prepare('INSERT INTO honey_sale_logs (user_id, kg, price_per_kg, total_amount, date, note) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(userId, kg, pricePerKg, totalAmount, date, note).run(),
      totalKgForUser: (d1: D1Database, userId: number) =>
        d1.prepare('SELECT COALESCE(SUM(kg), 0) as total FROM honey_sale_logs WHERE user_id = ?')
          .bind(userId).first<{ total: number }>(),
      totalRevenueForUser: (d1: D1Database, userId: number) =>
        d1.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM honey_sale_logs WHERE user_id = ?')
          .bind(userId).first<{ total: number }>(),
    },
  },
};

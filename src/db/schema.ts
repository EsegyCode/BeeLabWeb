// src/db/schema.ts
// TypeScript types matching the D1 SQLite schema

export interface User {
  id: number;
  username: string;
  password_hash: string;
  full_name: string | null;
  contact_info: string | null;
  telegram_id: string | null;
  city: string;
  created_at: string;
}

export interface Hive {
  id: number;
  user_id: number;
  hive_number: string;
  bee_species: string | null;
  queen_year: number | null;
  install_date: string;
  current_status: string;
  honey_level: string;
  last_feeding_date: string | null;
  mite_plate_date: string | null;
  next_inspection_date: string | null;
  status_expires_at: string | null;
  is_first_inspection_done: 0 | 1;
  created_at: string;
}

export interface HiveInspection {
  id: number;
  hive_id: number;
  inspection_date: string;
  condition_description: string | null;
  has_queen_cells: 0 | 1;
  inspection_honey_level: string | null;
  next_inspection_date: string | null;
  created_at: string;
}

export interface FutureTask {
  id: number;
  hive_id: number;
  planned_date: string;
  task_type: string;
  is_completed: 0 | 1;
  created_at: string;
}

export interface FutureTaskWithHive extends FutureTask {
  hive_number: string;
}

export interface ExpenseLog {
  id: number;
  user_id: number;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  created_at: string;
}

export interface HoneyHarvestLog {
  id: number;
  user_id: number;
  kg: number;
  date: string;
  note: string | null;
  created_at: string;
}

export interface HoneySaleLog {
  id: number;
  user_id: number;
  kg: number;
  price_per_kg: number;
  total_amount: number;
  date: string;
  note: string | null;
  created_at: string;
}

// Cloudflare Workers bindings type
export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  SECRET_KEY: string;
  WEATHER_API_KEY?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_BOT_USERNAME?: string;
  APP_NAME?: string;
  APP_VERSION?: string;
  APP_URL?: string;
}

// Status types
export type HiveStatusKey =
  | 'all_good'
  | 'matochniky'
  | 'inspected'
  | 'fed'
  | 'mite_plate'
  | 'harvest'
  | 'attention'
  | 'overdue'
  | 'due_today'
  | 'due_soon'
  | 'remove_plates'
  | 'check_feed'
  | 'old_queen';

export interface ComputedStatus {
  key: HiveStatusKey;
  label: string;
  color: 'green' | 'yellow' | 'orange' | 'red' | 'brown';
  icon: string; // SVG icon name e.g. 'status-ok'
}

-- BeeLab D1 SQLite Schema
-- Migration: 0001_initial

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  contact_info TEXT,
  telegram_id TEXT UNIQUE,
  city TEXT NOT NULL DEFAULT 'Суми',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS hives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hive_number TEXT NOT NULL,
  bee_species TEXT DEFAULT 'Інша',
  queen_year INTEGER,
  install_date TEXT NOT NULL DEFAULT (date('now')),
  current_status TEXT NOT NULL DEFAULT 'все добре',
  honey_level TEXT NOT NULL DEFAULT 'Немає',
  last_feeding_date TEXT,
  mite_plate_date TEXT,
  next_inspection_date TEXT,
  status_expires_at TEXT,
  is_first_inspection_done INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, hive_number)
);

CREATE TABLE IF NOT EXISTS hive_inspections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hive_id INTEGER NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
  inspection_date TEXT NOT NULL DEFAULT (date('now')),
  condition_description TEXT,
  has_queen_cells INTEGER NOT NULL DEFAULT 0,
  inspection_honey_level TEXT,
  next_inspection_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS future_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hive_id INTEGER NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
  planned_date TEXT NOT NULL,
  task_type TEXT NOT NULL,
  is_completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expense_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL DEFAULT (date('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS honey_harvest_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kg REAL NOT NULL,
  date TEXT NOT NULL DEFAULT (date('now')),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS honey_sale_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kg REAL NOT NULL,
  price_per_kg REAL NOT NULL,
  total_amount REAL NOT NULL,
  date TEXT NOT NULL DEFAULT (date('now')),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hives_user_id ON hives(user_id);
CREATE INDEX IF NOT EXISTS idx_hive_inspections_hive_id ON hive_inspections(hive_id);
CREATE INDEX IF NOT EXISTS idx_future_tasks_hive_id ON future_tasks(hive_id);
CREATE INDEX IF NOT EXISTS idx_future_tasks_planned_date ON future_tasks(planned_date);
CREATE INDEX IF NOT EXISTS idx_expense_logs_user_id ON expense_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_honey_harvest_logs_user_id ON honey_harvest_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_honey_sale_logs_user_id ON honey_sale_logs(user_id);

// src/utils/validators.ts
// Input validation — TypeScript port of validators.py

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const HONEY_LEVELS = ['Немає', 'Майже немає', 'Середньо', 'Велика кількість', 'Повний вулик'] as const;
export const BEE_SPECIES = ['Карпатка', 'Бакфаст', 'Українська степова', 'Карніка', 'Інша'] as const;
export const QUICK_ACTIONS = ['feeding', 'mite_plate', 'harvest', 'attention'] as const;
export const EXPENSE_CATEGORIES = [
  'Препарати та лікування',
  'Кормова база',
  'Логістика та пальне',
  'Господарчі витрати',
] as const;

function cleanText(value: unknown, opts?: { required?: boolean; maxLength?: number; fieldName?: string }): string {
  const { required = false, maxLength = 255, fieldName = 'Поле' } = opts ?? {};
  const text = (value == null ? '' : String(value)).trim();
  if (required && !text) throw new ValidationError(`${fieldName} є обов'язковим.`);
  if (text.length > maxLength) throw new ValidationError(`${fieldName} має бути не довшим за ${maxLength} символів.`);
  return text;
}

export function validateUsername(value: unknown): string {
  const username = cleanText(value, { required: true, maxLength: 50, fieldName: 'Логін' });
  if (username.length < 3) throw new ValidationError('Логін має містити щонайменше 3 символи.');
  if (!/^[A-Za-z0-9_.\-]+$/.test(username)) throw new ValidationError('Логін може містити латинські літери, цифри, крапку, дефіс або підкреслення.');
  return username;
}

export function validatePassword(value: unknown): string {
  const password = String(value ?? '');
  if (password.length < 6) throw new ValidationError('Пароль має містити щонайменше 6 символів.');
  if (password.length > 128) throw new ValidationError('Пароль занадто довгий.');
  return password;
}

export function validateContact(value: unknown): string {
  return cleanText(value, { maxLength: 100, fieldName: 'Контактні дані' });
}

export function validateCity(value: unknown): string {
  const city = cleanText(value, { maxLength: 50, fieldName: 'Місто' });
  return city || 'Суми';
}

export function validateTelegramId(value: unknown): string | null {
  const id = cleanText(value, { maxLength: 20, fieldName: 'Telegram ID' });
  if (id && !/^\d{5,20}$/.test(id)) throw new ValidationError('Telegram ID має складатися з 5-20 цифр.');
  return id || null;
}

export function validateHiveNumber(value: unknown): string {
  const num = cleanText(value, { required: true, maxLength: 20, fieldName: 'Номер вулика' });
  if (!/^[A-Za-zА-ЯҐЄІЇа-яґєії0-9_\-]+$/u.test(num)) throw new ValidationError('Номер вулика може містити літери, цифри, дефіс або підкреслення.');
  return num;
}

export function validateBeeSpecies(value: unknown): string {
  const species = cleanText(value, { maxLength: 50, fieldName: 'Порода бджіл' });
  return (BEE_SPECIES as readonly string[]).includes(species) ? species : 'Інша';
}

export function validateQueenYear(value: unknown): number {
  const raw = cleanText(value, { maxLength: 4, fieldName: 'Рік матки' });
  if (!raw) return new Date().getFullYear();
  const year = parseInt(raw, 10);
  if (isNaN(year)) throw new ValidationError('Рік матки має бути числом.');
  const maxYear = new Date().getFullYear() + 1;
  if (year < 2000 || year > maxYear) throw new ValidationError(`Рік матки має бути в межах 2000-${maxYear}.`);
  return year;
}

export function validateDate(value: unknown, opts?: { required?: boolean; allowFuture?: boolean; fieldName?: string }): string | null {
  const { required = false, allowFuture = false, fieldName = 'Дата' } = opts ?? {};
  const raw = cleanText(value);
  if (!raw) {
    if (required) throw new ValidationError(`${fieldName} є обов'язковою.`);
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new ValidationError(`${fieldName} має бути у форматі РРРР-ММ-ДД.`);
  const d = new Date(raw);
  if (isNaN(d.getTime())) throw new ValidationError(`${fieldName} — некоректна дата.`);
  const today = new Date().toISOString().slice(0, 10);
  if (!allowFuture && raw > today) throw new ValidationError(`${fieldName} не може бути в майбутньому.`);
  return raw;
}

export function validateHoneyLevel(value: unknown): string {
  const level = cleanText(value, { maxLength: 50, fieldName: 'Рівень меду' });
  if (!(HONEY_LEVELS as readonly string[]).includes(level)) throw new ValidationError('Невідомий рівень меду.');
  return level;
}

export function validateCondition(value: unknown): string {
  return cleanText(value, { maxLength: 2000, fieldName: 'Нотатки огляду' });
}

export function validateQuickAction(value: unknown): string {
  const action = cleanText(value, { required: true, maxLength: 50, fieldName: 'Дія' });
  if (!(QUICK_ACTIONS as readonly string[]).includes(action)) throw new ValidationError('Невідома швидка дія.');
  return action;
}

export function validateDecimal(value: unknown, opts?: { fieldName?: string; minValue?: number }): number {
  const { fieldName = 'Значення', minValue = 0.01 } = opts ?? {};
  const raw = cleanText(value, { required: true, maxLength: 30, fieldName }).replace(',', '.');
  const num = parseFloat(raw);
  if (isNaN(num)) throw new ValidationError(`${fieldName} має бути числом.`);
  if (num < minValue) throw new ValidationError(`${fieldName} має бути не меншим за ${minValue}.`);
  return Math.round(num * 100) / 100;
}

export function validateExpenseCategory(value: unknown): string {
  const cat = cleanText(value, { required: true, maxLength: 100, fieldName: 'Категорія' });
  if (!(EXPENSE_CATEGORIES as readonly string[]).includes(cat)) throw new ValidationError('Невідома категорія витрат.');
  return cat;
}

export function validateFinanceNote(value: unknown, fieldName = 'Примітка'): string | null {
  const note = cleanText(value, { maxLength: 500, fieldName });
  return note || null;
}

export function validateHoneySaleQty(value: unknown, availableKg: number): number {
  const kg = validateDecimal(value, { fieldName: 'Кількість меду' });
  if (kg > availableKg) throw new ValidationError('Недостатньо меду на складі.');
  return kg;
}

// CSRF token generation
export function generateCsrfToken(): string {
  return bufToHex(crypto.getRandomValues(new Uint8Array(32)).buffer);
}

function bufToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

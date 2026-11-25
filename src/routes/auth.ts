// src/routes/auth.ts
import { Hono } from 'hono';
import type { HonoEnv } from '../types';
import { db } from '../db/queries';
import { hashPassword, verifyPassword } from '../utils/auth-crypto';
import { createSession, destroySession } from '../utils/session';
import { guestOnly, loginRequired } from '../middleware/auth';
import { popFlash, setFlash } from '../utils/flash';
import {
  ValidationError,
  validateCity,
  validateContact,
  validatePassword,
  validateTelegramId,
  validateUsername,
} from '../utils/validators';
import { renderLogin } from '../templates/auth/login';
import { renderRegister } from '../templates/auth/register';
import { renderProfile } from '../templates/auth/profile';

export const authRoutes = new Hono<HonoEnv>();

function safeNext(raw: string | undefined): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

authRoutes.get('/login', guestOnly, (c) => {
  return c.html(
    renderLogin({
      csrfToken: c.get('csrfToken'),
      next: safeNext(c.req.query('next')),
      flash: popFlash(c),
    })
  );
});

authRoutes.post('/login', guestOnly, async (c) => {
  const body = await c.req.parseBody();
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const next = safeNext(typeof body.next === 'string' ? body.next : '/');

  if (!username || !password) {
    return c.html(
      renderLogin({
        csrfToken: c.get('csrfToken'),
        username,
        next,
        error: 'Введіть логін і пароль.',
      }),
      400
    );
  }

  const user = await db.users.findByUsername(c.env.DB, username);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.html(
      renderLogin({
        csrfToken: c.get('csrfToken'),
        username,
        next,
        error: 'Невірний логін або пароль.',
      }),
      401
    );
  }

  await createSession(c, { userId: user.id, username: user.username });
  setFlash(c, 'success', `Вітаємо, ${user.username}!`);
  return c.redirect(next);
});

authRoutes.get('/register', guestOnly, (c) => {
  return c.html(
    renderRegister({
      csrfToken: c.get('csrfToken'),
      flash: popFlash(c),
    })
  );
});

authRoutes.post('/register', guestOnly, async (c) => {
  const body = await c.req.parseBody();
  const rawUsername = typeof body.username === 'string' ? body.username : '';
  const rawContact = typeof body.contact_info === 'string' ? body.contact_info : '';
  const rawPassword = typeof body.password === 'string' ? body.password : '';
  const rawConfirm = typeof body.password_confirm === 'string' ? body.password_confirm : '';

  try {
    const username = validateUsername(rawUsername);
    const contactInfo = validateContact(rawContact);
    const password = validatePassword(rawPassword);

    if (password !== rawConfirm) {
      throw new ValidationError('Паролі не співпадають.');
    }

    const existing = await db.users.findByUsername(c.env.DB, username);
    if (existing) {
      throw new ValidationError('Користувач із таким логіном вже існує.');
    }

    const hash = await hashPassword(password);
    const user = await db.users.create(c.env.DB, username, hash, contactInfo || undefined);
    if (!user) {
      throw new Error('Не вдалося створити користувача.');
    }

    await createSession(c, { userId: user.id, username: user.username });
    setFlash(c, 'success', 'Акаунт успішно створено! Додайте свій перший вулик.');
    return c.redirect('/');
  } catch (err) {
    const message = err instanceof ValidationError ? err.message : 'Помилка реєстрації. Спробуйте ще раз.';
    return c.html(
      renderRegister({
        csrfToken: c.get('csrfToken'),
        username: rawUsername,
        contactInfo: rawContact,
        error: message,
      }),
      400
    );
  }
});

authRoutes.get('/logout', async (c) => {
  await destroySession(c);
  setFlash(c, 'info', 'Ви вийшли з облікового запису.');
  return c.redirect('/login');
});

authRoutes.get('/profile', loginRequired, (c) => {
  const user = c.get('user')!;
  return c.html(
    renderProfile({
      user,
      csrfToken: c.get('csrfToken'),
      telegramBotUsername: c.env.TELEGRAM_BOT_USERNAME,
      flash: popFlash(c),
    })
  );
});

authRoutes.post('/profile', loginRequired, async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const action = typeof body.action === 'string' ? body.action : 'update_profile';

  try {
    if (action === 'change_password') {
      const currentPassword = typeof body.current_password === 'string' ? body.current_password : '';
      const newPassword = validatePassword(body.new_password);
      const confirmPassword = typeof body.confirm_password === 'string' ? body.confirm_password : '';

      if (!(await verifyPassword(currentPassword, user.password_hash))) {
        throw new ValidationError('Поточний пароль вказано невірно.');
      }
      if (newPassword !== confirmPassword) {
        throw new ValidationError('Нові паролі не співпадають.');
      }

      const newHash = await hashPassword(newPassword);
      await db.users.updatePassword(c.env.DB, user.id, newHash);
      setFlash(c, 'success', 'Пароль успішно оновлено.');
      return c.redirect('/profile');
    }

    const city = validateCity(body.city);
    const telegramId = validateTelegramId(body.telegram_id);
    await db.users.updateProfile(c.env.DB, user.id, telegramId, city);
    setFlash(c, 'success', 'Налаштування профілю збережено.');
    return c.redirect('/profile');
  } catch (err) {
    const message = err instanceof ValidationError ? err.message : 'Не вдалося оновити профіль.';
    return c.html(
      renderProfile({
        user,
        csrfToken: c.get('csrfToken'),
        telegramBotUsername: c.env.TELEGRAM_BOT_USERNAME,
        error: message,
      }),
      400
    );
  }
});

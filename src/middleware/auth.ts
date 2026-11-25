// src/middleware/auth.ts
import type { MiddlewareHandler } from 'hono';
import type { HonoEnv } from '../types';
import { getSession } from '../utils/session';
import { db } from '../db/queries';

export const sessionMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const session = await getSession(c);
  if (session) {
    const user = await db.users.findById(c.env.DB, session.userId);
    if (user) {
      c.set('session', session);
      c.set('user', user);
    } else {
      c.set('session', null);
      c.set('user', null);
    }
  } else {
    c.set('session', null);
    c.set('user', null);
  }
  await next();
};

export const loginRequired: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const user = c.get('user');
  if (!user) {
    const nextUrl = encodeURIComponent(c.req.path);
    return c.redirect(`/login?next=${nextUrl}`);
  }
  await next();
};

export const guestOnly: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const user = c.get('user');
  if (user) {
    return c.redirect('/');
  }
  await next();
};

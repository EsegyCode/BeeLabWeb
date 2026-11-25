// src/index.ts
import { Hono } from 'hono';
import type { ExecutionContext, ScheduledEvent } from '@cloudflare/workers-types';
import type { Env } from './db/schema';
import type { HonoEnv } from './types';
import { sessionMiddleware } from './middleware/auth';
import { csrfMiddleware } from './middleware/csrf';
import { authRoutes } from './routes/auth';
import { hiveRoutes } from './routes/hives';
import { financeRoutes } from './routes/finance';
import { analyticsRoutes } from './routes/analytics';
import { pageRoutes } from './routes/pages';
import { metaRoutes } from './routes/meta';
import { render404 } from './templates/errors/404';
import { render500 } from './templates/errors/500';
import { handleScheduled } from './scheduled/tasks';

export const app = new Hono<HonoEnv>();

// Global middleware
app.use('*', sessionMiddleware);
app.use('*', csrfMiddleware);

// Routes
app.route('/', metaRoutes);
app.route('/', pageRoutes);
app.route('/', authRoutes);
app.route('/', hiveRoutes);
app.route('/', financeRoutes);
app.route('/', analyticsRoutes);

// 404 Not Found
app.notFound((c) => {
  const user = c.get('user') ?? null;
  return c.html(render404(user), 404);
});

// 500 Internal Server Error
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  const user = c.get('user') ?? null;
  return c.html(render500(user), 500);
});

// Cloudflare Worker entrypoint (HTTP + Cron Triggers)
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(handleScheduled(event, env));
  },
};

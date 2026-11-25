// src/routes/pages.ts
import { Hono } from 'hono';
import type { HonoEnv } from '../types';
import { renderFaq } from '../templates/faq';
import { renderAbout } from '../templates/about';
import { renderPrivacy, renderTerms } from '../templates/legal';

export const pageRoutes = new Hono<HonoEnv>();

pageRoutes.get('/faq', (c) => {
  const user = c.get('user');
  return c.html(renderFaq(user, c.env.APP_URL || ''));
});

pageRoutes.get('/about', (c) => {
  const user = c.get('user');
  return c.html(renderAbout(user, c.env.APP_URL || ''));
});

pageRoutes.get('/privacy', (c) => {
  const user = c.get('user');
  return c.html(renderPrivacy(user, c.env.APP_URL || ''));
});

pageRoutes.get('/terms', (c) => {
  const user = c.get('user');
  return c.html(renderTerms(user, c.env.APP_URL || ''));
});

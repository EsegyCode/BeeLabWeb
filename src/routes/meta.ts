// src/routes/meta.ts
import { Hono } from 'hono';
import type { HonoEnv } from '../types';

export const metaRoutes = new Hono<HonoEnv>();

function getBaseUrl(c: { env: { APP_URL?: string }; req: { url: string } }): string {
  if (c.env.APP_URL) return c.env.APP_URL.replace(/\/$/, '');
  const u = new URL(c.req.url);
  return `${u.protocol}//${u.host}`;
}

metaRoutes.get('/robots.txt', (c) => {
  const baseUrl = getBaseUrl(c);
  const body = `User-agent: *
Allow: /login
Allow: /register
Allow: /faq
Allow: /about
Allow: /privacy
Allow: /terms
Disallow: /hive/
Disallow: /finance
Disallow: /analytics
Disallow: /profile
Disallow: /export

Sitemap: ${baseUrl}/sitemap.xml
`;
  return c.text(body, 200, { 'Content-Type': 'text/plain; charset=utf-8' });
});

metaRoutes.get('/sitemap.xml', (c) => {
  const baseUrl = getBaseUrl(c);
  const publicPaths = ['/login', '/register', '/faq', '/about', '/privacy', '/terms'];
  const urls = publicPaths
    .map(
      (path) => `  <url>
    <loc>${baseUrl}${path}</loc>
    <changefreq>weekly</changefreq>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return c.text(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' });
});

metaRoutes.get('/llms.txt', (c) => {
  const baseUrl = getBaseUrl(c);
  const body = `# BeeLab
> Веб-застосунок для обліку пасіки, вуликів, оглядів, календаря робіт, фінансів та аналітики.

## Основні публічні сторінки
- [Про проект](${baseUrl}/about): Огляд можливостей BeeLab для пасічників.
- [FAQ](${baseUrl}/faq): Відповіді на часті запитання щодо обліку вуликів, статусів та Telegram-сповіщень.
- [Політика конфіденційності](${baseUrl}/privacy): Правила обробки даних.
- [Умови використання](${baseUrl}/terms): Правила користування сервісом.
`;
  return c.text(body, 200, { 'Content-Type': 'text/plain; charset=utf-8' });
});

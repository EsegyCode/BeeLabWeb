// src/middleware/csrf.ts
import type { MiddlewareHandler } from 'hono';
import type { HonoEnv } from '../types';
import { generateCsrfToken } from '../utils/validators';

const CSRF_COOKIE = 'bl_csrf';

async function hmacSign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacVerify(value: string, signature: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(value, secret);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

function getCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const csrfMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const secret = c.env.SECRET_KEY || 'dev-secret-change-me';
  const cookieHeader = c.req.header('Cookie') || '';
  const rawCookie = getCookie(cookieHeader, CSRF_COOKIE);

  let token: string | null = null;
  if (rawCookie) {
    const [val, sig] = rawCookie.split('.');
    if (val && sig && (await hmacVerify(val, sig, secret))) {
      token = val;
    }
  }

  if (!token) {
    token = generateCsrfToken();
    const sig = await hmacSign(token, secret);
    c.header(
      'Set-Cookie',
      `${CSRF_COOKIE}=${encodeURIComponent(`${token}.${sig}`)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
      { append: true }
    );
  }

  c.set('csrfToken', token);

  const method = c.req.method.toUpperCase();
  if (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
    let submittedToken = c.req.header('X-CSRF-Token') || '';
    if (!submittedToken) {
      const contentType = c.req.header('Content-Type') || '';
      if (
        contentType.includes('application/x-www-form-urlencoded') ||
        contentType.includes('multipart/form-data')
      ) {
        const body = await c.req.parseBody();
        const rawField = body['_csrf'];
        if (typeof rawField === 'string') {
          submittedToken = rawField;
        }
      }
    }

    if (!submittedToken || submittedToken !== token) {
      return c.html(
        '<h1>403 Forbidden</h1><p>Недійсний або відсутній CSRF-токен. Оновіть сторінку та спробуйте ще раз.</p>',
        403
      );
    }
  }

  await next();
};

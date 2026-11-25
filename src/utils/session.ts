// src/utils/session.ts
// Cookie-based sessions signed with HMAC-SHA256, stored in Cloudflare KV

import type { Context } from 'hono';
import type { HonoEnv } from '../types';

const SESSION_COOKIE = 'bl_session';
const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days in seconds
const KV_TTL = SESSION_TTL;

function bufToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return bufToBase64(sig);
}

async function verify(payload: string, signature: string, secret: string): Promise<boolean> {
  const expected = await sign(payload, secret);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

export interface SessionData {
  userId: number;
  username: string;
}

export async function createSession(c: Context<HonoEnv>, data: SessionData): Promise<void> {
  const sessionId = bufToBase64(crypto.getRandomValues(new Uint8Array(32)).buffer);
  const payload = JSON.stringify({ sessionId, ...data, createdAt: Date.now() });
  const signature = await sign(payload, c.env.SECRET_KEY);
  const cookie = `${btoa(payload)}.${signature}`;

  // Store in KV
  await c.env.KV.put(`session:${sessionId}`, JSON.stringify(data), { expirationTtl: KV_TTL });

  c.header(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(cookie)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL}`,
    { append: true }
  );
}

export async function getSession(c: Context<HonoEnv>): Promise<SessionData | null> {
  const cookieHeader = c.req.header('Cookie') || '';
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;

  try {
    const [payloadB64, signature] = decodeURIComponent(match[1]).split('.');
    if (!payloadB64 || !signature) return null;

    const payloadStr = atob(payloadB64);
    const isValid = await verify(payloadStr, signature, c.env.SECRET_KEY);
    if (!isValid) return null;

    const parsed = JSON.parse(payloadStr);
    // Verify KV still has the session
    const kvData = await c.env.KV.get(`session:${parsed.sessionId}`);
    if (!kvData) return null;

    return { userId: parsed.userId, username: parsed.username };
  } catch {
    return null;
  }
}

export async function destroySession(c: Context<HonoEnv>): Promise<void> {
  const cookieHeader = c.req.header('Cookie') || '';
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (match) {
    try {
      const [payloadB64] = decodeURIComponent(match[1]).split('.');
      const parsed = JSON.parse(atob(payloadB64));
      await c.env.KV.delete(`session:${parsed.sessionId}`);
    } catch { /* ignore */ }
  }
  c.header('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`, { append: true });
}

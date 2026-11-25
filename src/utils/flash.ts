// src/utils/flash.ts
import type { Context } from 'hono';
import type { HonoEnv } from '../types';

export type FlashType = 'success' | 'danger' | 'warning' | 'info';

export interface FlashMessage {
  type: FlashType;
  message: string;
}

const FLASH_COOKIE = 'bl_flash';

export function setFlash(c: Context<HonoEnv>, type: FlashType, message: string): void {
  const payload = encodeURIComponent(JSON.stringify({ type, message }));
  c.header('Set-Cookie', `${FLASH_COOKIE}=${payload}; Path=/; HttpOnly; SameSite=Lax; Max-Age=60`, {
    append: true,
  });
}

export function popFlash(c: Context<HonoEnv>): FlashMessage | null {
  const cookieHeader = c.req.header('Cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${FLASH_COOKIE}=([^;]+)`));
  if (!match) return null;

  c.header('Set-Cookie', `${FLASH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`, {
    append: true,
  });

  try {
    const parsed = JSON.parse(decodeURIComponent(match[1])) as FlashMessage;
    if (parsed && parsed.message) return parsed;
  } catch {
    // ignore malformed flash cookie
  }
  return null;
}

// src/utils/auth-crypto.ts
// Password hashing using PBKDF2 (Web Crypto API - Cloudflare Workers compatible)

const ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const HASH_ALG = 'SHA-256';

function bufToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: HASH_ALG },
    keyMaterial, KEY_LENGTH * 8
  );
  return `pbkdf2:${bufToHex(salt.buffer)}:${bufToHex(derived)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  // Support legacy werkzeug hashes (pbkdf2:sha256:...) from the Python version
  if (stored.startsWith('pbkdf2:sha256:') || stored.startsWith('scrypt:')) {
    // These are Python/Werkzeug hashes — cannot verify in Workers, return false
    // User will need to reset password
    return false;
  }

  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'pbkdf2') return false;

  const salt = hexToBuf(parts[1]);
  const expectedHash = parts[2];

  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: HASH_ALG },
    keyMaterial, KEY_LENGTH * 8
  );

  const derivedHex = bufToHex(derived);
  // Constant time comparison
  if (derivedHex.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < derivedHex.length; i++) {
    diff |= derivedHex.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
}

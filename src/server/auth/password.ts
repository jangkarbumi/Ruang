import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Hash password dengan scrypt (bawaan Node, tanpa dependensi tambahan).
 * Format tersimpan: "scrypt$<salt hex>$<hash hex>".
 */

const KEYLEN = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string | undefined) {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(expected, actual);
}

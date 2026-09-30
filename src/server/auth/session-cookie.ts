import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Role } from '@/lib/account';

/**
 * Cookie sesi yang ditandatangani HMAC: "<userId>.<role>.<kedaluwarsa>.<tanda tangan>".
 * Isi cookie tidak bisa diubah pengguna tanpa ketahuan, karena tanda tangannya butuh SESSION_SECRET.
 * Role ikut disimpan agar proxy bisa menolak akses salah-role tanpa membaca data akun.
 *
 * Wajib set SESSION_SECRET (acak, panjang) di .env untuk lingkungan selain pengembangan lokal.
 */

export const SESSION_COOKIE = 'ruang_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

const DEV_SECRET = 'ruang-dev-only-secret-ganti-di-env';
const ROLES: Role[] = ['PENGGUNA', 'PETUGAS', 'ADMIN'];

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET belum diset.');
  }
  return s || DEV_SECRET;
}

const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url');

export function createSessionToken(userId: number, role: Role, now = Date.now()) {
  const payload = `${userId}.${role}.${now + SESSION_MAX_AGE * 1000}`;
  return `${payload}.${sign(payload)}`;
}

/** Isi token bila tanda tangan sah dan belum kedaluwarsa. */
export function readSessionToken(token: string | undefined, now = Date.now()): { userId: number; role: Role } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 4) return null;
  const [id, role, exp, sig] = parts;
  const expected = Buffer.from(sign(`${id}.${role}.${exp}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (!(Number(exp) > now)) return null;
  const userId = Number(id);
  if (!Number.isInteger(userId) || !ROLES.includes(role as Role)) return null;
  return { userId, role: role as Role };
}

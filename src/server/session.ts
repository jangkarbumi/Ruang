import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { store } from '@/server/data/store';
import { SESSION_COOKIE, readSessionToken } from '@/server/auth/session-cookie';
import type { Role } from '@/lib/account';
import { HOME_BY_ROLE, landingFor } from '@/lib/auth-routes';

/**
 * Sesi dari cookie bertanda tangan (lihat server/auth/session-cookie.ts).
 * Akun masih disimpan di memori server; saat database siap, cukup ganti pencarian akun di `getCurrentUser`.
 */

export type { Role };

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export { HOME_BY_ROLE, landingFor };

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const account = store().users.find((u) => u.id === session.userId);
  // Akun yang dinonaktifkan/ditolak atau berganti role setelah login ikut kehilangan akses
  if (!account || account.accountStatus !== 'ACTIVE' || account.role !== session.role) return null;
  return { id: account.id, name: account.name, email: account.email, role: account.role };
}

const toLogin = (nextPath?: string) => redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login');

/** Halaman & aksi milik pengguna (mahasiswa/dosen/staf). */
export async function requireUser(nextPath?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) toLogin(nextPath);
  if (user!.role !== 'PENGGUNA') redirect(HOME_BY_ROLE[user!.role]);
  return user!;
}

/** Halaman & aksi petugas/admin (NFR-02). */
export async function requireRole(role: Exclude<Role, 'PENGGUNA'>, nextPath?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) toLogin(nextPath);
  if (user!.role !== role) redirect(HOME_BY_ROLE[user!.role]);
  return user!;
}

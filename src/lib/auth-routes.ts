import type { Role } from './account';

/**
 * Aturan rute per role — murni (tanpa akses data), dipakai proxy dan server.
 */

/** Halaman awal setelah login, per role. */
export const HOME_BY_ROLE: Record<Role, string> = {
  PENGGUNA: '/fasilitas',
  PETUGAS: '/petugas',
  ADMIN: '/admin/akun',
};

/** Area yang dikunci dan role pemiliknya. */
export const PROTECTED_AREAS: { prefix: string; role: Role }[] = [
  { prefix: '/reservasi', role: 'PENGGUNA' },
  { prefix: '/laporan', role: 'PENGGUNA' },
  { prefix: '/petugas', role: 'PETUGAS' },
  { prefix: '/admin', role: 'ADMIN' },
];

const inArea = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`);

export function areaRole(pathname: string): Role | null {
  return PROTECTED_AREAS.find((a) => inArea(pathname, a.prefix))?.role ?? null;
}

/** Tujuan setelah login: `next` bila aman & sesuai role (atau halaman publik fasilitas), selain itu halaman awal role. */
export function landingFor(role: Role, next?: string | null) {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) return HOME_BY_ROLE[role];
  const owner = areaRole(next);
  // Halaman fasilitas (publik) selalu boleh; area terproteksi hanya jika role-nya cocok
  const isFacilityPage = next === '/fasilitas' || inArea(next, '/fasilitas');
  const isOwnArea = owner !== null && owner === role;
  const allowed = isFacilityPage || isOwnArea;
  return allowed ? next : HOME_BY_ROLE[role];
}

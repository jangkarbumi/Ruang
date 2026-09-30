import Link from 'next/link';
import { logoutAction } from '@/server/actions/auth-actions';
import type { SessionUser } from '@/server/session';
import type { NavLink } from '@/components/user/UserNavbar';

const USER_LINKS: NavLink[] = [
  { key: 'fasilitas', href: '/fasilitas', label: 'Fasilitas' },
  { key: 'reservasi', href: '/reservasi', label: 'Reservasi Saya' },
  { key: 'laporan', href: '/laporan', label: 'Laporan Saya' },
];

const OFFICER_LINKS: NavLink[] = [
  { key: 'dashboard', href: '/petugas', label: 'Dashboard' },
  { key: 'reservasi', href: '/petugas/reservasi', label: 'Reservasi' },
  { key: 'laporan', href: '/petugas/laporan', label: 'Laporan' },
  { key: 'fasilitas', href: '/petugas/fasilitas', label: 'Status Fasilitas' },
];

const ADMIN_LINKS: NavLink[] = [
  { key: 'akun', href: '/admin/akun', label: 'Kelola Akun' },
  { key: 'fasilitas', href: '/admin/fasilitas', label: 'Kelola Fasilitas' },
  { key: 'rekap', href: '/admin/rekap', label: 'Rekap & Ekspor' },
];

const ROLE_META: Record<string, { links: NavLink[]; label?: string }> = {
  PENGGUNA: { links: USER_LINKS },
  PETUGAS:  { links: OFFICER_LINKS, label: 'Petugas' },
  ADMIN:    { links: ADMIN_LINKS,   label: 'Admin'   },
};

/**
 * Navbar yang digunakan di halaman publik Fasilitas.
 * - `user` null  → tombol Login + Register (guest)
 * - `user` ada   → nama + menu sesuai role + tombol Logout
 * Tidak ada hardcode status login; sepenuhnya bergantung pada nilai `user` dari server.
 */
export default function FacilityNavbar({
  user,
  active = 'fasilitas',
}: {
  user: SessionUser | null;
  active?: string;
}) {
  const meta = user ? (ROLE_META[user.role] ?? { links: USER_LINKS }) : null;
  const links = meta?.links ?? [];

  return (
    <header className="w-full absolute top-0 z-50 text-white px-8 py-3 bg-linear-to-b from-[#001741]/90 to-transparent">
      <div className="flex items-center justify-between gap-6">
        {/* Kiri: logo + navigasi (hanya saat login) */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center text-2xl font-bold tracking-tight">
            Ruang
          </Link>
          {user && (
            <nav aria-label="Menu utama" className="hidden md:flex items-center gap-1">
              {links.map((l) => (
                <Link
                  key={l.key}
                  href={l.href}
                  aria-current={active === l.key ? 'page' : undefined}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    active === l.key ? 'bg-white/15 text-white' : 'text-white/75 hover:text-white'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Kanan: tombol sesuai status login */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:block text-sm text-white/80">
                {user.name}
                {meta?.label && (
                  <span className="ml-2 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold text-white">
                    {meta.label}
                  </span>
                )}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="bg-white text-[#0064D2] hover:bg-gray-100 px-6 py-2 rounded-2xl text-sm font-bold transition"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="bg-white text-[#0064D2] hover:bg-gray-100 px-6 py-2 rounded-2xl text-sm font-bold transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-[#0064D2] text-white hover:bg-[#0056b3] px-6 py-2 rounded-2xl text-sm font-bold transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Menu mobile (hanya saat login) */}
      {user && (
        <nav aria-label="Menu utama" className="md:hidden mt-2 -mx-2 flex gap-1 overflow-x-auto">
          {links.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              aria-current={active === l.key ? 'page' : undefined}
              className={`shrink-0 rounded-2xl px-3 py-1.5 text-sm font-semibold ${
                active === l.key ? 'bg-white/15 text-white' : 'text-white/75'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

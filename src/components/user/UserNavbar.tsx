import Link from 'next/link';
import { logoutAction } from '@/server/actions/auth-actions';
import type { SessionUser } from '@/server/session';

export type UserNavKey = 'fasilitas' | 'reservasi' | 'laporan';

export interface NavLink {
  key: string;
  href: string;
  label: string;
}

const USER_LINKS: NavLink[] = [
  { key: 'fasilitas', href: '/fasilitas', label: 'Fasilitas' },
  { key: 'reservasi', href: '/reservasi', label: 'Reservasi Saya' },
  { key: 'laporan', href: '/laporan', label: 'Laporan Saya' },
];

/**
 * Navbar untuk akun yang sudah login — struktur & gaya sama dengan Navbar publik.
 * Petugas & admin memakai komponen yang sama dengan daftar menu sendiri (`links`).
 */
export default function UserNavbar({
  user,
  active,
  links = USER_LINKS,
  roleLabel,
}: {
  user: SessionUser;
  active?: string;
  links?: NavLink[];
  roleLabel?: string;
}) {
  return (
    <header className="w-full absolute top-0 z-50 text-white px-8 py-3 bg-linear-to-b from-[#001741]/90 to-transparent">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center text-2xl font-bold tracking-tight">
            Ruang
          </Link>
          <nav aria-label="Menu pengguna" className="hidden md:flex items-center gap-1">
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
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-white/80">
            {user.name}
            {roleLabel && <span className="ml-2 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold text-white">{roleLabel}</span>}
          </span>
          <form action={logoutAction}>
            <button type="submit" className="bg-white text-[#0064D2] hover:bg-gray-100 px-6 py-2 rounded-2xl text-sm font-bold transition">
              Logout
            </button>
          </form>
        </div>
      </div>

      {/* Menu pada layar kecil */}
      <nav aria-label="Menu pengguna" className="md:hidden mt-2 -mx-2 flex gap-1 overflow-x-auto">
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
    </header>
  );
}

import UserNavbar, { type NavLink } from '@/components/user/UserNavbar';
import type { SessionUser } from '@/server/session';

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

export function OfficerNavbar({ user, active }: { user: SessionUser; active: string }) {
  return <UserNavbar user={user} active={active} links={OFFICER_LINKS} roleLabel="Petugas" />;
}

export function AdminNavbar({ user, active }: { user: SessionUser; active: string }) {
  return <UserNavbar user={user} active={active} links={ADMIN_LINKS} roleLabel="Admin" />;
}

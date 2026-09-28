/**
 * Tipe akun. Bentuknya mengikuti model `User` di prisma/schema.prisma (tanpa kolom password).
 */

export type Role = 'PENGGUNA' | 'PETUGAS' | 'ADMIN';
export type AccountStatus = 'PENDING' | 'ACTIVE' | 'REJECTED';

export interface Account {
  id: number;
  name: string;
  email: string;
  role: Role;
  accountStatus: AccountStatus;
  createdAt: Date;
}

export const ROLE_LABEL: Record<Role, string> = {
  PENGGUNA: 'Pengguna',
  PETUGAS: 'Petugas',
  ADMIN: 'Admin',
};

export const ACCOUNT_STATUS: Record<AccountStatus, { label: string; className: string }> = {
  PENDING: { label: 'Menunggu verifikasi', className: 'bg-amber-100 text-amber-700' },
  ACTIVE: { label: 'Aktif', className: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Ditolak', className: 'bg-red-100 text-red-700' },
};

export const PASSWORD_MIN = 8;

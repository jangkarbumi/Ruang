import { store } from '@/server/data/store';
import { hashPassword } from '@/server/auth/password';
import { PASSWORD_MIN, type Account, type AccountStatus, type Role } from '@/lib/account';

/**
 * Kelola akun oleh admin (FR-13, FR-14, FR-15).
 * Petugas hanya bisa dibuat oleh admin — tidak ada jalur registrasi mandiri untuk petugas (BR-09, AC-08).
 */

export async function listAccounts(filter: { role?: Role; status?: AccountStatus } = {}) {
  return store()
    .users.filter((u) => (!filter.role || u.role === filter.role) && (!filter.status || u.accountStatus === filter.status))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function setAccountStatus(id: number, status: Extract<AccountStatus, 'ACTIVE' | 'REJECTED'>) {
  const u = store().users.find((x) => x.id === id);
  if (!u) return { ok: false as const, message: 'Akun tidak ditemukan.' };
  if (u.accountStatus !== 'PENDING') return { ok: false as const, message: 'Akun ini sudah diverifikasi sebelumnya.' };
  u.accountStatus = status;
  return { ok: true as const };
}

export interface NewAccountInput {
  name: string;
  email: string;
  role: string;
  password: string;
}

export type NewAccountErrors = Partial<Record<keyof NewAccountInput, string>>;

export function validateNewAccount(v: NewAccountInput): NewAccountErrors {
  const e: NewAccountErrors = {};
  if (v.name.trim().length < 3) e.name = 'Nama minimal 3 karakter.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'Masukkan alamat email yang valid.';
  // Admin hanya mendaftarkan petugas atau pengguna — bukan admin lain
  if (v.role !== 'PETUGAS' && v.role !== 'PENGGUNA') e.role = 'Pilih jenis akun.';
  if (v.password.length < PASSWORD_MIN) e.password = `Password minimal ${PASSWORD_MIN} karakter.`;
  return e;
}

export async function createAccount(v: NewAccountInput): Promise<{ ok: true; account: Account } | { ok: false; errors: NewAccountErrors }> {
  const errors = validateNewAccount(v);
  if (Object.keys(errors).length) return { ok: false, errors };

  const email = v.email.trim().toLowerCase();
  const s = store();
  if (s.users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, errors: { email: 'Email ini sudah terdaftar.' } };
  }

  const account: Account = {
    id: s.nextUserId++,
    name: v.name.trim(),
    email,
    role: v.role as Role,
    accountStatus: 'ACTIVE', // akun buatan admin langsung aktif
    createdAt: new Date(),
  };
  s.users.push(account);
  s.passwords[account.id] = hashPassword(v.password);
  return { ok: true, account };
}

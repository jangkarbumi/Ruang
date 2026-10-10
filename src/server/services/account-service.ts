import { db } from '@/server/db';
import { hashPassword } from '@/server/auth/password';
import { PASSWORD_MIN, type Account, type AccountStatus, type Role } from '@/lib/account';

export async function listAccounts(filter: { role?: Role; status?: AccountStatus } = {}) {
  const where: any = {};
  if (filter.role) where.role = filter.role;
  if (filter.status) where.accountStatus = filter.status;
  
  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true, accountStatus: true, createdAt: true }
  });
  
  return users as Account[];
}

export async function setAccountStatus(id: number, status: Extract<AccountStatus, 'ACTIVE' | 'REJECTED'>) {
  const u = await db.user.findUnique({ where: { id } });
  if (!u) return { ok: false as const, message: 'Akun tidak ditemukan.' };
  if (u.accountStatus !== 'PENDING') return { ok: false as const, message: 'Akun ini sudah diverifikasi sebelumnya.' };
  
  await db.user.update({
    where: { id },
    data: { accountStatus: status }
  });
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
  if (v.role !== 'PETUGAS' && v.role !== 'PENGGUNA') e.role = 'Pilih jenis akun.';
  if (v.password.length < PASSWORD_MIN) e.password = `Password minimal ${PASSWORD_MIN} karakter.`;
  return e;
}

export async function createAccount(v: NewAccountInput): Promise<{ ok: true; account: Account } | { ok: false; errors: NewAccountErrors }> {
  const errors = validateNewAccount(v);
  if (Object.keys(errors).length) return { ok: false, errors };

  const email = v.email.trim().toLowerCase();
  
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, errors: { email: 'Email ini sudah terdaftar.' } };
  }

  const account = await db.user.create({
    data: {
      name: v.name.trim(),
      email,
      role: v.role as Role,
      accountStatus: 'ACTIVE',
      password: hashPassword(v.password),
    },
    select: { id: true, name: true, email: true, role: true, accountStatus: true, createdAt: true }
  });
  
  return { ok: true, account: account as Account };
}

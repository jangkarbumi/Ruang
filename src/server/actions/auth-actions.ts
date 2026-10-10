'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/server/db';
import { hashPassword, verifyPassword } from '@/server/auth/password';
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from '@/server/auth/session-cookie';
import { landingFor } from '@/lib/auth-routes';
import { PASSWORD_MIN, type Role } from '@/lib/account';

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export type LoginResult =
  | { ok: true; redirectTo: string }
  | { ok: false; message: string; errors?: { email?: string; password?: string } };

export async function loginAction(input: { email: string; password: string; next?: string | null }): Promise<LoginResult> {
  const email = String(input.email ?? '').trim().toLowerCase();
  const password = String(input.password ?? '');

  const errors: { email?: string; password?: string } = {};
  if (!email) errors.email = 'This field is required';
  else if (!emailOk(email)) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'This field is required';
  if (Object.keys(errors).length) return { ok: false, message: 'Please check the highlighted fields', errors };

  const account = await db.user.findUnique({ where: { email } });
  
  if (!account || !verifyPassword(password, account.password)) {
    return { ok: false, message: 'Email or password is incorrect' };
  }
  
  if (account.accountStatus === 'PENDING') {
    return { ok: false, message: 'Your account is waiting for admin verification' };
  }
  if (account.accountStatus === 'REJECTED') {
    return { ok: false, message: 'Your registration was rejected. Please contact the facility admin' };
  }

  (await cookies()).set(SESSION_COOKIE, createSessionToken(account.id, account.role as Role), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return { ok: true, redirectTo: landingFor(account.role as Role, input.next) };
}

export type RegisterResult =
  | { ok: true }
  | { ok: false; message: string; errors?: { name?: string; email?: string; password?: string } };

export async function registerAction(input: { name: string; email: string; password: string }): Promise<RegisterResult> {
  const name = String(input.name ?? '').trim();
  const email = String(input.email ?? '').trim().toLowerCase();
  const password = String(input.password ?? '');

  const errors: { name?: string; email?: string; password?: string } = {};
  if (!name) errors.name = 'This field is required';
  if (!email) errors.email = 'This field is required';
  else if (!emailOk(email)) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'This field is required';
  else if (password.length < PASSWORD_MIN) errors.password = `Password must be at least ${PASSWORD_MIN} characters`;
  if (Object.keys(errors).length) return { ok: false, message: 'Please check the highlighted fields', errors };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, message: 'Email already registered' };
  }
  
  await db.user.create({
    data: {
      name,
      email,
      role: 'PENGGUNA',
      accountStatus: 'PENDING',
      password: hashPassword(password),
    }
  });
  
  return { ok: true };
}

export async function logoutAction() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/');
}

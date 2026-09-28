'use client';

import { useActionState, useState } from 'react';
import { createAccountAction, type CreateAccountState } from '@/server/actions/admin-actions';
import { PASSWORD_MIN } from '@/lib/account';
import { FormField, Notice, fieldClass } from '@/components/user/form';

type Values = { name: string; email: string; role: string; password: string };

/** FR-13 & FR-14: admin mendaftarkan akun petugas atau pengguna secara langsung. */
export default function AccountForm() {
  const [state, action, pending] = useActionState<CreateAccountState, FormData>(createAccountAction, { errors: {} });
  const [v, setV] = useState<Values>({ name: '', email: '', role: 'PETUGAS', password: '' });
  const [clientErrors, setClientErrors] = useState<CreateAccountState['errors'] | null>(null);
  const errors = clientErrors ?? state.errors;
  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setV((p) => ({ ...p, [k]: e.target.value }));
    setClientErrors((p) => (p ? { ...p, [k]: undefined } : p));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const found: CreateAccountState['errors'] = {};
    if (v.name.trim().length < 3) found.name = 'Nama minimal 3 karakter.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) found.email = 'Masukkan alamat email yang valid.';
    if (v.password.length < PASSWORD_MIN) found.password = `Password minimal ${PASSWORD_MIN} karakter.`;
    if (Object.keys(found).length) {
      e.preventDefault();
      setClientErrors(found);
    } else setClientErrors(null);
  };

  return (
    <form action={action} onSubmit={onSubmit} noValidate className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 md:p-8 space-y-5 max-w-2xl">
      {state.message && !clientErrors && <Notice tone="error">{state.message}</Notice>}

      <fieldset>
        <legend className="mb-1.5 block text-xs font-semibold text-gray-600">Jenis akun</legend>
        <div className="flex flex-wrap gap-2">
          {[
            ['PETUGAS', 'Petugas fasilitas'],
            ['PENGGUNA', 'Pengguna (mahasiswa/dosen/staf)'],
          ].map(([value, label]) => (
            <label
              key={value}
              className={`cursor-pointer rounded-full px-5 py-2.5 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#0064D2] ${
                v.role === value ? 'bg-[#EBF3FF] text-[#0064D2] font-bold' : 'bg-gray-50 text-gray-600 font-semibold hover:bg-gray-100'
              }`}
            >
              <input type="radio" name="role" value={value} checked={v.role === value} onChange={set('role')} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
        {errors.role && <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.role}</p>}
      </fieldset>

      <FormField id="name" label="Nama lengkap" error={errors.name}>
        <input id="name" name="name" value={v.name} onChange={set('name')} aria-invalid={!!errors.name} className={fieldClass(errors.name)} />
      </FormField>
      <FormField id="email" label="Email" error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          value={v.email}
          onChange={set('email')}
          placeholder="nama@undip.ac.id"
          aria-invalid={!!errors.email}
          className={fieldClass(errors.email)}
        />
      </FormField>
      <FormField id="password" label="Password awal" error={errors.password} hint={`Minimal ${PASSWORD_MIN} karakter. Sampaikan ke pemilik akun untuk segera diganti.`}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={v.password}
          onChange={set('password')}
          aria-invalid={!!errors.password}
          className={fieldClass(errors.password)}
        />
      </FormField>

      <button
        type="submit"
        disabled={pending}
        className="bg-[#0064D2] text-white hover:bg-[#0056b3] px-6 py-3 rounded-2xl text-sm font-bold transition disabled:opacity-60"
      >
        {pending ? 'Menyimpan…' : 'Buat Akun'}
      </button>
    </form>
  );
}

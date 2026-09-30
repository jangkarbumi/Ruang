'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/server/session';
import { createAccount, setAccountStatus, type NewAccountErrors } from '@/server/services/account-service';
import { setFacilityActive, updateFacility } from '@/server/services/facility-service';
import { ROLE_LABEL } from '@/lib/account';
import type { FacilityInput, FieldErrors } from '@/lib/validation';

export interface CreateAccountState {
  errors: NewAccountErrors;
  message?: string;
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '');

export async function createAccountAction(_prev: CreateAccountState, fd: FormData): Promise<CreateAccountState> {
  await requireRole('ADMIN');
  const result = await createAccount({
    name: str(fd, 'name'),
    email: str(fd, 'email'),
    role: str(fd, 'role'),
    password: str(fd, 'password'),
  });
  if (!result.ok) return { errors: result.errors, message: 'Periksa kembali isian yang ditandai.' };
  revalidatePath('/admin', 'layout');
  redirect(`/admin/akun?status=daftar&dibuat=${encodeURIComponent(`${ROLE_LABEL[result.account.role]} ${result.account.name}`)}`);
}

/** FR-15: verifikasi atau tolak registrasi mandiri. */
export async function verifyAccountAction(fd: FormData) {
  await requireRole('ADMIN');
  const id = Number(fd.get('id'));
  const decision = fd.get('decision') === 'reject' ? 'REJECTED' : 'ACTIVE';
  const result = await setAccountStatus(id, decision);
  revalidatePath('/admin', 'layout');
  redirect(`/admin/akun?status=verifikasi&hasil=${result.ok ? (decision === 'ACTIVE' ? 'diterima' : 'ditolak') : 'gagal'}`);
}

/* ------------------------------------------------------------------ */
/* FR-16: kelola fasilitas                                              */
/* ------------------------------------------------------------------ */

export interface UpdateFacilityState {
  errors: FieldErrors<keyof FacilityInput>;
  message?: string;
}

export async function updateFacilityAction(_prev: UpdateFacilityState, fd: FormData): Promise<UpdateFacilityState> {
  await requireRole('ADMIN');
  const id = Number(fd.get('id'));
  const result = await updateFacility(id, {
    name: str(fd, 'name'),
    type: str(fd, 'type'),
    location: str(fd, 'location'),
    capacity: str(fd, 'capacity'),
    description: str(fd, 'description'),
  });
  if (!result.ok) return { errors: result.errors, message: result.message ?? 'Periksa kembali isian yang ditandai.' };
  // Nama, kapasitas, dll. tampil di katalog publik, halaman pengguna, dan petugas
  revalidatePath('/', 'layout');
  redirect(`/admin/fasilitas/${id}?hasil=disimpan`);
}

export async function setFacilityActiveAction(fd: FormData) {
  await requireRole('ADMIN');
  const id = Number(fd.get('id'));
  const active = fd.get('active') === 'true';
  const ok = await setFacilityActive(id, active);
  revalidatePath('/', 'layout');
  redirect(`/admin/fasilitas/${id}?hasil=${ok ? (active ? 'aktif' : 'nonaktif') : 'gagal'}`);
}

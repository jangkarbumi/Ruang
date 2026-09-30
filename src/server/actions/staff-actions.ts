'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/server/session';
import { setFacilityStatus } from '@/server/services/facility-service';
import {
  approveReservation,
  cancelUrgent,
  rejectReservation,
  updateReport,
} from '@/server/services/staff-service';

export interface StaffActionState {
  message?: string;
}

function refreshAll() {
  revalidatePath('/petugas', 'layout');
  revalidatePath('/reservasi', 'layout');
  revalidatePath('/laporan', 'layout');
  revalidatePath('/fasilitas', 'layout');
}

/** Satu action untuk keputusan reservasi: setujui / tolak / batalkan mendesak. */
export async function decideReservationAction(_prev: StaffActionState, fd: FormData): Promise<StaffActionState> {
  const officer = await requireRole('PETUGAS');
  const id = Number(fd.get('id'));
  const decision = String(fd.get('decision') ?? '');

  const result =
    decision === 'approve'
      ? await approveReservation(officer, id)
      : decision === 'reject'
        ? await rejectReservation(officer, id, String(fd.get('reason') ?? ''))
        : decision === 'cancel'
          ? await cancelUrgent(officer, id, String(fd.get('reason') ?? ''))
          : { ok: false as const, message: 'Aksi tidak dikenal.' };

  if (!result.ok) return { message: result.message };
  refreshAll();
  redirect(`/petugas/reservasi/${id}?hasil=${decision}`);
}

export interface ReportUpdateState {
  errors: { status?: string; note?: string };
}

export async function updateReportAction(_prev: ReportUpdateState, fd: FormData): Promise<ReportUpdateState> {
  const officer = await requireRole('PETUGAS');
  const id = Number(fd.get('id'));
  const result = await updateReport(officer, id, String(fd.get('status') ?? ''), String(fd.get('note') ?? ''));
  if (!result.ok) return { errors: result.errors };
  refreshAll();
  redirect(`/petugas/laporan/${id}?hasil=diperbarui`);
}

export async function setFacilityStatusAction(fd: FormData) {
  await requireRole('PETUGAS');
  const id = Number(fd.get('id'));
  const status = fd.get('status') === 'PERBAIKAN' ? 'PERBAIKAN' : 'AKTIF';
  await setFacilityStatus(id, status);
  refreshAll();
  const back = String(fd.get('back') ?? '/petugas/fasilitas');
  // Hanya izinkan kembali ke halaman petugas sendiri
  redirect(back.startsWith('/petugas') ? back : '/petugas/fasilitas');
}

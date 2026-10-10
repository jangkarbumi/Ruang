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

import {
  scheduleMaintenance,
  endMaintenance,
} from '@/server/services/maintenance-service';

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

export interface MaintenanceActionState {
  message?: string;
  errors?: Record<string, string>;
}

export async function scheduleMaintenanceAction(
  _prev: MaintenanceActionState,
  fd: FormData
): Promise<MaintenanceActionState> {
  const officer = await requireRole('PETUGAS');
  const facilityId = Number(fd.get('facilityId'));
  const startDate = String(fd.get('startDate') ?? '');
  const endDate = String(fd.get('endDate') ?? '');
  const reason = String(fd.get('reason') ?? '');
  const reportIdRaw = fd.get('reportId');
  const reportId = reportIdRaw ? Number(reportIdRaw) : null;
  const back = String(fd.get('back') ?? '/petugas/fasilitas');

  const res = await scheduleMaintenance(officer, {
    facilityId,
    startDate,
    endDate,
    reason,
    reportId,
  });

  if (!res.ok) {
    return { message: res.message, errors: res.errors };
  }

  refreshAll();
  const sep = back.includes('?') ? '&' : '?';
  const query = `maintenance=sukses&batal=${res.cancelledApprovedCount}&tolak=${res.rejectedPendingCount}`;
  redirect(`${back}${sep}${query}`);
}

export async function endMaintenanceAction(fd: FormData) {
  const officer = await requireRole('PETUGAS');
  const maintenanceId = Number(fd.get('maintenanceId'));
  const back = String(fd.get('back') ?? '/petugas/fasilitas');

  await endMaintenance(officer, maintenanceId);
  refreshAll();
  const sep = back.includes('?') ? '&' : '?';
  redirect(`${back}${sep}maintenance=selesai`);
}

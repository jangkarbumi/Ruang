import { db } from '@/server/db';
import { REJECTION_REASON_MIN } from '@/lib/reservation';
import { getAvailability, getFacility } from '@/server/services/facility-service';
import type { SessionUser } from '@/server/session';
import type { Account } from '@/lib/account';
import type { ReservationStatus } from '@/lib/reservation';
import type { ReportStatus } from '@/lib/report';
import { nowInJakarta, toJakarta, toMinutes } from '@/lib/slots';

export async function findUser(id: number | null): Promise<Account | undefined> {
  if (id == null) return undefined;
  const user = await db.user.findUnique({ where: { id } });
  if (!user) return undefined;
  return { ...user, role: user.role as Account['role'], accountStatus: user.accountStatus as Account['accountStatus'] };
}

/* ---------------------------- Reservasi ---------------------------- */

export async function listReservations(status?: ReservationStatus) {
  const records = await db.reservation.findMany({
    where: { ...(status && { status }) },
    orderBy: status === 'PENDING' 
      ? { startTime: 'asc' } 
      : { createdAt: 'desc' },
  });
  return records.map(r => ({ ...r, status: r.status as ReservationStatus }));
}

export async function getReservation(id: number) {
  const r = await db.reservation.findUnique({ where: { id } });
  if (!r) return null;
  return { ...r, status: r.status as ReservationStatus };
}

/**
 * Konflik untuk satu pengajuan:
 */
export async function conflictsFor(r: { id: number, facilityId: number, startTime: Date, endTime: Date }) {
  const others = await db.reservation.findMany({
    where: {
      id: { not: r.id },
      facilityId: r.facilityId,
      startTime: { lt: r.endTime },
      endTime: { gt: r.startTime },
    }
  });
  const approved = others.filter((x) => x.status === 'APPROVED');

  const facility = await getFacility(r.facilityId);
  const start = toJakarta(r.startTime);
  const end = toJakarta(r.endTime);
  let slotTaken = false;
  if (facility) {
    const slots = await getAvailability(facility, start.date, { date: '0000-00-00', minute: 0 });
    const from = toMinutes(start.time);
    const to = toMinutes(end.time);
    slotTaken = slots.some((s) => {
      const m = toMinutes(s.start);
      return m >= from && m < to && s.state === 'terisi';
    });
  }

  return {
    blocking: approved,
    slotTaken: slotTaken && approved.length === 0,
    competing: others.filter((x) => x.status === 'PENDING'),
  };
}

type Result = { ok: true } | { ok: false; message: string };

export async function approveReservation(officer: SessionUser, id: number): Promise<Result> {
  const r = await getReservation(id);
  if (!r) return { ok: false, message: 'Reservasi tidak ditemukan.' };
  if (r.status !== 'PENDING') return { ok: false, message: 'Hanya pengajuan berstatus Menunggu yang dapat disetujui.' };

  const facility = await getFacility(r.facilityId);
  if (!facility || facility.status !== 'AKTIF') {
    return { ok: false, message: 'Fasilitas sedang dalam perbaikan atau tidak aktif, pengajuan tidak dapat disetujui.' };
  }
  const now = nowInJakarta();
  const start = toJakarta(r.startTime);
  if (start.date < now.date || (start.date === now.date && toMinutes(start.time) <= now.minute)) {
    return { ok: false, message: 'Waktu reservasi sudah lewat.' };
  }

  const c = await conflictsFor(r);
  if (c.blocking.length || c.slotTaken) {
    return { ok: false, message: 'Jadwal ini bentrok dengan reservasi lain yang sudah disetujui.' };
  }

  await db.reservation.update({
    where: { id },
    data: {
      status: 'APPROVED',
      decidedById: officer.id,
    }
  });
  return { ok: true };
}

export const REJECT_REASON_MIN = REJECTION_REASON_MIN;

export async function rejectReservation(officer: SessionUser, id: number, reason: string): Promise<Result> {
  const r = await getReservation(id);
  if (!r) return { ok: false, message: 'Reservasi tidak ditemukan.' };
  if (r.status !== 'PENDING') return { ok: false, message: 'Hanya pengajuan berstatus Menunggu yang dapat ditolak.' };
  
  const text = reason.trim();
  if (text.length < REJECTION_REASON_MIN) {
    return { ok: false, message: `Alasan penolakan wajib diisi, minimal ${REJECTION_REASON_MIN} karakter.` };
  }
  
  await db.reservation.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectionReason: text,
      decidedById: officer.id,
    }
  });
  return { ok: true };
}

export const CANCEL_REASON_MIN = 10;

export async function cancelUrgent(officer: SessionUser, id: number, reason: string): Promise<Result> {
  const r = await getReservation(id);
  if (!r) return { ok: false, message: 'Reservasi tidak ditemukan.' };
  if (r.status !== 'APPROVED') return { ok: false, message: 'Hanya reservasi yang sudah disetujui yang dapat dibatalkan petugas.' };
  
  const text = reason.trim();
  if (text.length < CANCEL_REASON_MIN) {
    return { ok: false, message: `Alasan pembatalan wajib diisi, minimal ${CANCEL_REASON_MIN} karakter.` };
  }
  
  await db.reservation.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancellationReason: text,
      decidedById: officer.id,
    }
  });
  return { ok: true };
}

/* ----------------------------- Laporan ----------------------------- */

export async function listReports(status?: ReportStatus) {
  const records = await db.report.findMany({
    where: { ...(status && { status }) },
    orderBy: { createdAt: 'desc' },
  });
  return records.map(r => ({ ...r, status: r.status as ReportStatus }));
}

export async function getReport(id: number) {
  const r = await db.report.findUnique({ where: { id } });
  if (!r) return null;
  return { ...r, status: r.status as ReportStatus };
}

const NEXT: Record<ReportStatus, ReportStatus[]> = {
  BARU: ['DIPROSES', 'DITOLAK'],
  DIPROSES: ['SELESAI', 'DITOLAK'],
  SELESAI: [],
  DITOLAK: [],
};

export const allowedNextStatuses = (s: ReportStatus) => NEXT[s];
export const NOTE_MIN = 10;

export async function updateReport(
  officer: SessionUser,
  id: number,
  status: string,
  note: string,
): Promise<{ ok: true } | { ok: false; errors: { status?: string; note?: string } }> {
  const r = await getReport(id);
  if (!r) return { ok: false, errors: { status: 'Laporan tidak ditemukan.' } };
  if (!(NEXT[r.status] as string[]).includes(status)) {
    return { ok: false, errors: { status: 'Perubahan status ini tidak sesuai alur laporan.' } };
  }
  
  const next = status as ReportStatus;
  const text = note.trim();
  const closing = next === 'SELESAI' || next === 'DITOLAK';
  
  if (closing && text.length < NOTE_MIN) {
    return { ok: false, errors: { note: `Catatan resolusi wajib diisi saat laporan ditutup (minimal ${NOTE_MIN} karakter).` } };
  }
  
  await db.report.update({
    where: { id },
    data: {
      status: next,
      handledById: officer.id,
      ...(text && { resolutionNote: text }),
    }
  });
  
  return { ok: true };
}

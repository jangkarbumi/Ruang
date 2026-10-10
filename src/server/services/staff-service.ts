import { REJECTION_REASON_MIN } from '@/lib/reservation';
import { getAvailability, getFacility } from '@/server/services/facility-service';
import type { SessionUser } from '@/server/session';
import type { Account, Role } from '@/lib/account';
import type { Reservation, ReservationStatus } from '@/lib/reservation';
import type { ReportStatus, Report } from '@/lib/report';
import { nowInJakarta, toJakarta, toMinutes } from '@/lib/slots';

/**
 * Logika petugas fasilitas (FR-08 – FR-12). Semua pengecekan konflik dilakukan di server (NFR-06).
 */

import { db } from '@/server/db';

export async function findUser(id: number | null): Promise<Account | null> {
  if (id == null) return null;
  const user = await db.user.findUnique({ where: { id } });
  return user ? { id: user.id, name: user.name, email: user.email, role: user.role as Role, accountStatus: user.accountStatus, createdAt: user.createdAt } : null;
}

/* ---------------------------- Reservasi ---------------------------- */

export async function listReservations(status?: ReservationStatus) {
  const where: any = {};
  if (status) where.status = status;
  return (await db.reservation.findMany({
    where,
    orderBy: status === 'PENDING' 
      ? { startTime: 'asc' } 
      : [{ createdAt: 'desc' }, { id: 'desc' }]
  })) as Reservation[];
}

export async function getReservation(id: number) {
  return (await db.reservation.findUnique({ where: { id } })) as Reservation | null;
}

const overlaps = (a: Reservation, b: Reservation) =>
  a.id !== b.id && a.facilityId === b.facilityId && a.startTime < b.endTime && b.startTime < a.endTime;

/**
 * Konflik untuk satu pengajuan:
 * - `blocking`: reservasi lain yang SUDAH disetujui / slot terisi → tidak boleh disetujui (BR-04, AC-03)
 * - `competing`: pengajuan lain yang masih menunggu di jam yang sama → menyetujui ini membuat yang lain bentrok
 */
export async function conflictsFor(r: Reservation) {
  const others = (await db.reservation.findMany({
    where: {
      id: { not: r.id },
      facilityId: r.facilityId,
      startTime: { lt: r.endTime },
      endTime: { gt: r.startTime }
    }
  })) as Reservation[];
  const approved = others.filter((x) => x.status === 'APPROVED');
  const facility = await getFacility(r.facilityId);
  const slotTaken = facility ? facility.status !== 'AKTIF' : true;

  return {
    blocking: approved,
    slotTaken,
    competing: others.filter((x) => x.status === 'PENDING'),
  };
}

type Result = { ok: true } | { ok: false; message: string };

export async function approveReservation(officer: SessionUser, id: number): Promise<Result> {
  try {
    return await db.$transaction(async (tx) => {
      const r = await tx.reservation.findUnique({ where: { id } });
      if (!r) return { ok: false, message: 'Reservasi tidak ditemukan.' };
      if (r.status !== 'PENDING') return { ok: false, message: 'Hanya pengajuan berstatus Menunggu yang dapat disetujui.' };
    
      const facility = await tx.facility.findUnique({ where: { id: r.facilityId } });
      if (!facility || facility.status !== 'AKTIF') {
        return { ok: false, message: 'Fasilitas sedang dalam perbaikan atau tidak aktif, pengajuan tidak dapat disetujui.' };
      }
      
      const now = nowInJakarta();
      const start = toJakarta(r.startTime);
      if (start.date < now.date || (start.date === now.date && toMinutes(start.time) <= now.minute)) {
        return { ok: false, message: 'Waktu reservasi sudah lewat.' };
      }
      
      const overlappingApproved = await tx.reservation.findMany({
        where: {
          id: { not: r.id },
          facilityId: r.facilityId,
          status: 'APPROVED',
          startTime: { lt: r.endTime },
          endTime: { gt: r.startTime }
        }
      });
      
      if (overlappingApproved.length > 0) {
        return { ok: false, message: 'Jadwal ini bentrok dengan reservasi lain yang sudah disetujui.' };
      }
      
      await tx.reservation.update({
        where: { id: r.id },
        data: {
          status: 'APPROVED',
          decidedById: officer.id
        }
      });
      
      return { ok: true };
    }, {
      isolationLevel: 'Serializable'
    });
  } catch (e: any) {
    if (e.code === 'P2034' || (e.message && e.message.includes('40001')) || (e.cause && e.cause.originalCode === '40001')) {
      return { ok: false, message: 'Jadwal ini bentrok dengan reservasi lain yang sudah disetujui.' };
    }
    throw e;
  }
}

export const REJECT_REASON_MIN = REJECTION_REASON_MIN;

/** FR-08: petugas menolak pengajuan. Alasan penolakan wajib diisi (minimal 10 karakter). */
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
      decidedById: officer.id
    }
  });
  
  return { ok: true };
}

export const CANCEL_REASON_MIN = 10;

/** FR-10, BR-07, AC-05: pembatalan mendesak wajib beralasan. */
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
      decidedById: officer.id
    }
  });
  
  return { ok: true };
}

/* ----------------------------- Laporan ----------------------------- */

export async function listReports(status?: ReportStatus) {
  const where: any = {};
  if (status) where.status = status;
  return (await db.report.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  })) as Report[];
}

export async function getReport(id: number) {
  return (await db.report.findUnique({ where: { id } })) as Report | null;
}

/** Alur status (AC-06): Baru → Diproses → Selesai/Ditolak. Baru boleh langsung Ditolak. Laporan tertutup tidak dibuka lagi. */
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
      resolutionNote: text || null
    }
  });
  return { ok: true };
}

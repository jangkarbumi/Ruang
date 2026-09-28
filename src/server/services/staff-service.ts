import { store } from '@/server/data/store';
import { REJECTION_REASON_MIN } from '@/lib/reservation';
import { getAvailability, getFacility } from '@/server/services/facility-service';
import type { SessionUser } from '@/server/session';
import type { Account } from '@/lib/account';
import type { Reservation, ReservationStatus } from '@/lib/reservation';
import type { ReportStatus } from '@/lib/report';
import { nowInJakarta, toJakarta, toMinutes } from '@/lib/slots';

/**
 * Logika petugas fasilitas (FR-08 – FR-12). Semua pengecekan konflik dilakukan di server (NFR-06).
 */

export function findUser(id: number | null): Account | undefined {
  return id == null ? undefined : store().users.find((u) => u.id === id);
}

/* ---------------------------- Reservasi ---------------------------- */

export async function listReservations(status?: ReservationStatus) {
  return store()
    .reservations.filter((r) => !status || r.status === status)
    .sort((a, b) =>
      // Antrian menunggu: yang paling dekat waktunya di atas. Lainnya: terbaru di atas.
      status === 'PENDING' ? a.startTime.getTime() - b.startTime.getTime() : b.createdAt.getTime() - a.createdAt.getTime(),
    );
}

export async function getReservation(id: number) {
  return store().reservations.find((r) => r.id === id) ?? null;
}

const overlaps = (a: Reservation, b: Reservation) =>
  a.id !== b.id && a.facilityId === b.facilityId && a.startTime < b.endTime && b.startTime < a.endTime;

/**
 * Konflik untuk satu pengajuan:
 * - `blocking`: reservasi lain yang SUDAH disetujui / slot terisi → tidak boleh disetujui (BR-04, AC-03)
 * - `competing`: pengajuan lain yang masih menunggu di jam yang sama → menyetujui ini membuat yang lain bentrok
 */
export async function conflictsFor(r: Reservation) {
  const others = store().reservations.filter((x) => overlaps(r, x));
  const approved = others.filter((x) => x.status === 'APPROVED');

  // Slot terisi di luar data reservasi (data jadwal contoh) juga dihitung sebagai bentrok
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

  // Cek ulang tepat sebelum menyimpan — bukan mengandalkan tampilan (NFR-06)
  const c = await conflictsFor(r);
  if (c.blocking.length || c.slotTaken) {
    return { ok: false, message: 'Jadwal ini bentrok dengan reservasi lain yang sudah disetujui.' };
  }

  r.status = 'APPROVED';
  r.decidedById = officer.id;
  return { ok: true };
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
  r.status = 'REJECTED';
  r.rejectionReason = text;
  r.decidedById = officer.id;
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
  r.status = 'CANCELLED';
  r.cancellationReason = text;
  r.decidedById = officer.id;
  return { ok: true };
}

/* ----------------------------- Laporan ----------------------------- */

export async function listReports(status?: ReportStatus) {
  return store()
    .reports.filter((r) => !status || r.status === status)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getReport(id: number) {
  return store().reports.find((r) => r.id === id) ?? null;
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
  r.status = next;
  r.handledById = officer.id;
  if (text) r.resolutionNote = text;
  return { ok: true };
}

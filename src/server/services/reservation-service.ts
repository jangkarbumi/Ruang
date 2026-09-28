import { store } from '@/server/data/store';
import { getAvailability, getFacility } from '@/server/services/facility-service';
import type { SessionUser } from '@/server/session';
import { CANCEL_DEADLINE_HOURS, type Reservation, type ReservationStatus } from '@/lib/reservation';
import { fromJakarta, nowInJakarta, toMinutes } from '@/lib/slots';
import { validateReservation, type FieldErrors, type ReservationInput } from '@/lib/validation';

/**
 * Logika reservasi milik pengguna (FR-03, FR-04, FR-05).
 * Setiap fungsi menerima pengguna yang sedang login dan hanya menyentuh data miliknya (AC-04).
 */

export async function listUserReservations(user: SessionUser, status?: ReservationStatus) {
  return store()
    .reservations.filter((r) => r.userId === user.id && (!status || r.status === status))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id);
}

/** `null` bila tidak ada ATAU milik orang lain — keduanya diperlakukan sama agar tidak membocorkan data. */
export async function getUserReservation(user: SessionUser, id: number) {
  const r = store().reservations.find((x) => x.id === id);
  return r && r.userId === user.id ? r : null;
}

/** BR-06: hanya PENDING/APPROVED, dan paling lambat CANCEL_DEADLINE_HOURS sebelum mulai. */
export function cancelPolicy(r: Reservation, now = new Date()) {
  if (r.status !== 'PENDING' && r.status !== 'APPROVED') return { allowed: false, reason: null };
  const deadline = new Date(r.startTime.getTime() - CANCEL_DEADLINE_HOURS * 3600_000);
  if (now > deadline) {
    return {
      allowed: false,
      deadline,
      reason: `Batas pembatalan (${CANCEL_DEADLINE_HOURS} jam sebelum mulai) sudah lewat. Hubungi petugas fasilitas bila perlu.`,
    };
  }
  return { allowed: true, deadline, reason: null };
}

export type CreateResult =
  | { ok: true; id: number }
  | { ok: false; errors: FieldErrors<keyof ReservationInput>; message?: string };

export async function createReservation(user: SessionUser, input: ReservationInput): Promise<CreateResult> {
  const now = nowInJakarta();
  const errors = validateReservation(input, now);
  if (Object.keys(errors).length) return { ok: false, errors };

  const facility = await getFacility(Number(input.facilityId));
  if (!facility) return { ok: false, errors: { facilityId: 'Fasilitas tidak ditemukan.' } };
  if (facility.status !== 'AKTIF') {
    // BR-08, AC-07
    return { ok: false, errors: { facilityId: 'Fasilitas ini sedang dalam perbaikan dan tidak dapat direservasi.' } };
  }

  // Semua slot dalam rentang harus tersedia. Pesan sengaja umum — tanpa detail pemohon lain (BR-05).
  const from = toMinutes(input.start);
  const to = toMinutes(input.end);
  const slots = await getAvailability(facility, input.date, now);
  const clash = slots.some((s) => {
    const m = toMinutes(s.start);
    return m >= from && m < to && s.state !== 'tersedia';
  });
  if (clash) {
    return { ok: false, errors: { start: 'Sebagian rentang waktu ini sudah terisi. Pilih jam lain.' } };
  }

  const startTime = fromJakarta(input.date, input.start);
  const endTime = fromJakarta(input.date, input.end);

  // Cegah pengajuan ganda dari pengguna yang sama pada jadwal yang tumpang tindih
  const duplicate = store().reservations.some(
    (r) =>
      r.userId === user.id &&
      r.facilityId === facility.id &&
      (r.status === 'PENDING' || r.status === 'APPROVED') &&
      r.startTime < endTime &&
      startTime < r.endTime,
  );
  if (duplicate) {
    return { ok: false, errors: { start: 'Anda sudah punya pengajuan di fasilitas ini pada jam yang tumpang tindih.' } };
  }

  const s = store();
  const reservation: Reservation = {
    id: s.nextReservationId++,
    userId: user.id,
    facilityId: facility.id,
    startTime,
    endTime,
    purpose: input.purpose.trim(),
    status: 'PENDING',
    cancellationReason: null,
    decidedById: null,
    createdAt: new Date(),
  };
  s.reservations.push(reservation);
  return { ok: true, id: reservation.id };
}

export async function cancelReservation(user: SessionUser, id: number) {
  const r = await getUserReservation(user, id);
  if (!r) return { ok: false as const, message: 'Reservasi tidak ditemukan.' };
  const policy = cancelPolicy(r);
  if (!policy.allowed) return { ok: false as const, message: policy.reason ?? 'Reservasi ini tidak dapat dibatalkan.' };
  r.status = 'CANCELLED';
  return { ok: true as const };
}

import { db } from '@/server/db';
import { getAvailability, getFacility } from '@/server/services/facility-service';
import type { SessionUser } from '@/server/session';
import { CANCEL_DEADLINE_HOURS, type Reservation, type ReservationStatus } from '@/lib/reservation';
import { fromJakarta, nowInJakarta, toMinutes } from '@/lib/slots';
import { validateReservation, type FieldErrors, type ReservationInput } from '@/lib/validation';

export async function listUserReservations(user: SessionUser, status?: ReservationStatus) {
  const records = await db.reservation.findMany({
    where: {
      userId: user.id,
      ...(status && { status }),
    },
    orderBy: [
      { createdAt: 'desc' },
      { id: 'desc' },
    ],
  });
  return records.map(r => ({ ...r, status: r.status as ReservationStatus }));
}

export async function getUserReservation(user: SessionUser, id: number) {
  const r = await db.reservation.findUnique({ where: { id } });
  if (!r || r.userId !== user.id) return null;
  return { ...r, status: r.status as ReservationStatus };
}

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
    return { ok: false, errors: { facilityId: 'Fasilitas ini sedang dalam perbaikan dan tidak dapat direservasi.' } };
  }

  const startTime = fromJakarta(input.date, input.start);
  const endTime = fromJakarta(input.date, input.end);

  const maintenance = await db.maintenance.findFirst({
    where: {
      facilityId: facility.id,
      startDate: { lt: endTime },
      endDate: { gt: startTime },
    }
  });
  if (maintenance) {
    return { ok: false, errors: { start: `Fasilitas ini sedang dalam jadwal perbaikan pada tanggal tersebut: "${maintenance.reason}".` } };
  }

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

  const duplicate = await db.reservation.findFirst({
    where: {
      userId: user.id,
      facilityId: facility.id,
      status: { in: ['PENDING', 'APPROVED'] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    }
  });

  if (duplicate) {
    return { ok: false, errors: { start: 'Anda sudah punya pengajuan di fasilitas ini pada jam yang tumpang tindih.' } };
  }

  const reservation = await db.reservation.create({
    data: {
      userId: user.id,
      facilityId: facility.id,
      startTime,
      endTime,
      purpose: input.purpose.trim(),
      status: 'PENDING',
    }
  });
  
  return { ok: true, id: reservation.id };
}

export async function cancelReservation(user: SessionUser, id: number) {
  const r = await getUserReservation(user, id);
  if (!r) return { ok: false as const, message: 'Reservasi tidak ditemukan.' };
  
  const policy = cancelPolicy(r);
  if (!policy.allowed) return { ok: false as const, message: policy.reason ?? 'Reservasi ini tidak dapat dibatalkan.' };
  
  await db.reservation.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });
  
  return { ok: true as const };
}

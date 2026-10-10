import { Prisma } from "@prisma/client";
import { db } from '@/server/db';
import type { SessionUser } from '@/server/session';

export interface MaintenanceScheduleInput {
  facilityId: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;
  reportId?: number | null;
}

export const MAINTENANCE_REASON_MIN = 10;

/** Mengonversi tanggal lokal YYYY-MM-DD ke Date awal hari WIB (+07:00) */
export const startOfDayJakarta = (dateStr: string) => new Date(`${dateStr}T00:00:00+07:00`);

/** Mengonversi tanggal lokal YYYY-MM-DD ke Date akhir hari WIB (+07:00) */
export const endOfDayJakarta = (dateStr: string) => new Date(`${dateStr}T23:59:59+07:00`);

export async function getActiveFacilityMaintenance(facilityId: number) {
  return db.maintenance.findFirst({
    where: {
      facilityId,
      endDate: { gte: new Date() },
    },
    orderBy: { startDate: 'asc' },
  });
}

export async function listActiveMaintenances(facilityId?: number) {
  const now = new Date();
  return db.maintenance.findMany({
    where: {
      ...(facilityId && { facilityId }),
      endDate: { gte: now },
    },
    include: {
      facility: { select: { id: true, name: true, location: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { startDate: 'asc' },
  });
}

export async function getFacilityMaintenanceOnDate(facilityId: number, dateStr: string) {
  const startOfDay = startOfDayJakarta(dateStr);
  const endOfDay = endOfDayJakarta(dateStr);

  return db.maintenance.findFirst({
    where: {
      facilityId,
      startDate: { lte: endOfDay },
      endDate: { gte: startOfDay },
    },
    orderBy: { startDate: 'asc' },
  });
}

export async function getMaintenanceOverlap(facilityId: number, startTime: Date, endTime: Date) {
  return db.maintenance.findFirst({
    where: {
      facilityId,
      startDate: { lt: endTime },
      endDate: { gt: startTime },
    },
    orderBy: { startDate: 'asc' },
  });
}

export async function findConflictsForMaintenance(facilityId: number, start: Date, end: Date) {
  const reservations = await db.reservation.findMany({
    where: {
      facilityId,
      status: { in: ['APPROVED', 'PENDING'] },
      startTime: { lt: end },
      endTime: { gt: start },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  return {
    approved: reservations.filter((r) => r.status === 'APPROVED'),
    pending: reservations.filter((r) => r.status === 'PENDING'),
  };
}

export type ScheduleMaintenanceResult =
  | {
      ok: true;
      maintenanceId: number;
      cancelledApprovedCount: number;
      rejectedPendingCount: number;
    }
  | { ok: false; message: string; errors?: Record<string, string> };

export async function scheduleMaintenance(
  officer: SessionUser,
  input: MaintenanceScheduleInput
): Promise<ScheduleMaintenanceResult> {
  const errors: Record<string, string> = {};

  if (!input.facilityId) errors.facilityId = 'Fasilitas wajib dipilih.';
  if (!input.startDate) errors.startDate = 'Pilih tanggal mulai.';
  if (!input.endDate) errors.endDate = 'Pilih tanggal selesai.';
  if (input.startDate && input.endDate && input.startDate > input.endDate) {
    errors.endDate = 'Tanggal selesai harus setelah atau sama dengan tanggal mulai.';
  }

  const reason = input.reason?.trim() ?? '';
  if (reason.length < MAINTENANCE_REASON_MIN) {
    errors.reason = `Alasan perbaikan wajib diisi (minimal ${MAINTENANCE_REASON_MIN} karakter).`;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: 'Harap periksa isian form.', errors };
  }

  const facility = await db.facility.findUnique({ where: { id: input.facilityId } });
  if (!facility || facility.status === 'NONAKTIF') {
    return { ok: false, message: 'Fasilitas tidak ditemukan atau sudah dinonaktifkan.' };
  }

  const startUtc = startOfDayJakarta(input.startDate);
  const endUtc = endOfDayJakarta(input.endDate);

  try {
    return await db.$transaction(async (tx) => {
      // 1. Simpan jadwal perbaikan
      const maintenance = await tx.maintenance.create({
        data: {
          facilityId: input.facilityId,
          startDate: startUtc,
          endDate: endUtc,
          reason,
          reportId: input.reportId ?? null,
          createdById: officer.id,
        },
      });

      // 2. Ambil reservasi yang bentrok
      const conflicting = await tx.reservation.findMany({
        where: {
          facilityId: input.facilityId,
          status: { in: ['APPROVED', 'PENDING'] },
          startTime: { lt: endUtc },
          endTime: { gt: startUtc },
        },
        select: { id: true, status: true },
      });

      const approvedIds = conflicting.filter((r) => r.status === 'APPROVED').map((r) => r.id);
      const pendingIds = conflicting.filter((r) => r.status === 'PENDING').map((r) => r.id);

      // 3. Batalkan darurat reservasi yang sudah disetujui (FR-10, BR-07, AC-05)
      if (approvedIds.length > 0) {
        await tx.reservation.updateMany({
          where: { id: { in: approvedIds } },
          data: {
            status: 'CANCELLED',
            cancellationReason: `[Pemeliharaan Fasilitas Darurat] ${reason}`,
            decidedById: officer.id,
          },
        });
      }

      // 4. Tolak pengajuan yang masih pending
      if (pendingIds.length > 0) {
        await tx.reservation.updateMany({
          where: { id: { in: pendingIds } },
          data: {
            status: 'REJECTED',
            rejectionReason: `[Fasilitas Dalam Perbaikan] ${reason}`,
            decidedById: officer.id,
          },
        });
      }

      // 5. Update status fasilitas jika masa perbaikan mencakup hari ini
      const now = new Date();
      if (now >= startUtc && now <= endUtc) {
        await tx.facility.update({
          where: { id: input.facilityId },
          data: { status: 'PERBAIKAN' },
        });
      }

      return {
        ok: true as const,
        maintenanceId: maintenance.id,
        cancelledApprovedCount: approvedIds.length,
        rejectedPendingCount: pendingIds.length,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string; cause?: { originalCode?: string } };
    if (err.code === 'P2034' || (err.message && err.message.includes('40001')) || (err.cause && err.cause.originalCode === '40001')) {
      return { ok: false, message: 'Gagal mengatur jadwal perbaikan karena ada perubahan reservasi di saat yang sama. Silakan coba lagi.' };
    }
    throw e;
  }
}

export async function endMaintenance(officer: SessionUser, maintenanceId: number) {
  const m = await db.maintenance.findUnique({ where: { id: maintenanceId } });
  if (!m) return { ok: false, message: 'Jadwal perbaikan tidak ditemukan.' };

  await db.$transaction(async (tx) => {
    await tx.maintenance.delete({ where: { id: maintenanceId } });

    // Cek apakah masih ada maintenance aktif hari ini untuk fasilitas ini
    const now = new Date();
    const otherActive = await tx.maintenance.findFirst({
      where: {
        facilityId: m.facilityId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (!otherActive) {
      await tx.facility.update({
        where: { id: m.facilityId },
        data: { status: 'AKTIF' },
      });
    }
  });

  return { ok: true as const };
}

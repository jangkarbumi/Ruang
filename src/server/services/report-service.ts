import { db } from '@/server/db';
import { getFacility } from '@/server/services/facility-service';
import type { SessionUser } from '@/server/session';
import type { ReportStatus } from '@/lib/report';
import { validateReport, type FieldErrors, type ReportInput } from '@/lib/validation';

/** Laporan kerusakan milik pengguna (FR-06, FR-07). */

export async function listUserReports(user: SessionUser, status?: ReportStatus) {
  const records = await db.report.findMany({
    where: {
      reporterId: user.id,
      ...(status && { status }),
    },
    orderBy: [
      { createdAt: 'desc' },
      { id: 'desc' },
    ]
  });
  return records.map(r => ({ ...r, status: r.status as ReportStatus }));
}

export async function getUserReport(user: SessionUser, id: number) {
  const r = await db.report.findUnique({ where: { id } });
  if (!r || r.reporterId !== user.id) return null;
  return { ...r, status: r.status as ReportStatus };
}

export type CreateReportResult =
  | { ok: true; id: number }
  | { ok: false; errors: FieldErrors<keyof ReportInput> };

export async function createReport(user: SessionUser, input: ReportInput): Promise<CreateReportResult> {
  const errors = validateReport(input);
  if (Object.keys(errors).length) return { ok: false, errors };

  // Fasilitas dalam perbaikan tetap boleh dilaporkan; yang nonaktif tidak terlihat sehingga tidak ditemukan.
  const facility = await getFacility(Number(input.facilityId));
  if (!facility) return { ok: false, errors: { facilityId: 'Fasilitas tidak ditemukan.' } };

  const report = await db.report.create({
    data: {
      reporterId: user.id,
      facilityId: facility.id,
      category: input.category,
      description: input.description.trim(),
      photo: input.photo || null,
      status: 'BARU',
    }
  });
  
  return { ok: true, id: report.id };
}

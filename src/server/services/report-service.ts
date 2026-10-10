import { db } from '@/server/db';
import { getFacility } from '@/server/services/facility-service';
import type { SessionUser } from '@/server/session';
import type { ReportStatus } from '@/lib/report';
import type { Report } from '@/lib/report';
import { validateReport, type FieldErrors, type ReportInput } from '@/lib/validation';

/** Laporan kerusakan milik pengguna (FR-06, FR-07). */

export async function listUserReports(user: SessionUser, status?: ReportStatus) {
  const where: any = { reporterId: user.id };
  if (status) where.status = status;
  return (await db.report.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
  })) as Report[];
}

export async function getUserReport(user: SessionUser, id: number) {
  const r = await db.report.findUnique({ where: { id } });
  return r && r.reporterId === user.id ? (r as Report) : null;
}

export type CreateReportResult =
  | { ok: true; id: number }
  | { ok: false; errors: FieldErrors<keyof ReportInput> };

export async function createReport(user: SessionUser, input: ReportInput): Promise<CreateReportResult> {
  const errors = validateReport(input);
  if (Object.keys(errors).length) return { ok: false, errors };

  const facility = await getFacility(Number(input.facilityId));
  if (!facility) return { ok: false, errors: { facilityId: 'Fasilitas tidak ditemukan.' } };

  const report = await db.report.create({
    data: {
      reporterId: user.id,
      facilityId: facility.id,
      category: input.category,
      description: input.description.trim(),
      photo: input.photo || null,
      status: 'BARU'
    }
  });
  
  return { ok: true, id: report.id };
}

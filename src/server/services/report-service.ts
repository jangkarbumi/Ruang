import { store } from '@/server/data/store';
import { getFacility } from '@/server/services/facility-service';
import type { SessionUser } from '@/server/session';
import type { Report, ReportStatus } from '@/lib/report';
import { validateReport, type FieldErrors, type ReportInput } from '@/lib/validation';

/** Laporan kerusakan milik pengguna (FR-06, FR-07). */

export async function listUserReports(user: SessionUser, status?: ReportStatus) {
  return store()
    .reports.filter((r) => r.reporterId === user.id && (!status || r.status === status))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id);
}

export async function getUserReport(user: SessionUser, id: number) {
  const r = store().reports.find((x) => x.id === id);
  return r && r.reporterId === user.id ? r : null;
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

  const s = store();
  const report: Report = {
    id: s.nextReportId++,
    reporterId: user.id,
    facilityId: facility.id,
    category: input.category,
    description: input.description.trim(),
    photo: input.photo || null,
    status: 'BARU',
    resolutionNote: null,
    handledById: null,
    createdAt: new Date(),
  };
  s.reports.push(report);
  return { ok: true, id: report.id };
}

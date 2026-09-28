import { store } from '@/server/data/store';
import { findUser } from '@/server/services/staff-service';
import { listAllFacilities } from '@/server/services/facility-service';
import { locationLabel, type Facility } from '@/lib/facility';
import { RESERVATION_STATUS, reservationCode, type ReservationStatus } from '@/lib/reservation';
import { REPORT_STATUS, reportCode, type ReportStatus } from '@/lib/report';
import { addDays, toJakarta, toMinutes } from '@/lib/slots';

/**
 * FR-17: rekap reservasi & laporan per periode, dan isi file ekspor CSV.
 * Reservasi dihitung berdasarkan tanggal pemakaian, laporan berdasarkan tanggal dilaporkan (WIB).
 */

export interface Range {
  from: string;
  to: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const RANGE_MAX_DAYS = 366;

/** Periode dari `?dari=&sampai=`; bila kosong/tidak sah dipakai 30 hari ke belakang & ke depan. */
export function parseRange(dari: unknown, sampai: unknown, today: string): Range & { error?: string } {
  const fallback = { from: addDays(today, -30), to: addDays(today, 30) };
  const from = typeof dari === 'string' && ISO_DATE.test(dari) ? dari : null;
  const to = typeof sampai === 'string' && ISO_DATE.test(sampai) ? sampai : null;
  if (!from && !to) return fallback;
  if (!from || !to) return { ...fallback, error: 'Isi tanggal awal dan akhir periode.' };
  if (from > to) return { ...fallback, error: 'Tanggal awal harus sebelum atau sama dengan tanggal akhir.' };
  if (to > addDays(from, RANGE_MAX_DAYS - 1)) return { ...fallback, error: `Periode maksimal ${RANGE_MAX_DAYS} hari.` };
  return { from, to };
}

const inRange = (date: string, r: Range) => date >= r.from && date <= r.to;

async function facilityMap() {
  return new Map<number, Facility>((await listAllFacilities()).map((f) => [f.id, f]));
}

export async function reservationsIn(range: Range) {
  return store()
    .reservations.filter((r) => inRange(toJakarta(r.startTime).date, range))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

export async function reportsIn(range: Range) {
  return store()
    .reports.filter((r) => inRange(toJakarta(r.createdAt).date, range))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

const hoursOf = (r: { startTime: Date; endTime: Date }) => (r.endTime.getTime() - r.startTime.getTime()) / 3_600_000;

export async function recap(range: Range) {
  const [reservations, reports, facilities] = await Promise.all([reservationsIn(range), reportsIn(range), facilityMap()]);

  const byReservationStatus = Object.fromEntries(
    (Object.keys(RESERVATION_STATUS) as ReservationStatus[]).map((s) => [s, reservations.filter((r) => r.status === s).length]),
  ) as Record<ReservationStatus, number>;
  const byReportStatus = Object.fromEntries(
    (Object.keys(REPORT_STATUS) as ReportStatus[]).map((s) => [s, reports.filter((r) => r.status === s).length]),
  ) as Record<ReportStatus, number>;

  const perFacility = new Map<number, { total: number; approved: number; hours: number; reports: number }>();
  const row = (id: number) => perFacility.get(id) ?? perFacility.set(id, { total: 0, approved: 0, hours: 0, reports: 0 }).get(id)!;
  for (const r of reservations) {
    const x = row(r.facilityId);
    x.total++;
    if (r.status === 'APPROVED') {
      x.approved++;
      x.hours += hoursOf(r);
    }
  }
  for (const r of reports) row(r.facilityId).reports++;

  return {
    reservationTotal: reservations.length,
    reportTotal: reports.length,
    approvedHours: reservations.filter((r) => r.status === 'APPROVED').reduce((n, r) => n + hoursOf(r), 0),
    byReservationStatus,
    byReportStatus,
    facilities: [...perFacility.entries()]
      .map(([id, v]) => ({ facility: facilities.get(id) ?? null, id, ...v }))
      .sort((a, b) => b.total - a.total || b.reports - a.reports || a.id - b.id),
  };
}

/* ------------------------------------------------------------------ */
/* CSV                                                                  */
/* ------------------------------------------------------------------ */

/**
 * Satu sel CSV (RFC 4180). Nilai yang diawali = + - @ diberi tanda petik tunggal
 * agar tidak dijalankan sebagai rumus saat dibuka di Excel/Sheets (CSV injection).
 */
function cell(value: string | number | null | undefined) {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n;]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

/** BOM di awal agar Excel membaca huruf non-ASCII dengan benar; baris dipisah CRLF. */
function toCsv(header: string[], rows: (string | number | null)[][]) {
  return '﻿' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}

const stamp = (d: Date) => {
  const j = toJakarta(d);
  return `${j.date} ${j.time}`;
};

export async function reservationsCsv(range: Range) {
  const [items, facilities] = await Promise.all([reservationsIn(range), facilityMap()]);
  return toCsv(
    ['Kode', 'Fasilitas', 'Lokasi', 'Tanggal', 'Mulai', 'Selesai', 'Durasi (jam)', 'Pemohon', 'Email pemohon', 'Tujuan', 'Status', 'Alasan pembatalan', 'Diputuskan oleh', 'Diajukan pada'],
    items.map((r) => {
      const f = facilities.get(r.facilityId);
      const s = toJakarta(r.startTime);
      const e = toJakarta(r.endTime);
      const u = findUser(r.userId);
      return [
        reservationCode(r.id),
        f?.name ?? `Fasilitas #${r.facilityId}`,
        f ? locationLabel(f.location) : '',
        s.date,
        s.time,
        e.time,
        (toMinutes(e.time) - toMinutes(s.time)) / 60,
        u?.name ?? '',
        u?.email ?? '',
        r.purpose,
        RESERVATION_STATUS[r.status].label,
        r.cancellationReason,
        findUser(r.decidedById)?.name ?? '',
        stamp(r.createdAt),
      ];
    }),
  );
}

export async function reportsCsv(range: Range) {
  const [items, facilities] = await Promise.all([reportsIn(range), facilityMap()]);
  return toCsv(
    ['Kode', 'Fasilitas', 'Lokasi', 'Kategori', 'Deskripsi', 'Ada foto', 'Status', 'Catatan penanganan', 'Pelapor', 'Ditangani oleh', 'Dilaporkan pada'],
    items.map((r) => {
      const f = facilities.get(r.facilityId);
      return [
        reportCode(r.id),
        f?.name ?? `Fasilitas #${r.facilityId}`,
        f ? locationLabel(f.location) : '',
        r.category,
        r.description,
        r.photo ? 'Ya' : 'Tidak',
        REPORT_STATUS[r.status].label,
        r.resolutionNote,
        findUser(r.reporterId)?.name ?? '',
        findUser(r.handledById)?.name ?? '',
        stamp(r.createdAt),
      ];
    }),
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { Download } from 'lucide-react';
import PageBanner from '@/components/facility/PageBanner';
import { AdminNavbar } from '@/components/staff/nav';
import { EmptyState } from '@/components/staff/rows';
import { Notice, fieldClass } from '@/components/user/form';
import { requireRole } from '@/server/session';
import { parseRange, recap, type Range } from '@/server/services/recap-service';
import { locationLabel } from '@/lib/facility';
import { RESERVATION_STATUS, type ReservationStatus } from '@/lib/reservation';
import { REPORT_STATUS, type ReportStatus } from '@/lib/report';
import { addDays, formatDateLong, nowInJakarta } from '@/lib/slots';

export const metadata: Metadata = { title: 'Rekap & Ekspor | Admin | Ruang' };

const qs = (r: Range) => `dari=${r.from}&sampai=${r.to}`;
const fmtHours = (h: number) => `${h.toLocaleString('id-ID', { maximumFractionDigits: 1 })} jam`;

function presets(today: string) {
  const monthStart = `${today.slice(0, 8)}01`;
  const nextMonthStart = addDays(monthStart, 32).slice(0, 8) + '01';
  const prevMonthStart = addDays(monthStart, -1).slice(0, 8) + '01';
  return [
    { label: '±30 hari', range: { from: addDays(today, -30), to: addDays(today, 30) } },
    { label: 'Bulan ini', range: { from: monthStart, to: addDays(nextMonthStart, -1) } },
    { label: 'Bulan lalu', range: { from: prevMonthStart, to: addDays(monthStart, -1) } },
  ];
}

function Breakdown<S extends string>({
  title,
  total,
  counts,
  meta,
}: {
  title: string;
  total: number;
  counts: Record<S, number>;
  meta: Record<S, { label: string; className: string }>;
}) {
  return (
    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-bold text-[#001741]">{title}</h2>
        <p className="text-3xl font-bold tracking-tight text-[#001741] tabular-nums">{total}</p>
      </div>
      <ul className="mt-5 space-y-3">
        {(Object.keys(meta) as S[]).map((s) => (
          <li key={s} className="flex items-center gap-3">
            <span className={`w-32 shrink-0 rounded-full px-3 py-1 text-center text-[11px] font-bold ${meta[s].className}`}>{meta[s].label}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              <span className="block h-full rounded-full bg-[#0064D2]" style={{ width: `${total ? (counts[s] / total) * 100 : 0}%` }} />
            </span>
            <span className="w-8 text-right text-sm font-bold text-[#001741] tabular-nums">{counts[s]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** FR-17: rekap reservasi & laporan per periode, dengan ekspor CSV. */
export default async function AdminRecapPage(props: PageProps<'/admin/rekap'>) {
  const user = await requireRole('ADMIN', '/admin/rekap');
  const sp = await props.searchParams;
  const today = nowInJakarta().date;
  const range = parseRange(sp.dari, sp.sampai, today);
  const data = await recap(range);
  const presetList = presets(today);

  return (
    <main className="flex-1 bg-[#f8f9fa]">
      <PageBanner navbar={<AdminNavbar user={user} active="rekap" />}>
        <h1 className="text-[44px] font-bold tracking-tight">Rekap & Ekspor</h1>
        <p className="mt-2 max-w-xl text-white/70">
          Ringkasan reservasi dan laporan kerusakan per periode. Unduh datanya sebagai CSV untuk diolah di Excel.
        </p>
      </PageBanner>

      <div className="relative z-20 w-full max-w-300 mx-auto px-4 -mt-7 pb-20 space-y-6">
        {/* Periode */}
        <nav aria-label="Periode cepat" className="bg-white rounded-full shadow-lg w-fit max-w-full overflow-x-auto">
          <div className="flex items-center gap-1 p-2">
            {presetList.map((p) => {
              const on = !range.error && p.range.from === range.from && p.range.to === range.to;
              return (
                <Link
                  key={p.label}
                  href={`/admin/rekap?${qs(p.range)}`}
                  aria-current={on ? 'page' : undefined}
                  className={`rounded-full px-5 py-2.5 text-sm shrink-0 transition ${
                    on ? 'bg-[#EBF3FF] text-[#0064D2] font-bold' : 'text-gray-600 font-semibold hover:bg-gray-50'
                  }`}
                >
                  {p.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {range.error && <Notice tone="error">{range.error} Menampilkan periode bawaan.</Notice>}

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-wrap items-end justify-between gap-6">
          <form action="/admin/rekap" className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="dari" className="mb-1.5 block text-xs font-semibold text-gray-600">
                Dari tanggal
              </label>
              <input id="dari" name="dari" type="date" defaultValue={range.from} required className={fieldClass()} />
            </div>
            <div>
              <label htmlFor="sampai" className="mb-1.5 block text-xs font-semibold text-gray-600">
                Sampai tanggal
              </label>
              <input id="sampai" name="sampai" type="date" defaultValue={range.to} required className={fieldClass()} />
            </div>
            <button type="submit" className="bg-[#0064D2] text-white hover:bg-[#0056b3] px-6 py-2.5 rounded-2xl text-sm font-bold transition">
              Terapkan
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {/* Tautan biasa (bukan <Link>) agar browser langsung mengunduh file */}
            <a
              href={`/admin/rekap/ekspor?jenis=reservasi&${qs(range)}`}
              download
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-[#001741] rounded-2xl text-sm font-bold hover:bg-gray-50 transition"
            >
              <Download className="w-4 h-4" aria-hidden /> CSV Reservasi
            </a>
            <a
              href={`/admin/rekap/ekspor?jenis=laporan&${qs(range)}`}
              download
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-[#001741] rounded-2xl text-sm font-bold hover:bg-gray-50 transition"
            >
              <Download className="w-4 h-4" aria-hidden /> CSV Laporan
            </a>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          Periode <span className="font-semibold text-[#001741]">{formatDateLong(range.from)}</span> sampai{' '}
          <span className="font-semibold text-[#001741]">{formatDateLong(range.to)}</span>. Reservasi dihitung dari tanggal pemakaian,
          laporan dari tanggal dilaporkan.
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          <Breakdown<ReservationStatus>
            title="Reservasi"
            total={data.reservationTotal}
            counts={data.byReservationStatus}
            meta={RESERVATION_STATUS}
          />
          <Breakdown<ReportStatus> title="Laporan kerusakan" total={data.reportTotal} counts={data.byReportStatus} meta={REPORT_STATUS} />
        </div>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-[#001741]">Per fasilitas</h2>
            <p className="text-sm text-gray-500">
              Total pemakaian disetujui: <span className="font-bold text-[#001741]">{fmtHours(data.approvedHours)}</span>
            </p>
          </div>

          {data.facilities.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-150 text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                    <th scope="col" className="py-3 pr-4">Fasilitas</th>
                    <th scope="col" className="py-3 px-4 text-right">Reservasi</th>
                    <th scope="col" className="py-3 px-4 text-right">Disetujui</th>
                    <th scope="col" className="py-3 px-4 text-right">Jam terpakai</th>
                    <th scope="col" className="py-3 pl-4 text-right">Laporan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.facilities.map((row) => (
                    <tr key={row.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4">
                        <p className="font-bold text-[#001741]">{row.facility?.name ?? `Fasilitas #${row.id}`}</p>
                        {row.facility && <p className="text-xs text-gray-500">{locationLabel(row.facility.location)}</p>}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[#001741] tabular-nums">{row.total}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-gray-600">{row.approved}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-gray-600">{fmtHours(row.hours)}</td>
                      <td className="py-3 pl-4 text-right tabular-nums text-gray-600">{row.reports}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState title="Belum ada data pada periode ini">Coba perlebar periode atau pilih periode cepat di atas.</EmptyState>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

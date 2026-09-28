import type { Metadata } from 'next';
import Link from 'next/link';
import { ClipboardList, Plus } from 'lucide-react';
import PageBanner from '@/components/facility/PageBanner';
import FacilityImage from '@/components/facility/FacilityImage';
import UserNavbar from '@/components/user/UserNavbar';
import StatusTabs from '@/components/user/StatusTabs';
import { ReportBadge } from '@/components/user/StatusBadge';
import { requireUser } from '@/server/session';
import { findFacility } from '@/server/services/facility-service';
import { listUserReports } from '@/server/services/report-service';
import { REPORT_STATUS, reportCode, type ReportStatus } from '@/lib/report';
import { formatDateLong, toJakarta } from '@/lib/slots';

export const metadata: Metadata = { title: 'Laporan Saya | Ruang' };

const STATUSES = Object.keys(REPORT_STATUS) as ReportStatus[];

export default async function MyReportsPage(props: PageProps<'/laporan'>) {
  const user = await requireUser('/laporan');
  const raw = (await props.searchParams).status;
  const status = STATUSES.find((s) => s === raw);

  const all = await listUserReports(user);
  const items = status ? all.filter((r) => r.status === status) : all;
  const rows = await Promise.all(items.map(async (r) => ({ r, facility: await findFacility(r.facilityId) })));

  const tabs = [
    { value: '', label: 'Semua', count: all.length },
    ...STATUSES.map((s) => ({ value: s, label: REPORT_STATUS[s].label, count: all.filter((r) => r.status === s).length })),
  ];

  return (
    <main className="flex-1 bg-[#f8f9fa]">
      <PageBanner navbar={<UserNavbar user={user} active="laporan" />}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[44px] font-bold tracking-tight">Laporan Saya</h1>
            <p className="mt-2 max-w-xl text-white/70">Pantau status laporan kerusakan yang Anda kirim.</p>
          </div>
          <Link
            href="/laporan/baru"
            className="flex items-center gap-2 bg-[#0064D2] text-white hover:bg-[#0056b3] px-6 py-3 rounded-2xl text-sm font-bold transition"
          >
            <Plus className="w-4 h-4" aria-hidden />
            Lapor Kerusakan
          </Link>
        </div>
      </PageBanner>

      <div className="relative z-20 w-full max-w-300 mx-auto px-4 -mt-7 pb-20">
        <StatusTabs basePath="/laporan" tabs={tabs} active={status ?? ''} />

        {rows.length > 0 ? (
          <ul className="mt-8 space-y-4">
            {rows.map(({ r, facility }) => (
              <li key={r.id}>
                <Link
                  href={`/laporan/${r.id}`}
                  className="flex gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-3 pr-5"
                >
                  {facility && <FacilityImage facility={facility} sizes="128px" className="w-28 h-24 sm:w-32 shrink-0 rounded-xl" />}
                  <div className="min-w-0 flex-1 py-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ReportBadge status={r.status} />
                      <span className="text-[11px] font-semibold text-gray-400">{reportCode(r.id)}</span>
                    </div>
                    <h2 className="mt-1.5 text-base font-bold text-[#001741] leading-tight line-clamp-1">
                      {r.category} · {facility?.name ?? 'Fasilitas tidak tersedia'}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-1">{r.description}</p>
                    <p className="mt-1 text-[11px] text-gray-400">Dilaporkan {formatDateLong(toJakarta(r.createdAt).date)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 bg-white rounded-3xl border border-gray-100 shadow-sm px-6 py-16 text-center">
            <ClipboardList className="mx-auto w-10 h-10 text-[#0064D2]" aria-hidden />
            <h2 className="mt-4 text-xl font-bold text-[#001741]">
              {status ? `Tidak ada laporan berstatus ${REPORT_STATUS[status].label.toLowerCase()}` : 'Belum ada laporan'}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Temukan kerusakan di fasilitas kampus? Laporkan agar petugas dapat menanganinya.
            </p>
            <Link
              href="/laporan/baru"
              className="mt-6 inline-flex bg-[#0064D2] text-white hover:bg-[#0056b3] px-6 py-2.5 rounded-2xl text-sm font-bold transition"
            >
              Lapor kerusakan
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

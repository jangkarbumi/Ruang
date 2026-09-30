import type { Metadata } from 'next';
import PageBanner from '@/components/facility/PageBanner';
import StatusTabs from '@/components/user/StatusTabs';
import { OfficerNavbar } from '@/components/staff/nav';
import { EmptyState, ReportRow } from '@/components/staff/rows';
import { requireRole } from '@/server/session';
import { findFacility } from '@/server/services/facility-service';
import { findUser, listReports } from '@/server/services/staff-service';
import { REPORT_STATUS, type ReportStatus } from '@/lib/report';

export const metadata: Metadata = { title: 'Laporan | Petugas | Ruang' };

const STATUSES = Object.keys(REPORT_STATUS) as ReportStatus[];

export default async function OfficerReportsPage(props: PageProps<'/petugas/laporan'>) {
  const user = await requireRole('PETUGAS', '/petugas/laporan');
  const raw = (await props.searchParams).status;
  const status = STATUSES.find((s) => s === raw);

  const all = await listReports();
  const items = await listReports(status);
  const rows = await Promise.all(
    items.map(async (r) => ({ r, facility: await findFacility(r.facilityId), reporter: findUser(r.reporterId)?.name })),
  );
  const tabs = [
    { value: '', label: 'Semua', count: all.length },
    ...STATUSES.map((s) => ({ value: s, label: REPORT_STATUS[s].label, count: all.filter((r) => r.status === s).length })),
  ];

  return (
    <main className="flex-1 bg-[#f8f9fa]">
      <PageBanner navbar={<OfficerNavbar user={user} active="laporan" />}>
        <h1 className="text-[44px] font-bold tracking-tight">Laporan Kerusakan</h1>
        <p className="mt-2 max-w-xl text-white/70">Tangani laporan dari pengguna dan catat resolusinya.</p>
      </PageBanner>

      <div className="relative z-20 w-full max-w-300 mx-auto px-4 -mt-7 pb-20">
        <StatusTabs basePath="/petugas/laporan" tabs={tabs} active={status ?? ''} />
        <div className="mt-8">
          {rows.length ? (
            <ul className="space-y-3">
              {rows.map((row) => (
                <li key={row.r.id}>
                  <ReportRow {...row} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Tidak ada laporan pada status ini" />
          )}
        </div>
      </div>
    </main>
  );
}

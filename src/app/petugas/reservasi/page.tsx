import type { Metadata } from 'next';
import PageBanner from '@/components/facility/PageBanner';
import StatusTabs from '@/components/user/StatusTabs';
import { OfficerNavbar } from '@/components/staff/nav';
import { EmptyState, ReservationRow } from '@/components/staff/rows';
import { requireRole } from '@/server/session';
import { findFacility } from '@/server/services/facility-service';
import { conflictsFor, findUser, listReservations } from '@/server/services/staff-service';
import { RESERVATION_STATUS, type ReservationStatus } from '@/lib/reservation';

export const metadata: Metadata = { title: 'Reservasi | Petugas | Ruang' };

const STATUSES = Object.keys(RESERVATION_STATUS) as ReservationStatus[];

export default async function OfficerReservationsPage(props: PageProps<'/petugas/reservasi'>) {
  const user = await requireRole('PETUGAS', '/petugas/reservasi');
  const raw = (await props.searchParams).status;
  const status = STATUSES.find((s) => s === raw);

  const all = await listReservations();
  const items = await listReservations(status);
  const rows = await Promise.all(
    items.map(async (r) => {
      const c = r.status === 'PENDING' ? await conflictsFor(r) : null;
      return {
        r,
        facility: await findFacility(r.facilityId),
        requester: findUser(r.userId)?.name,
        conflict: !!c && (c.blocking.length > 0 || c.slotTaken),
      };
    }),
  );

  const tabs = [
    { value: '', label: 'Semua', count: all.length },
    ...STATUSES.map((s) => ({ value: s, label: RESERVATION_STATUS[s].label, count: all.filter((r) => r.status === s).length })),
  ];

  return (
    <main className="flex-1 bg-[#f8f9fa]">
      <PageBanner navbar={<OfficerNavbar user={user} active="reservasi" />}>
        <h1 className="text-[44px] font-bold tracking-tight">Reservasi</h1>
        <p className="mt-2 max-w-xl text-white/70">Tinjau, setujui, atau tolak pengajuan reservasi fasilitas.</p>
      </PageBanner>

      <div className="relative z-20 w-full max-w-300 mx-auto px-4 -mt-7 pb-20">
        <StatusTabs basePath="/petugas/reservasi" tabs={tabs} active={status ?? ''} />
        <div className="mt-8">
          {rows.length ? (
            <ul className="space-y-3">
              {rows.map((row) => (
                <li key={row.r.id}>
                  <ReservationRow {...row} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Tidak ada reservasi pada status ini" />
          )}
        </div>
      </div>
    </main>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PageBanner from '@/components/facility/PageBanner';
import { OfficerNavbar } from '@/components/staff/nav';
import { EmptyState, ReportRow, ReservationRow } from '@/components/staff/rows';
import { requireRole } from '@/server/session';
import { findFacility, listFacilities } from '@/server/services/facility-service';
import { conflictsFor, findUser, listReports, listReservations } from '@/server/services/staff-service';

export const metadata: Metadata = { title: 'Dashboard Petugas | Ruang' };

export default async function OfficerDashboardPage() {
  const user = await requireRole('PETUGAS', '/petugas');

  const [pending, baru, diproses, facilities] = await Promise.all([
    listReservations('PENDING'),
    listReports('BARU'),
    listReports('DIPROSES'),
    listFacilities(),
  ]);
  const inRepair = facilities.filter((f) => f.status === 'PERBAIKAN').length;

  const reservationRows = await Promise.all(
    pending.slice(0, 5).map(async (r) => {
      const c = await conflictsFor(r);
      return {
        r,
        facility: await findFacility(r.facilityId),
        requester: findUser(r.userId)?.name,
        conflict: c.blocking.length > 0 || c.slotTaken,
      };
    }),
  );
  const openReports = [...baru, ...diproses].slice(0, 5);
  const reportRows = await Promise.all(
    openReports.map(async (r) => ({ r, facility: await findFacility(r.facilityId), reporter: findUser(r.reporterId)?.name })),
  );

  const stats = [
    { label: 'Reservasi menunggu', value: pending.length, href: '/petugas/reservasi?status=PENDING' },
    { label: 'Laporan baru', value: baru.length, href: '/petugas/laporan?status=BARU' },
    { label: 'Laporan diproses', value: diproses.length, href: '/petugas/laporan?status=DIPROSES' },
    { label: 'Fasilitas dalam perbaikan', value: inRepair, href: '/petugas/fasilitas' },
  ];

  return (
    <main className="flex-1 bg-[#f8f9fa]">
      <PageBanner navbar={<OfficerNavbar user={user} active="dashboard" />}>
        <h1 className="text-[44px] font-bold tracking-tight">Dashboard Petugas</h1>
        <p className="mt-2 max-w-xl text-white/70">Antrian reservasi dan laporan kerusakan yang menunggu diproses.</p>
      </PageBanner>

      <div className="relative z-20 w-full max-w-300 mx-auto px-4 -mt-10 pb-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow p-5"
            >
              <p className="text-xs font-semibold text-gray-500">{s.label}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-[#001741]">{s.value}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="antrian-reservasi">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id="antrian-reservasi" className="text-xl font-bold tracking-tight text-[#001741]">
                Reservasi Menunggu
              </h2>
              <Link href="/petugas/reservasi?status=PENDING" className="text-sm font-semibold text-[#0064D2] flex items-center gap-1 hover:gap-1.5 transition-all">
                Lihat semua <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
            </div>
            {reservationRows.length ? (
              <ul className="space-y-3">
                {reservationRows.map((row) => (
                  <li key={row.r.id}>
                    <ReservationRow {...row} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Tidak ada reservasi menunggu">Semua pengajuan sudah diproses.</EmptyState>
            )}
          </section>

          <section aria-labelledby="antrian-laporan">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id="antrian-laporan" className="text-xl font-bold tracking-tight text-[#001741]">
                Laporan Belum Selesai
              </h2>
              <Link href="/petugas/laporan" className="text-sm font-semibold text-[#0064D2] flex items-center gap-1 hover:gap-1.5 transition-all">
                Lihat semua <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
            </div>
            {reportRows.length ? (
              <ul className="space-y-3">
                {reportRows.map((row) => (
                  <li key={row.r.id}>
                    <ReportRow {...row} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Tidak ada laporan terbuka">Semua laporan sudah ditutup.</EmptyState>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

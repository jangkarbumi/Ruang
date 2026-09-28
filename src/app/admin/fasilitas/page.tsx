import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Users } from 'lucide-react';
import PageBanner from '@/components/facility/PageBanner';
import FacilityImage from '@/components/facility/FacilityImage';
import PinIcon from '@/components/facility/PinIcon';
import { AdminNavbar } from '@/components/staff/nav';
import { EmptyState } from '@/components/staff/rows';
import StatusTabs from '@/components/user/StatusTabs';
import { requireRole } from '@/server/session';
import { listAllFacilities } from '@/server/services/facility-service';
import { FACILITY_STATUS, locationLabel, type FacilityStatus } from '@/lib/facility';

export const metadata: Metadata = { title: 'Kelola Fasilitas | Admin | Ruang' };

const STATUSES: FacilityStatus[] = ['AKTIF', 'PERBAIKAN', 'NONAKTIF'];

/** FR-16: daftar semua fasilitas, termasuk yang nonaktif. */
export default async function AdminFacilitiesPage(props: PageProps<'/admin/fasilitas'>) {
  const user = await requireRole('ADMIN', '/admin/fasilitas');
  const raw = (await props.searchParams).status;
  const status = STATUSES.find((s) => s === raw) ?? '';

  const all = await listAllFacilities();
  const items = status ? all.filter((f) => f.status === status) : all;

  const tabs = [
    { value: '', label: 'Semua', count: all.length },
    ...STATUSES.map((s) => ({ value: s, label: FACILITY_STATUS[s].label, count: all.filter((f) => f.status === s).length })),
  ];

  return (
    <main className="flex-1 bg-[#f8f9fa]">
      <PageBanner navbar={<AdminNavbar user={user} active="fasilitas" />}>
        <h1 className="text-[44px] font-bold tracking-tight">Kelola Fasilitas</h1>
        <p className="mt-2 max-w-xl text-white/70">
          Ubah data fasilitas, atau nonaktifkan fasilitas yang tidak lagi dapat dipinjam.
        </p>
      </PageBanner>

      <div className="relative z-20 w-full max-w-300 mx-auto px-4 -mt-7 pb-20">
        <StatusTabs basePath="/admin/fasilitas" tabs={tabs} active={status} />

        {items.length ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {items.map((f) => (
              <Link
                key={f.id}
                href={`/admin/fasilitas/${f.id}`}
                className="group flex gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-3 pr-5"
              >
                <FacilityImage
                  facility={f}
                  sizes="112px"
                  className={`w-24 h-24 shrink-0 rounded-xl ${f.status === 'NONAKTIF' ? 'grayscale opacity-70' : ''}`}
                />
                <div className="min-w-0 flex-1 py-1">
                  <span className={`w-fit rounded-full px-3 py-1 text-[11px] font-bold ${FACILITY_STATUS[f.status].className}`}>
                    {FACILITY_STATUS[f.status].label}
                  </span>
                  <h2 className="mt-1.5 text-sm font-bold text-[#001741] leading-tight line-clamp-1">{f.name}</h2>
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#0064D2]">
                    <PinIcon /> {locationLabel(f.location)}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                    <Users className="w-3.5 h-3.5" aria-hidden /> {f.type} · {f.capacity.toLocaleString('id-ID')} orang
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 self-center shrink-0 text-gray-300 group-hover:text-[#0064D2] transition" aria-hidden />
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState title="Tidak ada fasilitas dengan status ini" />
          </div>
        )}
      </div>
    </main>
  );
}

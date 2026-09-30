import type { Metadata } from 'next';
import PageBanner from '@/components/facility/PageBanner';
import FacilityImage from '@/components/facility/FacilityImage';
import PinIcon from '@/components/facility/PinIcon';
import { OfficerNavbar } from '@/components/staff/nav';
import StatusTabs from '@/components/user/StatusTabs';
import { requireRole } from '@/server/session';
import { listFacilities } from '@/server/services/facility-service';
import { setFacilityStatusAction } from '@/server/actions/staff-actions';
import { locationLabel } from '@/lib/facility';

export const metadata: Metadata = { title: 'Status Fasilitas | Petugas | Ruang' };

/** FR-12: tandai fasilitas dalam perbaikan / kembalikan ke aktif. */
export default async function OfficerFacilitiesPage(props: PageProps<'/petugas/fasilitas'>) {
  const user = await requireRole('PETUGAS', '/petugas/fasilitas');
  const raw = (await props.searchParams).status;
  const status = raw === 'AKTIF' || raw === 'PERBAIKAN' ? raw : '';

  const all = await listFacilities();
  const items = status ? all.filter((f) => f.status === status) : all;
  const back = status ? `/petugas/fasilitas?status=${status}` : '/petugas/fasilitas';

  const tabs = [
    { value: '', label: 'Semua', count: all.length },
    { value: 'AKTIF', label: 'Aktif', count: all.filter((f) => f.status === 'AKTIF').length },
    { value: 'PERBAIKAN', label: 'Dalam perbaikan', count: all.filter((f) => f.status === 'PERBAIKAN').length },
  ];

  return (
    <main className="flex-1 bg-[#f8f9fa]">
      <PageBanner navbar={<OfficerNavbar user={user} active="fasilitas" />}>
        <h1 className="text-[44px] font-bold tracking-tight">Status Fasilitas</h1>
        <p className="mt-2 max-w-xl text-white/70">
          Fasilitas yang ditandai dalam perbaikan tidak dapat direservasi sampai dikembalikan ke aktif.
        </p>
      </PageBanner>

      <div className="relative z-20 w-full max-w-300 mx-auto px-4 -mt-7 pb-20">
        <StatusTabs basePath="/petugas/fasilitas" tabs={tabs} active={status} />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map((f) => {
            const active = f.status === 'AKTIF';
            return (
              <div key={f.id} className="flex gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
                <FacilityImage facility={f} sizes="112px" className="w-24 h-24 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 py-1 flex flex-col">
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-[11px] font-bold ${
                      active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {active ? 'Aktif' : 'Dalam perbaikan'}
                  </span>
                  <h2 className="mt-1.5 text-sm font-bold text-[#001741] leading-tight line-clamp-1">{f.name}</h2>
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#0064D2]">
                    <PinIcon /> {locationLabel(f.location)}
                  </p>
                  <form action={setFacilityStatusAction} className="mt-auto pt-2">
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="back" value={back} />
                    <input type="hidden" name="status" value={active ? 'PERBAIKAN' : 'AKTIF'} />
                    <button
                      type="submit"
                      className={`text-xs font-bold transition hover:underline ${active ? 'text-amber-700' : 'text-emerald-700'}`}
                    >
                      {active ? 'Tandai dalam perbaikan' : 'Kembalikan ke aktif'}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

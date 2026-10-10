import type { Metadata } from 'next';
import PageBanner from '@/components/facility/PageBanner';
import FacilityImage from '@/components/facility/FacilityImage';
import PinIcon from '@/components/facility/PinIcon';
import { OfficerNavbar } from '@/components/staff/nav';
import StatusTabs from '@/components/user/StatusTabs';
import { Notice } from '@/components/user/form';
import FacilityMaintenanceManager from '@/components/staff/FacilityMaintenanceManager';
import { requireRole } from '@/server/session';
import { listFacilities } from '@/server/services/facility-service';
import { listActiveMaintenances } from '@/server/services/maintenance-service';
import { locationLabel } from '@/lib/facility';

export const metadata: Metadata = { title: 'Status Fasilitas | Petugas | Ruang' };

/** FR-12: tandai fasilitas dalam perbaikan / kelola jadwal pemeliharaan. */
export default async function OfficerFacilitiesPage(props: PageProps<'/petugas/fasilitas'>) {
  const user = await requireRole('PETUGAS', '/petugas/fasilitas');
  const sp = await props.searchParams;
  const raw = sp.status;
  const status = raw === 'AKTIF' || raw === 'PERBAIKAN' ? raw : '';

  const [all, maintenances] = await Promise.all([
    listFacilities(),
    listActiveMaintenances(),
  ]);

  const maintenanceByFacility = new Map(maintenances.map((m) => [m.facilityId, m]));
  const items = status ? all.filter((f) => f.status === status) : all;
  const back = status ? `/petugas/fasilitas?status=${status}` : '/petugas/fasilitas';

  const tabs = [
    { value: '', label: 'Semua', count: all.length },
    { value: 'AKTIF', label: 'Aktif', count: all.filter((f) => f.status === 'AKTIF').length },
    { value: 'PERBAIKAN', label: 'Dalam perbaikan', count: all.filter((f) => f.status === 'PERBAIKAN').length },
  ];

  const maintenanceSuccess = sp.maintenance === 'sukses';
  const maintenanceEnded = sp.maintenance === 'selesai';
  const batalCount = Number(sp.batal ?? 0);
  const tolakCount = Number(sp.tolak ?? 0);

  return (
    <main className="flex-1 bg-[#f8f9fa]">
      <PageBanner navbar={<OfficerNavbar user={user} active="fasilitas" />}>
        <h1 className="text-[44px] font-bold tracking-tight">Status Fasilitas & Pemeliharaan</h1>
        <p className="mt-2 max-w-xl text-white/70">
          Kelola jadwal perbaikan fasilitas. Reservasi yang telah disetujui pada masa perbaikan akan otomatis
          dibatalkan demi keamanan pemohon.
        </p>
      </PageBanner>

      <div className="relative z-20 w-full max-w-300 mx-auto px-4 -mt-7 pb-20">
        {maintenanceSuccess && (
          <div className="mb-6">
            <Notice tone="success">
              Jadwal perbaikan berhasil diterapkan.
              {batalCount > 0 && ` ${batalCount} reservasi disetujui dibatalkan otomatis.`}
              {tolakCount > 0 && ` ${tolakCount} pengajuan menunggu ditolak otomatis.`}
            </Notice>
          </div>
        )}

        {maintenanceEnded && (
          <div className="mb-6">
            <Notice tone="success">
              Masa perbaikan diselesaikan. Fasilitas kini telah kembali aktif untuk reservasi.
            </Notice>
          </div>
        )}

        <StatusTabs basePath="/petugas/fasilitas" tabs={tabs} active={status} />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map((f) => {
            const active = f.status === 'AKTIF';
            const m = maintenanceByFacility.get(f.id);

            return (
              <div key={f.id} className="flex gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <FacilityImage facility={f} sizes="112px" className="w-24 h-24 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 flex flex-col">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-fit rounded-full px-3 py-0.5 text-[11px] font-bold ${
                        active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {active ? 'Aktif' : 'Dalam perbaikan'}
                    </span>
                  </div>
                  <h2 className="mt-1 text-sm font-bold text-[#001741] leading-tight line-clamp-1">{f.name}</h2>
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#0064D2]">
                    <PinIcon /> {locationLabel(f.location)}
                  </p>

                  <FacilityMaintenanceManager
                    facility={f}
                    maintenance={m}
                    backUrl={back}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

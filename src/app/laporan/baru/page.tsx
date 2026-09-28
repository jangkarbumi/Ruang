import type { Metadata } from 'next';
import PageBanner from '@/components/facility/PageBanner';
import UserNavbar from '@/components/user/UserNavbar';
import ReportForm from '@/components/user/ReportForm';
import { requireUser } from '@/server/session';
import { listFacilities } from '@/server/services/facility-service';

export const metadata: Metadata = { title: 'Lapor Kerusakan | Ruang' };

export default async function NewReportPage(props: PageProps<'/laporan/baru'>) {
  const user = await requireUser('/laporan/baru');
  const sp = await props.searchParams;
  // Fasilitas dalam perbaikan tetap bisa dilaporkan (mis. kerusakan tambahan)
  const facilities = await listFacilities();
  const fid = typeof sp.fasilitas === 'string' && facilities.some((f) => String(f.id) === sp.fasilitas) ? sp.fasilitas : '';

  return (
    <main className="flex-1 bg-[#f8f9fa]">
      <PageBanner navbar={<UserNavbar user={user} active="laporan" />}>
        <h1 className="text-[44px] font-bold tracking-tight">Lapor Kerusakan</h1>
        <p className="mt-2 max-w-xl text-white/70">
          Laporkan masalah pada fasilitas kampus beserta kategori, deskripsi, dan foto agar petugas dapat segera
          menanganinya.
        </p>
      </PageBanner>

      <div className="relative z-20 w-full max-w-300 mx-auto px-4 -mt-10 pb-20">
        <ReportForm facilities={facilities.map((f) => ({ id: f.id, name: f.name }))} initialFacilityId={fid} />
      </div>
    </main>
  );
}

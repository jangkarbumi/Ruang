import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import PageBanner from '@/components/facility/PageBanner';
import FacilityImage from '@/components/facility/FacilityImage';
import PinIcon from '@/components/facility/PinIcon';
import FacilityActivePanel from '@/components/staff/FacilityActivePanel';
import FacilityForm from '@/components/staff/FacilityForm';
import { AdminNavbar } from '@/components/staff/nav';
import { Notice } from '@/components/user/form';
import { requireRole } from '@/server/session';
import { findFacility, listLocations, upcomingReservationCount } from '@/server/services/facility-service';
import { FACILITY_STATUS, locationLabel } from '@/lib/facility';

export const metadata: Metadata = { title: 'Ubah Fasilitas | Admin | Ruang' };

const FLASH = {
  disimpan: { tone: 'success', text: 'Perubahan disimpan dan langsung tampil di katalog fasilitas.' },
  nonaktif: { tone: 'info', text: 'Fasilitas dinonaktifkan. Fasilitas tidak lagi tampil di katalog dan tidak dapat direservasi.' },
  aktif: { tone: 'success', text: 'Fasilitas diaktifkan kembali dan dapat direservasi.' },
  gagal: { tone: 'error', text: 'Status fasilitas tidak dapat diubah. Muat ulang halaman lalu coba lagi.' },
} as const;

/** FR-16: ubah data dan status aktif satu fasilitas. */
export default async function AdminFacilityEditPage(props: PageProps<'/admin/fasilitas/[id]'>) {
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);
  const user = await requireRole('ADMIN', `/admin/fasilitas/${id}`);
  const facility = Number.isInteger(Number(id)) ? await findFacility(Number(id)) : null;
  if (!facility) notFound();

  const [locations, upcoming] = await Promise.all([listLocations(), upcomingReservationCount(facility.id)]);
  const flash = typeof sp.hasil === 'string' && sp.hasil in FLASH ? FLASH[sp.hasil as keyof typeof FLASH] : null;
  const inactive = facility.status === 'NONAKTIF';

  return (
    <main className="flex-1 bg-[#f8f9fa]">
      <PageBanner navbar={<AdminNavbar user={user} active="fasilitas" />}>
        <Link href="/admin/fasilitas" className="flex w-fit items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" aria-hidden /> Kembali ke daftar fasilitas
        </Link>
        <span className={`mt-6 inline-flex rounded-full px-4 py-1.5 text-xs font-bold ${FACILITY_STATUS[facility.status].className}`}>
          {FACILITY_STATUS[facility.status].label}
        </span>
        <h1 className="mt-3 text-[44px] font-bold tracking-tight leading-tight">{facility.name}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
          <PinIcon className="w-4 h-4" /> {locationLabel(facility.location)}
        </p>
      </PageBanner>

      <div className="relative z-20 w-full max-w-300 mx-auto px-4 -mt-7 pb-20">
        {flash && (
          <div className="mb-6">
            <Notice tone={flash.tone}>{flash.text}</Notice>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          {/* key: form kembali ke nilai tersimpan setelah berhasil disimpan */}
          <FacilityForm
            key={`${facility.name}|${facility.type}|${facility.location}|${facility.capacity}|${facility.description}`}
            facility={facility}
            locations={locations}
          />

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-3">
              <FacilityImage
                facility={facility}
                sizes="(min-width: 1024px) 380px, 100vw"
                className={`h-44 rounded-2xl ${inactive ? 'grayscale opacity-70' : ''}`}
              />
              {!inactive && (
                <Link
                  href={`/fasilitas/${facility.id}`}
                  className="mt-3 mb-1 flex items-center justify-center gap-1.5 text-sm font-bold text-[#0064D2] hover:underline"
                >
                  Lihat halaman publik <ExternalLink className="w-4 h-4" aria-hidden />
                </Link>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#001741]">Status fasilitas</h2>
              <p className="mt-1 mb-5 text-sm text-gray-500">
                {inactive
                  ? 'Fasilitas ini disembunyikan dari katalog. Riwayat reservasi dan laporannya tetap tersimpan.'
                  : 'Nonaktifkan bila fasilitas tidak lagi dapat dipinjam. Untuk perbaikan sementara, petugas cukup menandainya dalam perbaikan.'}
              </p>
              <FacilityActivePanel id={facility.id} inactive={inactive} upcoming={upcoming} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

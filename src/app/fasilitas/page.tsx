import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchX } from 'lucide-react';
import PageBanner from '@/components/facility/PageBanner';
import FacilityCard from '@/components/facility/FacilityCard';
import FacilityFilters from '@/components/facility/FacilityFilters';
import { listFacilities, listLocations } from '@/server/services/facility-service';
import { CAPACITY_OPTIONS, isFacilityType } from '@/lib/facility';

export const metadata: Metadata = { title: 'Daftar Fasilitas | Ruang' };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function FacilitiesPage(props: PageProps<'/fasilitas'>) {
  const sp = await props.searchParams;
  const locations = await listLocations();

  // Nilai URL yang tidak dikenal diabaikan, bukan menyebabkan error
  const q = one(sp.q).slice(0, 80);
  const tipe = isFacilityType(one(sp.tipe)) ? one(sp.tipe) : '';
  const lokasi = locations.includes(one(sp.lokasi)) ? one(sp.lokasi) : '';
  const kapasitas = CAPACITY_OPTIONS.some((o) => String(o.value) === one(sp.kapasitas)) ? Number(one(sp.kapasitas)) : 0;

  const results = await listFacilities({ q, type: tipe, location: lokasi, minCapacity: kapasitas });
  const filtered = Boolean(q || tipe || lokasi || kapasitas);

  return (
    <main className="flex-1 bg-[#f8f9fa]">
      <PageBanner>
        <h1 className="text-[44px] font-bold tracking-tight">Daftar Fasilitas</h1>
        <p className="mt-2 max-w-xl text-white/70">
          Telusuri gedung, aula, ruangan, dan lapangan di Universitas Diponegoro. Jadwal ketersediaan dapat
          dilihat tanpa login.
        </p>
      </PageBanner>

      <div className="relative z-20 w-full max-w-300 mx-auto px-4 -mt-10 pb-20">
        {/* key: form di-mount ulang saat URL berubah, agar defaultValue mengikuti filter aktif */}
        <FacilityFilters
          key={`${q}|${tipe}|${lokasi}|${kapasitas}`}
          locations={locations}
          values={{ q, tipe, lokasi, kapasitas }}
        />

        <div className="mt-10 mb-6 flex flex-wrap items-center justify-between gap-3" aria-live="polite">
          <p className="text-sm text-gray-500">
            Menampilkan <span className="font-bold text-[#001741]">{results.length}</span> fasilitas
          </p>
          {filtered && (
            <Link href="/fasilitas" className="text-sm font-semibold text-[#0064D2] hover:underline">
              Hapus filter
            </Link>
          )}
        </div>

        {results.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((f, i) => (
              <FacilityCard key={f.id} facility={f} priority={i < 3} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-6 py-16 text-center">
            <SearchX className="mx-auto w-10 h-10 text-[#0064D2]" aria-hidden />
            <h2 className="mt-4 text-xl font-bold text-[#001741]">Tidak ada fasilitas yang cocok</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Coba longgarkan filter, misalnya pilih semua lokasi atau kapasitas yang lebih kecil.
            </p>
            <Link
              href="/fasilitas"
              className="mt-6 inline-flex bg-[#0064D2] text-white hover:bg-[#0056b3] px-6 py-2.5 rounded-2xl text-sm font-bold transition"
            >
              Tampilkan semua fasilitas
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

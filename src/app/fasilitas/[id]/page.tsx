import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Wrench } from 'lucide-react';
import PageBanner from '@/components/facility/PageBanner';
import FacilityCard from '@/components/facility/FacilityCard';
import FacilityImage from '@/components/facility/FacilityImage';
import FacilityNavbar from '@/components/facility/FacilityNavbar';
import PinIcon from '@/components/facility/PinIcon';
import SlotPicker from '@/components/facility/SlotPicker';
import { getAvailability, getFacility, listFacilities } from '@/server/services/facility-service';
import { getCurrentUser } from '@/server/session';
import { UNIVERSITY_LOCATION, locationLabel } from '@/lib/facility';
import { BOOKING_WINDOW_DAYS, addDays, clampDate, nowInJakarta } from '@/lib/slots';

/**
 * Halaman publik — dapat diakses tanpa login (guest) maupun setelah login.
 * Status login dibaca dari sesi di sisi server.
 * Proteksi login HANYA pada aksi pengajuan reservasi (/reservasi/baru), bukan di sini.
 */
export const dynamic = 'force-dynamic';

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

async function load(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return null;
  return getFacility(id);
}

export async function generateMetadata(props: PageProps<'/fasilitas/[id]'>) {
  const facility = await load((await props.params).id);
  return { title: `${facility?.name ?? 'Fasilitas tidak ditemukan'} | Ruang` };
}

export default async function FacilityDetailPage(props: PageProps<'/fasilitas/[id]'>) {
  // Null = guest; SessionUser = sudah login. Tidak ada redirect di sini.
  const viewer = await getCurrentUser();

  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);
  const facility = await load(id);
  if (!facility) notFound();

  const now = nowInJakarta();
  const date = clampDate(Array.isArray(sp.tanggal) ? sp.tanggal[0] : sp.tanggal, now.date);
  const bookable = facility.status === 'AKTIF';
  const [slots, sameLocation] = await Promise.all([
    bookable ? getAvailability(facility, date, now) : Promise.resolve([]),
    listFacilities({ location: facility.location }),
  ]);
  const related = sameLocation.filter((f) => f.id !== facility.id).slice(0, 3);

  const facts = [
    ['Tipe', facility.type],
    ['Lokasi', locationLabel(facility.location)],
    ['Kapasitas', `${facility.capacity.toLocaleString('id-ID')} orang`],
    ['Status', bookable ? 'Aktif' : 'Dalam perbaikan'],
  ];

  return (
    <main className="flex-1 bg-[#f8f9fa]">
      {/* FacilityNavbar menampilkan Login+Register untuk guest, atau nama+Logout untuk yang sudah login */}
      <PageBanner navbar={<FacilityNavbar user={viewer} active="fasilitas" />}>
        <Link href="/fasilitas" className="flex w-fit items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" aria-hidden /> Kembali ke daftar fasilitas
        </Link>
        <span className="mt-6 inline-flex rounded-full bg-[#EBF3FF] px-4 py-1.5 text-xs font-bold text-[#0064D2]">
          {facility.type}
        </span>
        <h1 className="mt-3 text-[44px] font-bold tracking-tight leading-tight">{facility.name}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
          <PinIcon className="w-4 h-4" /> {locationLabel(facility.location)}
        </p>
      </PageBanner>

      <div className="relative z-20 w-full max-w-300 mx-auto px-4 pb-20">
        <FacilityImage
          facility={facility}
          priority
          sizes="(min-width: 1200px) 1168px, 100vw"
          className="-mt-8 h-64 md:h-96 rounded-3xl shadow-2xl"
        />

        <dl className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {facts.map(([k, v]) => (
            <div key={k} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <dt className="text-xs font-semibold text-gray-500">{k}</dt>
              <dd className={`mt-1 text-sm font-bold ${k === 'Status' && !bookable ? 'text-amber-700' : 'text-[#001741]'}`}>{v}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#001741]">Deskripsi</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            {facility.description ?? 'Deskripsi fasilitas ini belum tersedia.'}
          </p>
        </section>

        <section className="mt-12" aria-labelledby="jadwal">
          <h2 id="jadwal" className="text-2xl font-bold tracking-tight text-[#001741]">
            Ketersediaan Slot
          </h2>
          <p className="mt-1 mb-6 text-sm text-gray-500">
            Jam operasional 07.00–20.00 WIB, slot 30 menit. Jadwal dapat dilihat hingga {BOOKING_WINDOW_DAYS} hari ke depan.
          </p>

          {bookable ? (
            <SlotPicker
              key={date}
              facilityId={facility.id}
              date={date}
              today={now.date}
              lastDate={addDays(now.date, BOOKING_WINDOW_DAYS)}
              slots={slots}
              viewerRole={viewer?.role ?? null}
              initialStart={one(sp.mulai)}
              initialEnd={one(sp.selesai)}
            />
          ) : (
            <div role="status" className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 max-w-2xl">
              <Wrench className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" aria-hidden />
              <div>
                <p className="font-bold text-amber-800">Sedang dalam perbaikan</p>
                <p className="mt-1 text-sm text-amber-800">
                  Fasilitas ini tidak dapat direservasi sampai petugas mengembalikan statusnya menjadi aktif. Silakan
                  pilih fasilitas lain.
                </p>
              </div>
            </div>
          )}
        </section>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold tracking-tight text-[#001741]">
              {facility.location === UNIVERSITY_LOCATION
                ? 'Fasilitas tingkat universitas lainnya'
                : `Fasilitas lain di ${facility.location}`}
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((f) => (
                <FacilityCard key={f.id} facility={f} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

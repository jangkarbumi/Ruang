import type { Metadata } from 'next';
import PageBanner from '@/components/facility/PageBanner';
import UserNavbar from '@/components/user/UserNavbar';
import ReservationForm from '@/components/user/ReservationForm';
import { requireUser } from '@/server/session';
import { listFacilities } from '@/server/services/facility-service';
import { BOOKING_WINDOW_DAYS, addDays, clampDate, isValidRange, nowInJakarta } from '@/lib/slots';

export const metadata: Metadata = { title: 'Ajukan Reservasi | Ruang' };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function NewReservationPage(props: PageProps<'/reservasi/baru'>) {
  const user = await requireUser('/reservasi/baru');
  const sp = await props.searchParams;
  const now = nowInJakarta();

  // Hanya fasilitas aktif yang ditawarkan (BR-08, AC-07)
  const facilities = (await listFacilities()).filter((f) => f.status === 'AKTIF');

  // Isian awal dari halaman jadwal: ?fasilitas=&tanggal=&mulai=&selesai=
  const fid = one(sp.fasilitas);
  const start = one(sp.mulai);
  const end = one(sp.selesai);
  const validRange = /^\d\d:\d\d$/.test(start) && /^\d\d:\d\d$/.test(end) && isValidRange(start, end);

  return (
    <main className="flex-1 bg-[#f8f9fa]">
      <PageBanner navbar={<UserNavbar user={user} active="reservasi" />}>
        <h1 className="text-[44px] font-bold tracking-tight">Ajukan Reservasi</h1>
        <p className="mt-2 max-w-xl text-white/70">
          Pilih fasilitas, tanggal, dan rentang waktu, lalu jelaskan tujuan penggunaannya. Petugas fasilitas akan
          meninjau pengajuan Anda.
        </p>
      </PageBanner>

      <div className="relative z-20 w-full max-w-300 mx-auto px-4 -mt-10 pb-20">
        <ReservationForm
          facilities={facilities.map((f) => ({ id: f.id, name: f.name, location: f.location }))}
          today={now.date}
          lastDate={addDays(now.date, BOOKING_WINDOW_DAYS)}
          initial={{
            facilityId: facilities.some((f) => String(f.id) === fid) ? fid : '',
            date: sp.tanggal ? clampDate(one(sp.tanggal), now.date) : '',
            start: validRange ? start : '',
            end: validRange ? end : '',
            purpose: '',
          }}
        />
      </div>
    </main>
  );
}

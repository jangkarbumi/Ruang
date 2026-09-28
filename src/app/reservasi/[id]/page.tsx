import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import PageBanner from '@/components/facility/PageBanner';
import FacilityImage from '@/components/facility/FacilityImage';
import PinIcon from '@/components/facility/PinIcon';
import UserNavbar from '@/components/user/UserNavbar';
import CancelReservation from '@/components/user/CancelReservation';
import { Notice } from '@/components/user/form';
import { ReservationBadge } from '@/components/user/StatusBadge';
import { requireUser } from '@/server/session';
import { findFacility } from '@/server/services/facility-service';
import { cancelPolicy, getUserReservation } from '@/server/services/reservation-service';
import { locationLabel } from '@/lib/facility';
import { reservationCode } from '@/lib/reservation';
import { formatDateLong, formatTime, toJakarta } from '@/lib/slots';

const fmtDateTime = (d: Date) => {
  const j = toJakarta(d);
  return `${formatDateLong(j.date)}, ${formatTime(j.time)} WIB`;
};

export async function generateMetadata(props: PageProps<'/reservasi/[id]'>) {
  return { title: `${reservationCode(Number((await props.params).id) || 0)} | Ruang` };
}

export default async function ReservationDetailPage(props: PageProps<'/reservasi/[id]'>) {
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);
  const user = await requireUser(`/reservasi/${id}`);

  // Milik orang lain diperlakukan sama dengan tidak ada (AC-04)
  const reservation = Number.isInteger(Number(id)) ? await getUserReservation(user, Number(id)) : null;
  if (!reservation) notFound();

  const facility = await findFacility(reservation.facilityId);
  const start = toJakarta(reservation.startTime);
  const end = toJakarta(reservation.endTime);
  const policy = cancelPolicy(reservation);
  const flash = sp.status === 'terkirim' ? 'terkirim' : sp.status === 'dibatalkan' ? 'dibatalkan' : null;

  const facts = [
    ['Tanggal', formatDateLong(start.date)],
    ['Waktu', `${formatTime(start.time)}–${formatTime(end.time)} WIB`],
    ['Diajukan', fmtDateTime(reservation.createdAt)],
  ];

  return (
    <main className="flex-1 bg-[#f8f9fa]">
      <PageBanner navbar={<UserNavbar user={user} active="reservasi" />}>
        <Link href="/reservasi" className="flex w-fit items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" aria-hidden /> Kembali ke Reservasi Saya
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ReservationBadge status={reservation.status} />
          <span className="text-sm font-semibold text-white/60">{reservationCode(reservation.id)}</span>
        </div>
        <h1 className="mt-3 text-[44px] font-bold tracking-tight leading-tight">{facility?.name ?? 'Fasilitas'}</h1>
        {facility && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
            <PinIcon className="w-4 h-4" /> {locationLabel(facility.location)}
          </p>
        )}
      </PageBanner>

      <div className="relative z-20 w-full max-w-300 mx-auto px-4 -mt-8 pb-20 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          {flash === 'terkirim' && (
            <Notice tone="success">Pengajuan terkirim. Status akan berubah setelah ditinjau petugas fasilitas.</Notice>
          )}
          {flash === 'dibatalkan' && <Notice tone="info">Reservasi telah dibatalkan dan slotnya dilepas.</Notice>}

          <section className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6">
            <h2 className="text-lg font-bold text-[#001741]">Detail Reservasi</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              {facts.map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-[#f8f9fa] p-4">
                  <dt className="text-xs font-semibold text-gray-500">{k}</dt>
                  <dd className="mt-1 text-sm font-bold text-[#001741]">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5">
              <h3 className="text-xs font-semibold text-gray-500">Tujuan penggunaan</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#001741]">{reservation.purpose}</p>
            </div>
          </section>

          {reservation.status === 'CANCELLED' && reservation.cancellationReason && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="text-sm font-bold text-amber-800">Dibatalkan oleh petugas fasilitas</h2>
              <p className="mt-1 text-sm text-amber-800">{reservation.cancellationReason}</p>
            </section>
          )}
          {reservation.status === 'REJECTED' && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <h2 className="text-sm font-bold text-red-700">Pengajuan ditolak</h2>
              <p className="mt-1 text-sm text-red-700">
                Anda dapat mengajukan ulang pada jadwal lain atau menghubungi petugas fasilitas.
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {facility && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
              <FacilityImage facility={facility} sizes="400px" className="h-40" />
              <div className="p-5">
                <p className="text-xs text-gray-500">{facility.type}</p>
                <Link href={`/fasilitas/${facility.id}`} className="mt-1 block text-sm font-bold text-[#0064D2] hover:underline">
                  Lihat halaman fasilitas
                </Link>
              </div>
            </div>
          )}

          {(reservation.status === 'PENDING' || reservation.status === 'APPROVED') && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-5">
              {policy.allowed && policy.deadline ? (
                <CancelReservation id={reservation.id} deadlineLabel={fmtDateTime(policy.deadline)} />
              ) : (
                <p className="text-sm text-gray-500">{policy.reason}</p>
              )}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

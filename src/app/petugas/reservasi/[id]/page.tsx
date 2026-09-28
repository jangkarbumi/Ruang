import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import PageBanner from '@/components/facility/PageBanner';
import PinIcon from '@/components/facility/PinIcon';
import DecisionPanel from '@/components/staff/DecisionPanel';
import { OfficerNavbar } from '@/components/staff/nav';
import { Notice } from '@/components/user/form';
import { ReservationBadge } from '@/components/user/StatusBadge';
import { requireRole } from '@/server/session';
import { findFacility } from '@/server/services/facility-service';
import { conflictsFor, findUser, getReservation } from '@/server/services/staff-service';
import { locationLabel } from '@/lib/facility';
import { RESERVATION_STATUS, reservationCode } from '@/lib/reservation';
import { formatDateLong, formatTime, toJakarta } from '@/lib/slots';

const FLASH: Record<string, string> = {
  approve: 'Reservasi disetujui.',
  reject: 'Reservasi ditolak.',
  cancel: 'Reservasi dibatalkan dan alasannya tercatat.',
};

export async function generateMetadata(props: PageProps<'/petugas/reservasi/[id]'>) {
  return { title: `${reservationCode(Number((await props.params).id) || 0)} | Petugas | Ruang` };
}

export default async function OfficerReservationDetailPage(props: PageProps<'/petugas/reservasi/[id]'>) {
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);
  const user = await requireRole('PETUGAS', `/petugas/reservasi/${id}`);
  const r = Number.isInteger(Number(id)) ? await getReservation(Number(id)) : null;
  if (!r) notFound();

  const facility = await findFacility(r.facilityId);
  const requester = findUser(r.userId);
  const decidedBy = findUser(r.decidedById);
  const start = toJakarta(r.startTime);
  const end = toJakarta(r.endTime);
  const c = await conflictsFor(r);
  const facilityBlocked = facility && facility.status !== 'AKTIF';

  const blockedReason =
    r.status !== 'PENDING'
      ? null
      : facilityBlocked
        ? 'Fasilitas sedang dalam perbaikan. Pengajuan tidak dapat disetujui.'
        : c.blocking.length || c.slotTaken
          ? 'Jadwal ini bentrok dengan reservasi yang sudah disetujui. Pengajuan tidak dapat disetujui.'
          : null;

  const flash = typeof sp.hasil === 'string' ? FLASH[sp.hasil] : undefined;

  const facts = [
    ['Pemohon', requester ? `${requester.name}` : '-'],
    ['Email', requester?.email ?? '-'],
    ['Tanggal', formatDateLong(start.date)],
    ['Waktu', `${formatTime(start.time)}–${formatTime(end.time)} WIB`],
  ];

  return (
    <main className="flex-1 bg-[#f8f9fa]">
      <PageBanner navbar={<OfficerNavbar user={user} active="reservasi" />}>
        <Link href="/petugas/reservasi" className="flex w-fit items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" aria-hidden /> Kembali ke daftar reservasi
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ReservationBadge status={r.status} />
          <span className="text-sm font-semibold text-white/60">{reservationCode(r.id)}</span>
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
          {flash && <Notice tone="success">{flash}</Notice>}

          <section className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6">
            <h2 className="text-lg font-bold text-[#001741]">Detail Pengajuan</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {facts.map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-[#f8f9fa] p-4">
                  <dt className="text-xs font-semibold text-gray-500">{k}</dt>
                  <dd className="mt-1 text-sm font-bold text-[#001741] break-words">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5">
              <h3 className="text-xs font-semibold text-gray-500">Tujuan penggunaan</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#001741]">{r.purpose}</p>
            </div>
            {decidedBy && r.status !== 'PENDING' && (
              <p className="mt-5 text-xs text-gray-500">Diproses oleh {decidedBy.name}</p>
            )}
            {r.status === 'REJECTED' && r.rejectionReason && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                <h3 className="text-sm font-bold text-red-700">Alasan penolakan</h3>
                <p className="mt-1 text-sm text-red-700">{r.rejectionReason}</p>
              </div>
            )}
            {r.status === 'CANCELLED' && r.cancellationReason && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-sm font-bold text-amber-800">Alasan pembatalan</h3>
                <p className="mt-1 text-sm text-amber-800">{r.cancellationReason}</p>
              </div>
            )}
          </section>

          {/* Pengecekan jadwal (FR-09) — hanya relevan saat masih menunggu */}
          {r.status === 'PENDING' && (
            <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#001741]">Pengecekan Jadwal</h2>
              {c.blocking.length === 0 && !c.slotTaken && c.competing.length === 0 ? (
                <p className="mt-2 text-sm text-emerald-700 font-semibold">Tidak ada jadwal lain yang bertabrakan.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {c.blocking.map((x) => (
                    <li key={x.id} className="flex items-start gap-2 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                      <span>
                        Bentrok dengan{' '}
                        <Link href={`/petugas/reservasi/${x.id}`} className="font-bold underline">
                          {reservationCode(x.id)}
                        </Link>{' '}
                        ({RESERVATION_STATUS[x.status].label}, {formatTime(toJakarta(x.startTime).time)}–{formatTime(toJakarta(x.endTime).time)})
                      </span>
                    </li>
                  ))}
                  {c.slotTaken && (
                    <li className="flex items-start gap-2 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                      Sebagian slot pada rentang ini sudah terisi di jadwal fasilitas.
                    </li>
                  )}
                  {c.competing.map((x) => (
                    <li key={x.id} className="flex items-start gap-2 rounded-2xl bg-[#EBF3FF] p-3 text-sm text-[#0064D2]">
                      <span>
                        Pengajuan lain di jam yang sama:{' '}
                        <Link href={`/petugas/reservasi/${x.id}`} className="font-bold underline">
                          {reservationCode(x.id)}
                        </Link>{' '}
                        oleh {findUser(x.userId)?.name ?? 'pengguna'} ({formatTime(toJakarta(x.startTime).time)}–
                        {formatTime(toJakarta(x.endTime).time)})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6">
            <h2 className="mb-4 text-xs font-semibold text-gray-500">Keputusan</h2>
            <DecisionPanel id={r.id} status={r.status} blockedReason={blockedReason} competingCount={c.competing.length} />
          </div>
        </aside>
      </div>
    </main>
  );
}

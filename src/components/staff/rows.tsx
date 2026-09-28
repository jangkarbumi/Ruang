import Link from 'next/link';
import { AlertTriangle, Clock, User } from 'lucide-react';
import FacilityImage from '@/components/facility/FacilityImage';
import { ReportBadge, ReservationBadge } from '@/components/user/StatusBadge';
import type { Facility } from '@/lib/facility';
import { reservationCode, type Reservation } from '@/lib/reservation';
import { reportCode, type Report } from '@/lib/report';
import { formatDateLong, formatTime, toJakarta } from '@/lib/slots';

const card =
  'flex gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-3 pr-5';

/** Baris reservasi untuk petugas — pola sama dengan Reservasi Saya, ditambah nama pemohon & tanda bentrok. */
export function ReservationRow({
  r,
  facility,
  requester,
  conflict,
}: {
  r: Reservation;
  facility: Facility | null;
  requester?: string;
  conflict?: boolean;
}) {
  const start = toJakarta(r.startTime);
  const end = toJakarta(r.endTime);
  return (
    <Link href={`/petugas/reservasi/${r.id}`} className={card}>
      {facility && <FacilityImage facility={facility} sizes="128px" className="w-24 h-20 sm:w-28 sm:h-24 shrink-0 rounded-xl" />}
      <div className="min-w-0 flex-1 py-1">
        <div className="flex flex-wrap items-center gap-2">
          <ReservationBadge status={r.status} />
          {conflict && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold text-red-700">
              <AlertTriangle className="w-3 h-3" aria-hidden /> Bentrok
            </span>
          )}
          <span className="text-[11px] font-semibold text-gray-400">{reservationCode(r.id)}</span>
        </div>
        <h3 className="mt-1.5 text-base font-bold text-[#001741] leading-tight line-clamp-1">{facility?.name ?? 'Fasilitas'}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" aria-hidden />
            {formatDateLong(start.date)}, {formatTime(start.time)}–{formatTime(end.time)}
          </span>
          {requester && (
            <span className="inline-flex items-center gap-1">
              <User className="w-3.5 h-3.5" aria-hidden />
              {requester}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}

export function ReportRow({ r, facility, reporter }: { r: Report; facility: Facility | null; reporter?: string }) {
  return (
    <Link href={`/petugas/laporan/${r.id}`} className={card}>
      {facility && <FacilityImage facility={facility} sizes="128px" className="w-24 h-20 sm:w-28 sm:h-24 shrink-0 rounded-xl" />}
      <div className="min-w-0 flex-1 py-1">
        <div className="flex flex-wrap items-center gap-2">
          <ReportBadge status={r.status} />
          <span className="text-[11px] font-semibold text-gray-400">{reportCode(r.id)}</span>
        </div>
        <h3 className="mt-1.5 text-base font-bold text-[#001741] leading-tight line-clamp-1">
          {r.category} · {facility?.name ?? 'Fasilitas'}
        </h3>
        <p className="mt-1 text-xs text-gray-500 line-clamp-1">{r.description}</p>
        <p className="mt-1 text-[11px] text-gray-400">
          {reporter ? `${reporter} · ` : ''}
          {formatDateLong(toJakarta(r.createdAt).date)}
        </p>
      </div>
    </Link>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-6 py-12 text-center">
      <h3 className="text-lg font-bold text-[#001741]">{title}</h3>
      {children && <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{children}</p>}
    </div>
  );
}

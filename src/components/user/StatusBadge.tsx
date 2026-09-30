import { RESERVATION_STATUS, type ReservationStatus } from '@/lib/reservation';
import { REPORT_STATUS, type ReportStatus } from '@/lib/report';

export function ReservationBadge({ status }: { status: ReservationStatus }) {
  const s = RESERVATION_STATUS[status];
  return <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${s.className}`}>{s.label}</span>;
}

export function ReportBadge({ status }: { status: ReportStatus }) {
  const s = REPORT_STATUS[status];
  return <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${s.className}`}>{s.label}</span>;
}

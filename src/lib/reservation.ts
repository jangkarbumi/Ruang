/**
 * Tipe & aturan reservasi. Bentuknya mengikuti model `Reservation` di prisma/schema.prisma.
 */

export type ReservationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Reservation {
  id: number;
  userId: number;
  facilityId: number;
  startTime: Date;
  endTime: Date;
  purpose: string;
  status: ReservationStatus;
  cancellationReason: string | null;
  /** Alasan penolakan wajib diisi petugas saat menolak pengajuan. */
  rejectionReason: string | null;
  decidedById: number | null;
  createdAt: Date;
}

export const REJECTION_REASON_MIN = 10;

export const RESERVATION_STATUS: Record<ReservationStatus, { label: string; className: string }> = {
  PENDING: { label: 'Menunggu', className: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Disetujui', className: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Ditolak', className: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Dibatalkan', className: 'bg-gray-100 text-gray-600' },
};

/**
 * BR-06: batas pembatalan oleh pengguna. SRS belum menetapkan angkanya —
 * ASUMSI 24 jam sebelum waktu mulai. Ubah di sini bila tim menetapkan lain.
 */
export const CANCEL_DEADLINE_HOURS = 24;

export const PURPOSE_MIN = 10;
export const PURPOSE_MAX = 500;

export const reservationCode = (id: number) => `RSV-${String(id).padStart(4, '0')}`;

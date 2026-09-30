/**
 * Tipe & aturan laporan kerusakan. Bentuknya mengikuti model `Report` di prisma/schema.prisma.
 */

export type ReportStatus = 'BARU' | 'DIPROSES' | 'SELESAI' | 'DITOLAK';

export interface Report {
  id: number;
  reporterId: number;
  facilityId: number;
  category: string;
  description: string;
  /** Sementara berupa data URL; nanti diganti URL file di penyimpanan. */
  photo: string | null;
  status: ReportStatus;
  resolutionNote: string | null;
  handledById: number | null;
  createdAt: Date;
}

export const REPORT_STATUS: Record<ReportStatus, { label: string; className: string }> = {
  BARU: { label: 'Baru', className: 'bg-[#EBF3FF] text-[#0064D2]' },
  DIPROSES: { label: 'Diproses', className: 'bg-amber-100 text-amber-700' },
  SELESAI: { label: 'Selesai', className: 'bg-emerald-100 text-emerald-700' },
  DITOLAK: { label: 'Ditolak', className: 'bg-red-100 text-red-700' },
};

export const REPORT_CATEGORIES = [
  'Kelistrikan',
  'Pendingin ruangan (AC)',
  'Audio & proyektor',
  'Jaringan & internet',
  'Furnitur',
  'Bangunan (atap, dinding, pintu, jendela)',
  'Kebersihan & sanitasi',
  'Lainnya',
] as const;

export const DESCRIPTION_MIN = 20;
export const DESCRIPTION_MAX = 1000;
/** Batas panjang data URL foto (setelah diperkecil di browser), di bawah batas 1 MB Server Action. */
export const PHOTO_MAX_CHARS = 900_000;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const reportCode = (id: number) => `LPR-${String(id).padStart(4, '0')}`;

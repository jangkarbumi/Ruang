import { hashPassword } from '@/server/auth/password';
import type { Account } from '@/lib/account';
import type { Facility, FacilityStatus } from '@/lib/facility';
import type { Reservation } from '@/lib/reservation';
import type { Report } from '@/lib/report';
import { addDays, fromJakarta, nowInJakarta, toJakarta, toMinutes } from '@/lib/slots';

/**
 * PENYIMPANAN SEMENTARA di memori server — pengganti tabel Reservation & Report
 * sampai Prisma tersambung. Data hilang saat server di-restart.
 * Disimpan di globalThis agar tidak ter-reset setiap hot reload di mode dev.
 */

interface Store {
  /** Hash password per id akun — dipisah dari data akun agar tidak ikut terkirim ke tampilan. */
  reports: Report[];
  /** Status fasilitas yang diubah petugas (FR-12), menimpa nilai di data fasilitas. */
  /** Perubahan data fasilitas oleh admin (FR-16), menimpa nilai di data fasilitas. */
  nextReportId: number;
}

// Kunci v3: bentuk store bertambah (passwords) — store lama di memori diabaikan
const g = globalThis as unknown as { __ruangStoreV3?: Store };

export type FacilityEdit = Partial<Pick<Facility, 'name' | 'type' | 'location' | 'capacity' | 'description'>>;

export function store(): Store {
  const s = (g.__ruangStoreV3 ??= seed());
  // Store yang sudah ada di memori sebelum FR-16 dibuat belum punya kolom ini
  return s;
}

/** Rentang waktu (menit WIB) reservasi APPROVED pada fasilitas & tanggal tertentu. */

/* ------------------------------------------------------------------ */
/* Data contoh — relatif terhadap hari ini                             */
/* ------------------------------------------------------------------ */

export const DEMO_USER_ID = 101;
const OTHER_USER_ID = 202;
const THIRD_USER_ID = 203;
export const DEMO_OFFICER_ID = 301;
export const DEMO_ADMIN_ID = 401;
const OFFICER_ID = DEMO_OFFICER_ID;

function seed(): Store {
  const today = nowInJakarta().date;
  const at = (days: number, time: string) => fromJakarta(addDays(today, days), time);

  let rid = 0;
  const rsv = (
    userId: number,
    facilityId: number,
    day: number,
    start: string,
    end: string,
    purpose: string,
    status: Reservation['status'],
    cancellationReason: string | null = null,
    rejectionReason: string | null = null,
  ): Reservation => ({
    id: ++rid,
    userId,
    facilityId,
    startTime: at(day, start),
    endTime: at(day, end),
    purpose,
    status,
    cancellationReason,
    rejectionReason,
    decidedById: status === 'PENDING' ? null : OFFICER_ID,
    createdAt: at(Math.min(day, 0) - 3, '10:15'),
  });


  let pid = 0;
  const rep = (
    facilityId: number,
    daysAgo: number,
    category: string,
    description: string,
    status: Report['status'],
    resolutionNote: string | null = null,
  ): Report => ({
    id: ++pid,
    reporterId: DEMO_USER_ID,
    facilityId,
    category,
    description,
    photo: null,
    status,
    resolutionNote,
    handledById: status === 'BARU' ? null : OFFICER_ID,
    createdAt: at(-daysAgo, '09:30'),
  });

  const reports = [
    rep(8, 1, 'Kelistrikan', 'Dua lampu di lorong lantai 2 mati sehingga lorong gelap saat sore hari.', 'BARU'),
    rep(26, 4, 'Kebersihan & sanitasi', 'Ada genangan air dan sampah di sisi tribun setelah hujan deras.', 'DIPROSES'),
    rep(
      19,
      12,
      'Pendingin ruangan (AC)',
      'AC di sisi kanan ruangan meneteskan air ke kursi peserta.',
      'SELESAI',
      'Saluran pembuangan AC sudah dibersihkan dan diuji ulang oleh teknisi.',
    ),
    rep(
      4,
      20,
      'Jaringan & internet',
      'Wi-Fi di ruang seminar lantai 3 tidak bisa tersambung sama sekali.',
      'DITOLAK',
      'Laporan yang sama sudah diterima sebelumnya dan sedang ditangani bagian jaringan.',
    ),
  ];

  reports.push({
    id: ++pid,
    reporterId: OTHER_USER_ID,
    facilityId: 14,
    category: 'Audio & proyektor',
    description: 'Proyektor di ruang seminar lantai 1 menampilkan warna kehijauan dan berkedip.',
    photo: null,
    status: 'BARU',
    resolutionNote: null,
    handledById: null,
    createdAt: at(0, '08:10'),
  });

  // Nama & email contoh (fiktif)

  return {
    reports,
    // Semua akun contoh memakai password "password123"
    nextReportId: pid + 1,
  };
}

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
  users: Account[];
  /** Hash password per id akun — dipisah dari data akun agar tidak ikut terkirim ke tampilan. */
  passwords: Record<number, string>;
  reservations: Reservation[];
  reports: Report[];
  /** Status fasilitas yang diubah petugas (FR-12), menimpa nilai di data fasilitas. */
  facilityStatus: Record<number, FacilityStatus>;
  /** Perubahan data fasilitas oleh admin (FR-16), menimpa nilai di data fasilitas. */
  facilityEdits: Record<number, FacilityEdit>;
  nextUserId: number;
  nextReservationId: number;
  nextReportId: number;
}

// Kunci v3: bentuk store bertambah (passwords) — store lama di memori diabaikan
const g = globalThis as unknown as { __ruangStoreV3?: Store };

export type FacilityEdit = Partial<Pick<Facility, 'name' | 'type' | 'location' | 'capacity' | 'description'>>;

export function store(): Store {
  const s = (g.__ruangStoreV3 ??= seed());
  // Store yang sudah ada di memori sebelum FR-16 dibuat belum punya kolom ini
  s.facilityEdits ??= {};
  return s;
}

/** Rentang waktu (menit WIB) reservasi APPROVED pada fasilitas & tanggal tertentu. */
export function approvedIntervals(facilityId: number, date: string) {
  return store()
    .reservations.filter((r) => r.facilityId === facilityId && r.status === 'APPROVED')
    .map((r) => ({ start: toJakarta(r.startTime), end: toJakarta(r.endTime) }))
    .filter((r) => r.start.date === date)
    .map((r) => ({ from: toMinutes(r.start.time), to: toMinutes(r.end.time) }));
}

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

  const reservations = [
    rsv(DEMO_USER_ID, 3, 5, '09:00', '11:00', 'Seminar himpunan mahasiswa tentang karier di bidang teknologi.', 'PENDING'),
    rsv(DEMO_USER_ID, 12, 2, '13:00', '16:00', 'Gladi resik pentas seni tari tradisional mahasiswa FIB.', 'APPROVED'),
    rsv(
      DEMO_USER_ID,
      28,
      7,
      '08:00',
      '12:00',
      'Workshop penulisan karya ilmiah untuk mahasiswa baru.',
      'CANCELLED',
      'Auditorium dipakai untuk agenda pimpinan fakultas yang tidak dapat dijadwalkan ulang.',
    ),
    rsv(DEMO_USER_ID, 1, 10, '07:00', '09:00', 'Latihan paduan suara untuk wisuda.', 'REJECTED'),
    rsv(DEMO_USER_ID, 19, -10, '10:00', '12:00', 'Diskusi publik kelompok studi hukum.', 'APPROVED'),
    // Milik pengguna lain — untuk menguji bentrok jadwal & AC-04
    rsv(OTHER_USER_ID, 3, 5, '13:00', '15:00', 'Rapat koordinasi panitia.', 'APPROVED'),
    // Antrian petugas: dua pengajuan tumpang tindih (09.00–11.00 milik demo di atas vs 10.00–12.00)
    rsv(THIRD_USER_ID, 3, 5, '10:00', '12:00', 'Pelatihan kepemimpinan organisasi mahasiswa.', 'PENDING'),
    // Bentrok dengan reservasi yang sudah disetujui 13.00–16.00 → tidak boleh disetujui (AC-03)
    rsv(OTHER_USER_ID, 12, 2, '14:00', '15:00', 'Latihan teater untuk festival budaya.', 'PENDING'),
    rsv(THIRD_USER_ID, 2, 4, '08:00', '12:00', 'Seminar nasional kewirausahaan mahasiswa.', 'PENDING'),
  ];

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

  const user = (id: number, name: string, email: string, role: Account['role'], accountStatus: Account['accountStatus'], daysAgo: number): Account => ({
    id,
    name,
    email,
    role,
    accountStatus,
    createdAt: at(-daysAgo, '09:00'),
  });
  // Nama & email contoh (fiktif)
  const users = [
    user(DEMO_USER_ID, 'Pengguna Demo', 'pengguna@students.undip.ac.id', 'PENGGUNA', 'ACTIVE', 60),
    user(OTHER_USER_ID, 'Rina Maharani', 'rina.maharani@students.undip.ac.id', 'PENGGUNA', 'ACTIVE', 45),
    user(THIRD_USER_ID, 'Dimas Saputra', 'dimas.saputra@students.undip.ac.id', 'PENGGUNA', 'ACTIVE', 30),
    user(DEMO_OFFICER_ID, 'Sri Wahyuni', 'sri.wahyuni@undip.ac.id', 'PETUGAS', 'ACTIVE', 120),
    // Email sama dengan petunjuk "Demo login" di halaman login
    user(DEMO_ADMIN_ID, 'Admin Fasilitas', 'admin@campus.edu', 'ADMIN', 'ACTIVE', 200),
    // Registrasi mandiri yang menunggu verifikasi admin (FR-15)
    user(501, 'Bagas Pratama', 'bagas.pratama@students.undip.ac.id', 'PENGGUNA', 'PENDING', 1),
    user(502, 'Dewi Lestari', 'dewi.lestari@lecturer.undip.ac.id', 'PENGGUNA', 'PENDING', 2),
  ];

  return {
    users,
    reservations,
    reports,
    // Semua akun contoh memakai password "password123"
    passwords: Object.fromEntries(users.map((u) => [u.id, hashPassword('password123')])),
    facilityStatus: {},
    facilityEdits: {},
    nextUserId: 600,
    nextReservationId: rid + 1,
    nextReportId: pid + 1,
  };
}

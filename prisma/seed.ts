import 'dotenv/config';
import { PrismaClient, Role, AccountStatus, FacilityStatus, ReportStatus } from '@prisma/client';
import { hashPassword } from '../src/server/auth/password';
import { FACILITIES } from './seed-data';

const prisma = new PrismaClient();

const DEMO_USER_ID = 101;
const OTHER_USER_ID = 202;
const THIRD_USER_ID = 203;
const DEMO_OFFICER_ID = 301;
const DEMO_ADMIN_ID = 401;

async function main() {
  console.log('Seeding facilities...');
  for (const f of FACILITIES) {
    await prisma.facility.upsert({
      where: { id: f.id },
      update: {
        name: f.name,
        type: f.type,
        location: f.location,
        capacity: f.capacity,
        description: f.description,
        status: f.status as FacilityStatus,
        imageUrl: f.imageUrl || null,
      },
      create: {
        id: f.id,
        name: f.name,
        type: f.type,
        location: f.location,
        capacity: f.capacity,
        description: f.description,
        status: f.status as FacilityStatus,
        imageUrl: f.imageUrl || null,
      },
    });
  }
  console.log(`Seeded ${FACILITIES.length} facilities.`);

  console.log('Seeding users...');
  const users: Array<{ id: number; name: string; email: string; role: Role; accountStatus: AccountStatus }> = [
    { id: DEMO_USER_ID, name: 'Pengguna Demo', email: 'pengguna@students.undip.ac.id', role: 'PENGGUNA', accountStatus: 'ACTIVE' },
    { id: OTHER_USER_ID, name: 'Rina Maharani', email: 'rina.maharani@students.undip.ac.id', role: 'PENGGUNA', accountStatus: 'ACTIVE' },
    { id: THIRD_USER_ID, name: 'Dimas Saputra', email: 'dimas.saputra@students.undip.ac.id', role: 'PENGGUNA', accountStatus: 'ACTIVE' },
    { id: DEMO_OFFICER_ID, name: 'Sri Wahyuni', email: 'sri.wahyuni@undip.ac.id', role: 'PETUGAS', accountStatus: 'ACTIVE' },
    { id: DEMO_ADMIN_ID, name: 'Admin Fasilitas', email: 'admin@campus.edu', role: 'ADMIN', accountStatus: 'ACTIVE' },
    { id: 501, name: 'Bagas Pratama', email: 'bagas.pratama@students.undip.ac.id', role: 'PENGGUNA', accountStatus: 'PENDING' },
    { id: 502, name: 'Dewi Lestari', email: 'dewi.lestari@lecturer.undip.ac.id', role: 'PENGGUNA', accountStatus: 'PENDING' },
  ];

  const defaultPassword = hashPassword('password123');

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        name: u.name,
        email: u.email,
        role: u.role,
        accountStatus: u.accountStatus,
      },
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        accountStatus: u.accountStatus,
        password: defaultPassword,
      },
    });
  }
  console.log(`Seeded ${users.length} users.`);

  console.log('Seeding demo reports...');
  const demoReports = [
    {
      id: 1,
      reporterId: DEMO_USER_ID,
      facilityId: 8,
      category: 'Kelistrikan',
      description: 'Dua lampu di lorong lantai 2 mati sehingga lorong gelap saat sore hari.',
      photo: null,
      status: 'BARU' as ReportStatus,
      resolutionNote: null,
      handledById: null,
    },
    {
      id: 2,
      reporterId: DEMO_USER_ID,
      facilityId: 26,
      category: 'Kebersihan & sanitasi',
      description: 'Ada genangan air dan sampah di sisi tribun setelah hujan deras.',
      photo: null,
      status: 'DIPROSES' as ReportStatus,
      resolutionNote: null,
      handledById: DEMO_OFFICER_ID,
    },
    {
      id: 3,
      reporterId: DEMO_USER_ID,
      facilityId: 19,
      category: 'Pendingin ruangan (AC)',
      description: 'AC di sisi kanan ruangan meneteskan air ke kursi peserta.',
      photo: null,
      status: 'SELESAI' as ReportStatus,
      resolutionNote: 'Saluran pembuangan AC sudah dibersihkan dan diuji ulang oleh teknisi.',
      handledById: DEMO_OFFICER_ID,
    },
    {
      id: 4,
      reporterId: DEMO_USER_ID,
      facilityId: 4,
      category: 'Jaringan & internet',
      description: 'Wi-Fi di ruang seminar lantai 3 tidak bisa tersambung sama sekali.',
      photo: null,
      status: 'DITOLAK' as ReportStatus,
      resolutionNote: 'Laporan yang sama sudah diterima sebelumnya dan sedang ditangani bagian jaringan.',
      handledById: DEMO_OFFICER_ID,
    },
    {
      id: 5,
      reporterId: OTHER_USER_ID,
      facilityId: 14,
      category: 'Audio & proyektor',
      description: 'Proyektor di ruang seminar lantai 1 menampilkan warna kehijauan dan berkedip.',
      photo: null,
      status: 'BARU' as ReportStatus,
      resolutionNote: null,
      handledById: null,
    },
  ];

  for (const rep of demoReports) {
    await prisma.report.upsert({
      where: { id: rep.id },
      update: {},
      create: rep,
    });
  }
  console.log(`Seeded ${demoReports.length} demo reports.`);

  // Reset database sequences so future autoincrements work properly
  try {
    await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Facility"', 'id'), COALESCE((SELECT MAX(id) FROM "Facility"), 1))`;
    await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE((SELECT MAX(id) FROM "User"), 1))`;
    await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Report"', 'id'), COALESCE((SELECT MAX(id) FROM "Report"), 1))`;
  } catch {
    // Sequence reset is optional if driver does not support it in current mode
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

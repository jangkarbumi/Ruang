import { PrismaClient, Role, AccountStatus } from '@prisma/client';
import { hashPassword } from '../src/server/auth/password';
import { FACILITIES } from '../src/server/data/facilities';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const password = hashPassword('password123');

  // Insert Facilities
  for (const f of FACILITIES) {
    await prisma.facility.upsert({
      where: { id: f.id },
      update: {},
      create: {
        id: f.id,
        name: f.name,
        type: f.type,
        location: f.location,
        capacity: f.capacity,
        description: f.description,
        status: f.status,
        imageUrl: f.imageUrl,
      }
    });
  }

  // Insert Users
  const users: Array<{ id: number; name: string; email: string; role: Role; accountStatus: AccountStatus }> = [
    { id: 101, name: 'Pengguna Demo', email: 'pengguna@students.undip.ac.id', role: 'PENGGUNA', accountStatus: 'ACTIVE' },
    { id: 202, name: 'Rina Maharani', email: 'rina.maharani@students.undip.ac.id', role: 'PENGGUNA', accountStatus: 'ACTIVE' },
    { id: 203, name: 'Dimas Saputra', email: 'dimas.saputra@students.undip.ac.id', role: 'PENGGUNA', accountStatus: 'ACTIVE' },
    { id: 301, name: 'Sri Wahyuni', email: 'sri.wahyuni@undip.ac.id', role: 'PETUGAS', accountStatus: 'ACTIVE' },
    { id: 401, name: 'Admin Fasilitas', email: 'admin@campus.edu', role: 'ADMIN', accountStatus: 'ACTIVE' },
    { id: 501, name: 'Bagas Pratama', email: 'bagas.pratama@students.undip.ac.id', role: 'PENGGUNA', accountStatus: 'PENDING' },
    { id: 502, name: 'Dewi Lestari', email: 'dewi.lestari@lecturer.undip.ac.id', role: 'PENGGUNA', accountStatus: 'PENDING' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        password: password,
        accountStatus: u.accountStatus,
      }
    });
  }

  console.log('Seeding completed!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

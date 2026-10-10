import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { FACILITIES } from './seed-data';
import { hashPassword } from '../src/server/auth/password';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEMO_USER_ID = 101;
const OTHER_USER_ID = 202;
const THIRD_USER_ID = 203;
const DEMO_OFFICER_ID = 301;
const DEMO_ADMIN_ID = 401;

async function main() {
  console.log('Seeding facilities...');
  
  let countF = 0;
  for (const f of FACILITIES) {
    await prisma.$executeRaw`
      INSERT INTO "Facility" (id, name, type, location, capacity, description, status, "imageUrl")
      VALUES (${f.id}, ${f.name}, ${f.type}, ${f.location}, ${f.capacity}, ${f.description}, ${f.status}::"FacilityStatus", ${f.imageUrl || null})
    `;
    countF++;
  }
  console.log(`Seeded ${countF} facilities.`);
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Facility"', 'id'), (SELECT MAX(id) FROM "Facility"))`;
  
  console.log('Seeding users...');
  const users = [
    { id: DEMO_USER_ID, name: 'Pengguna Demo', email: 'pengguna@students.undip.ac.id', role: 'PENGGUNA', accountStatus: 'ACTIVE', daysAgo: 60 },
    { id: OTHER_USER_ID, name: 'Rina Maharani', email: 'rina.maharani@students.undip.ac.id', role: 'PENGGUNA', accountStatus: 'ACTIVE', daysAgo: 45 },
    { id: THIRD_USER_ID, name: 'Dimas Saputra', email: 'dimas.saputra@students.undip.ac.id', role: 'PENGGUNA', accountStatus: 'ACTIVE', daysAgo: 30 },
    { id: DEMO_OFFICER_ID, name: 'Sri Wahyuni', email: 'sri.wahyuni@undip.ac.id', role: 'PETUGAS', accountStatus: 'ACTIVE', daysAgo: 120 },
    { id: DEMO_ADMIN_ID, name: 'Admin Fasilitas', email: 'admin@campus.edu', role: 'ADMIN', accountStatus: 'ACTIVE', daysAgo: 200 },
    { id: 501, name: 'Bagas Pratama', email: 'bagas.pratama@students.undip.ac.id', role: 'PENGGUNA', accountStatus: 'PENDING', daysAgo: 1 },
    { id: 502, name: 'Dewi Lestari', email: 'dewi.lestari@lecturer.undip.ac.id', role: 'PENGGUNA', accountStatus: 'PENDING', daysAgo: 2 },
  ];
  
  let countU = 0;
  for (const u of users) {
    const passwordHash = hashPassword('password123');
    const createdAt = new Date(Date.now() - u.daysAgo * 86400000);
    
    await prisma.$executeRaw`
      INSERT INTO "User" (id, name, email, password, role, "accountStatus", "createdAt")
      VALUES (${u.id}, ${u.name}, ${u.email}, ${passwordHash}, ${u.role}::"Role", ${u.accountStatus}::"AccountStatus", ${createdAt})
    `;
    countU++;
  }
  console.log(`Seeded ${countU} users.`);
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"User"', 'id'), (SELECT MAX(id) FROM "User"))`;

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

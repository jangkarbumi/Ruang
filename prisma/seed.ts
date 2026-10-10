import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { FACILITIES } from './seed-data';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding facilities...');
  
  // Clear existing to avoid conflicts
  await prisma.facility.deleteMany();
  
  let count = 0;
  for (const f of FACILITIES) {
    await prisma.$executeRaw`
      INSERT INTO "Facility" (id, name, type, location, capacity, description, status, "imageUrl")
      VALUES (${f.id}, ${f.name}, ${f.type}, ${f.location}, ${f.capacity}, ${f.description}, ${f.status}::"FacilityStatus", ${f.imageUrl || null})
    `;
    count++;
  }
  console.log(`Seeded ${count} facilities.`);

  // Reset sequence
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Facility"', 'id'), (SELECT MAX(id) FROM "Facility"))`;
  console.log('Sequence reset.');
  
  const total = await prisma.facility.count();
  console.log(`Total facilities in DB: ${total}`);
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

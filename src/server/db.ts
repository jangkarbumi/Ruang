import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma Client singleton untuk Next.js.
 *
 * Prisma v7 mewajibkan driver adapter untuk koneksi database di runtime aplikasi.
 * PrismaPg dari @prisma/adapter-pg digunakan sebagai adapter resmi untuk PostgreSQL.
 *
 * Pola singleton mencegah Next.js dev mode (hot reload) membuat banyak instance
 * PrismaClient baru setiap kali file di-reload.
 *
 * Referensi: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg(process.env.DATABASE_URL!);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client singleton untuk Next.js.
 *
 * Pola ini mencegah Next.js dev mode (hot reload) membuat banyak instance
 * PrismaClient baru setiap kali file di-reload. Di production, setiap request
 * menggunakan instance yang sama dari module cache Node.js.
 *
 * Referensi: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";

// Load .env untuk mendapatkan DATABASE_URL saat menjalankan perintah Prisma CLI
dotenv.config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});

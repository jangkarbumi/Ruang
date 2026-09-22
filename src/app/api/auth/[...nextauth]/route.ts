/**
 * Route handler untuk Auth.js v5 (next-auth@beta).
 * Menangani semua request ke /api/auth/* (signin, signout, session, dll).
 *
 * Dokumentasi: https://authjs.dev/getting-started/installation#configure
 */
import { handlers } from "@/server/auth";

export const { GET, POST } = handlers;

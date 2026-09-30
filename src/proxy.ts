import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, readSessionToken } from '@/server/auth/session-cookie';
import { HOME_BY_ROLE, areaRole } from '@/lib/auth-routes';

/**
 * Penjaga rute (NFR-02) — berjalan sebelum halaman dirender, sehingga pengunjung tanpa sesi
 * mendapat redirect 307 sungguhan ke /login, dan akun salah-role dikembalikan ke halaman role-nya.
 * Halaman & Server Action tetap memeriksa ulang akun di server sebagai penentu akhir.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const needed = areaRole(pathname);
  if (!needed) return NextResponse.next();

  const session = readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', pathname + search);
    const res = NextResponse.redirect(login);
    // Cookie rusak/kedaluwarsa dibersihkan
    if (request.cookies.has(SESSION_COOKIE)) res.cookies.delete(SESSION_COOKIE);
    return res;
  }
  if (session.role !== needed) {
    return NextResponse.redirect(new URL(HOME_BY_ROLE[session.role], request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/reservasi/:path*', '/laporan/:path*', '/petugas/:path*', '/admin/:path*'],
};

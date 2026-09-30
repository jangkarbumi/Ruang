import { getCurrentUser } from '@/server/session';
import { parseRange, reportsCsv, reservationsCsv } from '@/server/services/recap-service';
import { nowInJakarta } from '@/lib/slots';

/**
 * FR-17: unduh rekap sebagai file CSV.
 * GET /admin/rekap/ekspor?jenis=reservasi|laporan&dari=YYYY-MM-DD&sampai=YYYY-MM-DD
 * Proxy sudah menjaga /admin, tetapi akun & role tetap diperiksa ulang di sini (NFR-02).
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response('Silakan login terlebih dahulu.', { status: 401 });
  if (user.role !== 'ADMIN') return new Response('Hanya admin yang dapat mengunduh rekap.', { status: 403 });

  const url = new URL(request.url);
  const jenis = url.searchParams.get('jenis');
  if (jenis !== 'reservasi' && jenis !== 'laporan') {
    return new Response('Jenis ekspor harus "reservasi" atau "laporan".', { status: 400 });
  }
  const range = parseRange(url.searchParams.get('dari'), url.searchParams.get('sampai'), nowInJakarta().date);
  if (range.error) return new Response(range.error, { status: 400 });

  const csv = jenis === 'reservasi' ? await reservationsCsv(range) : await reportsCsv(range);
  const filename = `ruang-${jenis}-${range.from}_sd_${range.to}.csv`;
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

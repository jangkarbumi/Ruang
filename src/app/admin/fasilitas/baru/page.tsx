import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PageBanner from '@/components/facility/PageBanner';
import FacilityForm from '@/components/staff/FacilityForm';
import { AdminNavbar } from '@/components/staff/nav';
import { requireRole } from '@/server/session';
import { listLocations } from '@/server/services/facility-service';

export const metadata: Metadata = { title: 'Tambah Fasilitas | Admin | Ruang' };

/** FR-16: Admin mendaftarkan fasilitas baru ke sistem. */
export default async function AdminFacilityCreatePage() {
  const user = await requireRole('ADMIN', '/admin/fasilitas/baru');
  const locations = await listLocations();

  return (
    <main className="flex-1 bg-[#f8f9fa]">
      <PageBanner navbar={<AdminNavbar user={user} active="fasilitas" />}>
        <Link
          href="/admin/fasilitas"
          className="flex w-fit items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden /> Kembali ke daftar fasilitas
        </Link>
        <h1 className="mt-4 text-[44px] font-bold tracking-tight leading-tight">Tambah Fasilitas Baru</h1>
        <p className="mt-2 max-w-xl text-white/70">
          Daftarkan ruang kelas, aula, laboratorium, atau sarana kampus lainnya agar dapat dipinjam oleh civitas akademika.
        </p>
      </PageBanner>

      <div className="relative z-20 w-full max-w-300 mx-auto px-4 -mt-7 pb-20">
        <div className="max-w-2xl">
          <FacilityForm locations={locations} />
        </div>
      </div>
    </main>
  );
}

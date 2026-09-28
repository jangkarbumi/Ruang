import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PageBanner from '@/components/facility/PageBanner';

export default function NotFound() {
  return (
    <main className="flex-1 bg-[#f8f9fa]">
      <PageBanner>
        <p className="text-sm font-bold text-white/60">404</p>
        <h1 className="mt-2 text-[44px] font-bold tracking-tight">Halaman tidak ditemukan</h1>
        <p className="mt-2 max-w-xl text-white/70">
          Fasilitas atau halaman yang Anda cari tidak ada, sudah dipindahkan, atau sedang dinonaktifkan.
        </p>
      </PageBanner>
      <div className="w-full max-w-300 mx-auto px-4 py-12 flex flex-wrap gap-3">
        <Link
          href="/fasilitas"
          className="flex items-center gap-2 bg-[#0064D2] text-white hover:bg-[#0056b3] px-6 py-3 rounded-full text-sm font-bold transition"
        >
          Lihat daftar fasilitas
          <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
        <Link
          href="/"
          className="flex items-center px-6 py-3 bg-white border border-gray-200 text-[#001741] rounded-full font-semibold text-sm shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
        >
          Ke beranda
        </Link>
      </div>
    </main>
  );
}

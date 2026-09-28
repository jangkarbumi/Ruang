import type { ReactNode } from 'react';
import Navbar from '@/components/Navbar';

/**
 * Pita gelap di atas halaman — Navbar lama bersifat `absolute` dengan gradasi gelap,
 * jadi ia butuh latar #001741 di belakangnya agar tetap terbaca.
 */
export default function PageBanner({ children, navbar }: { children: ReactNode; navbar?: ReactNode }) {
  return (
    <div 
      className="relative bg-[#001741] bg-cover bg-center"
      style={{ backgroundImage: "url('/latar belakang bagian informasi tanpa login.jpg')" }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-[#001741] via-[#001741]/85 to-[#001741]/70"></div>
      <div className="relative z-10">
        {navbar ?? <Navbar />}
        <div className="w-full max-w-300 mx-auto px-4 pt-24 pb-16 text-white">{children}</div>
      </div>
    </div>
  );
}

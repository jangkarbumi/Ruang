import Image from 'next/image';
import { Building2 } from 'lucide-react';
import type { Facility } from '@/lib/facility';

/**
 * Foto fasilitas. Schema `Facility` belum punya kolom foto, jadi pemetaannya sementara di sini.
 */
const PHOTOS: Record<number, string> = {
  1: '/ProfSoedarto.jpg',
  3: '/Gedung-WP.jpg',
  12: '/gsgFIB.png',
};

export default function FacilityImage({
  facility,
  sizes,
  priority,
  className = '',
}: {
  facility: Facility;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const src = facility.imageUrl || PHOTOS[facility.id];
  return (
    <div className={`relative overflow-hidden bg-[#EBF3FF] ${className}`}>
      {src ? (
        <Image src={src} alt={facility.name} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div
          role="img"
          aria-label={`${facility.name} (foto belum tersedia)`}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#0064D2]"
        >
          <Building2 className="w-10 h-10 opacity-60" aria-hidden />
          <span className="text-xs font-semibold text-[#0064D2]/70">Foto belum tersedia</span>
        </div>
      )}
      {facility.status === 'PERBAIKAN' && (
        <span className="absolute top-3 left-3 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-700 shadow-sm">
          Dalam perbaikan
        </span>
      )}
    </div>
  );
}

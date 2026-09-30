import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import { locationLabel, type Facility } from '@/lib/facility';
import FacilityImage from './FacilityImage';
import PinIcon from './PinIcon';

/** Versi vertikal dari GedungCard untuk grid daftar fasilitas. */
export default function FacilityCard({ facility, priority }: { facility: Facility; priority?: boolean }) {
  const href = `/fasilitas/${facility.id}`;
  return (
    <div className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      <FacilityImage
        facility={facility}
        priority={priority}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="h-44"
      />

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1 text-[11px] text-[#0064D2] font-semibold mb-1">
          <PinIcon />
          {locationLabel(facility.location)}
        </div>
        <h3 className="text-base font-bold text-[#001741] mb-1 leading-tight line-clamp-2">{facility.name}</h3>
        <p className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span>{facility.type}</span>
          <span className="inline-flex items-center gap-1">
            <Users className="w-3.5 h-3.5" aria-hidden />
            {facility.capacity.toLocaleString('id-ID')} orang
          </span>
        </p>

        <Link
          href={href}
          className="mt-auto text-xs text-[#0064D2] font-semibold flex items-center gap-1 hover:gap-1.5 transition-all w-fit"
        >
          Detail lengkap
          <ArrowRight className="w-4 h-4" aria-hidden />
          <span className="sr-only">{facility.name}</span>
        </Link>
      </div>
    </div>
  );
}

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export interface GedungCardProps {
  name: string;
  description: string;
  imageUrl: string;
  location: string;
}

export default function GedungCard({ name, description, imageUrl, location }: GedungCardProps) {
  return (
    <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 w-95 h-45 shrink-0 overflow-hidden">

      <div className="w-[40%] relative">
        <Image 
          src={imageUrl} 
          alt={name}
          fill
          className="w-full h-full object-cover"
        />
      </div>

      <div className="w-[60%] p-4 flex flex-col justify-center">
        <div className="flex items-center gap-1 text-[11px] text-[#0064D2] font-semibold mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          {location}
        </div>
        <h3 className="text-base font-bold text-[#001741] mb-1 leading-tight line-clamp-2">
          {name}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-3 mb-2">
          {description}
        </p>
        
        <button className="mt-auto text-xs text-[#0064D2] font-semibold flex items-center gap-1 hover:gap-1.5 transition-all w-fit group">
          Detail lengkap 
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}
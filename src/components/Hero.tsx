import Link from 'next/link';
import GedungCard from './GedungCard';
import { ArrowRight } from 'lucide-react';

const dummyGedungData = [
  {
    id: 1,
    name: 'Gedung Prof Soedarto',
    location: 'Undip Kampus Tembalang',
    description: 'Gedung serbaguna yang digunakan untuk mengadakan acara',
    imageUrl: '/ProfSoedarto.jpg'
  },
  {
    id: 2,
    name: 'Gedung Serbaguna FIB',
    location: 'Fakultas Ilmu Budaya Undip Tembalang',
    description: 'Gedung serbaguna berkapasitas besar yang sering digunakan untuk acara pada FIB',
    imageUrl: '/gsgFIB.png'
  }
];

export default function Hero() {
  return (
    <main
      className="relative w-full h-screen flex flex-col items-center pt-32 pb-16 bg-cover bg-center"
      style={{ backgroundImage: "url('/Gedung-WP.jpg')" }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-[#001741]/80 via-[#001741]/20 to-transparent"></div>

      <div className="relative z-10 w-full max-w-300 mx-auto flex flex-col items-center px-4">
        
        <h1 className="text-white text-[44px] font-bold mb-8 tracking-tight text-center">
          Reservasi Fasilitas Kampus
        </h1>

        <div className="relative w-full flex flex-col items-center mt-2">
          
          <div className="bg-white items-center rounded-full shadow-lg w-auto max-w-full flex flex-row relative z-20 translate-y-6">
            <div className="flex items-center gap-1 p-2">
              <button className="flex items-center gap-2 bg-[#EBF3FF] text-[#0064D2] rounded-full px-6 py-2.5 font-bold text-sm shrink-0">
                Gedung
              </button>
              <button className="flex items-center gap-2 hover:bg-gray-50 text-gray-600 rounded-full px-6 py-2.5 font-semibold text-sm shrink-0 transition">
                Ruangan
              </button>
              <button className="flex items-center gap-2 hover:bg-gray-50 text-gray-600 rounded-full px-6 py-2.5 font-semibold text-sm shrink-0 transition">
                Laboratorium
              </button>
              <button className="flex items-center gap-2 hover:bg-gray-50 text-gray-600 rounded-full px-6 py-2.5 font-semibold text-sm shrink-0 transition">
                Lapangan
              </button>
              <button className="flex items-center gap-2 hover:bg-gray-50 text-gray-600 rounded-full px-6 py-2.5 font-semibold text-sm shrink-0 transition">
                Aula
              </button>
            </div>
          </div>

          <div className="bg-[#f8f9fa] w-full max-w-260 rounded-3xl shadow-2xl relative z-0 flex flex-col justify-end pb-8">
            
            <div className="w-full flex flex-row items-center justify-center gap-6 px-8 mt-12">
              
              {dummyGedungData.map((gedung) => (
                <GedungCard 
                  key={gedung.id}
                  name={gedung.name}
                  location={gedung.location}
                  description={gedung.description}
                  imageUrl={gedung.imageUrl}
                />
              ))}

              <Link href={'/gedung'} className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-[#001741] rounded-full font-semibold text-sm shadow-sm hover:shadow-md hover:bg-gray-50 transition-all shrink-0">
                Lihat Semua
                <ArrowRight />
              </Link>
              
            </div>
            
          </div>
        </div>
      </div>
    </main>
  );
}
export default function Hero() {
  return (
    <div 
      className="relative w-full min-h-175 flex flex-col items-center pt-32 pb-16 bg-cover bg-center"
      style={{ backgroundImage: "url('/Gedung-WP.jpg')" }}
    >
      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-linear-to-b from-[#001741]/80 via-[#001741]/20 to-transparent"></div>

      <div className="relative z-10 w-full flex flex-col items-center px-4">
        {/* Headlines */}
        <h1 className="text-white text-[44px] font-bold mb-2 tracking-tight">
          Tempat reservasi ruangan resmi.
        </h1>

        {/* Main Search Card */}
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w flex flex-col">
          
          {/* Top Tabs */}
          <div className="flex items-center gap-2 p-3 border-b border-gray-100 overflow-x-auto relative">
            <button className="flex items-center gap-2 bg-[#EBF3FF] text-[#0064D2] rounded-full px-5 py-2.5 font-bold text-sm shrink-0">
              Gedung
            </button>
            <button className="flex items-center gap-2 hover:bg-gray-50 text-gray-600 rounded-full px-5 py-2.5 font-semibold text-sm shrink-0 transition">
              Ruangan
            </button>
            <button className="flex items-center gap-2 hover:bg-gray-50 text-gray-600 rounded-full px-5 py-2.5 font-semibold text-sm shrink-0 transition">
                Laboratorium
            </button>
            <button className="flex items-center gap-2 hover:bg-gray-50 text-gray-600 rounded-full px-5 py-2.5 font-semibold text-sm shrink-0 transition">
                Lapangan
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
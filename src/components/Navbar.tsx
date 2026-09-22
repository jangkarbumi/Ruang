import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="w-full absolute top-0 z-50 text-white px-8 py-3 bg-linear-to-b from-[#001741]/90 to-transparent">
      <div className="flex items-center justify-between">
        
        {/* Left Section: Logo & Search */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center text-2xl font-bold tracking-tight">
            Ruang
          </Link>
        </div>

        {/* Right Section: Auth Buttons */}
        <div className="flex items-center gap-3">
          <button className="bg-white text-[#0064D2] hover:bg-gray-100 px-6 py-2 rounded-full text-sm font-bold transition">
            Login
          </button>
          <button className="bg-[#0064D2] text-white hover:bg-[#0056b3] px-6 py-2 rounded-full text-sm font-bold transition">
            Register
          </button>
        </div>
        
      </div>
    </header>
  );
}
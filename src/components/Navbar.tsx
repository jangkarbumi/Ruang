import Link from 'next/link';
import { logoutAction } from '@/server/actions/auth-actions';

/** `isLoggedIn`: tombol Login & Register di kanan atas diganti tombol Logout. */
export default function Navbar({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <header className="w-full absolute top-0 z-50 text-white px-8 py-3 bg-linear-to-b from-[#001741]/90 to-transparent">
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center text-2xl font-bold tracking-tight">
            Ruang
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <form action={logoutAction}>
              <button type="submit" className="bg-white text-[#0064D2] hover:bg-gray-100 px-6 py-2 rounded-2xl text-sm font-bold transition">
                Logout
              </button>
            </form>
          ) : (
            <>
              <Link href={'/login'} className="bg-white text-[#0064D2] hover:bg-gray-100 px-6 py-2 rounded-2xl text-sm font-bold transition">
                Login
              </Link>
              <Link href={'/register'} className="bg-[#0064D2] text-white hover:bg-[#0056b3] px-6 py-2 rounded-2xl text-sm font-bold transition">
                Register
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
}

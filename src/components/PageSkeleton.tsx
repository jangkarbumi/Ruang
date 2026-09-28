import PageBanner from '@/components/facility/PageBanner';

/** Kerangka halaman saat server masih memuat — banner sama persis, isi berupa blok abu-abu berdenyut. */
export default function PageSkeleton({ variant }: { variant: 'grid' | 'list' }) {
  return (
    <main className="flex-1 bg-[#f8f9fa]" aria-busy="true" aria-label="Memuat halaman">
      <PageBanner
        navbar={
          <header className="w-full absolute top-0 z-50 text-white px-8 py-3 bg-linear-to-b from-[#001741]/90 to-transparent">
            <span className="text-2xl font-bold tracking-tight">Ruang</span>
          </header>
        }
      >
        <div className="h-11 w-72 max-w-full rounded-2xl bg-white/15 animate-pulse" />
        <div className="mt-4 h-4 w-96 max-w-full rounded-full bg-white/10 animate-pulse" />
      </PageBanner>

      <div className="relative z-20 w-full max-w-300 mx-auto px-4 -mt-7 pb-20">
        <div className="h-14 w-80 max-w-full rounded-full bg-white shadow-lg" />
        {variant === 'grid' ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-44 bg-gray-100 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-24 rounded-full bg-gray-100 animate-pulse" />
                  <div className="h-4 w-3/4 rounded-full bg-gray-100 animate-pulse" />
                  <div className="h-3 w-1/2 rounded-full bg-gray-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
                <div className="w-28 h-24 sm:w-32 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                <div className="flex-1 py-1 space-y-2">
                  <div className="h-5 w-20 rounded-full bg-gray-100 animate-pulse" />
                  <div className="h-4 w-2/3 rounded-full bg-gray-100 animate-pulse" />
                  <div className="h-3 w-1/2 rounded-full bg-gray-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

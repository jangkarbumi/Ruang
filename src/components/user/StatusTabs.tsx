import Link from 'next/link';

/** Tab status berbentuk pil — gaya sama dengan tab kategori di beranda. */
export default function StatusTabs({
  basePath,
  tabs,
  active,
}: {
  basePath: string;
  tabs: { value: string; label: string; count?: number }[];
  active: string;
}) {
  return (
    <nav aria-label="Saring status" className="bg-white rounded-full shadow-lg w-fit max-w-full overflow-x-auto">
      <div className="flex items-center gap-1 p-2">
        {tabs.map((t) => {
          const on = t.value === active;
          return (
            <Link
              key={t.value || 'semua'}
              href={t.value ? `${basePath}?status=${t.value}` : basePath}
              aria-current={on ? 'page' : undefined}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm shrink-0 transition ${
                on ? 'bg-[#EBF3FF] text-[#0064D2] font-bold' : 'text-gray-600 font-semibold hover:bg-gray-50'
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={`text-xs ${on ? 'text-[#0064D2]' : 'text-gray-400'}`}>{t.count}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

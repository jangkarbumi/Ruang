import type { ReactNode } from 'react';

/** Gaya input yang sama dengan filter di /fasilitas. */
export const fieldClass = (error?: string) =>
  `w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-[#001741] transition focus:outline-none focus:ring-2 ${
    error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
      : 'border-gray-200 focus:border-[#0064D2] focus:ring-[#0064D2]/15'
  }`;

/** Label + input + pesan bantuan/galat tepat di bawah isian. */
export function FormField({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Notice({ tone, children }: { tone: 'success' | 'error' | 'info'; children: ReactNode }) {
  const cls = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-700',
    info: 'bg-[#EBF3FF] border-transparent text-[#0064D2]',
  }[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${cls}`}>
      {children}
    </div>
  );
}

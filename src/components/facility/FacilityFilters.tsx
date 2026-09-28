'use client';

import { useRef } from 'react';
import { CAPACITY_OPTIONS, FACILITY_TYPES, locationLabel } from '@/lib/facility';

const field =
  'w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#001741] transition focus:border-[#0064D2] focus:outline-none focus:ring-2 focus:ring-[#0064D2]/15';

/**
 * Form GET — filter tersimpan di URL. JS hanya menambahkan kirim-otomatis saat pilihan berubah.
 * Tata letaknya mengikuti hero beranda: bar tab pil yang menumpuk di atas kartu.
 */
export default function FacilityFilters({
  locations,
  values,
}: {
  locations: string[];
  values: { q: string; tipe: string; lokasi: string; kapasitas: number };
}) {
  const form = useRef<HTMLFormElement>(null);
  const submit = () => form.current?.requestSubmit();

  return (
    <form ref={form} action="/fasilitas" method="get" role="search" aria-label="Cari fasilitas" className="relative flex flex-col items-center">
      {/* Tab tipe */}
      <fieldset className="bg-white rounded-full shadow-lg max-w-full relative z-20 translate-y-6 overflow-x-auto">
        <legend className="sr-only">Tipe fasilitas</legend>
        <div className="flex items-center gap-1 p-2">
          {['', ...FACILITY_TYPES].map((t) => {
            const on = values.tipe === t;
            return (
              <label
                key={t || 'semua'}
                className={`cursor-pointer rounded-full px-5 py-2.5 text-sm shrink-0 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#0064D2] ${
                  on ? 'bg-[#EBF3FF] text-[#0064D2] font-bold' : 'text-gray-600 font-semibold hover:bg-gray-50'
                }`}
              >
                <input type="radio" name="tipe" value={t} defaultChecked={on} onChange={submit} className="sr-only" />
                {t || 'Semua'}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Kartu isian */}
      <div className="w-full bg-[#f8f9fa] rounded-3xl shadow-2xl relative z-0 px-6 md:px-8 pt-12 pb-8">
        <div className="grid gap-4 md:grid-cols-[1.6fr_1fr_1fr_auto] md:items-end">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-600">Nama fasilitas</span>
            <input type="search" name="q" defaultValue={values.q} placeholder="Contoh: Widya Puraya" className={field} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-600">Lokasi</span>
            <select name="lokasi" defaultValue={values.lokasi} onChange={submit} className={field}>
              <option value="">Semua lokasi</option>
              {locations.map((l) => (
                <option key={l} value={l}>
                  {locationLabel(l)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-600">Kapasitas minimum</span>
            <select name="kapasitas" defaultValue={values.kapasitas} onChange={submit} className={field}>
              {CAPACITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="bg-[#0064D2] text-white hover:bg-[#0056b3] px-6 py-2.5 rounded-2xl text-sm font-bold transition"
          >
            Cari
          </button>
        </div>
      </div>
    </form>
  );
}

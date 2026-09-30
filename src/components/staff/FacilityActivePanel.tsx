'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { setFacilityActiveAction } from '@/server/actions/admin-actions';

function Submit({ className, children }: { className: string; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-60`}>
      {pending ? 'Memproses…' : children}
    </button>
  );
}

/** FR-16: nonaktifkan (dengan konfirmasi) atau aktifkan kembali sebuah fasilitas. */
export default function FacilityActivePanel({ id, inactive, upcoming }: { id: number; inactive: boolean; upcoming: number }) {
  const [confirming, setConfirming] = useState(false);

  if (inactive) {
    return (
      <form action={setFacilityActiveAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="active" value="true" />
        <Submit className="w-full bg-[#0064D2] text-white hover:bg-[#0056b3] px-6 py-3 rounded-2xl text-sm font-bold transition">
          Aktifkan Kembali
        </Submit>
      </form>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full px-6 py-3 bg-white border border-red-200 text-red-600 rounded-2xl text-sm font-bold hover:bg-red-50 transition"
      >
        Nonaktifkan Fasilitas
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4" role="alert">
      <p className="text-sm font-bold text-red-700">Nonaktifkan fasilitas ini?</p>
      <p className="mt-1 text-xs text-red-700">
        Fasilitas tidak lagi tampil di katalog dan tidak dapat direservasi maupun dilaporkan.
        {upcoming > 0 &&
          ` Masih ada ${upcoming} reservasi menunggu/disetujui yang belum berlangsung: pengajuan yang menunggu tidak dapat disetujui, dan petugas perlu membatalkan yang sudah disetujui.`}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <form action={setFacilityActiveAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="active" value="false" />
          <Submit className="bg-red-600 text-white hover:bg-red-700 px-5 py-2.5 rounded-2xl text-sm font-bold transition">
            Ya, nonaktifkan
          </Submit>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-50 transition"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

'use client';

import { useActionState, useState } from 'react';
import { cancelReservationAction, type CancelState } from '@/server/actions/reservation-actions';
import { Notice } from './form';

/** Pembatalan dua langkah agar tidak terpicu karena salah klik. */
export default function CancelReservation({ id, deadlineLabel }: { id: number; deadlineLabel: string }) {
  const [state, action, pending] = useActionState<CancelState, FormData>(cancelReservationAction, {});
  const [confirming, setConfirming] = useState(false);

  return (
    <div>
      {state.message && (
        <div className="mb-4">
          <Notice tone="error">{state.message}</Notice>
        </div>
      )}

      {!confirming ? (
        <>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="w-full px-6 py-3 bg-white border border-red-200 text-red-600 rounded-2xl text-sm font-bold hover:bg-red-50 transition"
          >
            Batalkan Reservasi
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">Dapat dibatalkan hingga {deadlineLabel}.</p>
        </>
      ) : (
        <form action={action} className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <input type="hidden" name="id" value={id} />
          <p className="text-sm font-bold text-red-700">Batalkan reservasi ini?</p>
          <p className="mt-1 text-xs text-red-700">Slot akan dilepas untuk pengguna lain dan tidak dapat dikembalikan.</p>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition disabled:opacity-60"
            >
              {pending ? 'Membatalkan…' : 'Ya, batalkan'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-[#001741] rounded-2xl text-sm font-semibold hover:bg-gray-50 transition"
            >
              Tidak
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

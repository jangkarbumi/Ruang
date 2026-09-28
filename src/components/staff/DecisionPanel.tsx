'use client';

import { useActionState, useState } from 'react';
import { decideReservationAction, type StaffActionState } from '@/server/actions/staff-actions';
import type { ReservationStatus } from '@/lib/reservation';
import { Notice, fieldClass } from '@/components/user/form';

const REASON_MIN = 10;

/**
 * Panel keputusan petugas:
 * - Menunggu  → Setujui (dinonaktifkan bila bentrok, AC-03) / Tolak
 * - Disetujui → Batalkan mendesak dengan alasan wajib (FR-10, AC-05)
 */
export default function DecisionPanel({
  id,
  status,
  blockedReason,
  competingCount,
}: {
  id: number;
  status: ReservationStatus;
  blockedReason: string | null;
  competingCount: number;
}) {
  const [state, action, pending] = useActionState<StaffActionState, FormData>(decideReservationAction, {});
  const [mode, setMode] = useState<'idle' | 'reject' | 'cancel'>('idle');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  if (status !== 'PENDING' && status !== 'APPROVED') {
    return <p className="text-sm text-gray-500">Reservasi ini sudah selesai diproses. Tidak ada tindakan lanjutan.</p>;
  }

  return (
    <div className="space-y-4">
      {state.message && <Notice tone="error">{state.message}</Notice>}

      {status === 'PENDING' && (
        <>
          {blockedReason && <Notice tone="error">{blockedReason}</Notice>}
          {!blockedReason && competingCount > 0 && (
            <Notice tone="info">
              Ada {competingCount} pengajuan lain di jam yang sama. Jika ini disetujui, pengajuan tersebut tidak dapat
              disetujui lagi.
            </Notice>
          )}

          {mode === 'reject' ? (
            <form action={action} className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="decision" value="reject" />
              <p className="text-sm font-bold text-red-700">Tolak pengajuan ini?</p>
              <div className="mt-3 flex gap-2">
                <button type="submit" disabled={pending} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition disabled:opacity-60">
                  {pending ? 'Memproses…' : 'Ya, tolak'}
                </button>
                <button type="button" onClick={() => setMode('idle')} className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-[#001741] rounded-2xl text-sm font-semibold hover:bg-gray-50 transition">
                  Kembali
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-2">
              <form action={action}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="decision" value="approve" />
                <button
                  type="submit"
                  disabled={pending || !!blockedReason}
                  className="w-full bg-[#0064D2] text-white hover:bg-[#0056b3] px-6 py-3 rounded-2xl text-sm font-bold transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {pending ? 'Memproses…' : 'Setujui'}
                </button>
              </form>
              <button
                type="button"
                onClick={() => setMode('reject')}
                className="w-full px-6 py-3 bg-white border border-red-200 text-red-600 rounded-2xl text-sm font-bold hover:bg-red-50 transition"
              >
                Tolak
              </button>
            </div>
          )}
        </>
      )}

      {status === 'APPROVED' &&
        (mode === 'cancel' ? (
          <form
            action={action}
            onSubmit={(e) => {
              if (reason.trim().length < REASON_MIN) {
                e.preventDefault();
                setReasonError(`Alasan wajib diisi, minimal ${REASON_MIN} karakter.`);
              }
            }}
            noValidate
            className="rounded-2xl border border-red-200 bg-red-50 p-4"
          >
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="decision" value="cancel" />
            <label htmlFor="reason" className="block text-sm font-bold text-red-700">
              Alasan pembatalan (wajib)
            </label>
            <p className="mt-0.5 text-xs text-red-700">Alasan ini akan terlihat oleh pemohon.</p>
            <textarea
              id="reason"
              name="reason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setReasonError(null);
              }}
              aria-invalid={!!reasonError}
              aria-describedby={reasonError ? 'reason-error' : undefined}
              placeholder="Contoh: Gedung dipakai untuk agenda pimpinan universitas yang mendesak."
              className={`mt-2 ${fieldClass(reasonError ?? undefined)}`}
            />
            {reasonError && (
              <p id="reason-error" className="mt-1.5 text-xs font-semibold text-red-600">
                {reasonError}
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <button type="submit" disabled={pending} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition disabled:opacity-60">
                {pending ? 'Memproses…' : 'Batalkan reservasi'}
              </button>
              <button type="button" onClick={() => setMode('idle')} className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-[#001741] rounded-2xl text-sm font-semibold hover:bg-gray-50 transition">
                Kembali
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="text-sm text-gray-500">Reservasi sudah disetujui. Batalkan hanya dalam kondisi mendesak.</p>
            <button
              type="button"
              onClick={() => setMode('cancel')}
              className="w-full px-6 py-3 bg-white border border-red-200 text-red-600 rounded-2xl text-sm font-bold hover:bg-red-50 transition"
            >
              Batalkan Mendesak
            </button>
          </>
        ))}
    </div>
  );
}

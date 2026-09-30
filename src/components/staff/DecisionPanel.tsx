'use client';

import { useActionState, useState } from 'react';
import { decideReservationAction, type StaffActionState } from '@/server/actions/staff-actions';
import type { ReservationStatus } from '@/lib/reservation';
import { Notice, fieldClass } from '@/components/user/form';
import { ReasonForm } from './ReasonForm';

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
            <ReasonForm
              id={id}
              action={action}
              decision="reject"
              pending={pending}
              minReasonLength={REASON_MIN}
              label="Alasan penolakan (wajib)"
              placeholder="Contoh: Jadwal gedung sudah dipenuhi kegiatan universitas pada tanggal tersebut."
              submitText="Ya, tolak"
              onCancel={() => setMode('idle')}
            />
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
          <ReasonForm
            id={id}
            action={action}
            decision="cancel"
            pending={pending}
            minReasonLength={REASON_MIN}
            label="Alasan pembatalan (wajib)"
            placeholder="Contoh: Gedung dipakai untuk agenda pimpinan universitas yang mendesak."
            submitText="Batalkan reservasi"
            onCancel={() => setMode('idle')}
          />
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

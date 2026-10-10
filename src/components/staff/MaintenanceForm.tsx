'use client';

import { useActionState, useState } from 'react';
import { Wrench, AlertTriangle } from 'lucide-react';
import { scheduleMaintenanceAction, type MaintenanceActionState } from '@/server/actions/staff-actions';
import { Button } from '@/components/ui/button';
import { fieldClass } from '@/components/user/form';

interface MaintenanceFormProps {
  facilityId: number;
  facilityName: string;
  reportId?: number | null;
  defaultReason?: string;
  backUrl: string;
  onCancel?: () => void;
}

export default function MaintenanceForm({
  facilityId,
  facilityName,
  reportId,
  defaultReason = '',
  backUrl,
  onCancel,
}: MaintenanceFormProps) {
  const [state, formAction, isPending] = useActionState<MaintenanceActionState, FormData>(
    scheduleMaintenanceAction,
    {}
  );

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState(defaultReason);

  return (
    <form action={formAction} className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 space-y-4">
      <input type="hidden" name="facilityId" value={facilityId} />
      <input type="hidden" name="back" value={backUrl} />
      {reportId && <input type="hidden" name="reportId" value={reportId} />}

      <div className="flex items-center gap-2 text-amber-800">
        <Wrench className="w-5 h-5 text-amber-600" />
        <h3 className="font-bold text-sm">Jadwalkan Masa Perbaikan Fasilitas</h3>
      </div>
      <p className="text-xs text-amber-900 leading-relaxed">
        Menetapkan rentang waktu pemeliharaan untuk <strong>{facilityName}</strong>.
      </p>

      {state.message && (
        <div className="flex items-start gap-2 rounded-xl bg-red-100 p-3 text-xs font-semibold text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{state.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={`start-${facilityId}`} className="block text-xs font-bold text-gray-700 mb-1">
            Tanggal Mulai Perbaikan
          </label>
          <div className="relative">
            <input
              type="date"
              id={`start-${facilityId}`}
              name="startDate"
              min={today}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate < e.target.value) setEndDate(e.target.value);
              }}
              required
              className={fieldClass(state.errors?.startDate)}
            />
          </div>
          {state.errors?.startDate && (
            <p className="mt-1 text-xs text-red-600">{state.errors.startDate}</p>
          )}
        </div>

        <div>
          <label htmlFor={`end-${facilityId}`} className="block text-xs font-bold text-gray-700 mb-1">
            Tanggal Selesai (Estimasi)
          </label>
          <div className="relative">
            <input
              type="date"
              id={`end-${facilityId}`}
              name="endDate"
              min={startDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className={fieldClass(state.errors?.endDate)}
            />
          </div>
          {state.errors?.endDate && (
            <p className="mt-1 text-xs text-red-600">{state.errors.endDate}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor={`reason-${facilityId}`} className="block text-xs font-bold text-gray-700 mb-1">
          Alasan / Deskripsi Perbaikan (Min. 10 Karakter)
        </label>
        <textarea
          id={`reason-${facilityId}`}
          name="reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Jelaskan jenis perbaikan, misal: Perbaikan AC bocor dan instalasi kelistrikan lantai 2..."
          required
          className={fieldClass(state.errors?.reason)}
        />
        {state.errors?.reason && (
          <p className="mt-1 text-xs text-red-600">{state.errors.reason}</p>
        )}
      </div>

      <div className="rounded-xl bg-amber-100/80 p-3 text-xs text-amber-900 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p>
          <strong>Dampak Otomatis:</strong> Semua reservasi yang sudah disetujui pada rentang tanggal ini akan
          dibatalkan darurat dengan alasan di atas, dan slot kalender akan otomatis dikunci.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition"
          >
            Batal
          </button>
        )}
        <Button
          type="submit"
          disabled={isPending || reason.trim().length < 10}
          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl px-4 py-2"
        >
          {isPending ? 'Menyimpan & Memproses...' : 'Terapkan Jadwal Perbaikan'}
        </Button>
      </div>
    </form>
  );
}

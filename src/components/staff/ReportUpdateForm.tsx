'use client';

import { useActionState, useState } from 'react';
import { updateReportAction, type ReportUpdateState } from '@/server/actions/staff-actions';
import { REPORT_STATUS, type ReportStatus } from '@/lib/report';
import { FormField, fieldClass } from '@/components/user/form';

const NOTE_MIN = 10;

/** FR-11 / AC-06: ubah status sesuai alur; catatan resolusi wajib saat laporan ditutup. */
export default function ReportUpdateForm({ id, next }: { id: number; next: ReportStatus[] }) {
  const [state, action, pending] = useActionState<ReportUpdateState, FormData>(updateReportAction, { errors: {} });
  const [status, setStatus] = useState<ReportStatus | ''>(next[0] ?? '');
  const [note, setNote] = useState('');
  const [clientErrors, setClientErrors] = useState<ReportUpdateState['errors'] | null>(null);
  const errors = clientErrors ?? state.errors;
  const closing = status === 'SELESAI' || status === 'DITOLAK';

  if (next.length === 0) {
    return <p className="text-sm text-gray-500">Laporan sudah ditutup. Status tidak dapat diubah lagi.</p>;
  }

  return (
    <form
      action={action}
      noValidate
      onSubmit={(e) => {
        const found: ReportUpdateState['errors'] = {};
        if (!status) found.status = 'Pilih status baru.';
        if (closing && note.trim().length < NOTE_MIN) found.note = `Catatan resolusi wajib diisi, minimal ${NOTE_MIN} karakter.`;
        if (Object.keys(found).length) {
          e.preventDefault();
          setClientErrors(found);
        } else setClientErrors(null);
      }}
      className="space-y-4"
    >
      <input type="hidden" name="id" value={id} />

      <FormField id="status" label="Ubah status menjadi" error={errors.status}>
        <select
          id="status"
          name="status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ReportStatus);
            setClientErrors(null);
          }}
          className={fieldClass(errors.status)}
        >
          {next.map((s) => (
            <option key={s} value={s}>
              {REPORT_STATUS[s].label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        id="note"
        label={closing ? 'Catatan resolusi (wajib)' : 'Catatan (opsional)'}
        error={errors.note}
        hint={closing ? 'Catatan ini dapat dilihat pelapor.' : undefined}
      >
        <textarea
          id="note"
          name="note"
          rows={3}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setClientErrors(null);
          }}
          aria-invalid={!!errors.note}
          placeholder={
            status === 'DITOLAK' ? 'Contoh: Laporan duplikat, sudah ditangani pada laporan sebelumnya.' : 'Contoh: Lampu sudah diganti oleh teknisi.'
          }
          className={`${fieldClass(errors.note)} resize-y`}
        />
      </FormField>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-[#0064D2] text-white hover:bg-[#0056b3] px-6 py-3 rounded-2xl text-sm font-bold transition disabled:opacity-60"
      >
        {pending ? 'Menyimpan…' : 'Simpan Status'}
      </button>
    </form>
  );
}

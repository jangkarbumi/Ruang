import { useState } from 'react';
import { fieldClass } from '@/components/user/form';

interface ReasonFormProps {
  id: number;
  action: string | ((payload: FormData) => void);
  decision: 'reject' | 'cancel';
  pending: boolean;
  minReasonLength: number;
  label: string;
  placeholder: string;
  submitText: string;
  onCancel: () => void;
}

export function ReasonForm({
  id,
  action,
  decision,
  pending,
  minReasonLength,
  label,
  placeholder,
  submitText,
  onCancel,
}: ReasonFormProps) {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (reason.trim().length < minReasonLength) {
          e.preventDefault();
          setReasonError(`Alasan wajib diisi, minimal ${minReasonLength} karakter.`);
        }
      }}
      noValidate
      className="rounded-2xl border border-red-200 bg-red-50 p-4"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="decision" value={decision} />
      <label htmlFor={`${decision}-reason`} className="block text-sm font-bold text-red-700">
        {label}
      </label>
      <p className="mt-0.5 text-xs text-red-700">Alasan ini akan terlihat oleh pemohon.</p>
      <textarea
        id={`${decision}-reason`}
        name="reason"
        rows={3}
        value={reason}
        onChange={(e) => {
          setReason(e.target.value);
          setReasonError(null);
        }}
        aria-invalid={!!reasonError}
        aria-describedby={reasonError ? `${decision}-reason-error` : undefined}
        placeholder={placeholder}
        className={`mt-2 ${fieldClass(reasonError ?? undefined)}`}
      />
      {reasonError && (
        <p id={`${decision}-reason-error`} className="mt-1.5 text-xs font-semibold text-red-600">
          {reasonError}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition disabled:opacity-60"
        >
          {pending ? 'Memproses…' : submitText}
        </button>
        <button
          type="button"
          onClick={() => {
            setReason('');
            setReasonError(null);
            onCancel();
          }}
          className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-[#001741] rounded-2xl text-sm font-semibold hover:bg-gray-50 transition"
        >
          Kembali
        </button>
      </div>
    </form>
  );
}

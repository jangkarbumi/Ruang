'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { createReservationAction, type ReservationFormState } from '@/server/actions/reservation-actions';
import { PURPOSE_MAX } from '@/lib/reservation';
import { SLOT_MINUTES, formatDateLong, formatTime, fromMinutes, nowInJakarta, slotTimes, toMinutes } from '@/lib/slots';
import { validateReservation, type ReservationInput } from '@/lib/validation';
import { FormField, Notice, fieldClass } from './form';

export interface FacilityOption {
  id: number;
  name: string;
  location: string;
}

const START_OPTIONS = slotTimes().map((s) => s.start);
const END_OPTIONS = slotTimes().map((s) => s.end);

export default function ReservationForm({
  facilities,
  initial,
  today,
  lastDate,
}: {
  facilities: FacilityOption[];
  initial: ReservationInput;
  today: string;
  lastDate: string;
}) {
  const [state, formAction, pending] = useActionState<ReservationFormState, FormData>(createReservationAction, {
    errors: {},
  });
  const [values, setValues] = useState<ReservationInput>(initial);
  const [clientErrors, setClientErrors] = useState<ReservationFormState['errors'] | null>(null);

  // Galat browser didahulukan; bila lolos, tampilkan galat dari server
  const errors = clientErrors ?? state.errors;
  const set = (k: keyof ReservationInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const v = e.target.value;
    setValues((prev) => {
      const next = { ...prev, [k]: v };
      // Jam selesai ikut maju bila jadi tidak valid
      if (k === 'start' && next.end && toMinutes(next.end) <= toMinutes(v)) next.end = fromMinutes(toMinutes(v) + SLOT_MINUTES);
      return next;
    });
    setClientErrors((prev) => (prev ? { ...prev, [k]: undefined } : prev));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const found = validateReservation(values, nowInJakarta());
    if (Object.keys(found).length) {
      e.preventDefault();
      setClientErrors(found);
      return;
    }
    setClientErrors(null);
  };

  const duration =
    values.start && values.end && toMinutes(values.end) > toMinutes(values.start)
      ? toMinutes(values.end) - toMinutes(values.start)
      : 0;
  const selected = facilities.find((f) => String(f.id) === values.facilityId);
  const describe = (k: keyof ReservationInput) => (errors[k] ? `${k}-error` : undefined);

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 md:p-8 space-y-5">
        {state.message && !clientErrors && <Notice tone="error">{state.message}</Notice>}

        <FormField id="facilityId" label="Fasilitas" error={errors.facilityId}>
          <select
            id="facilityId"
            name="facilityId"
            value={values.facilityId}
            onChange={set('facilityId')}
            aria-invalid={!!errors.facilityId}
            aria-describedby={describe('facilityId')}
            className={fieldClass(errors.facilityId)}
          >
            <option value="">Pilih fasilitas</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="date" label="Tanggal" error={errors.date} hint="Hingga 30 hari ke depan.">
          <input
            id="date"
            name="date"
            type="date"
            min={today}
            max={lastDate}
            value={values.date}
            onChange={set('date')}
            aria-invalid={!!errors.date}
            aria-describedby={describe('date')}
            className={fieldClass(errors.date)}
          />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="start" label="Jam mulai" error={errors.start}>
            <select
              id="start"
              name="start"
              value={values.start}
              onChange={set('start')}
              aria-invalid={!!errors.start}
              aria-describedby={describe('start')}
              className={fieldClass(errors.start)}
            >
              <option value="">Pilih jam</option>
              {START_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {formatTime(t)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="end" label="Jam selesai" error={errors.end}>
            <select
              id="end"
              name="end"
              value={values.end}
              onChange={set('end')}
              aria-invalid={!!errors.end}
              aria-describedby={describe('end')}
              className={fieldClass(errors.end)}
            >
              <option value="">Pilih jam</option>
              {END_OPTIONS.filter((t) => !values.start || toMinutes(t) > toMinutes(values.start)).map((t) => (
                <option key={t} value={t}>
                  {formatTime(t)}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <p className="-mt-2 text-xs text-gray-500">Jam operasional 07.00–20.00 WIB, per {SLOT_MINUTES} menit.</p>

        <FormField
          id="purpose"
          label="Tujuan penggunaan"
          error={errors.purpose}
          hint={`${values.purpose.trim().length}/${PURPOSE_MAX} karakter`}
        >
          <textarea
            id="purpose"
            name="purpose"
            rows={4}
            maxLength={PURPOSE_MAX}
            value={values.purpose}
            onChange={set('purpose')}
            placeholder="Contoh: Seminar nasional himpunan mahasiswa, sekitar 200 peserta, membutuhkan proyektor."
            aria-invalid={!!errors.purpose}
            aria-describedby={describe('purpose')}
            className={`${fieldClass(errors.purpose)} resize-y`}
          />
        </FormField>
      </div>

      {/* Ringkasan */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6">
          <p className="text-xs font-semibold text-gray-500">Ringkasan pengajuan</p>
          <p className="mt-2 text-base font-bold text-[#001741] leading-tight">{selected?.name ?? 'Belum memilih fasilitas'}</p>
          <p className="mt-1 text-sm text-gray-500">
            {/^\d{4}-\d{2}-\d{2}$/.test(values.date) ? formatDateLong(values.date) : 'Tanggal belum dipilih'}
          </p>
          {duration > 0 && (
            <p className="mt-3 text-3xl font-bold tracking-tight text-[#001741]">
              {formatTime(values.start)}–{formatTime(values.end)}
            </p>
          )}

          {selected && values.date && (
            <Link
              href={`/fasilitas/${selected.id}?tanggal=${values.date}`}
              target="_blank"
              rel="noopener"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0064D2] hover:underline"
            >
              <CalendarDays className="w-4 h-4" aria-hidden />
              Lihat jadwal ketersediaan (tab baru)
            </Link>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 flex w-full justify-center bg-[#0064D2] text-white hover:bg-[#0056b3] px-6 py-3 rounded-2xl text-sm font-bold transition disabled:opacity-60 disabled:cursor-wait"
          >
            {pending ? 'Mengirim…' : 'Ajukan Reservasi'}
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">
            Status awal pengajuan adalah Menunggu sampai ditinjau petugas.
          </p>
        </div>
      </aside>
    </form>
  );
}

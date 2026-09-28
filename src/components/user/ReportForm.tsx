'use client';

import { useActionState, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { createReportAction, type ReportFormState } from '@/server/actions/report-actions';
import { DESCRIPTION_MAX, PHOTO_MAX_CHARS, PHOTO_TYPES, REPORT_CATEGORIES } from '@/lib/report';
import { validateReport, type ReportInput } from '@/lib/validation';
import { FormField, Notice, fieldClass } from './form';

export interface ReportFacilityOption {
  id: number;
  name: string;
}

/** Perkecil foto di browser: sisi terpanjang ≤ 1280 px, JPEG. Foto kamera HP jadi ± 200–400 KB. */
async function shrink(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const q of [0.8, 0.65, 0.5]) {
    const url = canvas.toDataURL('image/jpeg', q);
    if (url.length <= PHOTO_MAX_CHARS) return url;
  }
  throw new Error('too-large');
}

export default function ReportForm({
  facilities,
  initialFacilityId,
}: {
  facilities: ReportFacilityOption[];
  initialFacilityId: string;
}) {
  const [state, formAction, pending] = useActionState<ReportFormState, FormData>(createReportAction, { errors: {} });
  const [values, setValues] = useState<ReportInput>({
    facilityId: initialFacilityId,
    category: '',
    description: '',
    photo: '',
  });
  const [clientErrors, setClientErrors] = useState<ReportFormState['errors'] | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const errors = clientErrors ?? state.errors;
  const setField = (k: keyof ReportInput, v: string) => {
    setValues((p) => ({ ...p, [k]: v }));
    setClientErrors((p) => (p ? { ...p, [k]: undefined } : p));
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      setClientErrors((p) => ({ ...(p ?? {}), photo: 'Format foto harus JPG, PNG, atau WebP.' }));
      return;
    }
    setProcessing(true);
    try {
      setField('photo', await shrink(file));
    } catch {
      setClientErrors((p) => ({ ...(p ?? {}), photo: 'Foto tidak dapat diproses. Coba foto lain.' }));
    } finally {
      setProcessing(false);
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const found = validateReport(values);
    if (Object.keys(found).length) {
      e.preventDefault();
      setClientErrors(found);
      return;
    }
    setClientErrors(null);
  };

  const describe = (k: keyof ReportInput) => (errors[k] ? `${k}-error` : undefined);

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 md:p-8 space-y-5">
        {state.message && !clientErrors && <Notice tone="error">{state.message}</Notice>}

        <FormField id="facilityId" label="Fasilitas" error={errors.facilityId}>
          <select
            id="facilityId"
            name="facilityId"
            value={values.facilityId}
            onChange={(e) => setField('facilityId', e.target.value)}
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

        <FormField id="category" label="Kategori kerusakan" error={errors.category}>
          <select
            id="category"
            name="category"
            value={values.category}
            onChange={(e) => setField('category', e.target.value)}
            aria-invalid={!!errors.category}
            aria-describedby={describe('category')}
            className={fieldClass(errors.category)}
          >
            <option value="">Pilih kategori</option>
            {REPORT_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </FormField>

        <FormField
          id="description"
          label="Deskripsi masalah"
          error={errors.description}
          hint={`${values.description.trim().length}/${DESCRIPTION_MAX} karakter. Sebutkan lokasi persisnya (lantai, ruang, sisi).`}
        >
          <textarea
            id="description"
            name="description"
            rows={5}
            maxLength={DESCRIPTION_MAX}
            value={values.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Contoh: Proyektor di ruang 201 tidak menyala walaupun kabel daya sudah terpasang."
            aria-invalid={!!errors.description}
            aria-describedby={describe('description')}
            className={`${fieldClass(errors.description)} resize-y`}
          />
        </FormField>

        <FormField id="photo-input" label="Foto kerusakan (opsional)" error={errors.photo} hint="JPG, PNG, atau WebP. Foto akan diperkecil otomatis.">
          <input type="hidden" name="photo" value={values.photo} />
          <input
            ref={fileInput}
            id="photo-input"
            type="file"
            accept={PHOTO_TYPES.join(',')}
            onChange={onPhoto}
            className="sr-only"
            aria-describedby={describe('photo')}
          />
          {values.photo ? (
            <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau data URL lokal */}
              <img src={values.photo} alt="Pratinjau foto kerusakan" className="w-full h-48 object-cover" />
              <button
                type="button"
                onClick={() => setField('photo', '')}
                aria-label="Hapus foto"
                className="absolute top-2 right-2 grid place-items-center w-9 h-9 rounded-full bg-white text-red-600 shadow-sm hover:bg-red-50 transition"
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={processing}
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-sm font-semibold transition ${
                errors.photo ? 'border-red-300 text-red-600' : 'border-gray-200 text-[#0064D2] hover:border-[#0064D2] hover:bg-[#EBF3FF]'
              }`}
            >
              <ImagePlus className="w-7 h-7" aria-hidden />
              {processing ? 'Memproses foto…' : 'Pilih foto'}
            </button>
          )}
        </FormField>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6">
          <p className="text-xs font-semibold text-gray-500">Setelah dikirim</p>
          <ol className="mt-3 space-y-2 text-sm text-[#001741]">
            <li>1. Laporan berstatus <b>Baru</b>.</li>
            <li>2. Petugas meninjau dan mengubahnya menjadi <b>Diproses</b>.</li>
            <li>3. Laporan ditutup sebagai <b>Selesai</b> atau <b>Ditolak</b> beserta catatan dari petugas.</li>
          </ol>
          <button
            type="submit"
            disabled={pending || processing}
            className="mt-6 flex w-full justify-center bg-[#0064D2] text-white hover:bg-[#0056b3] px-6 py-3 rounded-2xl text-sm font-bold transition disabled:opacity-60 disabled:cursor-wait"
          >
            {pending ? 'Mengirim…' : 'Kirim Laporan'}
          </button>
        </div>
      </aside>
    </form>
  );
}

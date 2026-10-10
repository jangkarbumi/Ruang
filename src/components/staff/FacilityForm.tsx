'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { createFacilityAction, updateFacilityAction, type UpdateFacilityState } from '@/server/actions/admin-actions';
import { FACILITY_DESCRIPTION_MAX, FACILITY_TYPES, locationLabel, type Facility } from '@/lib/facility';
import { validateFacility, type FacilityInput } from '@/lib/validation';
import { FormField, Notice, fieldClass } from '@/components/user/form';

interface FacilityFormProps {
  facility?: Facility;
  locations: string[];
}

/** FR-16: admin menambah atau mengubah data fasilitas. Validasi yang sama dijalankan lagi di server. */
export default function FacilityForm({ facility, locations }: FacilityFormProps) {
  const formAction = facility ? updateFacilityAction : createFacilityAction;
  const [state, action, pending] = useActionState<UpdateFacilityState, FormData>(formAction, { errors: {} });
  const [v, setV] = useState<FacilityInput>({
    name: facility?.name ?? '',
    type: facility?.type ?? FACILITY_TYPES[0],
    location: facility?.location ?? locations[0] ?? '',
    capacity: facility ? String(facility.capacity) : '',
    description: facility?.description ?? '',
    imageUrl: facility?.imageUrl ?? '',
  });
  const [clientErrors, setClientErrors] = useState<UpdateFacilityState['errors'] | null>(null);
  const errors = clientErrors ?? state.errors;
  const set =
    (k: keyof FacilityInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setV((p) => ({ ...p, [k]: e.target.value }));
      setClientErrors((p) => (p ? { ...p, [k]: undefined } : p));
    };
  const describe = (k: keyof FacilityInput) => (errors[k] ? `${k}-error` : undefined);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const found = validateFacility(v, locations);
    if (Object.keys(found).length) {
      e.preventDefault();
      setClientErrors(found);
    } else setClientErrors(null);
  };

  return (
    <form action={action} onSubmit={onSubmit} noValidate className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 md:p-8 space-y-5">
      {facility && <input type="hidden" name="id" value={facility.id} />}
      {state.message && !clientErrors && <Notice tone="error">{state.message}</Notice>}

      <FormField id="name" label="Nama fasilitas" error={errors.name}>
        <input
          id="name"
          name="name"
          value={v.name}
          onChange={set('name')}
          placeholder="Misal: Aula Gedung A, Ruang Kelas 101"
          aria-invalid={!!errors.name}
          aria-describedby={describe('name')}
          className={fieldClass(errors.name)}
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="type" label="Tipe" error={errors.type}>
          <select
            id="type"
            name="type"
            value={v.type}
            onChange={set('type')}
            aria-invalid={!!errors.type}
            aria-describedby={describe('type')}
            className={fieldClass(errors.type)}
          >
            {FACILITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="capacity" label="Kapasitas (orang)" error={errors.capacity}>
          <input
            id="capacity"
            name="capacity"
            inputMode="numeric"
            value={v.capacity}
            onChange={set('capacity')}
            placeholder="Misal: 50"
            aria-invalid={!!errors.capacity}
            aria-describedby={describe('capacity')}
            className={fieldClass(errors.capacity)}
          />
        </FormField>
      </div>

      <FormField id="location" label="Lokasi" error={errors.location}>
        <select
          id="location"
          name="location"
          value={v.location}
          onChange={set('location')}
          aria-invalid={!!errors.location}
          aria-describedby={describe('location')}
          className={fieldClass(errors.location)}
        >
          {locations.map((l) => (
            <option key={l} value={l}>
              {locationLabel(l)}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        id="imageUrl"
        label="URL / Jalur Gambar Foto (opsional)"
        error={errors.imageUrl}
        hint="Contoh: /gedung-baru.jpg (file di public/) atau tautan gambar lengkap (https://...)."
      >
        <div className="space-y-3">
          <input
            id="imageUrl"
            name="imageUrl"
            value={v.imageUrl ?? ''}
            onChange={set('imageUrl')}
            placeholder="Misal: /gedung-baru.jpg atau https://..."
            aria-invalid={!!errors.imageUrl}
            aria-describedby={describe('imageUrl')}
            className={fieldClass(errors.imageUrl)}
          />
          {v.imageUrl?.trim() && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                <Image
                  src={v.imageUrl.trim()}
                  alt="Pratinjau foto"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="text-xs text-gray-500">
                <p className="font-semibold text-gray-700 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-[#0064D2]" /> Pratinjau Gambar
                </p>
                <p className="line-clamp-1 text-[11px] mt-0.5">{v.imageUrl.trim()}</p>
              </div>
            </div>
          )}
        </div>
      </FormField>

      <FormField
        id="description"
        label="Deskripsi (opsional)"
        error={errors.description}
        hint={`${v.description.trim().length}/${FACILITY_DESCRIPTION_MAX} karakter. Tampil di halaman detail fasilitas.`}
      >
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={FACILITY_DESCRIPTION_MAX}
          value={v.description}
          onChange={set('description')}
          placeholder="Jelaskan fasilitas yang disediakan, kelengkapan proyektor, sound system, dll..."
          aria-invalid={!!errors.description}
          aria-describedby={describe('description')}
          className={`${fieldClass(errors.description)} resize-y`}
        />
      </FormField>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-[#0064D2] text-white hover:bg-[#0056b3] px-6 py-3 rounded-2xl text-sm font-bold transition disabled:opacity-60"
        >
          {pending
            ? (facility ? 'Menyimpan…' : 'Menambahkan…')
            : (facility ? 'Simpan Perubahan' : 'Tambah Fasilitas')}
        </button>
        {!facility && (
          <Link
            href="/admin/fasilitas"
            className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition"
          >
            Batal
          </Link>
        )}
      </div>
    </form>
  );
}

'use client';

import { useActionState, useState } from 'react';
import { updateFacilityAction, type UpdateFacilityState } from '@/server/actions/admin-actions';
import { FACILITY_DESCRIPTION_MAX, FACILITY_TYPES, locationLabel, type Facility } from '@/lib/facility';
import { validateFacility, type FacilityInput } from '@/lib/validation';
import { FormField, Notice, fieldClass } from '@/components/user/form';

/** FR-16: admin mengubah data fasilitas. Validasi yang sama dijalankan lagi di server. */
export default function FacilityForm({ facility, locations }: { facility: Facility; locations: string[] }) {
  const [state, action, pending] = useActionState<UpdateFacilityState, FormData>(updateFacilityAction, { errors: {} });
  const [v, setV] = useState<FacilityInput>({
    name: facility.name,
    type: facility.type,
    location: facility.location,
    capacity: String(facility.capacity),
    description: facility.description ?? '',
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
      <input type="hidden" name="id" value={facility.id} />
      {state.message && !clientErrors && <Notice tone="error">{state.message}</Notice>}

      <FormField id="name" label="Nama fasilitas" error={errors.name}>
        <input
          id="name"
          name="name"
          value={v.name}
          onChange={set('name')}
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
          aria-invalid={!!errors.description}
          aria-describedby={describe('description')}
          className={`${fieldClass(errors.description)} resize-y`}
        />
      </FormField>

      <button
        type="submit"
        disabled={pending}
        className="bg-[#0064D2] text-white hover:bg-[#0056b3] px-6 py-3 rounded-2xl text-sm font-bold transition disabled:opacity-60"
      >
        {pending ? 'Menyimpan…' : 'Simpan Perubahan'}
      </button>
    </form>
  );
}

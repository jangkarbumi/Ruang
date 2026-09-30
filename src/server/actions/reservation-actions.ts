'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/server/session';
import { cancelReservation, createReservation } from '@/server/services/reservation-service';
import type { FieldErrors, ReservationInput } from '@/lib/validation';

export interface ReservationFormState {
  errors: FieldErrors<keyof ReservationInput>;
  message?: string;
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '');

export async function createReservationAction(
  _prev: ReservationFormState,
  fd: FormData,
): Promise<ReservationFormState> {
  const user = await requireUser('/reservasi/baru');
  const result = await createReservation(user, {
    facilityId: str(fd, 'facilityId'),
    date: str(fd, 'date'),
    start: str(fd, 'start'),
    end: str(fd, 'end'),
    purpose: str(fd, 'purpose'),
  });
  if (!result.ok) {
    return { errors: result.errors, message: 'Periksa kembali isian yang ditandai.' };
  }
  revalidatePath('/reservasi');
  revalidatePath('/fasilitas', 'layout');
  redirect(`/reservasi/${result.id}?status=terkirim`);
}

export interface CancelState {
  message?: string;
}

export async function cancelReservationAction(_prev: CancelState, fd: FormData): Promise<CancelState> {
  const user = await requireUser();
  const id = Number(fd.get('id'));
  const result = await cancelReservation(user, id);
  if (!result.ok) return { message: result.message };
  revalidatePath('/reservasi');
  revalidatePath('/fasilitas', 'layout');
  redirect(`/reservasi/${id}?status=dibatalkan`);
}

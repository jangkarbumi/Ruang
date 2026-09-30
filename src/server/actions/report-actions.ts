'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/server/session';
import { createReport } from '@/server/services/report-service';
import type { FieldErrors, ReportInput } from '@/lib/validation';

export interface ReportFormState {
  errors: FieldErrors<keyof ReportInput>;
  message?: string;
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '');

export async function createReportAction(_prev: ReportFormState, fd: FormData): Promise<ReportFormState> {
  const user = await requireUser('/laporan/baru');
  const result = await createReport(user, {
    facilityId: str(fd, 'facilityId'),
    category: str(fd, 'category'),
    description: str(fd, 'description'),
    photo: str(fd, 'photo'),
  });
  if (!result.ok) return { errors: result.errors, message: 'Periksa kembali isian yang ditandai.' };
  revalidatePath('/laporan');
  redirect(`/laporan/${result.id}?status=terkirim`);
}

import { PURPOSE_MAX, PURPOSE_MIN } from './reservation';
import { DESCRIPTION_MAX, DESCRIPTION_MIN, PHOTO_MAX_CHARS, REPORT_CATEGORIES } from './report';
import {
  FACILITY_CAPACITY_MAX,
  FACILITY_DESCRIPTION_MAX,
  FACILITY_NAME_MAX,
  FACILITY_NAME_MIN,
  isFacilityType,
} from './facility';
import { BOOKING_WINDOW_DAYS, addDays, isValidRange, toMinutes } from './slots';

/**
 * Validasi form yang dipakai DUA kali: di browser untuk umpan balik cepat,
 * dan di server sebagai penentu akhir (NFR-03, BR-03). Jangan hanya mengandalkan sisi browser.
 */

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export interface ReservationInput {
  facilityId: string;
  date: string;
  start: string;
  end: string;
  purpose: string;
}

export function validateReservation(v: ReservationInput, now: { date: string; minute: number }) {
  const e: FieldErrors<keyof ReservationInput> = {};

  if (!v.facilityId) e.facilityId = 'Pilih fasilitas.';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date)) e.date = 'Pilih tanggal.';
  else if (v.date < now.date) e.date = 'Tanggal sudah lewat.';
  else if (v.date > addDays(now.date, BOOKING_WINDOW_DAYS))
    e.date = `Reservasi hanya bisa diajukan hingga ${BOOKING_WINDOW_DAYS} hari ke depan.`;

  if (!v.start) e.start = 'Pilih jam mulai.';
  if (!v.end) e.end = 'Pilih jam selesai.';
  if (v.start && v.end) {
    if (!isValidRange(v.start, v.end)) {
      e.end = 'Waktu harus di antara 07.00–20.00, kelipatan 30 menit, dan jam selesai setelah jam mulai.';
    } else if (v.date === now.date && toMinutes(v.start) <= now.minute) {
      e.start = 'Jam mulai sudah lewat untuk hari ini.';
    }
  }

  const purpose = v.purpose.trim();
  if (purpose.length < PURPOSE_MIN) e.purpose = `Tuliskan tujuan penggunaan minimal ${PURPOSE_MIN} karakter.`;
  else if (purpose.length > PURPOSE_MAX) e.purpose = `Maksimal ${PURPOSE_MAX} karakter.`;

  return e;
}

export interface ReportInput {
  facilityId: string;
  category: string;
  description: string;
  photo: string;
}

export function validateReport(v: ReportInput) {
  const e: FieldErrors<keyof ReportInput> = {};
  if (!v.facilityId) e.facilityId = 'Pilih fasilitas.';
  if (!(REPORT_CATEGORIES as readonly string[]).includes(v.category)) e.category = 'Pilih kategori kerusakan.';

  const d = v.description.trim();
  if (d.length < DESCRIPTION_MIN) e.description = `Jelaskan masalahnya minimal ${DESCRIPTION_MIN} karakter.`;
  else if (d.length > DESCRIPTION_MAX) e.description = `Maksimal ${DESCRIPTION_MAX} karakter.`;

  if (v.photo) {
    if (!/^data:image\/(jpeg|png|webp);base64,/.test(v.photo)) e.photo = 'Format foto harus JPG, PNG, atau WebP.';
    else if (v.photo.length > PHOTO_MAX_CHARS) e.photo = 'Ukuran foto terlalu besar.';
  }
  return e;
}

export interface FacilityInput {
  name: string;
  type: string;
  location: string;
  capacity: string;
  description: string;
}

/** FR-16: ubah data fasilitas. `locations` = daftar unit yang sah. */
export function validateFacility(v: FacilityInput, locations: readonly string[]) {
  const e: FieldErrors<keyof FacilityInput> = {};
  const name = v.name.trim();
  if (name.length < FACILITY_NAME_MIN) e.name = `Nama minimal ${FACILITY_NAME_MIN} karakter.`;
  else if (name.length > FACILITY_NAME_MAX) e.name = `Nama maksimal ${FACILITY_NAME_MAX} karakter.`;

  if (!isFacilityType(v.type)) e.type = 'Pilih tipe fasilitas.';
  if (!locations.includes(v.location)) e.location = 'Pilih lokasi.';

  const cap = v.capacity.trim();
  if (!/^\d+$/.test(cap) || Number(cap) < 1) e.capacity = 'Kapasitas berupa bilangan bulat minimal 1.';
  else if (Number(cap) > FACILITY_CAPACITY_MAX)
    e.capacity = `Kapasitas maksimal ${FACILITY_CAPACITY_MAX.toLocaleString('id-ID')} orang.`;

  if (v.description.trim().length > FACILITY_DESCRIPTION_MAX)
    e.description = `Deskripsi maksimal ${FACILITY_DESCRIPTION_MAX} karakter.`;
  return e;
}

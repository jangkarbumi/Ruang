/**
 * Aturan waktu reservasi (SRS 2.1, BR-01, BR-02).
 * Dipakai tampilan untuk menggambar kalender, dan nanti oleh server untuk validasi (BR-03).
 */

export const TIMEZONE = "Asia/Jakarta";
export const OPENING_MINUTE = 7 * 60; // 07.00
export const CLOSING_MINUTE = 20 * 60; // 20.00
export const SLOT_MINUTES = 30;
/** Seberapa jauh ke depan jadwal bisa dilihat. */
export const BOOKING_WINDOW_DAYS = 30;

export type SlotState = "tersedia" | "terisi" | "lewat";

export interface Slot {
  start: string; // "HH:MM"
  end: string;
  state: SlotState;
}

export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 07.00–20.00 dipecah per 30 menit → 26 slot. */
export function slotTimes() {
  const out: { start: string; end: string }[] = [];
  for (let t = OPENING_MINUTE; t < CLOSING_MINUTE; t += SLOT_MINUTES) {
    out.push({ start: fromMinutes(t), end: fromMinutes(t + SLOT_MINUTES) });
  }
  return out;
}

/** Validasi rentang waktu reservasi. Wajib dipanggil juga di server (AC-02). */
export function isValidRange(start: string, end: string) {
  const s = toMinutes(start);
  const e = toMinutes(end);
  return (
    s >= OPENING_MINUTE &&
    e <= CLOSING_MINUTE &&
    e > s &&
    s % SLOT_MINUTES === 0 &&
    e % SLOT_MINUTES === 0
  );
}

/* ---------- Tanggal (selalu dalam WIB) ---------- */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Tanggal & menit saat ini menurut zona waktu Jakarta. */
export function nowInJakarta(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minute: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/** Date → { tanggal "YYYY-MM-DD", jam "HH:MM" } dalam WIB. */
export function toJakarta(d: Date) {
  const { date, minute } = nowInJakarta(d);
  return { date, time: fromMinutes(minute) };
}

/** Tanggal + jam WIB → Date (untuk kolom startTime/endTime). */
export function fromJakarta(isoDate: string, hhmm: string) {
  return new Date(`${isoDate}T${hhmm}:00+07:00`);
}

export function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Terima `?tanggal=` hanya jika formatnya benar dan berada di jendela pemesanan. */
export function clampDate(input: unknown, today: string) {
  const last = addDays(today, BOOKING_WINDOW_DAYS);
  if (typeof input !== "string" || !ISO_DATE.test(input)) return today;
  if (input < today) return today;
  if (input > last) return last;
  return input;
}

export function formatDateLong(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("id-ID", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "09:30" → "09.30" (penulisan jam baku Bahasa Indonesia). */
export function formatTime(hhmm: string) {
  return hhmm.replace(":", ".");
}

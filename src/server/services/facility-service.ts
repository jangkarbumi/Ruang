import { FACILITIES, LOCATIONS } from "@/server/data/facilities";
import { approvedIntervals, store } from "@/server/data/store";
import { isFacilityType, type Facility, type FacilityStatus } from "@/lib/facility";
import { validateFacility, type FacilityInput, type FieldErrors } from "@/lib/validation";
import { slotTimes, toJakarta, toMinutes, type Slot } from "@/lib/slots";

/**
 * Logika baca fasilitas untuk halaman publik.
 * Saat database siap, ganti isi fungsi dengan query Prisma — tanda tangan fungsinya tetap.
 */

export interface FacilityFilter {
  q?: string;
  type?: string;
  location?: string;
  minCapacity?: number;
}

/** Data fasilitas + perubahan admin (FR-16) + status terbaru yang diubah petugas/admin (FR-12, FR-16). */
function all(): Facility[] {
  const { facilityEdits, facilityStatus } = store();
  return FACILITIES.map((f) => ({ ...f, ...facilityEdits[f.id], status: facilityStatus[f.id] ?? f.status }));
}

/** Fasilitas NONAKTIF tidak pernah terlihat oleh pengunjung. */
function visible(f: Facility) {
  return f.status !== "NONAKTIF";
}

export async function listFacilities(filter: FacilityFilter = {}): Promise<Facility[]> {
  const q = filter.q?.trim().toLowerCase();
  return all().filter(visible).filter((f) => {
    if (q && !f.name.toLowerCase().includes(q)) return false;
    if (isFacilityType(filter.type) && f.type !== filter.type) return false;
    if (filter.location && f.location !== filter.location) return false;
    if (filter.minCapacity && f.capacity < filter.minCapacity) return false;
    return true;
  });
}

export async function getFacility(id: number): Promise<Facility | null> {
  const f = all().find((x) => x.id === id);
  return f && visible(f) ? f : null;
}

/** FR-12: petugas menandai fasilitas dalam perbaikan / mengembalikannya ke aktif. */
export async function setFacilityStatus(id: number, status: Extract<FacilityStatus, "AKTIF" | "PERBAIKAN">) {
  const f = await getFacility(id);
  if (!f) return false;
  store().facilityStatus[id] = status;
  return true;
}

export async function listLocations(): Promise<string[]> {
  return LOCATIONS;
}

/* ------------------------------------------------------------------ */
/* Admin — FR-16                                                        */
/* ------------------------------------------------------------------ */

/** Semua fasilitas termasuk yang nonaktif — hanya untuk admin. */
export async function listAllFacilities(): Promise<Facility[]> {
  return all();
}

/**
 * Fasilitas berdasarkan id tanpa memandang status. Dipakai untuk menampilkan riwayat
 * reservasi & laporan, agar fasilitas yang sudah dinonaktifkan tetap terbaca namanya.
 */
export async function findFacility(id: number): Promise<Facility | null> {
  return all().find((x) => x.id === id) ?? null;
}

export type UpdateFacilityResult =
  | { ok: true; facility: Facility }
  | { ok: false; errors: FieldErrors<keyof FacilityInput>; message?: string };

export async function updateFacility(id: number, input: FacilityInput): Promise<UpdateFacilityResult> {
  const current = await findFacility(id);
  if (!current) return { ok: false, errors: {}, message: "Fasilitas tidak ditemukan." };

  const errors = validateFacility(input, LOCATIONS);
  if (Object.keys(errors).length) return { ok: false, errors };

  const name = input.name.trim().replace(/\s+/g, " ");
  // Nama dipakai orang untuk mencari fasilitas — jangan sampai ada dua yang sama persis
  if (all().some((f) => f.id !== id && f.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, errors: { name: "Nama ini sudah dipakai fasilitas lain." } };
  }

  store().facilityEdits[id] = {
    name,
    type: input.type as Facility["type"],
    location: input.location,
    capacity: Number(input.capacity),
    description: input.description.trim() || null,
  };
  return { ok: true, facility: (await findFacility(id))! };
}

/** Reservasi yang masih berjalan (menunggu/disetujui dan belum lewat) pada sebuah fasilitas. */
export async function upcomingReservationCount(id: number, now = new Date()) {
  return store().reservations.filter(
    (r) => r.facilityId === id && (r.status === "PENDING" || r.status === "APPROVED") && r.endTime > now,
  ).length;
}

/**
 * FR-16: nonaktifkan / aktifkan kembali. Fasilitas nonaktif hilang dari katalog publik,
 * tidak bisa direservasi atau dilaporkan, dan pengajuan yang menunggu tidak bisa disetujui.
 * Data reservasi lamanya tetap disimpan untuk riwayat & rekap.
 */
export async function setFacilityActive(id: number, active: boolean) {
  const f = await findFacility(id);
  if (!f) return false;
  if (active && f.status !== "NONAKTIF") return false;
  if (!active && f.status === "NONAKTIF") return false;
  store().facilityStatus[id] = active ? "AKTIF" : "NONAKTIF";
  return true;
}

/**
 * Ketersediaan per slot untuk satu tanggal.
 * Hanya mengembalikan status — tanpa pemohon atau tujuan (BR-05, AC-01).
 *
 * `now` = tanggal & menit WIB saat ini; slot yang sudah lewat hari ini ditandai "lewat".
 */
export async function getAvailability(
  facility: Facility,
  date: string,
  now: { date: string; minute: number },
): Promise<Slot[]> {
  const booked = dummyBookedStarts(facility.id, date);
  const approved = approvedIntervals(facility.id, date);
  return slotTimes().map(({ start, end }) => {
    const m = toMinutes(start);
    const taken = booked.has(start) || approved.some((r) => m >= r.from && m < r.to);
    let state: Slot["state"] = taken ? "terisi" : "tersedia";
    if (date === now.date && toMinutes(start) <= now.minute) state = "lewat";
    return { start, end, state };
  });
}

/* ------------------------------------------------------------------ */
/* SEMENTARA: jadwal terisi buatan, stabil per fasilitas + tanggal.     */
/* Ganti dengan query Reservation berstatus APPROVED/PENDING.          */
/* ------------------------------------------------------------------ */

function dummyBookedStarts(facilityId: number, date: string) {
  let seed = facilityId * 7919 + Number(date.replaceAll("-", ""));
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const times = slotTimes();
  const out = new Set<string>();
  const blocks = 1 + Math.floor(rand() * 3); // 1–3 reservasi per hari
  for (let b = 0; b < blocks; b++) {
    const length = 2 + Math.floor(rand() * 5); // 1–3 jam
    const first = Math.floor(rand() * (times.length - length));
    for (let i = 0; i < length; i++) out.add(times[first + i].start);
  }
  // Jangan menimpa jam yang sudah dipakai reservasi di penyimpanan (menunggu/disetujui),
  // agar data contoh tidak bentrok secara acak dan tidak terjadi dobel pesan.
  for (const r of store().reservations) {
    if (r.facilityId !== facilityId || (r.status !== "PENDING" && r.status !== "APPROVED")) continue;
    const s = toJakarta(r.startTime);
    if (s.date !== date) continue;
    const from = toMinutes(s.time);
    const to = toMinutes(toJakarta(r.endTime).time);
    for (const t of times) {
      const m = toMinutes(t.start);
      if (m >= from && m < to) out.delete(t.start);
    }
  }
  return out;
}

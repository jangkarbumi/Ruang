import { LOCATIONS } from "@/server/data/facilities";
import { db } from "@/server/db";
import { isFacilityType, type Facility, type FacilityStatus } from "@/lib/facility";
import { validateFacility, type FacilityInput, type FieldErrors } from "@/lib/validation";
import { slotTimes, toJakarta, toMinutes, type Slot } from "@/lib/slots";

export interface FacilityFilter {
  q?: string;
  type?: string;
  location?: string;
  minCapacity?: number;
}

export async function listFacilities(filter: FacilityFilter = {}) {
  const q = filter.q?.trim();
  const records = await db.facility.findMany({
    where: {
      status: { not: "NONAKTIF" }, // Fasilitas NONAKTIF tidak pernah terlihat oleh pengunjung.
      ...(q && { name: { contains: q, mode: 'insensitive' } }),
      ...(isFacilityType(filter.type) && { type: filter.type }),
      ...(filter.location && { location: filter.location }),
      ...(filter.minCapacity && { capacity: { gte: filter.minCapacity } }),
    },
    orderBy: { name: 'asc' },
  });
  return records.map(f => ({ ...f, type: f.type as Facility["type"], status: f.status as FacilityStatus }));
}

export async function getFacility(id: number) {
  const f = await db.facility.findUnique({ where: { id } });
  if (!f || f.status === "NONAKTIF") return null;
  return { ...f, type: f.type as Facility["type"], status: f.status as FacilityStatus };
}

/** FR-12: petugas menandai fasilitas dalam perbaikan / mengembalikannya ke aktif. */
export async function setFacilityStatus(id: number, status: Extract<FacilityStatus, "AKTIF" | "PERBAIKAN">) {
  const f = await db.facility.findUnique({ where: { id } });
  if (!f || f.status === "NONAKTIF") return false;
  await db.facility.update({ where: { id }, data: { status } });
  return true;
}

export async function listLocations(): Promise<string[]> {
  return LOCATIONS;
}

/* ------------------------------------------------------------------ */
/* Admin — FR-16                                                      */
/* ------------------------------------------------------------------ */

/** Semua fasilitas termasuk yang nonaktif — hanya untuk admin. */
export async function listAllFacilities() {
  const records = await db.facility.findMany({ orderBy: { name: 'asc' } });
  return records.map(f => ({ ...f, type: f.type as Facility["type"], status: f.status as FacilityStatus }));
}

export async function findFacility(id: number) {
  const f = await db.facility.findUnique({ where: { id } });
  if (!f) return null;
  return { ...f, type: f.type as Facility["type"], status: f.status as FacilityStatus };
}

export type UpdateFacilityResult =
  | { ok: true; facility: Facility }
  | { ok: false; errors: FieldErrors<keyof FacilityInput>; message?: string };

export async function updateFacility(id: number, input: FacilityInput): Promise<UpdateFacilityResult> {
  const current = await db.facility.findUnique({ where: { id } });
  if (!current) return { ok: false, errors: {}, message: "Fasilitas tidak ditemukan." };

  const errors = validateFacility(input, LOCATIONS);
  if (Object.keys(errors).length) return { ok: false, errors };

  const name = input.name.trim().replace(/\s+/g, " ");
  // Nama dipakai orang untuk mencari fasilitas — jangan sampai ada dua yang sama persis
  const existing = await db.facility.findFirst({ where: { name: { equals: name, mode: 'insensitive' }, id: { not: id } } });
  if (existing) {
    return { ok: false, errors: { name: "Nama ini sudah dipakai fasilitas lain." } };
  }

  const updated = await db.facility.update({
    where: { id },
    data: {
      name,
      type: input.type,
      location: input.location,
      capacity: Number(input.capacity),
      description: input.description.trim() || null,
    }
  });
  return { ok: true, facility: { ...updated, type: updated.type as Facility["type"], status: updated.status as FacilityStatus } };
}

/** Reservasi yang masih berjalan (menunggu/disetujui dan belum lewat) pada sebuah fasilitas. */
export async function upcomingReservationCount(id: number, now = new Date()) {
  return db.reservation.count({
    where: {
      facilityId: id,
      status: { in: ["PENDING", "APPROVED"] },
      endTime: { gt: now }
    }
  });
}

/**
 * FR-16: nonaktifkan / aktifkan kembali.
 */
export async function setFacilityActive(id: number, active: boolean) {
  const f = await db.facility.findUnique({ where: { id } });
  if (!f) return false;
  if (active && f.status !== "NONAKTIF") return false;
  if (!active && f.status === "NONAKTIF") return false;
  await db.facility.update({ where: { id }, data: { status: active ? "AKTIF" : "NONAKTIF" } });
  return true;
}

/**
 * Ketersediaan per slot untuk satu tanggal.
 */
export async function getAvailability(
  facility: { id: number },
  date: string,
  now: { date: string; minute: number },
): Promise<Slot[]> {
  // Ambil semua reservasi yang disetujui pada tanggal tsb
  const approved = await db.reservation.findMany({
    where: {
      facilityId: facility.id,
      status: "APPROVED",
    }
  });

  const approvedIntervals = approved
    .map(r => {
      const s = toJakarta(r.startTime);
      const e = toJakarta(r.endTime);
      if (s.date !== date) return null;
      return { from: toMinutes(s.time), to: toMinutes(e.time) };
    })
    .filter(Boolean) as { from: number; to: number }[];

  return slotTimes().map(({ start, end }) => {
    const m = toMinutes(start);
    const taken = approvedIntervals.some((r) => m >= r.from && m < r.to);
    let state: Slot["state"] = taken ? "terisi" : "tersedia";
    if (date === now.date && toMinutes(start) <= now.minute) state = "lewat";
    return { start, end, state };
  });
}

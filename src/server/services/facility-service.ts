import { db } from "@/server/db";

import { isFacilityType, type Facility, type FacilityStatus } from "@/lib/facility";
import { validateFacility, type FacilityInput, type FieldErrors } from "@/lib/validation";
import { slotTimes, toJakarta, toMinutes, type Slot } from "@/lib/slots";

const UNIV = "Universitas";
const FIB = "Fakultas Ilmu Budaya";
const FT = "Fakultas Teknik";
const FISIP = "Fakultas Ilmu Sosial dan Ilmu Politik";
const FH = "Fakultas Hukum";
const FSM = "Fakultas Sains dan Matematika";
const FPIK = "Fakultas Perikanan dan Ilmu Kelautan";

export const LOCATIONS = [UNIV, FIB, FT, FISIP, FH, FSM, FPIK];

export interface FacilityFilter {
  q?: string;
  type?: string;
  location?: string;
  minCapacity?: number;
}

export async function listFacilities(filter: FacilityFilter = {}): Promise<Facility[]> {
  const q = filter.q?.trim();
  
  const records = await db.facility.findMany({
    where: {
      status: { not: "NONAKTIF" },
      ...(q && { name: { contains: q, mode: 'insensitive' } }),
      ...(isFacilityType(filter.type) && { type: filter.type }),
      ...(filter.location && { location: filter.location }),
      ...(filter.minCapacity && { capacity: { gte: filter.minCapacity } }),
    },
    orderBy: { name: 'asc' },
  });
  return records.map((f) => ({
    ...f,
    type: f.type as Facility["type"],
    status: f.status as FacilityStatus,
  }));
}

export async function getFacility(id: number): Promise<Facility | null> {
  const f = await db.facility.findUnique({ where: { id } });
  if (!f || f.status === "NONAKTIF") return null;
  return { ...f, type: f.type as Facility["type"], status: f.status as FacilityStatus };
}

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
/* Admin — FR-16                                                        */
/* ------------------------------------------------------------------ */

export async function listAllFacilities(): Promise<Facility[]> {
  const records = await db.facility.findMany({ orderBy: { name: 'asc' } });
  return records.map((f) => ({ ...f, type: f.type as Facility["type"], status: f.status as FacilityStatus }));
}

export async function findFacility(id: number): Promise<Facility | null> {
  const f = await db.facility.findUnique({ where: { id } });
  if (!f) return null;
  return { ...f, type: f.type as Facility["type"], status: f.status as FacilityStatus };
}

export type CreateFacilityResult =
  | { ok: true; facility: Facility }
  | { ok: false; errors: FieldErrors<keyof FacilityInput>; message?: string };

export async function createFacility(input: FacilityInput): Promise<CreateFacilityResult> {
  const errors = validateFacility(input, LOCATIONS);
  if (Object.keys(errors).length) return { ok: false, errors };

  const name = input.name.trim().replace(/\s+/g, ' ');

  const existing = await db.facility.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
    },
  });
  if (existing) {
    return { ok: false, errors: { name: 'Nama fasilitas ini sudah dipakai fasilitas lain.' } };
  }

  const created = await db.facility.create({
    data: {
      name,
      type: input.type as Facility['type'],
      location: input.location,
      capacity: Number(input.capacity),
      description: input.description.trim() || null,
      imageUrl: input.imageUrl?.trim() || null,
      status: 'AKTIF',
    },
  });

  return { ok: true, facility: created as Facility };
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
  
  const existing = await db.facility.findFirst({
    where: {
      id: { not: id },
      name: { equals: name, mode: 'insensitive' }
    }
  });
  if (existing) {
    return { ok: false, errors: { name: "Nama ini sudah dipakai fasilitas lain." } };
  }

  const updated = await db.facility.update({
    where: { id },
    data: {
      name,
      type: input.type as Facility["type"],
      location: input.location,
      capacity: Number(input.capacity),
      description: input.description.trim() || null,
      imageUrl: input.imageUrl !== undefined ? (input.imageUrl.trim() || null) : current.imageUrl,
    }
  });
  return { ok: true, facility: updated as Facility };
}

export async function upcomingReservationCount(id: number, now = new Date()) {
  return await db.reservation.count({
    where: {
      facilityId: id,
      status: { in: ['PENDING', 'APPROVED'] },
      endTime: { gt: now }
    }
  });
}

export async function setFacilityActive(id: number, active: boolean) {
  const f = await findFacility(id);
  if (!f) return false;
  if (active && f.status !== "NONAKTIF") return false;
  if (!active && f.status === "NONAKTIF") return false;
  
  await db.facility.update({
    where: { id },
    data: { status: active ? "AKTIF" : "NONAKTIF" }
  });
  return true;
}

export async function getAvailability(
  f: { id: number; status?: FacilityStatus },
  date: string,
  now: { date: string; minute: number }
): Promise<Slot[]> {
  // Hanya reservasi APPROVED yang menandai slot terisi (BR-04, AC-03)
  const [approved, maintenance] = await Promise.all([
    db.reservation.findMany({
      where: {
        facilityId: f.id,
        status: "APPROVED",
      }
    }),
    db.maintenance.findFirst({
      where: {
        facilityId: f.id,
        startDate: { lte: new Date(`${date}T23:59:59+07:00`) },
        endDate: { gte: new Date(`${date}T00:00:00+07:00`) },
      }
    })
  ]);

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
    let state: Slot['state'] = taken ? 'terisi' : 'tersedia';
    // BR-08, AC-07: Fasilitas tidak aktif atau dalam jadwal perbaikan tidak tersedia
    if ((f.status && f.status !== 'AKTIF') || Boolean(maintenance)) state = 'terisi';
    if (date === now.date && toMinutes(start) <= now.minute) state = 'lewat';
    return { start, end, state };
  });
}



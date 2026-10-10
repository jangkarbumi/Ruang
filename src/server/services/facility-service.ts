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

function visible(f: Facility) {
  return f.status !== "NONAKTIF";
}

export async function listFacilities(filter: FacilityFilter = {}): Promise<Facility[]> {
  const q = filter.q?.trim().toLowerCase();
  
  const where: any = { status: { not: "NONAKTIF" } };
  if (filter.type && isFacilityType(filter.type)) where.type = filter.type;
  if (filter.location) where.location = filter.location;
  if (filter.minCapacity) where.capacity = { gte: filter.minCapacity };

  let facilities = (await db.facility.findMany({ where, orderBy: { id: 'asc' } })) as Facility[];
  
  if (q) {
    facilities = facilities.filter((f) => f.name.toLowerCase().includes(q));
  }
  
  return facilities;
}

export async function getFacility(id: number): Promise<Facility | null> {
  const f = await db.facility.findUnique({ where: { id } }) as Facility | null;
  return f && visible(f) ? f : null;
}

export async function setFacilityStatus(id: number, status: Extract<FacilityStatus, "AKTIF" | "PERBAIKAN">) {
  const f = await getFacility(id);
  if (!f) return false;
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
  return (await db.facility.findMany({ orderBy: { id: 'asc' } })) as Facility[];
}

export async function findFacility(id: number): Promise<Facility | null> {
  return (await db.facility.findUnique({ where: { id } })) as Facility | null;
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
  f: Facility,
  date: string,
  now: { date: string; minute: number }
): Promise<Slot[]> {
  const startOfDay = new Date(date + 'T00:00:00+07:00');
  const endOfDay = new Date(date + 'T23:59:59+07:00');

  const reservations = await db.reservation.findMany({
    where: {
      facilityId: f.id,
      status: { in: ['PENDING', 'APPROVED'] },
      startTime: { gte: startOfDay, lte: endOfDay }
    }
  });

  const booked = new Set<string>();
  for (const r of reservations) {
    const s = toJakarta(r.startTime);
    const from = toMinutes(s.time);
    const to = toMinutes(toJakarta(r.endTime).time);
    for (const t of slotTimes()) {
      const m = toMinutes(t.start);
      if (m >= from && m < to) booked.add(t.start);
    }
  }

  return slotTimes().map(({ start, end }) => {
    let state: Slot['state'] = booked.has(start) ? 'terisi' : 'tersedia';
    if (f.status !== 'AKTIF') state = 'terisi';
    if (date === now.date && toMinutes(start) <= now.minute) state = 'lewat';
    return { start, end, state };
  });
}



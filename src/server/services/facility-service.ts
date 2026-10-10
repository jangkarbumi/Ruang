import { db } from "@/server/db";
import { approvedIntervals, store } from "@/server/data/store";
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
  return store().reservations.filter(
    (r) => r.facilityId === id && (r.status === "PENDING" || r.status === "APPROVED") && r.endTime > now,
  ).length;
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

function dummyBookedStarts(facilityId: number, date: string) {
  let seed = facilityId * 7919 + Number(date.replaceAll("-", ""));
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const times = slotTimes();
  const out = new Set<string>();
  const blocks = 1 + Math.floor(rand() * 3);
  for (let b = 0; b < blocks; b++) {
    const length = 2 + Math.floor(rand() * 5);
    const first = Math.floor(rand() * (times.length - length));
    for (let i = 0; i < length; i++) out.add(times[first + i].start);
  }
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

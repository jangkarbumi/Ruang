/**
 * Tipe & konstanta fasilitas yang dipakai bersama oleh server dan tampilan.
 * Bentuknya mengikuti model `Facility` di prisma/schema.prisma.
 */

export type FacilityStatus = "AKTIF" | "PERBAIKAN" | "NONAKTIF";

export interface Facility {
  id: number;
  name: string;
  type: FacilityType;
  location: string;
  capacity: number;
  description: string | null;
  status: FacilityStatus;
  imageUrl?: string;
}

export const FACILITY_STATUS: Record<FacilityStatus, { label: string; className: string }> = {
  AKTIF: { label: "Aktif", className: "bg-emerald-100 text-emerald-700" },
  PERBAIKAN: { label: "Dalam perbaikan", className: "bg-amber-100 text-amber-700" },
  NONAKTIF: { label: "Nonaktif", className: "bg-gray-100 text-gray-600" },
};

/** Batas isian saat admin mengubah data fasilitas (FR-16). */
export const FACILITY_NAME_MIN = 3;
export const FACILITY_NAME_MAX = 100;
export const FACILITY_CAPACITY_MAX = 100_000;
export const FACILITY_DESCRIPTION_MAX = 1000;

export const FACILITY_TYPES = ["Gedung", "Aula", "Ruangan", "Lapangan", "Area Terbuka"] as const;
export type FacilityType = (typeof FACILITY_TYPES)[number];

/** Nilai `location` untuk fasilitas yang dikelola langsung oleh universitas. */
export const UNIVERSITY_LOCATION = "Universitas";

export const CAPACITY_OPTIONS = [
  { value: 0, label: "Semua kapasitas" },
  { value: 50, label: "≥ 50 orang" },
  { value: 100, label: "≥ 100 orang" },
  { value: 300, label: "≥ 300 orang" },
  { value: 1000, label: "≥ 1.000 orang" },
] as const;

export function locationLabel(location: string) {
  return location === UNIVERSITY_LOCATION ? "Tingkat Universitas" : location;
}

export function isFacilityType(value: unknown): value is FacilityType {
  return typeof value === "string" && (FACILITY_TYPES as readonly string[]).includes(value);
}

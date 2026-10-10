import type { Facility } from "@/lib/facility";

/**
 * DATA SEMENTARA — dipakai sampai tabel `Facility` di database terisi.
 * Bentuknya sama dengan model Prisma, jadi file ini juga bisa dijadikan seed.
 *
 * ⚠ `capacity` masih PERKIRAAN (schema mewajibkan angka). Ganti dengan data resmi.
 * ⚠ `status: "PERBAIKAN"` pada Lapangan Tenis hanya untuk menguji tampilan AC-07.
 */

const FIB = "Fakultas Ilmu Budaya";
const FT = "Fakultas Teknik";
const FISIP = "Fakultas Ilmu Sosial dan Ilmu Politik";
const FH = "Fakultas Hukum";
const FSM = "Fakultas Sains dan Matematika";
const FPIK = "Fakultas Perikanan dan Ilmu Kelautan";
const UNIV = "Universitas";

export const FACILITIES: Facility[] = [
  // Tingkat universitas
  { id: 1, name: "Gedung Prof. Soedarto, SH", type: "Aula", location: UNIV, capacity: 1500, description: "Gedung serbaguna yang digunakan untuk mengadakan acara.", status: "AKTIF", imageUrl: "/ProfSoedarto.jpg" },
  { id: 2, name: "Gedung Serba Guna (GSG) Undip", type: "Aula", location: UNIV, capacity: 1000, description: null, status: "AKTIF", imageUrl: "/muladi dome atau gsg.jpg" },
  { id: 3, name: "Gedung Widya Puraya", type: "Gedung", location: UNIV, capacity: 500, description: null, status: "AKTIF", imageUrl: "/Gedung-WP.jpg" },
  { id: 4, name: "Gedung ICT Center", type: "Gedung", location: UNIV, capacity: 200, description: null, status: "AKTIF", imageUrl: "/ict.jpg" },
  { id: 5, name: "Stadion Olahraga Undip", type: "Lapangan", location: UNIV, capacity: 5000, description: null, status: "AKTIF", imageUrl: "/Stadion Olahraga Undip.jpg" },
  { id: 6, name: "Lapangan Tenis Undip", type: "Lapangan", location: UNIV, capacity: 40, description: null, status: "PERBAIKAN", imageUrl: "/tenis.png" },

  // Fakultas Ilmu Budaya
  { id: 7, name: "Gedung A FIB", type: "Gedung", location: FIB, capacity: 300, description: null, status: "AKTIF", imageUrl: "/gsgFIB.png" }, // Fallback since no specific A FIB image
  { id: 8, name: "Gedung B FIB", type: "Gedung", location: FIB, capacity: 300, description: null, status: "AKTIF", imageUrl: "/Gedung-B-.webp" },
  { id: 9, name: "Gedung C FIB", type: "Gedung", location: FIB, capacity: 300, description: null, status: "AKTIF", imageUrl: "/Gedung-C.webp" },
  { id: 10, name: "Gedung D FIB", type: "Gedung", location: FIB, capacity: 300, description: null, status: "AKTIF", imageUrl: "/gedung d.webp" },
  { id: 11, name: "Gedung E Hall Art Center FIB", type: "Aula", location: FIB, capacity: 250, description: null, status: "AKTIF", imageUrl: "/Gedung-E-scaled.webp" },
  { id: 12, name: "Gedung Serbaguna FIB", type: "Aula", location: FIB, capacity: 600, description: "Gedung serbaguna berkapasitas besar yang sering digunakan untuk acara pada FIB.", status: "AKTIF", imageUrl: "/gsgFIB.png" },

  // Fakultas Teknik
  { id: 13, name: "Gedung Prof. Ir. Eko Budihardjo, M.Sc.", type: "Gedung", location: FT, capacity: 500, description: null, status: "AKTIF", imageUrl: "/Gedung Prof. Ir. Eko Budihardjo, M.Sc..jpg" },

  // FISIP
  { id: 14, name: "Gedung A FISIP", type: "Gedung", location: FISIP, capacity: 300, description: null, status: "AKTIF", imageUrl: "/a fisip.webp" },
  { id: 15, name: "Gedung B FISIP", type: "Gedung", location: FISIP, capacity: 300, description: null, status: "AKTIF", imageUrl: "/fisip b.jpg" },
  { id: 16, name: "Gedung C FISIP", type: "Gedung", location: FISIP, capacity: 300, description: null, status: "AKTIF", imageUrl: "/c fisip.png" },
  { id: 17, name: "Gedung D FISIP", type: "Gedung", location: FISIP, capacity: 300, description: null, status: "AKTIF", imageUrl: "/d fisip.png" },
  { id: 18, name: "IKA FISIP Co-Working Space", type: "Ruangan", location: FISIP, capacity: 40, description: null, status: "AKTIF", imageUrl: "/co work.png" },

  // Fakultas Hukum
  { id: 19, name: "Ruang Fiat Justitia", type: "Ruangan", location: FH, capacity: 150, description: null, status: "AKTIF", imageUrl: "/Ruang Fiat Justitia.jpg" },
  { id: 20, name: "Gedung Prof. Purwahid Patrik", type: "Gedung", location: FH, capacity: 300, description: null, status: "AKTIF", imageUrl: "/Gedung Prof. Purwahid Patrik.jpg" },
  { id: 21, name: "Gedung Prof. Satjipto Rahardjo", type: "Gedung", location: FH, capacity: 300, description: null, status: "AKTIF", imageUrl: "/Gedung Prof. Satjipto Rahardjo.jpg" },
  { id: 22, name: "Serambi Inspirasi FH", type: "Ruangan", location: FH, capacity: 50, description: null, status: "AKTIF", imageUrl: "/Serambi Inspirasi FH.jpg" },
  { id: 23, name: "Beranda Kreativitas FH", type: "Ruangan", location: FH, capacity: 50, description: null, status: "AKTIF", imageUrl: "/Beranda Kreativitas FH.jpg" },

  // Fakultas Sains dan Matematika
  { id: 24, name: "Gedung G FSM", type: "Gedung", location: FSM, capacity: 300, description: null, status: "AKTIF", imageUrl: "/Gedung G FSM.jpg" },
  { id: 25, name: "Gedung AP (Acintya Prasada)", type: "Gedung", location: FSM, capacity: 400, description: null, status: "AKTIF", imageUrl: "/Gedung AP (Acintya Prasada).jpg" },
  { id: 26, name: "Lapangan Olahraga FSM", type: "Lapangan", location: FSM, capacity: 200, description: null, status: "AKTIF", imageUrl: "/Lapangan Olahraga FSM.png" },
  { id: 27, name: "Gazebo FSM", type: "Area Terbuka", location: FSM, capacity: 20, description: null, status: "AKTIF", imageUrl: "/gazebo fsm.png" },

  // FPIK
  { id: 28, name: "Auditorium FPIK", type: "Aula", location: FPIK, capacity: 400, description: null, status: "AKTIF", imageUrl: "/fpik.png" },
];

/** Urutan unit untuk filter lokasi — universitas dulu, lalu fakultas sesuai daftar resmi. */
export const LOCATIONS = [UNIV, FIB, FT, FISIP, FH, FSM, FPIK];

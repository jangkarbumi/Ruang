## Software Requirements Specification (SRS)

## Sistem Reservasi & Pelaporan Fasilitas Kampus.

## 1. Pendahuluan

## 1.1 Tujuan Dokumen

SRS ini mendefinisikan kebutuhan fungsional dan nonfungsional untuk Sistem Reservasi & Pelaporan

Fasilitas Kampus. Dokumen menjadi acuan bersama bagi tim saat merancang basis data, antarmuka, proses bisnis, implementasi, dan pengujian.

## 1.2 Ruang Lingkup Produk

Sistem berupa aplikasi web untuk mengelola penggunaan fasilitas kampus seperti ruang kelas, aula,

laboratorium, alat, dan lapangan. Pengguna dapat melihat ketersediaan, mengajukan reservasi, dan melaporkan kerusakan. Petugas dan admin memproses alur reservasi serta laporan secara terpusat.

## 1.3 Aktor

| Aktor | Deskripsi | Akses Utama |
| --- | --- | --- |
| Pengunjung | Pengguna tanpa login. | Melihat daftar fasilitas, pencarian, dan ketersediaan per slot. |
| Pengguna | Mahasiswa/dosen/staf yang login. Reservasi, pembatalan reservasi | sendiri, riwayat/status reservasi, laporan kerusakan, status laporan. |
| Petugas | Pengelola proses reservasi dan laporan. | Dashboard/antrian, approve/reject/cancel reservasi, menangani laporan, mengubah status fasilitas. |
| Admin | Pengelola sistem | Kelola fasilitas, kelola akun sesuai ketentuan, verifikasi registrasi mandiri jika diterapkan, rekap dan ekspor. |

## 2. Gambaran Umum Sistem

## 2.1 Aturan Waktu Reservasi

- 1. Jam operasional reservasi: 07.00–20.00.

- 2. Reservasi menggunakan slot tetap berdurasi 30 menit.

- 3. start_time dan end_time harus berada dalam jam operasional dan mengikuti kelipatan 30 menit.

- 4. Validasi aturan waktu wajib dilakukan di sisi server, bukan hanya pada kalender/tampilan.

## 2.2 Batasan dan Ketentuan Proyek

- 1. Authentication mencakup registrasi, login, dan logout.

- 2. Validasi form penting dilakukan di sisi client dan server.

- 3. Kode dipisahkan minimal antara koneksi database, tampilan, dan logika proses.

- 4. Repository GitHub digunakan bersama dan seluruh anggota berkontribusi.

- 5. Struktur folder minimal yang disebutkan studi kasus: /public, /app (model/controller), /views, /config.


## 3. Kebutuhan Fungsional

| ID | Fitur | Kebutuhan |
| --- | --- | --- |
| FR-01 | Daftar & ketersediaan | Pengunjung/pengguna dapat melihat daftar fasilitas dan status tersedia/tidak tersedia per slot tanpa melihat detail pemohon atau tujuan. |
| FR-02 | Pencarian fasilitas | Pengunjung/pengguna dapat mencari fasilitas berdasarkan tipe, lokasi, dan kapasitas. |
| FR-03 | Pengajuan reservasi | Pengguna login dapat mengajukan reservasi pada rentang waktu tertentu dan mengisi tujuan penggunaan. |
| FR-04 | Pembatalan reservasi pengguna | Pengguna dapat membatalkan reservasi miliknya sendiri sebelum batas waktu tertentu. |
| FR-05 | Riwayat reservasi | Pengguna dapat melihat riwayat, status, dan detail lengkap reservasinya. |
| FR-06 | Pelaporan kerusakan | Pengguna dapat melaporkan masalah fasilitas dengan kategori, deskripsi, dan foto. |
| FR-07 | Status laporan | Pengguna dapat melihat status laporan yang dibuatnya. |
| FR-08 | Dashboard petugas | Petugas dapat melihat antrian reservasi dan laporan yang menunggu diproses. |
| FR-09 | Keputusan reservasi | Petugas dapat approve/reject reservasi; sistem mencegah persetujuan yang bentrok pada fasilitas dan jadwal yang sama. |
| FR-10 | Pembatalan oleh petugas | Petugas dapat membatalkan reservasi yang telah disetujui dalam kondisi mendesak dan wajib mencatat alasan. |
| FR-11 | Penanganan laporan | Petugas dapat mengubah status laporan menjadi baru/diproses/selesai/ditolak dan mencatat resolusi saat laporan ditutup. |
| FR-12 | Status pemeliharaan fasilitas | Petugas dapat menandai fasilitas dalam perbaikan dan mengembalikannya ke aktif setelah selesai. |
| FR-13 | Registrasi petugas | Admin dapat mendaftarkan akun petugas secara langsung; petugas tidak melakukan registrasi mandiri. |
| FR-14 | Registrasi pengguna oleh admin | Admin dapat mendaftarkan akun mahasiswa/dosen/staf secara langsung. |
| FR-15 | Verifikasi registrasi mandiri | Jika registrasi mandiri diimplementasikan, admin dapat memverifikasi atau menolak akun sebelum login. |
| FR-16 | Kelola fasilitas | Admin dapat menambah, mengedit, |


|   |   | dan menonaktifkan data fasilitas. |
| --- | --- | --- |
| FR-17 | Rekap & ekspor | Admin dapat melihat dan mengekspor rekap okupansi fasilitas serta frekuensi kerusakan per fasilitas/lokasi ke CSV/Excel/PDF. |

## 4. Aturan Bisnis

| ID | Aturan |
| --- | --- |
| BR-01 | Reservasi hanya berada pada jam 07.00–20.00. |
| BR-02 | Durasi/waktu reservasi mengikuti slot 30 menit. |
| BR-03 | Validasi waktu reservasi wajib dilakukan server-side. |
| BR-04 | Sistem tidak boleh menyetujui reservasi yang bentrok pada fasilitas dan jadwal yang sama. |
| BR-05 | Pengunjung hanya melihat ketersediaan, bukan detail pemohon/tujuan. |
| BR-06 | Pengguna hanya dapat membatalkan reservasinya sendiri sesuai batas waktu yang ditetapkan. |
| BR-07 | Pembatalan reservasi yang sudah disetujui oleh petugas karena kondisi mendesak harus memiliki alasan. |
| BR-08 | Fasilitas dapat berstatus dalam perbaikan dan tidak dianggap tersedia untuk penggunaan ketika status tersebut berlaku. |
| BR-09 | Petugas tidak melakukan registrasi mandiri. |
| BR-10 | Akun hasil registrasi mandiri, jika fitur tersebut dipakai, harus diverifikasi admin sebelum dapat login. |

## 5. Kebutuhan Nonfungsional

| ID | Kategori | Kebutuhan |
| --- | --- | --- |
| NFR-01 | Usability | Antarmuka harus mudah digunakan. |
| NFR-02 | Security | Fitur yang membutuhkan identitas pengguna harus dilindungi authentication dan authorization sesuai role. |
| NFR-03 | Validation | Form penting divalidasi di client dan server. |
| NFR-04 | Architecture | Koneksi DB, tampilan, dan logika proses dipisahkan minimal sesuai ketentuan proyek. |
| NFR-05 | Data integrity | Relasi data reservasi/laporan harus menjaga keterkaitan pengguna dan fasilitas. |
| NFR-06 | Concurrency | Pengecekan konflik reservasi harus dilakukan pada sisi server untuk mencegah persetujuan bentrok. |
| NFR-07 | Maintainability | Kode disusun dalam struktur folder dan repository bersama yang jelas. |
| NFR-08 | Traceability | Setiap kebutuhan dapat ditelusuri ke user story dan diuji melalui skenario penerimaan. |


## 6. Kebutuhan Data

Studi kasus memberikan empat kelompok data awal: Users, Facilities, Reservations, dan Reports. Dokumen ini menurunkannya menjadi kebutuhan data berikut. Detail tipe data/SQL merupakan keputusan desain dan dapat berubah setelah ERD ditetapkan.

| Entitas | Atribut inti yang dibutuhkan | Keterangan |
| --- | --- | --- |
| Users | id, name, email, password, role | Mendukung akun pengguna, petugas, dan admin. |
| Facilities | id, name, type, location, capacity, description, status | Status dibutuhkan untuk membedakan aktif, dalam perbaikan, dan nonaktif sebagai rancangan pengembangan dari kebutuhan studi kasus. |
| Reservations | id, user, facility, start_time, end_time, purpose, status, cancellation_reason | Menyimpan pengajuan, penggunaan waktu, keputusan, dan alasan pembatalan bila ada. |
| Reports | id, reporter, facility, category, description, photo, status, resolution_note, handled_by | handled_by merupakan rancangan tambahan untuk mencatat petugas yang menangani laporan. |

## 7. Use Case Ringkas

| Aktor | Use Case |
| --- | --- |
| Pengunjung | Lihat fasilitas; cari fasilitas; lihat ketersediaan. |
| Pengguna | Lihat fasilitas/ketersediaan; cari fasilitas; ajukan reservasi; batalkan reservasi sendiri; lihat riwayat/status reservasi; buat laporan; lihat status laporan. |
| Petugas | Lihat dashboard/antrian; approve/reject reservasi; cancel reservasi mendesak; proses laporan; ubah status fasilitas. |
| Admin | Daftar petugas; daftar pengguna; verifikasi registrasi mandiri jika diterapkan; kelola fasilitas; lihat/ekspor rekap. |

## 8. Acceptance Criteria Awal

| ID | Kriteria |
| --- | --- |
| AC-01 | Saat pengunjung melihat ketersediaan, sistem hanya menampilkan status tersedia/tidak tersedia, tanpa detail pemohon/tujuan. |
| AC-02 | Reservasi dengan waktu di luar 07.00–20.00 atau tidak mengikuti interval 30 menit ditolak oleh server. |
| AC-03 | Dua reservasi pada fasilitas dan rentang waktu yang sama tidak dapat sama-sama disetujui. |
| AC-04 | Pengguna tidak dapat membatalkan reservasi milik pengguna lain. |
| AC-05 | Pembatalan oleh petugas terhadap reservasi yang telah disetujui menyimpan alasan. |
| AC-06 | Laporan dapat berpindah status sesuai alur dan memiliki catatan resolusi ketika ditutup. |
| AC-07 | Fasilitas yang ditandai dalam perbaikan tidak ditawarkan sebagai fasilitas aktif untuk reservasi. |


| AC-08 | Petugas tidak memiliki jalur registrasi mandiri. |
| --- | --- |
| AC-09 | Jika registrasi mandiri diterapkan, akun baru tidak dapat digunakan sebelum diverifikasi admin. |
| AC-10 | Admin dapat menghasilkan rekap okupansi dan frekuensi kerusakan serta mengekspornya ke format yang ditentukan. |

## 9. Traceability User Story dan Requirement

| User Story | Requirement |
| --- | --- |
| US-1 | FR-01 |
| US-2 | FR-02 |
| US-3 | FR-03 |
| US-4 | FR-04 |
| US-5 | FR-05 |
| US-6 | FR-06 |
| US-7 | FR-07 |
| US-8 | FR-08 |
| US-9 | FR-09 |
| US-10 | FR-10 |
| US-11 | FR-11 |
| US-12 | FR-12 |
| US-13 | FR-13 |
| US-14 | FR-14 |
| US-15 | FR-15 |
| US-16 | FR-16 |
| US-17 | FR-17 |

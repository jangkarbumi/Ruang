'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SLOT_MINUTES, addDays, formatDateLong, formatTime, type Slot } from '@/lib/slots';
import type { Role } from '@/lib/account';

const GROUPS = [
  { label: 'Pagi', from: '07:00', to: '12:00' },
  { label: 'Siang', from: '12:00', to: '16:00' },
  { label: 'Sore & Malam', from: '16:00', to: '20:00' },
];

const STATE_LABEL: Record<Slot['state'], string> = {
  tersedia: 'tersedia',
  terisi: 'tidak tersedia',
  lewat: 'sudah lewat',
};

function duration(slots: number) {
  const m = slots * SLOT_MINUTES;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return [h && `${h} jam`, r && `${r} menit`].filter(Boolean).join(' ');
}

const navBtn =
  'grid place-items-center w-10 h-10 rounded-full bg-white border border-gray-200 text-[#001741] shadow-sm hover:shadow-md hover:bg-gray-50 transition';

/**
 * Kalender slot publik — hanya menampilkan tersedia / tidak tersedia (AC-01).
 * Pilih satu slot, lalu slot lain di kanannya untuk membentuk rentang berurutan.
 */
export default function SlotPicker({
  facilityId,
  date,
  today,
  lastDate,
  slots,
  viewerRole,
}: {
  facilityId: number;
  date: string;
  today: string;
  lastDate: string;
  slots: Slot[];
  /** Role akun yang sedang login; null untuk pengunjung. */
  viewerRole: Role | null;
}) {
  const router = useRouter();
  const [range, setRange] = useState<{ from: number; to: number } | null>(null);

  const base = `/fasilitas/${facilityId}`;
  const prev = date > today ? addDays(date, -1) : null;
  const next = date < lastDate ? addDays(date, 1) : null;

  const pick = (i: number) => {
    if (!range) return setRange({ from: i, to: i });
    if (range.from === i && range.to === i) return setRange(null);
    if (i > range.from && slots.slice(range.from, i + 1).every((s) => s.state === 'tersedia')) {
      return setRange({ from: range.from, to: i });
    }
    setRange({ from: i, to: i });
  };

  const chosen = range && { start: slots[range.from].start, end: slots[range.to].end, count: range.to - range.from + 1 };
  // Pengguna yang sudah login langsung ke form reservasi; pengunjung login dulu lalu kembali ke form yang sama
  const nextUrl =
    chosen && `/reservasi/baru?fasilitas=${facilityId}&tanggal=${date}&mulai=${chosen.start}&selesai=${chosen.end}`;
  const available = slots.filter((s) => s.state === 'tersedia').length;
  const isUser = viewerRole === 'PENGGUNA';
  const isStaff = viewerRole === 'PETUGAS' || viewerRole === 'ADMIN';
  const ctaLabel = isUser ? 'Ajukan reservasi' : isStaff ? 'Khusus akun pengguna' : 'Login untuk mengajukan';

  return (
    <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        {/* Navigasi tanggal */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-base font-bold text-[#001741]">{formatDateLong(date)}</p>
          <div className="flex items-center gap-2">
            {prev ? (
              <Link href={`${base}?tanggal=${prev}`} scroll={false} aria-label="Hari sebelumnya" className={navBtn}>
                <ChevronLeft className="w-4 h-4" aria-hidden />
              </Link>
            ) : (
              <span aria-hidden className={`${navBtn} opacity-40 pointer-events-none`}>
                <ChevronLeft className="w-4 h-4" />
              </span>
            )}
            <label className="flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 focus-within:border-[#0064D2] focus-within:ring-2 focus-within:ring-[#0064D2]/15">
              <span className="sr-only">Pilih tanggal</span>
              <input
                type="date"
                value={date}
                min={today}
                max={lastDate}
                onChange={(e) => e.target.value && router.push(`${base}?tanggal=${e.target.value}`, { scroll: false })}
                className="bg-transparent text-sm font-semibold text-[#001741] focus:outline-none"
              />
            </label>
            {next ? (
              <Link href={`${base}?tanggal=${next}`} scroll={false} aria-label="Hari berikutnya" className={navBtn}>
                <ChevronRight className="w-4 h-4" aria-hidden />
              </Link>
            ) : (
              <span aria-hidden className={`${navBtn} opacity-40 pointer-events-none`}>
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border border-gray-300 bg-white" /> Tersedia
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gray-200" /> Tidak tersedia
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#0064D2]" /> Pilihan Anda
          </span>
        </div>

        {available === 0 && (
          <p className="mt-5 rounded-2xl bg-[#EBF3FF] px-4 py-3 text-sm text-[#0064D2]">
            Tidak ada slot tersedia pada tanggal ini. Coba tanggal lain.
          </p>
        )}

        <div className="mt-6 space-y-5">
          {GROUPS.map((g) => {
            const items = slots.map((s, i) => ({ s, i })).filter(({ s }) => s.start >= g.from && s.start < g.to);
            return (
              <section key={g.label} aria-label={g.label}>
                <h3 className="mb-2 text-xs font-semibold text-gray-600">{g.label}</h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {items.map(({ s, i }) => {
                    const on = !!range && i >= range.from && i <= range.to;
                    const free = s.state === 'tersedia';
                    return (
                      <button
                        key={s.start}
                        type="button"
                        disabled={!free}
                        aria-pressed={on}
                        aria-label={`${formatTime(s.start)}–${formatTime(s.end)}, ${on ? 'dipilih' : STATE_LABEL[s.state]}`}
                        onClick={() => pick(i)}
                        className={`rounded-xl border py-2.5 text-sm font-semibold tabular-nums transition ${
                          on
                            ? 'bg-[#0064D2] border-[#0064D2] text-white'
                            : free
                              ? 'bg-white border-gray-200 text-[#001741] hover:border-[#0064D2] hover:text-[#0064D2]'
                              : s.state === 'terisi'
                                ? 'bg-gray-100 border-transparent text-gray-400 line-through cursor-not-allowed'
                                : 'bg-gray-50 border-transparent text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {formatTime(s.start)}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
        <p className="mt-5 text-xs text-gray-500">
          Pilih satu slot, lalu slot lain di sebelah kanannya untuk memesan lebih dari {SLOT_MINUTES} menit.
        </p>
      </div>

      {/* Ringkasan */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6" aria-live="polite">
          <p className="text-xs font-semibold text-gray-500">Waktu dipilih</p>
          {chosen ? (
            <>
              <p className="mt-1 text-3xl font-bold tracking-tight text-[#001741]">
                {formatTime(chosen.start)}–{formatTime(chosen.end)}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {duration(chosen.count)} · {formatDateLong(date)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-[#001741]">Belum ada slot dipilih.</p>
          )}

          {chosen && nextUrl && !isStaff ? (
            <Link
              href={isUser ? nextUrl : `/login?next=${encodeURIComponent(nextUrl)}`}
              className="mt-6 flex w-full justify-center bg-[#0064D2] text-white hover:bg-[#0056b3] px-6 py-3 rounded-2xl text-sm font-bold transition"
            >
              {ctaLabel}
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="mt-6 flex w-full justify-center bg-gray-200 text-gray-400 px-6 py-3 rounded-2xl text-sm font-bold cursor-not-allowed"
            >
              {ctaLabel}
            </button>
          )}
          <p className="mt-3 text-center text-xs text-gray-500">
            {isStaff
              ? 'Reservasi diajukan oleh akun pengguna (mahasiswa, dosen, atau staf).'
              : isUser
                ? 'Pengajuan akan ditinjau petugas fasilitas.'
                : 'Pengajuan memerlukan akun dan akan ditinjau petugas fasilitas.'}
          </p>
        </div>
      </aside>
    </div>
  );
}

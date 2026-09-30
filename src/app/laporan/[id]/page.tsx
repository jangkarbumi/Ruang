import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import PageBanner from '@/components/facility/PageBanner';
import PinIcon from '@/components/facility/PinIcon';
import UserNavbar from '@/components/user/UserNavbar';
import { Notice } from '@/components/user/form';
import { ReportBadge } from '@/components/user/StatusBadge';
import { requireUser } from '@/server/session';
import { findFacility } from '@/server/services/facility-service';
import { getUserReport } from '@/server/services/report-service';
import { locationLabel } from '@/lib/facility';
import { reportCode, type ReportStatus } from '@/lib/report';
import { formatDateLong, formatTime, toJakarta } from '@/lib/slots';

export async function generateMetadata(props: PageProps<'/laporan/[id]'>) {
  return { title: `${reportCode(Number((await props.params).id) || 0)} | Ruang` };
}

/** Alur status laporan (FR-11): Baru → Diproses → Selesai / Ditolak */
function steps(status: ReportStatus) {
  const closed = status === 'SELESAI' || status === 'DITOLAK';
  return [
    { label: 'Baru', done: true },
    { label: 'Diproses', done: status !== 'BARU' },
    { label: status === 'DITOLAK' ? 'Ditolak' : 'Selesai', done: closed, rejected: status === 'DITOLAK' },
  ];
}

export default async function ReportDetailPage(props: PageProps<'/laporan/[id]'>) {
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);
  const user = await requireUser(`/laporan/${id}`);

  const report = Number.isInteger(Number(id)) ? await getUserReport(user, Number(id)) : null;
  if (!report) notFound();

  const facility = await findFacility(report.facilityId);
  const created = toJakarta(report.createdAt);
  const closed = report.status === 'SELESAI' || report.status === 'DITOLAK';

  return (
    <main className="flex-1 bg-[#f8f9fa]">
      <PageBanner navbar={<UserNavbar user={user} active="laporan" />}>
        <Link href="/laporan" className="flex w-fit items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" aria-hidden /> Kembali ke Laporan Saya
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ReportBadge status={report.status} />
          <span className="text-sm font-semibold text-white/60">{reportCode(report.id)}</span>
        </div>
        <h1 className="mt-3 text-[44px] font-bold tracking-tight leading-tight">{report.category}</h1>
        {facility && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
            <PinIcon className="w-4 h-4" /> {facility.name} · {locationLabel(facility.location)}
          </p>
        )}
      </PageBanner>

      <div className="relative z-20 w-full max-w-300 mx-auto px-4 -mt-8 pb-20 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          {sp.status === 'terkirim' && (
            <Notice tone="success">Laporan terkirim. Petugas fasilitas akan meninjaunya.</Notice>
          )}

          <section className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6">
            <h2 className="text-lg font-bold text-[#001741]">Deskripsi Masalah</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#001741]">{report.description}</p>
            <p className="mt-4 text-xs text-gray-500">
              Dilaporkan {formatDateLong(created.date)}, {formatTime(created.time)} WIB
            </p>
            {report.photo && (
              // eslint-disable-next-line @next/next/no-img-element -- foto tersimpan sebagai data URL sementara
              <img src={report.photo} alt={`Foto kerusakan: ${report.category}`} className="mt-5 w-full max-h-96 rounded-2xl object-cover" />
            )}
          </section>

          {closed && (
            <section
              className={`rounded-2xl border p-5 ${
                report.status === 'SELESAI' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              <h2 className="text-sm font-bold">Catatan dari petugas</h2>
              <p className="mt-1 text-sm">{report.resolutionNote ?? 'Tidak ada catatan.'}</p>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6">
            <h2 className="text-xs font-semibold text-gray-500">Status laporan</h2>
            <ol className="mt-4 space-y-4">
              {steps(report.status).map((s, i) => (
                <li key={s.label} className="flex items-center gap-3">
                  <span
                    className={`grid place-items-center w-8 h-8 rounded-full text-xs font-bold ${
                      s.done ? (s.rejected ? 'bg-red-100 text-red-700' : 'bg-[#0064D2] text-white') : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {s.done ? <Check className="w-4 h-4" aria-hidden /> : i + 1}
                  </span>
                  <span className={`text-sm font-semibold ${s.done ? 'text-[#001741]' : 'text-gray-400'}`}>
                    {s.label}
                    <span className="sr-only">{s.done ? ' (sudah)' : ' (belum)'}</span>
                  </span>
                </li>
              ))}
            </ol>
            {facility && (
              <Link href={`/fasilitas/${facility.id}`} className="mt-6 block text-sm font-bold text-[#0064D2] hover:underline">
                Lihat halaman fasilitas
              </Link>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

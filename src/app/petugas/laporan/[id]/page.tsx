import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import PageBanner from '@/components/facility/PageBanner';
import PinIcon from '@/components/facility/PinIcon';
import ReportUpdateForm from '@/components/staff/ReportUpdateForm';
import { OfficerNavbar } from '@/components/staff/nav';
import { Notice } from '@/components/user/form';
import { ReportBadge } from '@/components/user/StatusBadge';
import { requireRole } from '@/server/session';
import { findFacility } from '@/server/services/facility-service';
import { allowedNextStatuses, findUser, getReport } from '@/server/services/staff-service';
import { setFacilityStatusAction } from '@/server/actions/staff-actions';
import { locationLabel } from '@/lib/facility';
import { reportCode } from '@/lib/report';
import { formatDateLong, formatTime, toJakarta } from '@/lib/slots';

export async function generateMetadata(props: PageProps<'/petugas/laporan/[id]'>) {
  return { title: `${reportCode(Number((await props.params).id) || 0)} | Petugas | Ruang` };
}

export default async function OfficerReportDetailPage(props: PageProps<'/petugas/laporan/[id]'>) {
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);
  const user = await requireRole('PETUGAS', `/petugas/laporan/${id}`);
  const r = Number.isInteger(Number(id)) ? await getReport(Number(id)) : null;
  if (!r) notFound();

  const facility = await findFacility(r.facilityId);
  const reporter = findUser(r.reporterId);
  const handler = findUser(r.handledById);
  const created = toJakarta(r.createdAt);
  const back = `/petugas/laporan/${r.id}`;

  return (
    <main className="flex-1 bg-[#f8f9fa]">
      <PageBanner navbar={<OfficerNavbar user={user} active="laporan" />}>
        <Link href="/petugas/laporan" className="flex w-fit items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" aria-hidden /> Kembali ke daftar laporan
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ReportBadge status={r.status} />
          <span className="text-sm font-semibold text-white/60">{reportCode(r.id)}</span>
        </div>
        <h1 className="mt-3 text-[44px] font-bold tracking-tight leading-tight">{r.category}</h1>
        {facility && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
            <PinIcon className="w-4 h-4" /> {facility.name} · {locationLabel(facility.location)}
          </p>
        )}
      </PageBanner>

      <div className="relative z-20 w-full max-w-300 mx-auto px-4 -mt-8 pb-20 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          {sp.hasil === 'diperbarui' && <Notice tone="success">Status laporan diperbarui.</Notice>}

          <section className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6">
            <h2 className="text-lg font-bold text-[#001741]">Deskripsi Masalah</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#001741]">{r.description}</p>
            <p className="mt-4 text-xs text-gray-500">
              Dilaporkan oleh {reporter?.name ?? 'pengguna'} · {formatDateLong(created.date)}, {formatTime(created.time)} WIB
            </p>
            {r.photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- foto tersimpan sebagai data URL sementara
              <img src={r.photo} alt={`Foto kerusakan: ${r.category}`} className="mt-5 w-full max-h-96 rounded-2xl object-cover" />
            ) : (
              <p className="mt-5 rounded-2xl bg-[#f8f9fa] p-4 text-sm text-gray-500">Pelapor tidak melampirkan foto.</p>
            )}
            {r.resolutionNote && (
              <div className="mt-5 rounded-2xl bg-[#EBF3FF] p-4">
                <h3 className="text-sm font-bold text-[#0064D2]">Catatan {handler ? `dari ${handler.name}` : 'petugas'}</h3>
                <p className="mt-1 text-sm text-[#001741]">{r.resolutionNote}</p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6">
            <h2 className="mb-4 text-xs font-semibold text-gray-500">Tangani laporan</h2>
            <ReportUpdateForm id={r.id} next={allowedNextStatuses(r.status)} />
          </div>

          {/* FR-12: tandai fasilitas terkait tanpa pindah halaman */}
          {facility && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xs font-semibold text-gray-500">Status fasilitas terkait</h2>
              <p className="mt-1 text-sm font-bold text-[#001741]">
                {facility.name}:{' '}
                <span className={facility.status === 'AKTIF' ? 'text-emerald-700' : 'text-amber-700'}>
                  {facility.status === 'AKTIF' ? 'Aktif' : 'Dalam perbaikan'}
                </span>
              </p>
              <form action={setFacilityStatusAction} className="mt-4">
                <input type="hidden" name="id" value={facility.id} />
                <input type="hidden" name="back" value={back} />
                <input type="hidden" name="status" value={facility.status === 'AKTIF' ? 'PERBAIKAN' : 'AKTIF'} />
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-white border border-gray-200 text-[#001741] rounded-2xl text-sm font-bold shadow-sm hover:shadow-md hover:bg-gray-50 transition"
                >
                  {facility.status === 'AKTIF' ? 'Tandai Dalam Perbaikan' : 'Kembalikan ke Aktif'}
                </button>
              </form>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

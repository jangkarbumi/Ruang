import type { Metadata } from 'next';
import { Mail, UserCheck } from 'lucide-react';
import PageBanner from '@/components/facility/PageBanner';
import AccountForm from '@/components/staff/AccountForm';
import { AdminNavbar } from '@/components/staff/nav';
import { EmptyState } from '@/components/staff/rows';
import StatusTabs from '@/components/user/StatusTabs';
import { Notice } from '@/components/user/form';
import { requireRole } from '@/server/session';
import { listAccounts } from '@/server/services/account-service';
import { verifyAccountAction } from '@/server/actions/admin-actions';
import { ACCOUNT_STATUS, ROLE_LABEL } from '@/lib/account';
import { formatDateLong, toJakarta } from '@/lib/slots';

export const metadata: Metadata = { title: 'Kelola Akun | Admin | Ruang' };

const TABS = ['verifikasi', 'tambah', 'daftar'] as const;

export default async function AdminAccountsPage(props: PageProps<'/admin/akun'>) {
  const user = await requireRole('ADMIN', '/admin/akun');
  const sp = await props.searchParams;
  const tab = TABS.find((t) => t === sp.status) ?? 'verifikasi';

  const [all, pending] = await Promise.all([listAccounts(), listAccounts({ status: 'PENDING' })]);

  const tabs = [
    { value: 'verifikasi', label: 'Verifikasi', count: pending.length },
    { value: 'tambah', label: 'Tambah Akun' },
    { value: 'daftar', label: 'Daftar Akun', count: all.length },
  ];

  const flash =
    sp.hasil === 'diterima'
      ? { tone: 'success' as const, text: 'Akun diverifikasi dan sekarang dapat digunakan untuk login.' }
      : sp.hasil === 'ditolak'
        ? { tone: 'info' as const, text: 'Registrasi ditolak. Akun tidak dapat digunakan untuk login.' }
        : sp.hasil === 'gagal'
          ? { tone: 'error' as const, text: 'Akun tidak ditemukan atau sudah diverifikasi sebelumnya.' }
          : typeof sp.dibuat === 'string'
            ? { tone: 'success' as const, text: `Akun ${sp.dibuat} berhasil dibuat dan langsung aktif.` }
            : null;

  return (
    <main className="flex-1 bg-[#f8f9fa]">
      <PageBanner navbar={<AdminNavbar user={user} active="akun" />}>
        <h1 className="text-[44px] font-bold tracking-tight">Kelola Akun</h1>
        <p className="mt-2 max-w-xl text-white/70">
          Verifikasi registrasi mandiri, daftarkan akun petugas dan pengguna secara langsung.
        </p>
      </PageBanner>

      <div className="relative z-20 w-full max-w-300 mx-auto px-4 -mt-7 pb-20">
        <StatusTabs basePath="/admin/akun" tabs={tabs} active={tab} />

        <div className="mt-8 space-y-6">
          {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}

          {tab === 'verifikasi' &&
            (pending.length ? (
              <ul className="space-y-3">
                {pending.map((u) => (
                  <li key={u.id} className="flex flex-wrap items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <span className="grid place-items-center w-11 h-11 rounded-full bg-[#EBF3FF] text-[#0064D2]">
                      <UserCheck className="w-5 h-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-[#001741]">{u.name}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1 break-all">
                          <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden /> {u.email}
                        </span>
                        <span>Mendaftar {formatDateLong(toJakarta(u.createdAt).date)}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <form action={verifyAccountAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="decision" value="approve" />
                        <button type="submit" className="bg-[#0064D2] text-white hover:bg-[#0056b3] px-5 py-2.5 rounded-2xl text-sm font-bold transition">
                          Verifikasi
                        </button>
                      </form>
                      <form action={verifyAccountAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="decision" value="reject" />
                        <button type="submit" className="px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-2xl text-sm font-bold hover:bg-red-50 transition">
                          Tolak
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Tidak ada registrasi yang menunggu">
                Akun yang mendaftar sendiri akan muncul di sini dan belum dapat login sebelum diverifikasi.
              </EmptyState>
            ))}

          {tab === 'tambah' && <AccountForm />}

          {tab === 'daftar' && (
            <ul className="space-y-3">
              {all.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#001741]">{u.name}</p>
                    <p className="text-xs text-gray-500 break-all">{u.email}</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-600">{ROLE_LABEL[u.role]}</span>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${ACCOUNT_STATUS[u.accountStatus].className}`}>
                    {ACCOUNT_STATUS[u.accountStatus].label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

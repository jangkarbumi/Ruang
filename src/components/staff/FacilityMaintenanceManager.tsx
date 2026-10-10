'use client';

import { useState } from 'react';
import { Wrench, CheckCircle, Clock } from 'lucide-react';
import MaintenanceForm from './MaintenanceForm';
import { endMaintenanceAction, setFacilityStatusAction } from '@/server/actions/staff-actions';
import { formatDateLong, toJakarta } from '@/lib/slots';

interface MaintenanceData {
  id: number;
  startDate: string | Date;
  endDate: string | Date;
  reason: string;
}

interface FacilityMaintenanceManagerProps {
  facility: {
    id: number;
    name: string;
    status: 'AKTIF' | 'PERBAIKAN' | 'NONAKTIF';
  };
  maintenance?: MaintenanceData | null;
  reportId?: number | null;
  defaultReason?: string;
  backUrl: string;
}

export default function FacilityMaintenanceManager({
  facility,
  maintenance,
  reportId,
  defaultReason,
  backUrl,
}: FacilityMaintenanceManagerProps) {
  const [openSchedule, setOpenSchedule] = useState(false);
  const active = facility.status === 'AKTIF';

  const formatD = (d: string | Date) => {
    const j = toJakarta(typeof d === 'string' ? new Date(d) : d);
    return formatDateLong(j.date);
  };

  return (
    <div className="mt-auto pt-2">
      {maintenance && !active && (
        <div className="mb-2 rounded-xl bg-amber-50 p-2 text-[11px] text-amber-900 border border-amber-200">
          <p className="flex items-center gap-1 font-bold text-amber-800">
            <Clock className="w-3.5 h-3.5" /> {formatD(maintenance.startDate)} – {formatD(maintenance.endDate)}
          </p>
          <p className="mt-0.5 line-clamp-2 text-gray-600 italic">&ldquo;{maintenance.reason}&rdquo;</p>
        </div>
      )}

      {openSchedule ? (
        <div className="mt-2">
          <MaintenanceForm
            facilityId={facility.id}
            facilityName={facility.name}
            reportId={reportId}
            defaultReason={defaultReason}
            backUrl={backUrl}
            onCancel={() => setOpenSchedule(false)}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
          {active ? (
            <button
              type="button"
              onClick={() => setOpenSchedule(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline transition"
            >
              <Wrench className="w-3.5 h-3.5" /> Jadwalkan Perbaikan
            </button>
          ) : maintenance ? (
            <form action={endMaintenanceAction}>
              <input type="hidden" name="maintenanceId" value={maintenance.id} />
              <input type="hidden" name="back" value={backUrl} />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Selesaikan Perbaikan (Kembalikan Aktif)
              </button>
            </form>
          ) : (
            <form action={setFacilityStatusAction}>
              <input type="hidden" name="id" value={facility.id} />
              <input type="hidden" name="back" value={backUrl} />
              <input type="hidden" name="status" value="AKTIF" />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Kembalikan ke Aktif
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { FiCopy, FiPlus, FiRefreshCw } from "react-icons/fi";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { useSyncAllPatientsToHis, type PatientSyncToHisResultRow } from "@/api/patientApi";
import { usePatientList } from "./hooks/usePatientList";
import { PatientStatsCards } from "./_components/PatientStatsCards";
import { PatientFilters } from "./_components/PatientFilters";
import { PatientTable } from "./_components/PatientTable";

export default function PatientsPage() {
  const ctrl = usePatientList();
  const [errorRows, setErrorRows] = useState<PatientSyncToHisResultRow[] | null>(null);

  const syncAllToHis = useSyncAllPatientsToHis({
    onSuccess: (data) => {
      if (data.total === 0) {
        toast.success("Không có bệnh nhân nào đang chờ đồng bộ lên HIS");
        return;
      }
      const parts = [`${data.success}/${data.total} thành công`];
      if (data.skipped > 0) parts.push(`${data.skipped} đã đồng bộ trước đó`);
      if (data.error > 0) parts.push(`${data.error} lỗi`);
      const summary = `Đồng bộ HIS: ${parts.join(", ")}`;
      data.error > 0 ? toast.error(summary) : toast.success(summary);
      if (data.error > 0) {
        setErrorRows(data.results.filter((row) => row.status === "error"));
      }
    },
    onError: (err) => toast.error(err.message || "Đồng bộ tất cả lên HIS thất bại"),
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bệnh nhân</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý hồ sơ bệnh nhân, đồng bộ HIS và thông tin đặt khám
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            disabled={syncAllToHis.isPending}
            onClick={() => syncAllToHis.mutate(undefined)}
          >
            <FiRefreshCw className={`h-4 w-4 ${syncAllToHis.isPending ? "animate-spin" : ""}`} />
            Đồng bộ tất cả
          </Button>
          <Link href="/patients/merge">
            <Button variant="outline" className="gap-2">
              <FiCopy className="h-4 w-4" /> Gộp bệnh nhân
            </Button>
          </Link>
          <Link href="/patients/new">
            <Button variant="primary" className="gap-2">
              <FiPlus className="h-4 w-4" /> Thêm bệnh nhân
            </Button>
          </Link>
        </div>
      </div>

      <PatientStatsCards
        total={ctrl.stats.total}
        withInsurance={ctrl.stats.withInsurance}
        insurancePct={ctrl.stats.insurancePct}
        pendingSync={ctrl.stats.pendingSync}
      />

      <PatientFilters ctrl={ctrl} />
      <PatientTable ctrl={ctrl} />

      {errorRows && errorRows.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setErrorRows(null)} />
          <div className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <AlertCircle className="h-5 w-5 text-error" /> Lỗi đồng bộ lên HIS ({errorRows.length})
              </h2>
              <button onClick={() => setErrorRows(null)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="divide-y divide-slate-100">
              {errorRows.map((row, idx) => (
                <div key={`${row.patient_id}-${idx}`} className="px-6 py-3">
                  <p className="text-sm font-medium text-slate-800">{row.patient_id}</p>
                  <p className="mt-0.5 text-xs text-error">{row.error || "Lỗi không xác định"}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setErrorRows(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

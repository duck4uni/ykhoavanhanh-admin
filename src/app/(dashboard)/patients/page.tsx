"use client";

import Link from "next/link";
import { FiCopy, FiPlus } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { usePatientList } from "./hooks/usePatientList";
import { PatientStatsCards } from "./_components/PatientStatsCards";
import { PatientFilters } from "./_components/PatientFilters";
import { PatientTable } from "./_components/PatientTable";

export default function PatientsPage() {
  const ctrl = usePatientList();

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
    </div>
  );
}

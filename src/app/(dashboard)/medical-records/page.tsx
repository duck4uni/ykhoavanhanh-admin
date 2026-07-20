"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FiPlus } from "react-icons/fi";
import { useMedicalRecordList } from "./hooks/useMedicalRecordList";
import { MedicalRecordStatsCards } from "./_components/MedicalRecordStatsCards";
import { MedicalRecordFilters } from "./_components/MedicalRecordFilters";
import { MedicalRecordTable } from "./_components/MedicalRecordTable";

export default function MedicalRecordsPage() {
  const records = useMedicalRecordList();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hồ sơ bệnh án</h1>
          <p className="mt-1 text-sm text-muted-foreground">Lịch sử khám bệnh của bệnh nhân</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/medical-records/new">
            <Button variant="primary" className="gap-2">
              <FiPlus className="h-4 w-4" /> Tạo hồ sơ
            </Button>
          </Link>
        </div>
      </div>

      <MedicalRecordStatsCards totalItems={records.totalItems} stats={records.stats} />

      <Card className="p-4">
        <MedicalRecordFilters
          search={records.search}
          onSearchChange={records.setSearch}
          fromDate={records.fromDate}
          onFromDateChange={records.setFromDate}
          toDate={records.toDate}
          onToDateChange={records.setToDate}
          specialtyId={records.specialtyId}
          onSpecialtyIdChange={records.setSpecialtyId}
          paymentStatus={records.paymentStatus}
          onPaymentStatusChange={(value) => {
            records.setPaymentStatus(value);
            records.setPage(1);
          }}
          specialties={records.specialties}
          onReset={records.resetFilters}
        />
      </Card>

      <MedicalRecordTable
        rows={records.rows}
        isLoading={records.isLoading}
        page={records.page}
        pageSize={records.pageSize}
        totalPages={records.totalPages}
        totalItems={records.totalItems}
        onPageChange={records.setPage}
        onPageSizeChange={records.setPageSize}
      />
    </div>
  );
}

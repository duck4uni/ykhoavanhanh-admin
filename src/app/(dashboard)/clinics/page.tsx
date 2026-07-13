"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";
import { useClinicList } from "./hooks/useClinicList";
import { ClinicStatsCards } from "./_components/ClinicStatsCards";
import { ClinicFilters } from "./_components/ClinicFilters";
import { ClinicTable } from "./_components/ClinicTable";

export default function ClinicsPage() {
  const router = useRouter();
  const clinics = useClinicList();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Phòng khám</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý danh sách phòng khám, khu khám và dịch vụ đã gán
          </p>
        </div>
        <button
          onClick={() => router.push("/clinics/new")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Thêm phòng khám
        </button>
      </div>

      <ClinicStatsCards stats={clinics.stats} />

      <ClinicFilters
        search={clinics.search}
        onSearchChange={(value) => {
          clinics.setSearch(value);
          clinics.setPage(1);
        }}
        areaFilter={clinics.areaFilter}
        onAreaFilterChange={(value) => {
          clinics.setAreaFilter(value);
          clinics.setPage(1);
        }}
        statusFilter={clinics.statusFilter}
        onStatusFilterChange={clinics.setStatusFilter}
        hisFilter={clinics.hisFilter}
        onHisFilterChange={(value) => {
          clinics.setHisFilter(value);
          clinics.setPage(1);
        }}
        examAreaOptions={clinics.examAreaOptions}
        onApply={() => clinics.setPage(1)}
        onReset={clinics.resetFilters}
      />

      <ClinicTable
        rooms={clinics.rooms}
        isLoading={clinics.isLoading}
        page={clinics.page}
        totalPages={clinics.totalPages}
        totalItems={clinics.totalItems}
        onPageChange={clinics.setPage}
        onEdit={(id) => router.push(`/clinics/${id}/edit`)}
        onDelete={clinics.openConfirmDelete}
        onToggleStatus={clinics.toggleRoomStatus}
        togglingId={clinics.togglingId}
      />

      <ConfirmDialog
        open={clinics.confirmOpen}
        onOpenChange={clinics.setConfirmOpen}
        variant="delete"
        title="Xóa phòng khám"
        description="Bạn có chắc muốn xóa phòng khám này? Hành động này sẽ đánh dấu phòng khám đã xóa."
        confirmLabel="Xóa"
        isLoading={clinics.isDeleting}
        onConfirm={clinics.handleConfirmDelete}
      />
    </div>
  );
}

"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";
import { useAppointmentScheduleList } from "./hooks/useAppointmentScheduleList";
import { AppointmentStatsCards } from "./_components/AppointmentStatsCards";
import { AppointmentFilters } from "./_components/AppointmentFilters";
import { AppointmentScheduleTable } from "./_components/AppointmentScheduleTable";

export default function AppointmentsPage() {
  const schedules = useAppointmentScheduleList();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lịch khám</h1>
          <p className="mt-1 text-sm text-muted-foreground">Quản lý lịch làm việc, khung giờ và số lượng slot khám của bác sĩ.</p>
        </div>
        <Link href="/appointments/new" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Thêm lịch khám
        </Link>
      </div>

      <AppointmentStatsCards stats={schedules.stats} />
      <AppointmentFilters
        search={schedules.search}
        onSearchChange={(value) => { schedules.setSearch(value); schedules.setPage(1); }}
        dateFilter={schedules.dateFilter}
        onDateFilterChange={(value) => { schedules.setDateFilter(value); schedules.setPage(1); }}
        shiftFilter={schedules.shiftFilter}
        onShiftFilterChange={(value) => { schedules.setShiftFilter(value); schedules.setPage(1); }}
        statusFilter={schedules.statusFilter}
        onStatusFilterChange={(value) => { schedules.setStatusFilter(value); schedules.setPage(1); }}
        onApply={() => schedules.setPage(1)}
        onReset={schedules.resetFilters}
      />

      <AppointmentScheduleTable
        rows={schedules.rows}
        isLoading={schedules.isLoading}
        page={schedules.page}
        totalPages={schedules.totalPages}
        filteredCount={schedules.filteredCount}
        isDeleting={schedules.isDeleting}
        onPageChange={schedules.setPage}
        onDelete={schedules.openConfirmDelete}
        onToggleStatus={schedules.toggleScheduleStatus}
        togglingId={schedules.togglingId}
      />

      <ConfirmDialog
        open={schedules.confirmOpen}
        onOpenChange={schedules.setConfirmOpen}
        variant="delete"
        title="Xóa lịch khám"
        description="Bạn có chắc muốn xóa lịch khám này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        isLoading={schedules.isDeleting}
        onConfirm={schedules.handleConfirmDelete}
      />
    </div>
  );
}

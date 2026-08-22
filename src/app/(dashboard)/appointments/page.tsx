"use client";

import Link from "next/link";
import { CheckCircle2, PauseCircle, PlayCircle, Plus, X } from "lucide-react";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";
import { useAppointmentScheduleList } from "./hooks/useAppointmentScheduleList";
import { AppointmentStatsCards } from "./_components/AppointmentStatsCards";
import { AppointmentFilters } from "./_components/AppointmentFilters";
import { AppointmentScheduleTable } from "./_components/AppointmentScheduleTable";

export default function AppointmentsPage() {
  const schedules = useAppointmentScheduleList();

  const selectedCount = schedules.selectedIds.length;

  const getBulkDialogProps = () => {
    switch (schedules.bulkActionConfirm.action) {
      case "activate":
        return {
          title: `Kích hoạt ${selectedCount} lịch khám đã chọn`,
          description: `Bạn có chắc muốn kích hoạt (chuyển sang trạng thái Hoạt động) cho ${selectedCount} lịch khám này?`,
          confirmLabel: "Kích hoạt",
          variant: "info" as const,
        };
      case "deactivate":
        return {
          title: `Tạm ngưng ${selectedCount} lịch khám đã chọn`,
          description: `Bạn có chắc muốn tạm ngưng (chuyển sang trạng thái Tạm ngưng) cho ${selectedCount} lịch khám này?`,
          confirmLabel: "Tạm ngưng",
          variant: "warning" as const,
        };
      case "activate_all":
        return {
          title: "Kích hoạt TẤT CẢ lịch khám đang tạm ngưng",
          description: "Hệ thống sẽ chuyển toàn bộ các lịch khám đang ở trạng thái Tạm ngưng sang Hoạt động. Bạn có chắc muốn tiếp tục?",
          confirmLabel: "Kích hoạt tất cả",
          variant: "info" as const,
        };
      case "deactivate_all":
        return {
          title: "Tạm ngưng TẤT CẢ lịch khám đang hoạt động",
          description: "Hệ thống sẽ tạm ngưng toàn bộ các lịch khám đang ở trạng thái Hoạt động. Bạn có chắc muốn tiếp tục?",
          confirmLabel: "Tạm ngưng tất cả",
          variant: "warning" as const,
        };
    }
  };

  const dialogProps = getBulkDialogProps();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lịch khám</h1>
          <p className="mt-1 text-sm text-muted-foreground">Quản lý lịch làm việc, khung giờ và số lượng slot khám của bác sĩ.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
            <button
              type="button"
              onClick={() => schedules.setBulkActionConfirm({ open: true, action: "activate_all" })}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
              title="Bật tất cả lịch khám đang tạm ngưng"
            >
              <PlayCircle className="h-3.5 w-3.5" /> Bật tất cả
            </button>
            <span className="h-4 w-px bg-slate-200" />
            <button
              type="button"
              onClick={() => schedules.setBulkActionConfirm({ open: true, action: "deactivate_all" })}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50"
              title="Tạm ngưng tất cả lịch khám"
            >
              <PauseCircle className="h-3.5 w-3.5" /> Tắt tất cả
            </button>
          </div>
          <Link href="/appointments/new" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Thêm lịch khám
          </Link>
        </div>
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

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-200 bg-primary-50/70 px-4 py-3 text-sm text-primary-950">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>Đã chọn <strong className="text-primary-800">{selectedCount}</strong> lịch khám</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => schedules.setBulkActionConfirm({ open: true, action: "activate" })}
              disabled={schedules.isBulkOperating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              <PlayCircle className="h-3.5 w-3.5" /> Bật {selectedCount} lịch đã chọn
            </button>
            <button
              type="button"
              onClick={() => schedules.setBulkActionConfirm({ open: true, action: "deactivate" })}
              disabled={schedules.isBulkOperating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-amber-700 disabled:opacity-50"
            >
              <PauseCircle className="h-3.5 w-3.5" /> Tạm ngưng {selectedCount} lịch đã chọn
            </button>
            <button
              type="button"
              onClick={schedules.clearSelection}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" /> Bỏ chọn
            </button>
          </div>
        </div>
      )}

      <AppointmentScheduleTable
        rows={schedules.rows}
        isLoading={schedules.isLoading}
        page={schedules.page}
        pageSize={schedules.pageSize}
        totalPages={schedules.totalPages}
        filteredCount={schedules.filteredCount}
        isDeleting={schedules.isDeleting}
        onPageChange={schedules.setPage}
        onPageSizeChange={schedules.setPageSize}
        onDelete={schedules.openConfirmDelete}
        onToggleStatus={schedules.toggleScheduleStatus}
        togglingId={schedules.togglingId}
        selectedIds={schedules.selectedIds}
        onToggleSelectRow={schedules.toggleSelectRow}
        onToggleSelectAll={schedules.toggleSelectAllCurrentPage}
        roomLookup={schedules.roomLookup}
        serviceLookup={schedules.serviceLookup}
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

      <ConfirmDialog
        open={schedules.bulkActionConfirm.open}
        onOpenChange={(open) => schedules.setBulkActionConfirm((prev) => ({ ...prev, open }))}
        variant={dialogProps.variant}
        title={dialogProps.title}
        description={dialogProps.description}
        confirmLabel={dialogProps.confirmLabel}
        isLoading={schedules.isBulkOperating}
        onConfirm={schedules.handleConfirmBulkAction}
      />
    </div>
  );
}

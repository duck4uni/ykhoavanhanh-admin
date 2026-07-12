"use client";

import { Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";
import { useExamServiceList } from "./hooks/useExamServiceList";
import { ServiceStatsCards } from "./_components/ServiceStatsCards";
import { ServiceFilters } from "./_components/ServiceFilters";
import { ServiceTable } from "./_components/ServiceTable";

export default function ExamServicesPage() {
  const ctrl = useExamServiceList();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dịch vụ khám</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý danh sách dịch vụ khám, giá, loại bảo hiểm và trạng thái hiển thị.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => ctrl.router.push("/exam-services/new")} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Thêm dịch vụ khám
          </button>
        </div>
      </div>

      <ServiceStatsCards stats={ctrl.stats} />
      <ServiceFilters ctrl={ctrl} />
      <ServiceTable ctrl={ctrl} />

      <ConfirmDialog
        open={ctrl.confirmOpen}
        onOpenChange={ctrl.setConfirmOpen}
        variant="delete"
        title="Xóa dịch vụ khám"
        description="Bạn có chắc muốn xóa dịch vụ này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        isLoading={ctrl.isDeleting}
        onConfirm={ctrl.handleConfirmDelete}
      />
    </div>
  );
}

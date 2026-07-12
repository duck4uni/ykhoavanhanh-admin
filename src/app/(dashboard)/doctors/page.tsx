"use client";

import { Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";
import { useDoctorList } from "./hooks/useDoctorList";
import { DoctorStatsCards } from "./_components/DoctorStatsCards";
import { DoctorFilters } from "./_components/DoctorFilters";
import { DoctorTable } from "./_components/DoctorTable";

export default function DoctorsPage() {
  const ctrl = useDoctorList();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bác sĩ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý danh sách bác sĩ, chuyên khoa phụ trách và trạng thái hiển thị trên thông tin đặt khám
          </p>
        </div>
        <button onClick={() => ctrl.router.push("/doctors/new")} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Thêm bác sĩ
        </button>
      </div>

      <DoctorStatsCards stats={ctrl.stats} />
      <DoctorFilters ctrl={ctrl} />
      <DoctorTable ctrl={ctrl} />

      <ConfirmDialog
        open={ctrl.confirmOpen}
        onOpenChange={ctrl.setConfirmOpen}
        variant="delete"
        title="Xóa bác sĩ"
        description="Bạn có chắc muốn xóa bác sĩ này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        isLoading={ctrl.isDeleting}
        onConfirm={ctrl.handleConfirmDelete}
      />
    </div>
  );
}

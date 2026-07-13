"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";
import { specialtiesHooks } from "@/api/specialtiesApi";
import type { AdminSpecialty } from "@/types/hospital-admin";
import { toast } from "@/components/ui/Toast";
import { useSpecialtyList } from "./hooks/useSpecialtyList";
import { SpecialtyStatsCards } from "./_components/SpecialtyStatsCards";
import { SpecialtyFilters } from "./_components/SpecialtyFilters";
import { SpecialtyTable } from "./_components/SpecialtyTable";

export default function SpecialtiesPage() {
  const router = useRouter();
  const list = useSpecialtyList();

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const statusMutation = specialtiesHooks.useUpdate({
    onSuccess: (_data, variables) => {
      toast.success((variables.data as Partial<AdminSpecialty>).is_active ? "Đã bật chuyên khoa" : "Đã tắt chuyên khoa");
    },
    onError: (err) => toast.error(err.message || "Cập nhật trạng thái thất bại"),
    onSettled: () => setTogglingId(null),
  });

  function toggleStatus(item: AdminSpecialty) {
    setTogglingId(item.id);
    statusMutation.mutate({ id: item.id, data: { is_active: !item.is_active } as Partial<AdminSpecialty> });
  }

  function openEdit(item: AdminSpecialty) {
    router.push(`/specialties/${item.id}/edit`);
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chuyên khoa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý danh sách chuyên khoa, bác sĩ, dịch vụ khám và cấu hình hiển thị đặt khám
          </p>
        </div>
        <button
          onClick={() => router.push("/specialties/new")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Thêm chuyên khoa
        </button>
      </div>

      <SpecialtyStatsCards stats={list.stats} />

      <SpecialtyFilters
        search={list.search}
        onSearchChange={(value) => {
          list.setSearch(value);
          list.setCurrentPage(1);
        }}
        statusFilter={list.statusFilter}
        onStatusFilterChange={list.setStatusFilter}
        bookingGroupFilter={list.bookingGroupFilter}
        onBookingGroupFilterChange={list.setBookingGroupFilter}
        bookingGroups={list.bookingGroups}
        onReset={list.resetFilters}
      />

      <SpecialtyTable
        rows={list.rows}
        isLoading={list.isLoading}
        currentPage={list.currentPage}
        pageSize={list.pageSize}
        totalPages={list.totalPages}
        total={list.total}
        onPageChange={list.setCurrentPage}
        onPageSizeChange={list.setPageSize}
        onEdit={openEdit}
        onDelete={list.openConfirmDelete}
        onToggleStatus={toggleStatus}
        togglingId={togglingId}
      />

      <ConfirmDialog
        open={list.confirmOpen}
        onOpenChange={list.setConfirmOpen}
        variant="delete"
        title="Xóa chuyên khoa"
        description="Bạn có chắc muốn xóa chuyên khoa này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        isLoading={list.isDeleting}
        onConfirm={list.handleConfirmDelete}
      />
    </div>
  );
}

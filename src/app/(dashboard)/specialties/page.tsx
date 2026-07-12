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
import { SpecialtyEditModal } from "./_components/SpecialtyEditModal";
import {
  EMPTY_SPECIALTY_FORM,
  buildSpecialtyPayload,
  mapSpecialtyToForm,
  type SpecialtyFormValues,
} from "./types";

export default function SpecialtiesPage() {
  const router = useRouter();
  const list = useSpecialtyList();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SpecialtyFormValues>(EMPTY_SPECIALTY_FORM);

  const updateMutation = specialtiesHooks.useUpdate({
    onSuccess: () => {
      toast.success("Cập nhật chuyên khoa thành công");
      closeModal();
    },
    onError: (err) => toast.error(err.message || "Cập nhật chuyên khoa thất bại"),
  });

  function openEdit(item: AdminSpecialty) {
    setEditingId(item.id);
    setForm(mapSpecialtyToForm(item));
  }

  function closeModal() {
    setEditingId(null);
    setForm(EMPTY_SPECIALTY_FORM);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên chuyên khoa");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: buildSpecialtyPayload(form) as Partial<AdminSpecialty> });
    }
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
      />

      <SpecialtyEditModal
        open={editingId !== null}
        form={form}
        onChange={setForm}
        onClose={closeModal}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";
import { examAreasHooks, type ExamArea } from "@/api/examAreasApi";
import { toast } from "@/components/ui/Toast";
import { useExamAreaList } from "./hooks/useExamAreaList";
import { ExamAreaStatsCards } from "./_components/ExamAreaStatsCards";
import { ExamAreaFilters } from "./_components/ExamAreaFilters";
import { ExamAreaTable } from "./_components/ExamAreaTable";
import { ExamAreaFormModal } from "./_components/ExamAreaFormModal";
import { ExamAreaDetailModal } from "./_components/ExamAreaDetailModal";
import {
  EMPTY_EXAM_AREA_FORM,
  examAreaFormToPayload,
  isValidVietnamesePhone,
  mapExamAreaToForm,
  type ExamAreaFormValues,
} from "./types";

export default function ExamAreasPage() {
  const router = useRouter();
  const list = useExamAreaList();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExamAreaFormValues>(EMPTY_EXAM_AREA_FORM);
  const [viewingArea, setViewingArea] = useState<ExamArea | null>(null);

  const createMutation = examAreasHooks.useCreate({
    onSuccess: () => {
      toast.success("Tạo khu vực khám thành công");
      closeModal();
    },
    onError: (err) => toast.error(err.message || "Tạo khu vực khám thất bại"),
  });
  const updateMutation = examAreasHooks.useUpdate({
    onSuccess: () => {
      toast.success("Cập nhật khu vực khám thành công");
      closeModal();
    },
    onError: (err) => toast.error(err.message || "Cập nhật khu vực khám thất bại"),
  });

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const statusMutation = examAreasHooks.useUpdate({
    onSuccess: (_data, variables) => {
      toast.success(variables.data.status === "ACTIVE" ? "Đã bật khu vực khám" : "Đã tắt khu vực khám");
    },
    onError: (err) => toast.error(err.message || "Cập nhật trạng thái thất bại"),
    onSettled: () => setTogglingId(null),
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_EXAM_AREA_FORM);
    setModalOpen(true);
  }

  function openEdit(item: ExamArea) {
    setEditingId(item.id);
    setForm(mapExamAreaToForm(item));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_EXAM_AREA_FORM);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Vui lòng nhập mã và tên khu vực khám");
      return;
    }
    if (!isValidVietnamesePhone(form.phone)) {
      toast.error("Số điện thoại không đúng định dạng");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: examAreaFormToPayload(form) });
    } else {
      createMutation.mutate(examAreaFormToPayload(form));
    }
  }

  function toggleStatus(item: ExamArea) {
    setTogglingId(item.id);
    statusMutation.mutate({
      id: item.id,
      data: { status: item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
    });
  }

  function viewRooms(item: ExamArea) {
    router.push(`/clinics?q=${encodeURIComponent(item.short_name || item.name)}`);
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Khu vực khám</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý khu vực khám, phòng khám và thông tin liên hệ tại bệnh viện
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Thêm khu vực khám
          </button>
        </div>
      </div>

      <ExamAreaStatsCards stats={list.stats} />

      <ExamAreaFilters
        search={list.search}
        onSearchChange={(value) => {
          list.setSearch(value);
          list.setPage(1);
        }}
        statusFilter={list.statusFilter}
        onStatusFilterChange={(value) => {
          list.setStatusFilter(value);
          list.setPage(1);
        }}
        onReset={list.resetFilters}
      />

      <ExamAreaTable
        rows={list.rows}
        isLoading={list.isLoading}
        page={list.page}
        totalPages={list.totalPages}
        filteredCount={list.filteredCount}
        onPageChange={list.setPage}
        onView={setViewingArea}
        onEdit={openEdit}
        onViewRooms={viewRooms}
        onToggle={toggleStatus}
        onDelete={list.openConfirmDelete}
        togglingId={togglingId}
      />

      <ExamAreaFormModal
        open={modalOpen}
        isEditing={editingId !== null}
        form={form}
        onChange={setForm}
        onClose={closeModal}
        onSubmit={handleSubmit}
        isSubmitting={isMutating}
      />

      <ExamAreaDetailModal
        area={viewingArea}
        onClose={() => setViewingArea(null)}
        onEdit={(area) => {
          setViewingArea(null);
          openEdit(area);
        }}
      />

      <ConfirmDialog
        open={list.confirmOpen}
        onOpenChange={list.setConfirmOpen}
        variant="delete"
        title="Xóa khu vực khám"
        description="Bạn có chắc muốn xóa khu vực khám này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        isLoading={list.isDeleting}
        onConfirm={list.handleConfirmDelete}
      />
    </div>
  );
}

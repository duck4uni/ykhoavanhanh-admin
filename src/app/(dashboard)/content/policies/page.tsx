"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { policiesHooks } from "@/api/policiesApi";
import { toast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";
import { usePolicyList } from "./hooks/usePolicyList";
import { PolicyFilters } from "./_components/PolicyFilters";
import { PolicyTable } from "./_components/PolicyTable";
import { PolicyFormModal } from "./_components/PolicyFormModal";
import { EMPTY_POLICY_FORM, policyFormToPayload, type PolicyFormValues } from "./types";

export default function PoliciesPage() {
  const router = useRouter();
  const policies = usePolicyList();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<PolicyFormValues>(EMPTY_POLICY_FORM);

  const createMutation = policiesHooks.useCreate({
    onSuccess: () => {
      toast.success("Tạo chính sách thành công");
      closeModal();
    },
    onError: (err) => toast.error(err.message || "Tạo chính sách thất bại"),
  });

  function openCreate() {
    setForm(EMPTY_POLICY_FORM);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm(EMPTY_POLICY_FORM);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề chính sách");
      return;
    }
    createMutation.mutate(policyFormToPayload(form));
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chính sách sử dụng</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý nội dung chính sách sử dụng, điều khoản, chính sách bảo mật, chính sách hủy lịch...
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Thêm chính sách
        </button>
      </div>

      <PolicyFilters
        search={policies.search}
        onSearchChange={(value) => {
          policies.setSearch(value);
          policies.setPage(1);
        }}
        filterActive={policies.filterActive}
        onFilterActiveChange={policies.setFilterActive}
        onApply={() => policies.setPage(1)}
        onReset={policies.resetFilters}
      />

      <PolicyTable
        rows={policies.rows}
        isFetching={policies.isFetching}
        page={policies.page}
        pageSize={policies.pageSize}
        totalPages={policies.totalPages}
        total={policies.total}
        onPageChange={policies.setPage}
        onPageSizeChange={policies.setPageSize}
        onView={(policy) => router.push(`/content/policies/${policy.id}`)}
        onEdit={(policy) => router.push(`/content/policies/${policy.id}/edit`)}
        onDelete={policies.openConfirmDelete}
        isDeleting={policies.isDeleting}
      />

      <PolicyFormModal
        open={modalOpen}
        isEditing={false}
        form={form}
        onChange={setForm}
        onClose={closeModal}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />

      <ConfirmDialog
        open={policies.confirmOpen}
        onOpenChange={policies.setConfirmOpen}
        variant="delete"
        title="Xóa chính sách"
        description="Bạn có chắc muốn xóa chính sách này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        isLoading={policies.isDeleting}
        onConfirm={policies.handleConfirmDelete}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { ArrowUpDown, Plus } from "lucide-react";
import { postCategoriesHooks, type PostCategory } from "@/api/postCategoriesApi";
import { toast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";
import { useCategoryList } from "./hooks/useCategoryList";
import { CategoryStatsCards } from "./_components/CategoryStatsCards";
import { CategoryFilters } from "./_components/CategoryFilters";
import { CategoryTable } from "./_components/CategoryTable";
import { CategoryFormModal } from "./_components/CategoryFormModal";
import {
  EMPTY_CATEGORY_FORM,
  categoryFormToPayload,
  mapCategoryToForm,
  type CategoryFormValues,
} from "./types";

export default function CategoriesPage() {
  const categories = useCategoryList();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormValues>(EMPTY_CATEGORY_FORM);

  const createMutation = postCategoriesHooks.useCreate({
    onSuccess: () => {
      toast.success("Tạo danh mục thành công");
      closeModal();
    },
    onError: (err) => toast.error(err.message || "Tạo danh mục thất bại"),
  });

  const isMutating = createMutation.isPending || categories.patchMutation.isPending || categories.isDeleting;

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_CATEGORY_FORM);
    setModalOpen(true);
  }

  function openEdit(category: PostCategory) {
    setEditingId(category.id);
    setForm(mapCategoryToForm(category));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_CATEGORY_FORM);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }
    const payload = categoryFormToPayload(form);
    if (editingId) {
      categories.patchMutation.mutate({ id: editingId, data: payload }, { onSuccess: closeModal });
    } else {
      createMutation.mutate(payload);
    }
  }

  function toggleActive(category: PostCategory) {
    categories.patchMutation.mutate({ id: category.id, data: { is_active: !category.is_active } });
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Danh mục bài viết</h1>
          <p className="mt-1 text-sm text-muted-foreground">Quản lý danh mục tin tức và bài viết</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => categories.setSortOrder((current) => (current === "asc" ? "desc" : "asc"))}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface-secondary"
          >
            <ArrowUpDown className="h-4 w-4" />
            Sắp xếp danh mục
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Thêm danh mục
          </button>
        </div>
      </div>

      <CategoryStatsCards stats={categories.stats} />

      <CategoryFilters
        search={categories.search}
        onSearchChange={(value) => {
          categories.setSearch(value);
          categories.setPage(1);
        }}
        filterActive={categories.filterActive}
        onFilterActiveChange={(value) => {
          categories.setFilterActive(value);
          categories.setPage(1);
        }}
        sortOrder={categories.sortOrder}
        onSortOrderChange={categories.setSortOrder}
        onReset={categories.resetFilters}
      />

      <CategoryTable
        rows={categories.rows}
        isFetching={categories.isFetching}
        page={categories.page}
        pageSize={categories.pageSize}
        totalPages={categories.totalPages}
        total={categories.total}
        copiedSlug={categories.copiedSlug}
        isPatching={categories.patchMutation.isPending}
        isDeleting={categories.isDeleting}
        onPageChange={categories.setPage}
        onPageSizeChange={categories.setPageSize}
        onCopySlug={categories.copySlug}
        onToggleActive={toggleActive}
        onEdit={openEdit}
        onDelete={categories.openConfirmDelete}
      />

      <CategoryFormModal
        open={modalOpen}
        isEditing={editingId !== null}
        form={form}
        onChange={setForm}
        onClose={closeModal}
        onSubmit={handleSubmit}
        isSubmitting={isMutating}
      />

      <ConfirmDialog
        open={categories.confirmOpen}
        onOpenChange={categories.setConfirmOpen}
        variant="delete"
        title="Xóa danh mục"
        description="Bạn có chắc muốn xóa danh mục này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        isLoading={categories.isDeleting}
        onConfirm={categories.handleConfirmDelete}
      />
    </div>
  );
}

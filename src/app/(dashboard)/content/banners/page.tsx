"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { pageConfigHooks, type PageConfig } from "@/api/pageConfigApi";
import { filesHooks } from "@/api/filesApi";
import { toast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";
import { useBannerList } from "./hooks/useBannerList";
import { BannerFilters } from "./_components/BannerFilters";
import { BannerTable } from "./_components/BannerTable";
import { BannerFormModal } from "./_components/BannerFormModal";
import { EMPTY_BANNER_FORM, bannerFormToPayload, type BannerFormValues } from "./types";

export default function BannersPage() {
  const banners = useBannerList();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerFormValues>(EMPTY_BANNER_FORM);

  const createMutation = pageConfigHooks.useCreate({
    onSuccess: () => {
      toast.success("Tạo banner thành công");
      closeModal();
    },
    onError: (err) => toast.error(err.message || "Tạo banner thất bại"),
  });
  const updateMutation = pageConfigHooks.useUpdate({
    onSuccess: () => {
      toast.success("Cập nhật banner thành công");
      closeModal();
    },
    onError: (err) => toast.error(err.message || "Cập nhật thất bại"),
  });
  const uploadMutation = filesHooks.useUpload({
    onSuccess: (file) => {
      setForm((prev) => ({ ...prev, content: file.original }));
      toast.success("Upload ảnh banner thành công");
    },
    onError: (err) => toast.error(err.message || "Upload ảnh thất bại"),
  });

  const isMutating = createMutation.isPending || updateMutation.isPending || uploadMutation.isPending;

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_BANNER_FORM);
    setModalOpen(true);
  }

  function openEdit(banner: PageConfig) {
    setEditingId(banner.id);
    setForm({
      name: banner.name ?? "",
      code: banner.code ?? "",
      content: banner.content ?? "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_BANNER_FORM);
  }

  function handleUploadImage(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }
    uploadMutation.mutate(file);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên banner");
      return;
    }
    const payload = bannerFormToPayload(form);
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banner</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý banner hiển thị trên ứng dụng
            {banners.total > 0 && <span className="ml-1.5 text-slate-400">({banners.total} banner)</span>}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Thêm banner
        </button>
      </div>

      <BannerFilters search={banners.search} onSearchChange={banners.setSearch} />

      <BannerTable
        rows={banners.rows}
        isFetching={banners.isFetching}
        page={banners.page}
        totalPages={banners.totalPages}
        total={banners.total}
        isDeleting={banners.isDeleting}
        onPageChange={banners.setPage}
        onEdit={openEdit}
        onDelete={banners.openConfirmDelete}
      />

      <BannerFormModal
        open={modalOpen}
        isEditing={editingId !== null}
        form={form}
        onChange={setForm}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onUploadImage={handleUploadImage}
        isSubmitting={isMutating}
        isUploading={uploadMutation.isPending}
      />

      <ConfirmDialog
        open={banners.confirmOpen}
        onOpenChange={banners.setConfirmOpen}
        variant="delete"
        title="Xóa banner"
        description="Bạn có chắc muốn xóa banner này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        isLoading={banners.isDeleting}
        onConfirm={banners.handleConfirmDelete}
      />
    </div>
  );
}

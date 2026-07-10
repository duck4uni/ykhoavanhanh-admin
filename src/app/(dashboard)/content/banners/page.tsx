"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { pageConfigHooks, type PageConfig } from "@/api/pageConfigApi";
import { filesHooks } from "@/api/filesApi";
import { toast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search, X, ImageIcon } from "lucide-react";
import { LoadingSection, Spinner } from "@/components/ui/Spinner";
import { TablePagination } from "@/components/ui/TablePagination";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";

const PAGE_SIZE = 10;

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface BannerForm {
  name: string;
  code: string;
  content: string; // Đường dẫn ảnh banner trả về từ API upload file (/images/...)
}

const EMPTY_FORM: BannerForm = {
  name: "",
  code: "",
  content: "",
};

function slugifyCode(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function isImagePath(path: string | null): path is string {
  return !!path && path.trim().length > 0;
}

function getImageSrc(path: string | null): string | null {
  if (!isImagePath(path)) return null;
  const value = path.trim();
  if (/^https?:\/\//i.test(value)) return value;
  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}${value.startsWith("/") ? value : `/${value}`}`;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function BannersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerForm>(EMPTY_FORM);

  const params = useMemo(
    () => ({ currentPage: page, pageSize: PAGE_SIZE }),
    [page]
  );

  const { data, isFetching } = pageConfigHooks.useList(params);
  const total = data?.count ?? 0;
  const totalPages = data?.totalPages ?? (Math.ceil(total / PAGE_SIZE) || 1);

  const filteredRows = useMemo(() => {
    const rows = data?.rows ?? [];
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        (r.name ?? "").toLowerCase().includes(q) ||
        (r.code ?? "").toLowerCase().includes(q)
    );
  }, [data, search]);

  /* ── Mutations ────────────────────────────────────────────────────────── */

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

  const deleteMutation = pageConfigHooks.useDelete({
    onSuccess: () => toast.success("Xóa banner thành công"),
    onError: (err) => toast.error(err.message || "Xóa banner thất bại"),
  });

  const uploadMutation = filesHooks.useUpload({
    onSuccess: (file) => {
      setForm((prev) => ({ ...prev, content: file.original }));
      toast.success("Upload ảnh banner thành công");
    },
    onError: (err) => toast.error(err.message || "Upload ảnh thất bại"),
  });

  function handleUploadImage(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }
    uploadMutation.mutate(file);
  }

  /* ── Actions ────────────────────────────────────────────────────────────── */

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
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
    setForm(EMPTY_FORM);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên banner");
      return;
    }
    const payload = {
      name: form.name.trim(),
      code: form.code.trim() || slugifyCode(form.name),
      content: form.content.trim() || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function openConfirmDelete(id: string) {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  }

  function handleConfirmDelete() {
    if (pendingDeleteId) {
      deleteMutation.mutate(pendingDeleteId);
      setPendingDeleteId(null);
      setConfirmOpen(false);
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending || uploadMutation.isPending;

  /* ── Render ─────────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banner</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý banner hiển thị trên ứng dụng
            {total > 0 && (
              <span className="ml-1.5 text-slate-400">({total} banner)</span>
            )}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm banner
        </button>
      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, mã banner..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] overflow-hidden">
        {isFetching && <LoadingSection />}

        {!isFetching && filteredRows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <ImageIcon className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              Chưa có banner nào
            </p>
            <p className="text-xs text-slate-400">
              Tạo banner đầu tiên để bắt đầu
            </p>
          </div>
        )}

        {!isFetching && filteredRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">
                    Banner
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3 hidden md:table-cell">
                    Mã
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3 hidden sm:table-cell">
                    Ngày tạo
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((banner) => {
                  const imageSrc = getImageSrc(banner.content);
                  return (
                  <tr
                    key={banner.id}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    {/* Thumbnail + name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-20 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200">
                          {imageSrc ? (
                            <Image
                              src={imageSrc}
                              alt={banner.name ?? "banner"}
                              fill
                              sizes="80px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate max-w-[220px]">
                            {banner.name || "—"}
                          </p>
                          {imageSrc && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">
                              {banner.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                        {banner.code || "—"}
                      </span>
                    </td>

                    {/* Created at */}
                    <td className="px-6 py-4 text-right hidden sm:table-cell">
                      <span className="text-xs text-slate-400">
                        {banner.created_at ? formatDate(banner.created_at) : "—"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity justify-end">
                        <button
                          onClick={() => openEdit(banner)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-primary hover:bg-primary-50 transition-colors"
                          title="Sửa"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openConfirmDelete(banner.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Xóa"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredRows.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100">
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={total}
              pageSize={PAGE_SIZE}
            />
          </div>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingId ? "Chỉnh sửa banner" : "Thêm banner mới"}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tên banner <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                      code:
                        f.code && f.code === slugifyCode(f.name)
                          ? slugifyCode(e.target.value)
                          : f.code,
                    }))
                  }
                  placeholder="VD: Banner trang chủ"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  autoFocus
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mã banner
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value }))
                  }
                  placeholder="banner-trang-chu"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none font-mono"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Để trống sẽ tự động tạo từ tên banner
                </p>
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ảnh banner
                </label>
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition-colors hover:border-primary-300 hover:bg-primary-50/40">
                  <ImageIcon className="mb-2 h-6 w-6 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">
                    {uploadMutation.isPending ? "Đang upload ảnh..." : "Chọn ảnh từ máy"}
                  </span>
                  <span className="mt-1 text-xs text-slate-400">
                    Hỗ trợ PNG, JPG, WEBP. File sẽ được upload lên hệ thống.
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadMutation.isPending}
                    onChange={(e) => handleUploadImage(e.target.files?.[0] ?? null)}
                  />
                </label>

                {form.content && (
                  <p className="mt-2 text-xs text-slate-400">
                    Đường dẫn đã lưu: <span className="font-mono">{form.content}</span>
                  </p>
                )}

                {getImageSrc(form.content) && (
                  <div className="relative mt-3 h-36 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <Image
                      src={getImageSrc(form.content)!}
                      alt="preview"
                      fill
                      sizes="480px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isMutating}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {isMutating && <Spinner size="sm" />}
                  {editingId ? "Lưu thay đổi" : "Tạo banner"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="delete"
        title="Xóa banner"
        description="Bạn có chắc muốn xóa banner này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

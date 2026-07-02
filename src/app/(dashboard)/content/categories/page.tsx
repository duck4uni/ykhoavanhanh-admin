"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { postCategoriesHooks, type PostCategory } from "@/api/postCategoriesApi";
import { toast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Check,
  FolderOpen,
  ArrowUpDown,
  RefreshCw,
  Copy,
  MoreVertical,
  FileText,
  CheckCircle2,
  PauseCircle,
  Info,
} from "lucide-react";
import { LoadingSection, Spinner } from "@/components/ui/Spinner";
import { TablePagination } from "@/components/ui/TablePagination";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";

const PAGE_SIZE = 10;

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  parent_id: string;
  sort_order: number;
  is_active: boolean;
}

const EMPTY_FORM: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  parent_id: "",
  sort_order: 0,
  is_active: true,
};

type SortOrder = "asc" | "desc";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/** Số bài viết của danh mục — đọc mềm nếu backend có trả field. */
function getPostCount(cat: PostCategory): number | null {
  const c = cat as unknown as Record<string, unknown>;
  const v = c.post_count ?? c.posts_count ?? c.postCount ?? c.total_posts;
  return typeof v === "number" ? v : null;
}

/* ─── Row action menu ───────────────────────────────────────────────────── */

function RowMenu({
  onEdit,
  onDelete,
  disabled,
}: {
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative flex justify-end" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        title="Thao tác"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-20 w-40 rounded-xl border border-slate-100 bg-white shadow-lg py-1">
          <button
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            disabled={disabled}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> Xóa
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);

  const params = useMemo(() => {
    const p: Record<string, unknown> = { currentPage: page, pageSize: PAGE_SIZE };
    if (filterActive !== null) p.is_active = filterActive;
    return p;
  }, [page, filterActive]);

  const { data, isFetching } = postCategoriesHooks.useList(params);
  const total = data?.count ?? 0;
  const totalPages = data?.totalPages ?? (Math.ceil(total / PAGE_SIZE) || 1);

  const filteredRows = useMemo(() => {
    let rows = [...(data?.rows ?? [])];
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q) ||
          (r.description ?? "").toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => {
      const diff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
      return sortOrder === "asc" ? diff : -diff;
    });
    return rows;
  }, [data, search, sortOrder]);

  /* ── Stats (tính từ dữ liệu thật) ─────────────────────────────────────── */
  const allRows = data?.rows ?? [];
  const activeCount = allRows.filter((r) => r.is_active).length;
  const inactiveCount = allRows.filter((r) => !r.is_active).length;
  const totalPosts = allRows.reduce((sum, r) => sum + (getPostCount(r) ?? 0), 0);
  const activePct = total > 0 ? Math.round((activeCount / total) * 100) : 0;
  const inactivePct = total > 0 ? Math.round((inactiveCount / total) * 100) : 0;

  const stats = [
    { label: "Tổng danh mục", value: total, sub: "Danh mục", icon: FolderOpen, tone: "bg-primary-100 text-primary-600" },
    { label: "Đang hoạt động", value: activeCount, sub: `${activePct}%`, icon: CheckCircle2, tone: "bg-success-light text-success" },
    { label: "Đã tắt", value: inactiveCount, sub: `${inactivePct}%`, icon: PauseCircle, tone: "bg-warning-light text-warning" },
    { label: "Tổng bài viết", value: totalPosts, sub: "Bài viết", icon: FileText, tone: "bg-purple-100 text-purple-600" },
  ];

  /* ── Mutations ────────────────────────────────────────────────────────── */

  const createMutation = postCategoriesHooks.useCreate({
    onSuccess: () => {
      toast.success("Tạo danh mục thành công");
      closeModal();
    },
    onError: (err) => toast.error(err.message || "Tạo danh mục thất bại"),
  });

  const patchMutation = postCategoriesHooks.usePatch({
    onSuccess: () => toast.success("Cập nhật thành công"),
    onError: (err) => toast.error(err.message || "Cập nhật thất bại"),
  });

  const deleteMutation = postCategoriesHooks.useDelete({
    onSuccess: () => toast.success("Xóa danh mục thành công"),
    onError: (err) => toast.error(err.message || "Xóa danh mục thất bại"),
  });

  /* ── Actions ────────────────────────────────────────────────────────────── */

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(cat: PostCategory) {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      parent_id: cat.parent_id ?? "",
      sort_order: cat.sort_order ?? 0,
      is_active: cat.is_active ?? true,
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
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }
    const payload = {
      ...form,
      slug: form.slug.trim() || slugify(form.name),
      parent_id: form.parent_id || undefined,
      sort_order: Number(form.sort_order) || 0,
    };
    if (editingId) {
      patchMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function toggleActive(cat: PostCategory) {
    patchMutation.mutate({
      id: cat.id,
      data: { is_active: !cat.is_active },
    });
  }

  function copySlug(slug: string) {
    navigator.clipboard?.writeText(slug);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug((s) => (s === slug ? null : s)), 1500);
  }

  function resetFilters() {
    setSearch("");
    setFilterActive(null);
    setSortOrder("asc");
    setPage(1);
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

  /* ── Render ─────────────────────────────────────────────────────────────── */

  const isMutating =
    createMutation.isPending ||
    patchMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Danh mục bài viết</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý danh mục tin tức và bài viết
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSortOrder((s) => (s === "asc" ? "desc" : "asc"))}
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

      {/* ── Stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-start gap-4">
                <div className={cn("flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl", s.tone)}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm theo tên, slug, mô tả..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
              />
            </div>
          </div>

          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái</label>
            <select
              value={filterActive === null ? "all" : filterActive ? "active" : "inactive"}
              onChange={(e) => {
                const v = e.target.value;
                setFilterActive(v === "all" ? null : v === "active");
                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã tắt</option>
            </select>
          </div>

          <div className="min-w-[170px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Sắp xếp</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            >
              <option value="asc">Thứ tự tăng dần</option>
              <option value="desc">Thứ tự giảm dần</option>
            </select>
          </div>

          <button
            onClick={resetFilters}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary"
          >
            <RefreshCw className="h-4 w-4" />
            Đặt lại
          </button>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] overflow-hidden">
        {isFetching && <LoadingSection />}

        {!isFetching && filteredRows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <FolderOpen className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              Chưa có danh mục nào
            </p>
            <p className="text-xs text-slate-400">
              Tạo danh mục đầu tiên để bắt đầu
            </p>
          </div>
        )}

        {!isFetching && filteredRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3.5">
                    Danh mục
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3.5 hidden md:table-cell">
                    Slug
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3.5 hidden lg:table-cell">
                    Số bài viết
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3.5 hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1">
                      Thứ tự <Info className="w-3 h-3 text-slate-400" />
                    </span>
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3.5">
                    Trạng thái
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3.5 hidden sm:table-cell">
                    Ngày tạo
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3.5">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((cat) => {
                  const postCount = getPostCount(cat);
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Name + Description */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FolderOpen className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate max-w-[240px]">
                              {cat.name}
                            </p>
                            {cat.description && (
                              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[240px]">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Slug + copy */}
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                            {cat.slug}
                          </span>
                          <button
                            onClick={() => copySlug(cat.slug)}
                            className="text-slate-400 hover:text-primary transition-colors"
                            title="Sao chép slug"
                          >
                            {copiedSlug === cat.slug ? (
                              <Check className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Post count */}
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-sm font-semibold text-primary-600">
                          {postCount ?? "—"}
                        </span>
                      </td>

                      {/* Sort order */}
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-sm text-slate-600">{cat.sort_order ?? 0}</span>
                      </td>

                      {/* Active toggle */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(cat)}
                          disabled={patchMutation.isPending}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                            cat.is_active
                              ? "text-emerald-600 bg-emerald-50 border border-emerald-200"
                              : "text-slate-500 bg-slate-50 border border-slate-200"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              cat.is_active ? "bg-emerald-500" : "bg-slate-400"
                            )}
                          />
                          {cat.is_active ? "Hoạt động" : "Tắt"}
                        </button>
                      </td>

                      {/* Created at */}
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="text-xs text-slate-500">
                          {cat.created_at ? formatDate(cat.created_at) : "—"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <RowMenu
                          onEdit={() => openEdit(cat)}
                          onDelete={() => openConfirmDelete(cat.id)}
                          disabled={deleteMutation.isPending}
                        />
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
                {editingId ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
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
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                      slug:
                        f.slug && f.slug === slugify(f.name)
                          ? slugify(e.target.value)
                          : f.slug,
                    }))
                  }
                  placeholder="VD: Sức khỏe"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  autoFocus
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
                  placeholder="suc-khoe"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none font-mono"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Để trống sẽ tự động tạo từ tên danh mục
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Mô tả ngắn về danh mục..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Sort order + Active */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Thứ tự
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        sort_order: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Trạng thái
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, is_active: !f.is_active }))
                    }
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl border transition-colors",
                      form.is_active
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    )}
                  >
                    {form.is_active ? (
                      <>
                        <Check className="w-4 h-4" />
                        Hoạt động
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        Tắt
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isMutating}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {isMutating && <Spinner size="sm" />}
                  {editingId ? "Lưu thay đổi" : "Tạo danh mục"}
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
        title="Xóa danh mục"
        description="Bạn có chắc muốn xóa danh mục này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

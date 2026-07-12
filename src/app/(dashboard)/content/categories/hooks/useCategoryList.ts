import { useMemo, useState } from "react";
import { postCategoriesHooks } from "@/api/postCategoriesApi";
import { toast } from "@/components/ui/Toast";
import { CATEGORY_PAGE_SIZE, getPostCount, type SortOrder } from "../types";

/** State + dữ liệu cho trang danh mục bài viết. */
export function useCategoryList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const params = useMemo(() => {
    const value: Record<string, unknown> = { currentPage: page, pageSize: CATEGORY_PAGE_SIZE };
    if (filterActive !== null) value.is_active = filterActive;
    return value;
  }, [page, filterActive]);

  const { data, isFetching } = postCategoriesHooks.useList(params);
  const total = data?.count ?? 0;
  const totalPages = data?.totalPages ?? (Math.ceil(total / CATEGORY_PAGE_SIZE) || 1);

  const filteredRows = useMemo(() => {
    let rows = [...(data?.rows ?? [])];
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (row) =>
          row.name.toLowerCase().includes(q) ||
          row.slug.toLowerCase().includes(q) ||
          (row.description ?? "").toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => {
      const diff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
      return sortOrder === "asc" ? diff : -diff;
    });
    return rows;
  }, [data, search, sortOrder]);

  const stats = useMemo(() => {
    const allRows = data?.rows ?? [];
    const activeCount = allRows.filter((row) => row.is_active).length;
    const inactiveCount = allRows.filter((row) => !row.is_active).length;
    const totalPosts = allRows.reduce((sum, row) => sum + (getPostCount(row) ?? 0), 0);
    const activePct = total > 0 ? Math.round((activeCount / total) * 100) : 0;
    const inactivePct = total > 0 ? Math.round((inactiveCount / total) * 100) : 0;
    return { total, activeCount, inactiveCount, totalPosts, activePct, inactivePct };
  }, [data, total]);

  const patchMutation = postCategoriesHooks.usePatch({
    onSuccess: () => toast.success("Cập nhật thành công"),
    onError: (err) => toast.error(err.message || "Cập nhật thất bại"),
  });
  const deleteMutation = postCategoriesHooks.useDelete({
    onSuccess: () => toast.success("Xóa danh mục thành công"),
    onError: (err) => toast.error(err.message || "Xóa danh mục thất bại"),
  });

  function copySlug(slug: string) {
    navigator.clipboard?.writeText(slug);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug((current) => (current === slug ? null : current)), 1500);
  }

  function resetFilters() {
    setSearch("");
    setFilterActive(null);
    setSortOrder("asc");
    setPage(1);
  }

  function openConfirmDelete(id: string) {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  }

  function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    deleteMutation.mutate(pendingDeleteId);
    setPendingDeleteId(null);
    setConfirmOpen(false);
  }

  return {
    rows: filteredRows,
    isFetching,
    page,
    setPage,
    total,
    totalPages,
    search,
    setSearch,
    filterActive,
    setFilterActive,
    sortOrder,
    setSortOrder,
    copiedSlug,
    copySlug,
    stats,
    patchMutation,
    resetFilters,
    confirmOpen,
    setConfirmOpen,
    openConfirmDelete,
    handleConfirmDelete,
    isDeleting: deleteMutation.isPending,
  };
}

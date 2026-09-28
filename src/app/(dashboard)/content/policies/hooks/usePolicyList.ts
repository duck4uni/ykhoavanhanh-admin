import { useEffect, useMemo, useState } from "react";
import { policiesHooks } from "@/api/policiesApi";
import { toast } from "@/components/ui/Toast";
import { useDebounce } from "@/hooks/useApiHelpers";
import { POLICY_PAGE_SIZE } from "../types";

/**
 * State + dữ liệu cho trang "Chính sách sử dụng".
 *
 * API `/policies` không hỗ trợ tham số tìm kiếm phía server, nên chỉ
 * `is_active` được gửi lên server; từ khóa tìm kiếm được lọc phía client
 * trên các dòng đã tải về (giống `useCategoryList`).
 */
export function usePolicyList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(POLICY_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const params = useMemo(() => {
    const value: Record<string, unknown> = { currentPage: page, pageSize };
    if (filterActive !== null) value.is_active = filterActive;
    return value;
  }, [page, pageSize, filterActive]);

  const { data, isFetching } = policiesHooks.useList(params);
  const total = data?.count ?? 0;
  const totalPages = data?.totalPages ?? (Math.ceil(total / pageSize) || 1);

  useEffect(() => {
    setPage(1);
  }, [pageSize, filterActive]);

  const filteredRows = useMemo(() => {
    let rows = [...(data?.rows ?? [])];
    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (row) =>
          row.title.toLowerCase().includes(q) ||
          (row.description ?? "").toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return rows;
  }, [data, debouncedSearch]);

  const deleteMutation = policiesHooks.useDelete({
    onSuccess: () => toast.success("Xóa chính sách thành công"),
    onError: (err) => toast.error(err.message || "Xóa chính sách thất bại"),
  });

  function resetFilters() {
    setSearch("");
    setFilterActive(null);
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
    pageSize,
    setPageSize,
    total,
    totalPages,
    search,
    setSearch,
    filterActive,
    setFilterActive,
    resetFilters,
    confirmOpen,
    setConfirmOpen,
    openConfirmDelete,
    handleConfirmDelete,
    isDeleting: deleteMutation.isPending,
  };
}

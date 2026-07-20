import { useEffect, useMemo, useState } from "react";
import { pageConfigHooks } from "@/api/pageConfigApi";
import { toast } from "@/components/ui/Toast";
import { BANNER_PAGE_SIZE } from "../types";

/** State + dữ liệu cho trang banner. */
export function useBannerList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(BANNER_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const params = useMemo(() => ({ currentPage: page, pageSize }), [page, pageSize]);
  const { data, isFetching } = pageConfigHooks.useList(params);
  const total = data?.count ?? 0;
  const totalPages = data?.totalPages ?? (Math.ceil(total / pageSize) || 1);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const filteredRows = useMemo(() => {
    const rows = data?.rows ?? [];
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) => (row.name ?? "").toLowerCase().includes(q) || (row.code ?? "").toLowerCase().includes(q));
  }, [data, search]);

  const deleteMutation = pageConfigHooks.useDelete({
    onSuccess: () => toast.success("Xóa banner thành công"),
    onError: (err) => toast.error(err.message || "Xóa banner thất bại"),
  });

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
    search,
    setSearch,
    total,
    totalPages,
    confirmOpen,
    setConfirmOpen,
    openConfirmDelete,
    handleConfirmDelete,
    isDeleting: deleteMutation.isPending,
  };
}

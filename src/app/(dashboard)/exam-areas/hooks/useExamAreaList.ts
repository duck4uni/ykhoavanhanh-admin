import { useEffect, useMemo, useState } from "react";
import { examAreasHooks, type ExamArea } from "@/api/examAreasApi";
import { toast } from "@/components/ui/Toast";
import { useDebounce } from "@/hooks/useApiHelpers";
import { EXAM_AREA_PAGE_SIZE } from "../types";

/** State + dữ liệu cho trang danh sách khu vực khám. */
export function useExamAreaList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(EXAM_AREA_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedSearch = useDebounce(search, 400);

  const serverFilters = useMemo(() => {
    const parts: string[] = [];
    if (debouncedSearch.trim()) parts.push(`name@=${debouncedSearch.trim()}`);
    if (statusFilter !== "all") parts.push(`status==${statusFilter}`);
    return parts.length > 0 ? parts.join(",") : undefined;
  }, [debouncedSearch, statusFilter]);

  const { data, isLoading } = examAreasHooks.useList({
    currentPage: page,
    pageSize,
    filters: serverFilters,
  });
  const areas = useMemo(() => data?.rows ?? [], [data]);
  const total = data?.count ?? areas.length;
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));
  const paged = areas;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const deleteMutation = examAreasHooks.useDelete({
    onSuccess: () => toast.success("Xóa khu vực khám thành công"),
    onError: (err) => toast.error(err.message || "Xóa khu vực khám thất bại"),
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, pageSize]);

  const stats = useMemo(() => {
    const activeCount = areas.filter((area) => area.status === "ACTIVE").length;
    const activePct = total > 0 ? Math.round((activeCount / total) * 100) : 0;
    return {
      total,
      activeCount,
      activePct,
      totalRooms: 0,
      noRoomConfigured: areas.length,
    };
  }, [areas, total]);

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
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
    rows: paged,
    filteredCount: total,
    isLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    stats,
    resetFilters,
    confirmOpen,
    setConfirmOpen,
    openConfirmDelete,
    handleConfirmDelete,
    isDeleting: deleteMutation.isPending,
  };
}

export type { ExamArea };

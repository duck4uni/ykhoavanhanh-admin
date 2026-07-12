import { useMemo, useState } from "react";
import { examAreasHooks, type ExamArea } from "@/api/examAreasApi";
import { toast } from "@/components/ui/Toast";
import { EXAM_AREA_PAGE_SIZE } from "../types";

/** State + dữ liệu cho trang danh sách khu vực khám (lọc client-side). */
export function useExamAreaList() {
  const { data, isLoading } = examAreasHooks.useList();
  const areas = useMemo(() => data?.rows ?? [], [data]);
  const total = data?.count ?? areas.length;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const deleteMutation = examAreasHooks.useDelete({
    onSuccess: () => toast.success("Xóa khu vực khám thành công"),
    onError: (err) => toast.error(err.message || "Xóa khu vực khám thất bại"),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return areas.filter((area) => {
      const matchSearch =
        !q ||
        area.code.toLowerCase().includes(q) ||
        area.name.toLowerCase().includes(q) ||
        (area.short_name ?? "").toLowerCase().includes(q) ||
        (area.address ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || area.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [areas, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / EXAM_AREA_PAGE_SIZE));
  const paged = filtered.slice((page - 1) * EXAM_AREA_PAGE_SIZE, page * EXAM_AREA_PAGE_SIZE);

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
    filteredCount: filtered.length,
    isLoading,
    page,
    setPage,
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

import { useEffect, useMemo, useState } from "react";
import { specialtiesHooks } from "@/api/specialtiesApi";
import type { AdminSpecialty } from "@/types/hospital-admin";
import { toast } from "@/components/ui/Toast";
import { useDebounce } from "@/hooks/useApiHelpers";
import { SPECIALTY_PAGE_SIZE } from "../types";

/** State + dữ liệu cho trang danh sách chuyên khoa. */
export function useSpecialtyList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(SPECIALTY_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bookingGroupFilter, setBookingGroupFilter] = useState("all");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);
  const serverFilters = debouncedSearch.trim() ? `name@=${debouncedSearch.trim()}` : undefined;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const { data, isLoading } = specialtiesHooks.useList({
    currentPage,
    pageSize,
    sortField: "created_at",
    sortOrder: "DESC",
    filters: serverFilters,
  });

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const total = data?.count ?? rows.length;

  const deleteMutation = specialtiesHooks.useDelete({
    onSuccess: () => toast.success("Xóa chuyên khoa thành công"),
    onError: (err) => toast.error(err.message || "Xóa chuyên khoa thất bại"),
  });

  const bookingGroups = useMemo(
    () =>
      Array.from(
        new Set(rows.map((item) => item.booking_group).filter((group): group is string => Boolean(group)))
      ).sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    // Tìm theo tên đã chuyển sang server (filters); tại đây chỉ lọc bổ sung.
    return rows.filter((item) => {
      const matchStatus =
        statusFilter === "all" || (statusFilter === "active" ? item.is_active : !item.is_active);
      const matchGroup = bookingGroupFilter === "all" || item.booking_group === bookingGroupFilter;
      return matchStatus && matchGroup;
    });
  }, [rows, statusFilter, bookingGroupFilter]);

  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));

  const stats = useMemo(() => {
    const activeCount = rows.filter((item) => item.is_active).length;
    const inactiveCount = rows.filter((item) => !item.is_active).length;
    const withRoomInstruction = rows.filter((item) => Boolean(item.room_visit_instruction)).length;
    const withBookingNote = rows.filter((item) => Boolean(item.booking_note)).length;
    const activePct = total > 0 ? Math.round((activeCount / total) * 100) : 0;
    return { total, activeCount, inactiveCount, withRoomInstruction, withBookingNote, activePct };
  }, [rows, total]);

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setBookingGroupFilter("all");
    setCurrentPage(1);
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
    isLoading,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    total,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    bookingGroupFilter,
    setBookingGroupFilter,
    bookingGroups,
    stats,
    resetFilters,
    confirmOpen,
    setConfirmOpen,
    openConfirmDelete,
    handleConfirmDelete,
    isDeleting: deleteMutation.isPending,
  };
}

export type UseSpecialtyListResult = ReturnType<typeof useSpecialtyList>;
export type { AdminSpecialty };

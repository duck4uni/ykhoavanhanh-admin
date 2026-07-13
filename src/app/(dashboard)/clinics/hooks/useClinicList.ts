import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { roomsHooks, type HisRoom } from "@/api/roomsApi";
import { toast } from "@/components/ui/Toast";
import { useDebounce } from "@/hooks/useApiHelpers";
import { CLINIC_PAGE_SIZE, getExamAreaName, hasAssignedServices } from "../types";

/** State + dữ liệu cho trang danh sách phòng khám. */
export function useClinicList() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hisFilter, setHisFilter] = useState("all");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Bộ lọc phía server theo tên phòng khám: filters=room_name@=<giá trị>
  const serverFilters = debouncedSearch.trim() ? `room_name@=${debouncedSearch.trim()}` : undefined;

  const { data: roomsData, isLoading } = roomsHooks.usePaginatedList({
    currentPage: page,
    pageSize: CLINIC_PAGE_SIZE,
    filters: serverFilters,
  });
  const allRooms = useMemo(() => roomsData?.rows ?? [], [roomsData]);

  // Về trang 1 khi từ khóa tìm kiếm (đã debounce) thay đổi.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Điền sẵn ô tìm kiếm khi điều hướng từ trang "Xem phòng khám".
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearch(q);
  }, [searchParams]);

  const deleteMutation = roomsHooks.useDelete({
    onSuccess: () => toast.success("Xóa phòng khám thành công"),
    onError: (err) => toast.error(err.message || "Xóa phòng khám thất bại"),
  });

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const statusMutation = roomsHooks.useUpdate({
    onSuccess: (data) => {
      toast.success(data.status === "ACTIVE" ? "Đã bật phòng khám" : "Đã tắt phòng khám");
    },
    onError: (err) => toast.error(err.message || "Cập nhật trạng thái thất bại"),
    onSettled: () => setTogglingId(null),
  });

  function toggleRoomStatus(room: HisRoom) {
    setTogglingId(room.id);
    statusMutation.mutate({
      id: room.id,
      data: { status: room.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
    });
  }

  const examAreaOptions = useMemo(() => {
    return Array.from(new Set(allRooms.map(getExamAreaName))).filter(Boolean).sort();
  }, [allRooms]);

  const filtered = useMemo(() => {
    // Tìm kiếm theo tên phòng đã chuyển sang server (params.filters); tại đây chỉ lọc bổ sung.
    return allRooms.filter((room) => {
      const areaName = getExamAreaName(room);
      const matchArea = areaFilter === "all" || areaName === areaFilter;
      const matchStatus = statusFilter === "all" || room.status === statusFilter;
      const matchHis =
        hisFilter === "all" ||
        (hisFilter === "has" ? hasAssignedServices(room) : !hasAssignedServices(room));
      return matchArea && matchStatus && matchHis;
    });
  }, [allRooms, areaFilter, statusFilter, hisFilter]);

  const totalPages = roomsData?.totalPages ?? Math.max(1, Math.ceil(filtered.length / CLINIC_PAGE_SIZE));

  const totalRooms = roomsData?.count ?? allRooms.length;
  const stats = useMemo(() => {
    const activeRooms = allRooms.filter((room) => room.status === "ACTIVE").length;
    const withServiceCode = allRooms.filter(hasAssignedServices).length;
    const withoutDescription = allRooms.filter((room) => !room.description?.trim()).length;
    const pct = (value: number) => (totalRooms > 0 ? ((value / totalRooms) * 100).toFixed(2) : "0");
    return {
      totalRooms,
      activeRooms,
      withServiceCode,
      withoutDescription,
      activePct: pct(activeRooms),
      withServiceCodePct: pct(withServiceCode),
      noDescPct: pct(withoutDescription),
    };
  }, [allRooms, totalRooms]);

  function resetFilters() {
    setSearch("");
    setAreaFilter("all");
    setStatusFilter("all");
    setHisFilter("all");
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
    // dữ liệu bảng
    rooms: filtered,
    isLoading,
    page,
    setPage,
    totalPages,
    totalItems: roomsData?.count ?? filtered.length,
    // tìm kiếm + lọc
    search,
    setSearch,
    areaFilter,
    setAreaFilter,
    statusFilter,
    setStatusFilter,
    hisFilter,
    setHisFilter,
    examAreaOptions,
    resetFilters,
    // thống kê
    stats,
    // xoá
    confirmOpen,
    setConfirmOpen,
    openConfirmDelete,
    handleConfirmDelete,
    isDeleting: deleteMutation.isPending,
    // bật/tắt trạng thái
    toggleRoomStatus,
    togglingId,
  };
}

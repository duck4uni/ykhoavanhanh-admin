import { useCallback, useEffect, useMemo, useState } from "react";
import { doctorWorkSchedulesHooks, type DoctorWorkSchedule } from "@/api/doctorWorkSchedulesApi";
import { examAreasHooks } from "@/api/examAreasApi";
import { doctorsHooks } from "@/api/doctorsApi";
import { roomsHooks, roomsService } from "@/api/roomsApi";
import { hisServicesHooks, hisServicesService } from "@/api/hisServicesApi";
import type { AsyncSearchFetchResult } from "@/components/ui/AsyncSearchSelect";
import { toast } from "@/components/ui/Toast";
import { useDebounce } from "@/hooks/useApiHelpers";
import {
  APPOINTMENT_PAGE_SIZE,
  getScheduleCapacity,
  scheduleIncludesDate,
  scheduleIncludesRoom,
} from "../types";

/** State + dữ liệu cho trang danh sách lịch khám (doctor work schedules). */
export function useAppointmentScheduleList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(APPOINTMENT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [examAreaFilter, setExamAreaFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = doctorWorkSchedulesHooks.useList({
    currentPage: page,
    pageSize,
    sortField: "created_at",
    sortOrder: "DESC",
    schedule_date: dateFilter || undefined,
    filters: statusFilter ? `status==${statusFilter}` : undefined,
    exam_area_id: examAreaFilter || undefined,
    // Phải thêm tiền tố "his_services." vì cột "id" trùng tên với id của chính bảng lịch khám
    // (doctor_work_schedules) — nếu không sẽ bị hiểu nhầm và lọc sai/không ra kết quả.
    service_filters: serviceFilter ? `his_services.id==${serviceFilter}` : undefined,
  });
  const schedules = useMemo(() => data?.rows ?? [], [data]);
  const totalCount = data?.count ?? schedules.length;

  const { data: areasData } = examAreasHooks.useList();
  const examAreas = areasData?.rows ?? [];
  const { data: doctors, isLoading: isLoadingDoctors } = doctorsHooks.useList();
  const doctorList = doctors ?? [];

  const { data: roomsData } = roomsHooks.usePaginatedList({
    pageSize: 100,
    filters: "status==ACTIVE",
  });
  const roomLookup = useMemo(() => {
    const map = new Map<string, string>();
    (roomsData?.rows ?? []).forEach((r) => {
      const name = r.roomname || (r as unknown as { room_name?: string }).room_name;
      if (name) {
        if (r.id) map.set(r.id, name);
        if (r.roomid) map.set(r.roomid, name);
      }
    });
    return map;
  }, [roomsData]);

  const { data: servicesData } = hisServicesHooks.usePaginatedList({
    pageSize: 100,
    filters: "status==ACTIVE",
  });
  const serviceLookup = useMemo(() => {
    const map = new Map<string, string>();
    (servicesData?.rows ?? []).forEach((s) => {
      const raw = s.raw_data as Record<string, unknown> | null | undefined;
      const rawName = typeof raw?.servicename === "string" ? raw.servicename : typeof raw?.service_name === "string" ? raw.service_name : undefined;
      const name = s.servicename || rawName;
      if (name) {
        if (s.id) map.set(s.id, name);
        if (s.serviceid) map.set(s.serviceid, name);
      }
    });
    return map;
  }, [servicesData]);

  // Dropdown filter Phòng khám: chỉ tải 15 item/trang + tìm kiếm phía server, tránh tải hết danh sách.
  const fetchRoomOptions = useCallback(
    async ({ search, page, pageSize: size }: { search: string; page: number; pageSize: number }): Promise<AsyncSearchFetchResult> => {
      const filters = search ? `status==ACTIVE,room_name@=${search}` : "status==ACTIVE";
      const res = await roomsService.getPaginatedList({ currentPage: page, pageSize: size, filters });
      const items = (res.rows ?? [])
        .map((r) => ({ id: r.id, name: r.roomname || (r as unknown as { room_name?: string }).room_name || r.roomid || r.id }))
        .filter((r) => r.id);
      return { items, hasMore: page < (res.totalPages ?? 1) };
    },
    []
  );

  // Dropdown filter Dịch vụ khám: chỉ tải 15 item/trang + tìm kiếm phía server, tránh tải hết danh sách.
  const fetchServiceOptions = useCallback(
    async ({ search, page, pageSize: size }: { search: string; page: number; pageSize: number }): Promise<AsyncSearchFetchResult> => {
      const filters = search ? `status==ACTIVE,service_name@=${search}` : "status==ACTIVE";
      const res = await hisServicesService.getPaginatedList({ currentPage: page, pageSize: size, filters });
      const items = (res.rows ?? [])
        .map((s) => {
          const raw = s.raw_data as Record<string, unknown> | null | undefined;
          const rawName = typeof raw?.servicename === "string" ? raw.servicename : typeof raw?.service_name === "string" ? raw.service_name : undefined;
          return { id: s.id, name: s.servicename || rawName || s.serviceid || s.id };
        })
        .filter((s) => s.id);
      return { items, hasMore: page < (res.totalPages ?? 1) };
    },
    []
  );

  const deleteMutation = doctorWorkSchedulesHooks.useDelete({
    onSuccess: () => toast.success("Xóa lịch khám thành công"),
    onError: (err) => toast.error(err.message || "Xóa lịch khám thất bại"),
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionConfirm, setBulkActionConfirm] = useState<{
    open: boolean;
    action: "activate" | "deactivate" | "activate_all" | "deactivate_all";
  }>({ open: false, action: "activate" });

  const activateManyMutation = doctorWorkSchedulesHooks.useActivateMany({
    onSuccess: (res) => {
      const count = res?.affected ?? selectedIds.length;
      toast.success(`Đã kích hoạt thành công ${count} lịch khám`);
      setSelectedIds([]);
      setBulkActionConfirm({ open: false, action: "activate" });
    },
    onError: (err) => toast.error(err.message || "Kích hoạt lịch khám thất bại"),
  });

  const deactivateManyMutation = doctorWorkSchedulesHooks.useDeactivateMany({
    onSuccess: (res) => {
      const count = res?.affected ?? selectedIds.length;
      toast.success(`Đã tạm ngưng thành công ${count} lịch khám`);
      setSelectedIds([]);
      setBulkActionConfirm({ open: false, action: "deactivate" });
    },
    onError: (err) => toast.error(err.message || "Tạm ngưng lịch khám thất bại"),
  });

  const activateAllMutation = doctorWorkSchedulesHooks.useActivateAll({
    onSuccess: (res) => {
      const count = res?.affected;
      toast.success(count !== undefined ? `Đã kích hoạt tất cả (${count}) lịch khám` : "Đã kích hoạt tất cả lịch khám đang tạm ngưng");
      setSelectedIds([]);
      setBulkActionConfirm({ open: false, action: "activate_all" });
    },
    onError: (err) => toast.error(err.message || "Kích hoạt tất cả lịch khám thất bại"),
  });

  const deactivateAllMutation = doctorWorkSchedulesHooks.useDeactivateAll({
    onSuccess: (res) => {
      const count = res?.affected;
      toast.success(count !== undefined ? `Đã tạm ngưng tất cả (${count}) lịch khám` : "Đã tạm ngưng tất cả lịch khám đang hoạt động");
      setSelectedIds([]);
      setBulkActionConfirm({ open: false, action: "deactivate_all" });
    },
    onError: (err) => toast.error(err.message || "Tạm ngưng tất cả lịch khám thất bại"),
  });

  const isBulkOperating =
    activateManyMutation.isPending ||
    deactivateManyMutation.isPending ||
    activateAllMutation.isPending ||
    deactivateAllMutation.isPending;

  function toggleSelectRow(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleSelectAllCurrentPage(pageRows: DoctorWorkSchedule[]) {
    const pageIds = pageRows.map((r) => r.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function handleConfirmBulkAction() {
    if (bulkActionConfirm.action === "activate") {
      if (selectedIds.length === 0) return;
      activateManyMutation.mutate(selectedIds);
    } else if (bulkActionConfirm.action === "deactivate") {
      if (selectedIds.length === 0) return;
      deactivateManyMutation.mutate(selectedIds);
    } else if (bulkActionConfirm.action === "activate_all") {
      activateAllMutation.mutate();
    } else if (bulkActionConfirm.action === "deactivate_all") {
      deactivateAllMutation.mutate();
    }
  }

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const statusMutation = doctorWorkSchedulesHooks.useUpdate({
    onSuccess: (_data, variables) => {
      toast.success(variables.data.status === "ACTIVE" ? "Đã bật lịch khám" : "Đã tạm ngưng lịch khám");
    },
    onError: (err) => toast.error(err.message || "Cập nhật trạng thái thất bại"),
    onSettled: () => setTogglingId(null),
  });

  function toggleScheduleStatus(schedule: DoctorWorkSchedule) {
    setTogglingId(schedule.id);
    statusMutation.mutate({
      id: schedule.id,
      data: { status: schedule.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
    });
  }

  const rows = useMemo(() => {
    return schedules.filter((schedule) => {
      const q = debouncedSearch.trim().toLowerCase();
      const matchQuery =
        !q ||
        (schedule.doctor?.doctor_name ?? "").toLowerCase().includes(q) ||
        (schedule.exam_area?.name ?? "").toLowerCase().includes(q);
      const matchDate = scheduleIncludesDate(schedule, dateFilter);
      // Chưa có param riêng ở BE để lọc theo phòng khám nên lọc phía client trên trang hiện tại.
      const matchRoom = !roomFilter || scheduleIncludesRoom(schedule, roomFilter);
      return matchQuery && matchDate && matchRoom;
    });
  }, [schedules, debouncedSearch, dateFilter, roomFilter]);

  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateFilter, statusFilter, examAreaFilter, roomFilter, serviceFilter, pageSize]);

  const stats = useMemo(() => {
    const activeCount = schedules.filter((schedule) => schedule.status === "ACTIVE").length;
    const totalSlots = schedules.reduce((sum, schedule) => sum + getScheduleCapacity(schedule), 0);
    const totalBooked = schedules.reduce((sum, schedule) => sum + (schedule.booked_count ?? 0), 0);
    return { totalCount, activeCount, totalSlots, totalBooked };
  }, [schedules, totalCount]);

  function resetFilters() {
    setSearch("");
    setDateFilter("");
    setStatusFilter("");
    setExamAreaFilter("");
    setRoomFilter("");
    setServiceFilter("");
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
    rows,
    filteredCount: totalCount,
    isLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    search,
    setSearch,
    dateFilter,
    setDateFilter,
    statusFilter,
    setStatusFilter,
    examAreaFilter,
    setExamAreaFilter,
    roomFilter,
    setRoomFilter,
    serviceFilter,
    setServiceFilter,
    stats,
    resetFilters,
    examAreas,
    fetchRoomOptions,
    fetchServiceOptions,
    doctorList,
    isLoadingDoctors,
    roomLookup,
    serviceLookup,
    confirmOpen,
    setConfirmOpen,
    openConfirmDelete,
    handleConfirmDelete,
    isDeleting: deleteMutation.isPending,
    // bật/tắt trạng thái
    toggleScheduleStatus,
    togglingId,
    // multi-select & bulk actions
    selectedIds,
    toggleSelectRow,
    toggleSelectAllCurrentPage,
    clearSelection,
    bulkActionConfirm,
    setBulkActionConfirm,
    handleConfirmBulkAction,
    isBulkOperating,
  };
}

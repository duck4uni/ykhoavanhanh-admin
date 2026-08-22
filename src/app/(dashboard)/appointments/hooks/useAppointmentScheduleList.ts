import { useEffect, useMemo, useState } from "react";
import { doctorWorkSchedulesHooks, type DoctorWorkSchedule } from "@/api/doctorWorkSchedulesApi";
import { examAreasHooks } from "@/api/examAreasApi";
import { doctorsHooks } from "@/api/doctorsApi";
import { roomsHooks } from "@/api/roomsApi";
import { hisServicesHooks } from "@/api/hisServicesApi";
import { toast } from "@/components/ui/Toast";
import { useDebounce } from "@/hooks/useApiHelpers";
import {
  APPOINTMENT_PAGE_SIZE,
  getScheduleCapacity,
  getScheduleShiftCode,
  scheduleIncludesDate,
} from "../types";

/** State + dữ liệu cho trang danh sách lịch khám (doctor work schedules). */
export function useAppointmentScheduleList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(APPOINTMENT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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
      const matchShift = !shiftFilter || getScheduleShiftCode(schedule) === shiftFilter;
      return matchQuery && matchDate && matchShift;
    });
  }, [schedules, debouncedSearch, dateFilter, shiftFilter]);

  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateFilter, shiftFilter, statusFilter, pageSize]);

  const stats = useMemo(() => {
    const activeCount = schedules.filter((schedule) => schedule.status === "ACTIVE").length;
    const totalSlots = schedules.reduce((sum, schedule) => sum + getScheduleCapacity(schedule), 0);
    const totalBooked = schedules.reduce((sum, schedule) => sum + (schedule.booked_count ?? 0), 0);
    return { totalCount, activeCount, totalSlots, totalBooked };
  }, [schedules, totalCount]);

  function resetFilters() {
    setSearch("");
    setDateFilter("");
    setShiftFilter("");
    setStatusFilter("");
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
    shiftFilter,
    setShiftFilter,
    statusFilter,
    setStatusFilter,
    stats,
    resetFilters,
    examAreas,
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

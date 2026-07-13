import { useMemo, useState } from "react";
import { doctorWorkSchedulesHooks, type DoctorWorkSchedule } from "@/api/doctorWorkSchedulesApi";
import { examAreasHooks } from "@/api/examAreasApi";
import { doctorsHooks } from "@/api/doctorsApi";
import { toast } from "@/components/ui/Toast";
import { APPOINTMENT_PAGE_SIZE } from "../types";

/** State + dữ liệu cho trang danh sách lịch khám (doctor work schedules). */
export function useAppointmentScheduleList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data, isLoading } = doctorWorkSchedulesHooks.useList();
  const schedules = useMemo(() => data?.rows ?? [], [data]);
  const totalCount = data?.count ?? schedules.length;

  const { data: areasData } = examAreasHooks.useList();
  const examAreas = areasData?.rows ?? [];
  const { data: doctors, isLoading: isLoadingDoctors } = doctorsHooks.useList();
  const doctorList = doctors ?? [];

  const deleteMutation = doctorWorkSchedulesHooks.useDelete({
    onSuccess: () => toast.success("Xóa lịch khám thành công"),
    onError: (err) => toast.error(err.message || "Xóa lịch khám thất bại"),
  });

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const statusMutation = doctorWorkSchedulesHooks.usePatch({
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

  const filtered = useMemo(() => {
    return schedules.filter((schedule) => {
      const q = search.trim().toLowerCase();
      const matchQuery =
        !q ||
        (schedule.doctor?.doctor_name ?? "").toLowerCase().includes(q) ||
        (schedule.exam_area?.name ?? "").toLowerCase().includes(q);
      const matchDate = !dateFilter || schedule.schedule_date === dateFilter;
      const matchShift = !shiftFilter || schedule.shift_code === shiftFilter;
      const matchStatus = !statusFilter || schedule.status === statusFilter;
      return matchQuery && matchDate && matchShift && matchStatus;
    });
  }, [schedules, search, dateFilter, shiftFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / APPOINTMENT_PAGE_SIZE));
  const rows = filtered.slice((page - 1) * APPOINTMENT_PAGE_SIZE, page * APPOINTMENT_PAGE_SIZE);

  const stats = useMemo(() => {
    const activeCount = schedules.filter((schedule) => schedule.status === "ACTIVE").length;
    const totalSlots = schedules.reduce((sum, schedule) => sum + (schedule.max_appointments ?? 0), 0);
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
    filteredCount: filtered.length,
    isLoading,
    page,
    setPage,
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
    confirmOpen,
    setConfirmOpen,
    openConfirmDelete,
    handleConfirmDelete,
    isDeleting: deleteMutation.isPending,
    // bật/tắt trạng thái
    toggleScheduleStatus,
    togglingId,
  };
}

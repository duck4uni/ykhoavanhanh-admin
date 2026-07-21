import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { doctorsHooks, type HisDoctor } from "@/api/doctorsApi";
import { specialtiesHooks } from "@/api/specialtiesApi";
import { toast } from "@/components/ui/Toast";
import { useDebounce } from "@/hooks/useApiHelpers";
import {
  DOCTORS_PAGE_SIZE,
  getClinicName,
  getDoctorStatus,
  getScheduleCount,
  inferSpecialtyName,
} from "../list-helpers";

/** State + dữ liệu cho trang danh sách bác sĩ. */
export function useDoctorList() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DOCTORS_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [clinicFilter, setClinicFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scheduleFilter, setScheduleFilter] = useState("all");

  const serverFilters = useMemo(() => {
    const parts: string[] = [];
    if (debouncedSearch.trim()) parts.push(`doctor_name@=${debouncedSearch.trim()}`);
    if (statusFilter === "Hoạt động") parts.push("status==ACTIVE");
    else if (statusFilter === "Tạm ngưng") parts.push("status==INACTIVE");
    if (specialtyFilter) parts.push(`specialty_id==${specialtyFilter}`);
    return parts.length > 0 ? parts.join(",") : undefined;
  }, [debouncedSearch, statusFilter, specialtyFilter]);

  const { data: doctorsData, isLoading } = doctorsHooks.usePaginatedList({
    currentPage: page,
    pageSize,
    filters: serverFilters,
    sortField: "doctor_name",
    sortOrder: "ASC",
  });
  const { data: specialtiesData } = specialtiesHooks.useList();
  const allDoctors = useMemo(() => doctorsData?.rows ?? [], [doctorsData]);
  const specialties = useMemo(() => specialtiesData?.rows ?? [], [specialtiesData]);

  const getDoctorSpecialtyName = (doctor: HisDoctor) =>
    doctor.specialty?.name ??
    specialties.find((specialty) => specialty.id === doctor.specialty_id)?.name ??
    inferSpecialtyName(doctor);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const deleteMutation = doctorsHooks.useDelete({
    onSuccess: () => toast.success("Xóa bác sĩ thành công"),
    onError: (err) => toast.error(err.message || "Xóa bác sĩ thất bại"),
  });

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const statusMutation = doctorsHooks.useUpdate({
    onSuccess: (_data, variables) => {
      toast.success(variables.data.status === "ACTIVE" ? "Đã đặt bác sĩ hoạt động" : "Đã ẩn bác sĩ");
    },
    onError: (err) => toast.error(err.message || "Cập nhật trạng thái thất bại"),
    onSettled: () => setTogglingId(null),
  });

  function toggleDoctorStatus(doctor: HisDoctor) {
    const nextStatus = getDoctorStatus(doctor).label === "Hoạt động" ? "INACTIVE" : "ACTIVE";
    setTogglingId(doctor.id);
    statusMutation.mutate({ id: doctor.id, data: { status: nextStatus } });
  }

  // Về trang 1 khi từ khóa tìm kiếm (đã debounce), chuyên khoa, phòng khám, trạng thái hoặc số lượng mỗi trang thay đổi.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, specialtyFilter, clinicFilter, pageSize]);

  const filtered = useMemo(() => {
    // Tìm kiếm, chuyên khoa và trạng thái đã chuyển sang server (params.filters); tại đây chỉ lọc bổ sung.
    // Lưu ý: bác sĩ chưa có quan hệ thật với phòng khám (rooms) trong dữ liệu — matchClinic chỉ là gợi ý gần đúng.
    return allDoctors.filter((doctor) => {
      const clinic = getClinicName(doctor);
      const scheduleCount = getScheduleCount(doctor);
      const matchClinic = !clinicFilter || clinic === clinicFilter;
      const matchSchedule = scheduleFilter === "all" || (scheduleFilter === "has" ? scheduleCount > 0 : scheduleCount === 0);
      return matchClinic && matchSchedule;
    });
  }, [allDoctors, clinicFilter, scheduleFilter]);

  const totalPages = doctorsData?.totalPages ?? Math.max(1, Math.ceil(filtered.length / pageSize));

  const activeCount = allDoctors.filter((doctor) => getDoctorStatus(doctor).label === "Hoạt động").length;
  const withSchedule = allDoctors.filter((doctor) => getScheduleCount(doctor) > 0).length;
  const unassignedSpecialty = allDoctors.filter((doctor) => getDoctorSpecialtyName(doctor) === "—").length;
  const activePct = allDoctors.length > 0 ? Math.round((activeCount / allDoctors.length) * 100) : 0;
  const totalDoctors = doctorsData?.count ?? allDoctors.length;

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

  function resetFilters() {
    setSearch("");
    setSpecialtyFilter("");
    setClinicFilter("");
    setStatusFilter("all");
    setScheduleFilter("all");
    setPage(1);
  }

  return {
    router,
    isLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    filtered,
    totalCount: doctorsData?.count ?? filtered.length,
    getDoctorSpecialtyName,
    // search + filters
    search,
    setSearch,
    specialtyFilter,
    setSpecialtyFilter,
    clinicFilter,
    setClinicFilter,
    statusFilter,
    setStatusFilter,
    scheduleFilter,
    setScheduleFilter,
    resetFilters,
    // stats
    stats: { totalDoctors, activeCount, withSchedule, unassignedSpecialty, activePct },
    // delete
    confirmOpen,
    setConfirmOpen,
    openConfirmDelete,
    handleConfirmDelete,
    isDeleting: deleteMutation.isPending,
    // status toggle
    toggleDoctorStatus,
    togglingId,
  };
}

export type DoctorListController = ReturnType<typeof useDoctorList>;

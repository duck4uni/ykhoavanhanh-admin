import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { hisServicesHooks, type HisService } from "@/api/hisServicesApi";
import { toast } from "@/components/ui/Toast";
import { useDebounce } from "@/hooks/useApiHelpers";
import { EXAM_SERVICES_PAGE_SIZE, supportsInsurance } from "../list-helpers";

/** State + dữ liệu cho trang danh sách dịch vụ khám. */
export function useExamServiceList() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(EXAM_SERVICES_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [insuranceFilter, setInsuranceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const deleteMutation = hisServicesHooks.useDelete({
    onSuccess: () => toast.success("Xóa dịch vụ thành công"),
    onError: (err) => toast.error(err.message || "Xóa dịch vụ thất bại"),
  });

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const statusMutation = hisServicesHooks.useUpdate({
    onSuccess: (_data, variables) => {
      toast.success(variables.data.status === "ACTIVE" ? "Đã bật dịch vụ" : "Đã tắt dịch vụ");
    },
    onError: (err) => toast.error(err.message || "Cập nhật trạng thái thất bại"),
    onSettled: () => setTogglingId(null),
  });

  function toggleServiceStatus(service: HisService) {
    setTogglingId(service.id);
    const nextStatus = service.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    statusMutation.mutate({ id: service.id, data: { status: nextStatus } });
  }

  const debouncedSearch = useDebounce(search, 400);
  const serverFilters = useMemo(() => {
    const parts: string[] = [];
    const keyword = debouncedSearch.trim();
    // Mã dịch vụ (service_id) chỉ gồm chữ số → từ khóa toàn số thì lọc theo mã dịch vụ,
    // ngược lại lọc theo tên dịch vụ. Không gộp OR 2 field bằng "|" vì filter đó không
    // trả kết quả trên endpoint này (khác với field==value|field2==value2 dùng cho
    // notifications/users/page-config).
    if (keyword) {
      parts.push(/^\d+$/.test(keyword) ? `service_id@=${keyword}` : `service_name@=${keyword}`);
    }
    if (statusFilter === "active") parts.push("status==ACTIVE");
    else if (statusFilter === "inactive") parts.push("status==INACTIVE");
    return parts.length > 0 ? parts.join(",") : undefined;
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const { data, isLoading } = hisServicesHooks.usePaginatedList({
    currentPage,
    pageSize,
    filters: serverFilters,
    sortField: "created_at",
    sortOrder: "DESC",
  });
  const services = useMemo(() => data?.rows ?? [], [data]);
  const total = data?.count ?? 0;
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchType = serviceTypeFilter === "all" || service.servicetype === serviceTypeFilter;
      const matchInsurance = insuranceFilter === "all" || (insuranceFilter === "yes" ? supportsInsurance(service) : !supportsInsurance(service));
      const isActive = service.status !== "INACTIVE";
      const matchStatus = statusFilter === "all" || (statusFilter === "active" ? isActive : !isActive);
      const matchDate = !fromDate || service.updatetime.startsWith(fromDate) || service.fromdate.startsWith(fromDate);
      return matchType && matchInsurance && matchStatus && matchDate;
    });
  }, [services, serviceTypeFilter, insuranceFilter, statusFilter, fromDate]);

  const serviceTypes = useMemo(() => Array.from(new Set(services.map((s) => s.servicetype).filter(Boolean))).sort(), [services]);

  const activeCount = services.filter((service) => service.status !== "INACTIVE").length;
  const insuranceCount = services.filter(supportsInsurance).length;
  const updatedThisMonth = services.filter((service) => {
    const value = service.updatetime || service.updated_at || "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
  const activePct = total > 0 ? ((activeCount / total) * 100).toFixed(1) : "0";
  const insurancePct = total > 0 ? Math.round((insuranceCount / Math.max(services.length, 1)) * 100) : 0;

  function resetFilters() {
    setSearch("");
    setServiceTypeFilter("all");
    setInsuranceFilter("all");
    setStatusFilter("all");
    setFromDate("");
    setCurrentPage(1);
  }

  function openEdit(service: HisService) {
    // Trang sửa dùng id = UUID (PK) trong DB, không phải mã dịch vụ HIS.
    router.push(`/exam-services/${service.id}/edit`);
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
    router,
    isLoading,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    total,
    totalPages,
    filteredServices,
    serviceTypes,
    // filters
    search,
    setSearch,
    serviceTypeFilter,
    setServiceTypeFilter,
    insuranceFilter,
    setInsuranceFilter,
    statusFilter,
    setStatusFilter,
    fromDate,
    setFromDate,
    resetFilters,
    // stats
    stats: { total, activeCount, insuranceCount, updatedThisMonth, activePct, insurancePct },
    // actions
    openEdit,
    confirmOpen,
    setConfirmOpen,
    openConfirmDelete,
    handleConfirmDelete,
    isDeleting: deleteMutation.isPending,
    // status toggle
    toggleServiceStatus,
    togglingId,
  };
}

export type ExamServiceListController = ReturnType<typeof useExamServiceList>;

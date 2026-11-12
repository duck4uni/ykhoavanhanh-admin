import { useEffect, useMemo, useState } from "react";
import { appVersionsHooks } from "@/api/appVersionsApi";
import { toast } from "@/components/ui/Toast";
import { useDebounce } from "@/hooks/useApiHelpers";
import { APP_VERSION_PAGE_SIZE } from "../types";

/** State + dữ liệu cho trang "Quản lý bản cập nhật". */
export function useAppVersionList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(APP_VERSION_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [enabledFilter, setEnabledFilter] = useState("all");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // filters=version_name@=<từ khóa>,platform==<giá trị>,status==<giá trị>,enabled==<true|false>
  const serverFilters = useMemo(() => {
    const parts: string[] = [];
    if (debouncedSearch.trim()) parts.push(`version_name@=${debouncedSearch.trim()}`);
    if (platformFilter !== "all") parts.push(`platform==${platformFilter}`);
    if (statusFilter !== "all") parts.push(`status==${statusFilter}`);
    if (enabledFilter !== "all") parts.push(`enabled==${enabledFilter}`);
    return parts.length > 0 ? parts.join(",") : undefined;
  }, [debouncedSearch, platformFilter, statusFilter, enabledFilter]);

  const { data, isFetching } = appVersionsHooks.useList({
    currentPage: page,
    pageSize,
    filters: serverFilters,
    sortField: "effective_date",
    sortOrder: "DESC",
  });
  const total = data?.count ?? 0;
  const totalPages = data?.totalPages ?? (Math.ceil(total / pageSize) || 1);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, platformFilter, statusFilter, enabledFilter, pageSize]);

  const deleteMutation = appVersionsHooks.useDelete({
    onSuccess: () => toast.success("Xóa bản cập nhật thành công"),
    onError: (err) => toast.error(err.message || "Xóa bản cập nhật thất bại"),
  });

  const toggleMutation = appVersionsHooks.useUpdate({
    onSuccess: () => toast.success("Cập nhật trạng thái thành công"),
    onError: (err) => toast.error(err.message || "Cập nhật trạng thái thất bại"),
  });

  function resetFilters() {
    setSearch("");
    setPlatformFilter("all");
    setStatusFilter("all");
    setEnabledFilter("all");
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

  function toggleEnabled(id: string, enabled: boolean) {
    toggleMutation.mutate({ id, data: { enabled } });
  }

  return {
    rows: data?.rows ?? [],
    isFetching,
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    totalPages,
    search,
    setSearch,
    platformFilter,
    setPlatformFilter,
    statusFilter,
    setStatusFilter,
    enabledFilter,
    setEnabledFilter,
    resetFilters,
    confirmOpen,
    setConfirmOpen,
    openConfirmDelete,
    handleConfirmDelete,
    isDeleting: deleteMutation.isPending,
    toggleEnabled,
    isToggling: toggleMutation.isPending,
  };
}

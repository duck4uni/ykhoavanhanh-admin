"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  Filter,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldPlus,
  Trash2,
  CalendarDays,
} from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";
import {
  hisServicesHooks,
  hisServicesService,
  type HisService,
} from "@/api/hisServicesApi";
import { toast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";
import { useDebounce } from "@/hooks/useApiHelpers";

const PAGE_SIZE = 10;

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSpecialtyName(service: HisService): string {
  return service.specialty?.name || "—";
}

function supportsInsurance(service: HisService): boolean {
  return service.insurancetype.toLowerCase().includes("bh");
}

function StatusBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-light px-2.5 py-1 text-xs font-medium text-success">
      <span className="h-1.5 w-1.5 rounded-full bg-current" /> Hoạt động
    </span>
  );
}

export default function ExamServicesPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [insuranceFilter, setInsuranceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const deleteMutation = hisServicesHooks.useDelete({
    onSuccess: () => toast.success("Xóa dịch vụ thành công"),
    onError: (err) => toast.error(err.message || "Xóa dịch vụ thất bại"),
  });

  const debouncedSearch = useDebounce(search, 400);

  // Bộ lọc phía server theo tên dịch vụ: filters=service_name@=<giá trị>
  const serverFilters = debouncedSearch.trim()
    ? `service_name@=${debouncedSearch.trim()}`
    : undefined;

  // Về trang 1 khi từ khóa tìm kiếm (đã debounce) thay đổi.
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

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
    // Tìm kiếm theo tên đã chuyển sang server (params.filters); tại đây chỉ lọc bổ sung.
    return services.filter((service) => {
      const matchType = serviceTypeFilter === "all" || service.servicetype === serviceTypeFilter;
      const matchInsurance = insuranceFilter === "all" || (insuranceFilter === "yes" ? supportsInsurance(service) : !supportsInsurance(service));
      const matchStatus = statusFilter === "all" || statusFilter === "active";
      const matchDate = !fromDate || service.updatetime.startsWith(fromDate) || service.fromdate.startsWith(fromDate);
      return matchType && matchInsurance && matchStatus && matchDate;
    });
  }, [services, serviceTypeFilter, insuranceFilter, statusFilter, fromDate]);

  const serviceTypes = useMemo(() => Array.from(new Set(services.map((s) => s.servicetype).filter(Boolean))).sort(), [services]);
  const activeCount = total;
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

  const stats = [
    { label: "Tổng dịch vụ", value: total, sub: "Tất cả dịch vụ", icon: ClipboardList, tone: "bg-primary-100 text-primary-600" },
    { label: "Đang hoạt động", value: activeCount, sub: `${activePct}% tổng dịch vụ`, icon: CheckCircle2, tone: "bg-success-light text-success" },
    { label: "Hỗ trợ BHYT", value: insuranceCount, sub: `${insurancePct}% trang hiện tại`, icon: ShieldPlus, tone: "bg-purple-100 text-purple-600" },
    { label: "Cập nhật tháng này", value: updatedThisMonth, sub: "Dịch vụ được cập nhật", icon: CalendarDays, tone: "bg-warning-light text-warning" },
  ];

  async function handleExportExcel() {
    setIsExporting(true);
    try {
      const blob = await hisServicesService.export();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dich-vu-his-${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Xuất file Excel thành công");
    } catch (err) {
      toast.error((err as Error).message || "Xuất file Excel thất bại");
    } finally {
      setIsExporting(false);
    }
  }

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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dịch vụ khám</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý danh sách dịch vụ khám, giá, loại bảo hiểm và trạng thái hiển thị.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface-secondary disabled:opacity-60"
          >
            <Download className="h-4 w-4" /> {isExporting ? "Đang xuất..." : "Xuất Excel"}
          </button>
          <button onClick={() => router.push("/exam-services/new")} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Thêm dịch vụ khám
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${stat.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr_auto_auto] xl:items-end">
          <div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên dịch vụ, mã dịch vụ..." className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10" />
            </div>
          </div>
          <select value={serviceTypeFilter} onChange={(e) => setServiceTypeFilter(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10">
            <option value="all">Loại dịch vụ: Tất cả</option>
            {serviceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select value={insuranceFilter} onChange={(e) => setInsuranceFilter(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10">
            <option value="all">Loại BH: Tất cả</option>
            <option value="yes">BHYT</option>
            <option value="no">Không BHYT</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10">
            <option value="all">Trạng thái: Tất cả</option>
            <option value="active">Hoạt động</option>
          </select>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10" />
          <button onClick={() => setCurrentPage(1)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"><Filter className="h-4 w-4" /> Lọc</button>
          <button onClick={resetFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary"><RefreshCw className="h-4 w-4" /> Đặt lại</button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        {isLoading ? (
          <LoadingSection text="Đang tải dịch vụ khám..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3.5">STT</th>
                    <th className="px-5 py-3.5">Mã dịch vụ</th>
                    <th className="px-5 py-3.5">Tên dịch vụ</th>
                    <th className="px-5 py-3.5">Chuyên khoa</th>
                    <th className="px-5 py-3.5">Loại DV</th>
                    <th className="px-5 py-3.5">Giá</th>
                    <th className="px-5 py-3.5">Loại BH</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5">Cập nhật lúc</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredServices.length === 0 ? (
                    <tr><td colSpan={10} className="px-5 py-12 text-center text-sm text-muted-foreground">Không tìm thấy dịch vụ phù hợp.</td></tr>
                  ) : filteredServices.map((service, index) => (
                    <tr key={service.id} className="text-sm transition-colors hover:bg-slate-50/60">
                      <td className="px-5 py-4">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="px-5 py-4 font-mono font-semibold text-primary-600">{service.serviceid}</td>
                      <td className="max-w-sm px-5 py-4 font-semibold text-slate-800">{service.servicename}</td>
                      <td className="px-5 py-4 text-slate-700">{getSpecialtyName(service)}</td>
                      <td className="px-5 py-4 text-slate-700">{service.servicetype}</td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{formatCurrency(Number(service.price) || 0)}</td>
                      <td className="px-5 py-4 text-slate-700">{service.insurancetype && service.insurancetype !== "—" ? service.insurancetype : "—"}</td>
                      <td className="px-5 py-4"><StatusBadge /></td>
                      <td className="px-5 py-4 text-slate-600">{formatDateTime(service.updatetime || service.updated_at || "")}</td>
                      <td className="px-5 py-4"><div className="flex items-center justify-end gap-2"><button onClick={() => openEdit(service)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" title="Xem"><Eye className="h-4 w-4" /></button><button onClick={() => openEdit(service)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-primary hover:bg-primary-50" title="Sửa"><Pencil className="h-4 w-4" /></button><button onClick={() => openConfirmDelete(service.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50" title="Xóa"><Trash2 className="h-4 w-4" /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-5 py-4">
              <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={total} pageSize={pageSize} onPageSizeChange={setPageSize} />
            </div>
          </>
        )}
      </div>

      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} variant="delete" title="Xóa dịch vụ khám" description="Bạn có chắc muốn xóa dịch vụ này? Hành động này không thể hoàn tác." confirmLabel="Xóa" isLoading={deleteMutation.isPending} onConfirm={handleConfirmDelete} />
    </div>
  );
}

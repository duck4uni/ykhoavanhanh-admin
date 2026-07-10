"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Download,
  EyeOff,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Stethoscope,
  Trash2,
  Users,
  X,
  Pencil,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection, Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";
import { specialtiesHooks } from "@/api/specialtiesApi";
import { AdminSpecialty } from "@/types/hospital-admin";
import { toast } from "@/components/ui/Toast";
import { useDebounce } from "@/hooks/useApiHelpers";

const PAGE_SIZE = 10;

type SpecialtyForm = {
  name: string;
  guide_room: string;
  booking_note: string;
  internal_id: string;
  booking_group: string;
  display_priority: number;
  hide_search: boolean;
};

const createInitialForm = (): SpecialtyForm => ({
  name: "",
  guide_room: "",
  booking_note: "",
  internal_id: "",
  booking_group: "",
  display_priority: 1,
  hide_search: false,
});

function mapItemToForm(item: AdminSpecialty): SpecialtyForm {
  return {
    name: item.name,
    guide_room: item.guide_room,
    booking_note: item.booking_note,
    internal_id: item.internal_id,
    booking_group: item.booking_group,
    display_priority: item.display_priority,
    hide_search: item.hide_search,
  };
}

function getSoftCount(item: AdminSpecialty, keys: string[]): number | null {
  const record = item as unknown as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number") return value;
  }
  return null;
}

function StatusBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Hoạt động
    </span>
  );
}

function BookingSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} className="inline-flex items-center gap-2 text-sm text-slate-700">
      <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-slate-200"}`}>
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </span>
      {checked ? "Hiển thị" : "Ẩn"}
    </button>
  );
}

function RowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
        aria-label="Thao tác"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-20 w-40 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
          <button
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" /> Chỉnh sửa
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Xóa
          </button>
        </div>
      )}
    </div>
  );
}

export default function SpecialtiesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bookingVisibleFilter, setBookingVisibleFilter] = useState("all");
  const [bookingGroupFilter, setBookingGroupFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SpecialtyForm>(createInitialForm);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  // Bộ lọc phía server theo tên chuyên khoa: filters=name@=<giá trị>
  const serverFilters = debouncedSearch.trim()
    ? `name@=${debouncedSearch.trim()}`
    : undefined;

  // Về trang 1 khi từ khóa tìm kiếm (đã debounce) thay đổi.
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const { data, isLoading } = specialtiesHooks.useList({
    page: currentPage,
    pageSize,
    sortField: "created_at",
    sortOrder: "DESC",
    filters: serverFilters,
  });

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const total = data?.count ?? rows.length;

  const createMutation = specialtiesHooks.useCreate({
    onSuccess: () => {
      toast.success("Tạo chuyên khoa thành công");
      closeModal();
    },
    onError: (err) => toast.error(err.message || "Tạo chuyên khoa thất bại"),
  });
  const updateMutation = specialtiesHooks.useUpdate({
    onSuccess: () => {
      toast.success("Cập nhật chuyên khoa thành công");
      closeModal();
    },
    onError: (err) => toast.error(err.message || "Cập nhật chuyên khoa thất bại"),
  });
  const deleteMutation = specialtiesHooks.useDelete({
    onSuccess: () => toast.success("Xóa chuyên khoa thành công"),
    onError: (err) => toast.error(err.message || "Xóa chuyên khoa thất bại"),
  });

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const bookingGroups = useMemo(
    () => Array.from(new Set(rows.map((item) => item.booking_group).filter(Boolean))).sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    // Tìm kiếm theo tên đã chuyển sang server (params.filters); tại đây chỉ lọc bổ sung.
    return rows.filter((item) => {
      const matchStatus = statusFilter === "all";
      const matchVisible =
        bookingVisibleFilter === "all" ||
        (bookingVisibleFilter === "show" ? !item.hide_search : item.hide_search);
      const matchGroup = bookingGroupFilter === "all" || item.booking_group === bookingGroupFilter;
      return matchStatus && matchVisible && matchGroup;
    });
  }, [rows, statusFilter, bookingVisibleFilter, bookingGroupFilter]);

  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));
  const activeCount = rows.length;
  const hiddenCount = rows.filter((item) => item.hide_search).length;
  const withDoctors = rows.filter((item) => (getSoftCount(item, ["doctor_count", "doctors_count", "total_doctors"]) ?? 0) > 0).length;
  const withServices = rows.filter((item) => (getSoftCount(item, ["service_count", "services_count", "total_services"]) ?? 0) > 0).length;
  const activePct = total > 0 ? Math.round((activeCount / total) * 100) : 0;

  const stats = [
    { label: "Tổng chuyên khoa", value: total, sub: "Chuyên khoa", icon: Stethoscope, tone: "bg-primary-100 text-primary-600" },
    { label: "Đang hoạt động", value: activeCount, sub: `${activePct}%`, icon: CheckCircle2, tone: "bg-success-light text-success" },
    { label: "Có bác sĩ", value: withDoctors, sub: "Chuyên khoa", icon: Users, tone: "bg-warning-light text-warning" },
    { label: "Có dịch vụ khám", value: withServices, sub: "Chuyên khoa", icon: ClipboardList, tone: "bg-purple-100 text-purple-600" },
    { label: "Đang ẩn tìm kiếm", value: hiddenCount, sub: "Chuyên khoa", icon: EyeOff, tone: "bg-slate-100 text-slate-500" },
  ];

  function openCreate() {
    setEditingId(null);
    setForm(createInitialForm());
    setModalOpen(true);
  }

  function openEdit(item: AdminSpecialty) {
    setEditingId(item.id);
    setForm(mapItemToForm(item));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(createInitialForm());
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên chuyên khoa");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form as Partial<AdminSpecialty> });
    } else {
      createMutation.mutate(form as Partial<AdminSpecialty>);
    }
  }

  function toggleBookingVisible(item: AdminSpecialty) {
    updateMutation.mutate({ id: item.id, data: { hide_search: !item.hide_search } as Partial<AdminSpecialty> });
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setBookingVisibleFilter("all");
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chuyên khoa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý danh sách chuyên khoa, bác sĩ, dịch vụ khám và cấu hình hiển thị đặt khám
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Thêm chuyên khoa
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên, mã chuyên khoa..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>

          <div className="min-w-[170px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10">
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
            </select>
          </div>

          <div className="min-w-[170px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Hiển thị đặt khám</label>
            <select value={bookingVisibleFilter} onChange={(e) => setBookingVisibleFilter(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10">
              <option value="all">Tất cả</option>
              <option value="show">Hiển thị</option>
              <option value="hide">Ẩn</option>
            </select>
          </div>

          <div className="min-w-[170px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Nhóm đặt khám</label>
            <select value={bookingGroupFilter} onChange={(e) => setBookingGroupFilter(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10">
              <option value="all">Tất cả</option>
              {bookingGroups.map((group) => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>

          <button onClick={resetFilters} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary">
            <RefreshCw className="h-4 w-4" /> Đặt lại
          </button>
          <button onClick={() => toast.info("Chưa cấu hình API xuất Excel chuyên khoa")} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary">
            <Download className="h-4 w-4" /> Xuất Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        {isLoading ? (
          <LoadingSection text="Đang tải chuyên khoa..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3.5">STT</th>
                    <th className="px-5 py-3.5">Tên chuyên khoa</th>
                    <th className="px-5 py-3.5">Mã chuyên khoa</th>
                    <th className="px-5 py-3.5">Số bác sĩ</th>
                    <th className="px-5 py-3.5">Số dịch vụ</th>
                    <th className="px-5 py-3.5">Phòng / khu vực khám</th>
                    <th className="px-5 py-3.5">Ưu tiên</th>
                    <th className="px-5 py-3.5">Hiển thị đặt khám</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.length === 0 ? (
                    <tr><td colSpan={10} className="px-5 py-12 text-center text-sm text-muted-foreground">Không tìm thấy chuyên khoa phù hợp.</td></tr>
                  ) : (
                    filteredRows.map((item, index) => {
                      const doctorCount = getSoftCount(item, ["doctor_count", "doctors_count", "total_doctors"]);
                      const serviceCount = getSoftCount(item, ["service_count", "services_count", "total_services"]);
                      return (
                        <tr key={item.id} className="text-sm transition-colors hover:bg-slate-50/60">
                          <td className="px-5 py-4"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{(currentPage - 1) * pageSize + index + 1}</span></td>
                          <td className="px-5 py-4 font-semibold text-slate-800">{item.name}</td>
                          <td className="px-5 py-4"><span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-600">{item.internal_id || "—"}</span></td>
                          <td className="px-5 py-4 font-medium text-primary-600">{doctorCount === null ? "—" : `${doctorCount} bác sĩ`}</td>
                          <td className="px-5 py-4 font-medium text-primary-600">{serviceCount === null ? "—" : `${serviceCount} dịch vụ`}</td>
                          <td className="max-w-xs px-5 py-4"><p className="font-semibold text-slate-800">{item.guide_room || "—"}</p>{item.booking_note && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{item.booking_note}</p>}</td>
                          <td className="px-5 py-4 font-semibold text-slate-700">{item.display_priority}</td>
                          <td className="px-5 py-4"><BookingSwitch checked={!item.hide_search} onChange={() => toggleBookingVisible(item)} /></td>
                          <td className="px-5 py-4"><StatusBadge /></td>
                          <td className="px-5 py-4"><RowMenu onEdit={() => openEdit(item)} onDelete={() => openConfirmDelete(item.id)} /></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
              <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={total} pageSize={pageSize} onPageSizeChange={setPageSize} />
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">{editingId ? "Chỉnh sửa chuyên khoa" : "Thêm chuyên khoa mới"}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Tên chuyên khoa *" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="VD: Nội khoa" />
                <Input label="Phòng hướng dẫn vào khám" value={form.guide_room} onChange={(e) => setForm((p) => ({ ...p, guide_room: e.target.value }))} placeholder="VD: Khu khám chuyên sâu" />
                <Input label="ID nội bộ" value={form.internal_id} onChange={(e) => setForm((p) => ({ ...p, internal_id: e.target.value }))} placeholder="VD: CK-NHI" hint="Cho phép bắt đầu bằng số 0." />
                <Input label="Nhóm đặt khám" value={form.booking_group} onChange={(e) => setForm((p) => ({ ...p, booking_group: e.target.value }))} placeholder="VD: nhi-khoa" />
                <Input label="Ưu tiên hiển thị" type="number" value={String(form.display_priority)} onChange={(e) => setForm((p) => ({ ...p, display_priority: Number(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Ghi chú đặt khám</label>
                <textarea value={form.booking_note} onChange={(e) => setForm((p) => ({ ...p, booking_note: e.target.value }))} rows={3} className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nhập lưu ý khi bệnh nhân đặt khám" />
              </div>
              <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                <span><span className="block text-sm font-medium text-slate-700">Ẩn tìm kiếm</span><span className="text-xs text-slate-400">Bật nếu chuyên khoa chỉ dùng nội bộ.</span></span>
                <input type="checkbox" checked={form.hide_search} onChange={(e) => setForm((p) => ({ ...p, hide_search: e.target.checked }))} className="h-4 w-4 accent-primary" />
              </label>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={isMutating} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60">{isMutating && <Spinner size="sm" />}{editingId ? "Lưu thay đổi" : "Tạo chuyên khoa"}</button>
                <button type="button" onClick={closeModal} className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} variant="delete" title="Xóa chuyên khoa" description="Bạn có chắc muốn xóa chuyên khoa này? Hành động này không thể hoàn tác." confirmLabel="Xóa" isLoading={deleteMutation.isPending} onConfirm={handleConfirmDelete} />
    </div>
  );
}

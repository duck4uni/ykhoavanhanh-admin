"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  DoorOpen,
  Download,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection, Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";
import {
  examAreasHooks,
  exportExamAreas,
  type ExamArea,
  type CreateExamAreaPayload,
} from "@/api/examAreasApi";
import { toast } from "@/components/ui/Toast";

const PAGE_SIZE = 10;

type AreaForm = {
  code: string;
  name: string;
  short_name: string;
  address: string;
  phone: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
};

const createInitialForm = (): AreaForm => ({
  code: "",
  name: "",
  short_name: "",
  address: "",
  phone: "",
  description: "",
  status: "ACTIVE",
});

function mapItemToForm(item: ExamArea): AreaForm {
  return {
    code: item.code,
    name: item.name,
    short_name: item.short_name ?? "",
    address: item.address ?? "",
    phone: item.phone ?? "",
    description: item.description ?? "",
    status: item.status,
  };
}

function formToPayload(form: AreaForm): CreateExamAreaPayload {
  return {
    code: form.code,
    name: form.name,
    short_name: form.short_name || undefined,
    address: form.address || undefined,
    phone: form.phone || undefined,
    description: form.description || undefined,
    status: form.status,
  };
}

function isValidVietnamesePhone(value: string): boolean {
  const phone = value.trim();
  if (!phone) return true;
  return /^(?:\+84|84|0)(?:\d{9}|\d{10})$/.test(phone.replace(/[\s.-]/g, ""));
}

function StatusBadge({ status }: { status: ExamArea["status"] }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-600"
          : "border-amber-200 bg-amber-50 text-amber-600"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-amber-500"}`} />
      {active ? "Hoạt động" : "Tạm tắt"}
    </span>
  );
}

function RowMenu({
  item,
  onView,
  onEdit,
  onViewRooms,
  onToggle,
  onDelete,
}: {
  item: ExamArea;
  onView: () => void;
  onEdit: () => void;
  onViewRooms: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const MENU_WIDTH = 176; // w-44
  const MENU_HEIGHT = 232; // ước lượng chiều cao menu

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    // Mở lên trên nếu không đủ chỗ bên dưới
    const top =
      spaceBelow < MENU_HEIGHT ? rect.top - MENU_HEIGHT - 4 : rect.bottom + 4;
    const left = Math.max(8, rect.right - MENU_WIDTH);
    setCoords({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (
        triggerRef.current?.contains(event.target as Node) ||
        menuRef.current?.contains(event.target as Node)
      )
        return;
      setOpen(false);
    };
    const handleClose = () => setOpen(false);
    document.addEventListener("mousedown", handlePointer);
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, [open]);

  return (
    <div className="flex justify-end">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
        aria-label="Thao tác"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: coords.top, left: coords.left, width: MENU_WIDTH }}
            className="fixed z-50 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg"
          >
            <button
              onClick={() => {
                setOpen(false);
                onView();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <Eye className="h-4 w-4" /> Chi tiết
            </button>
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
                onViewRooms();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <DoorOpen className="h-4 w-4" /> Xem phòng khám
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onToggle();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <Power className="h-4 w-4" /> {item.status === "ACTIVE" ? "Tạm tắt" : "Kích hoạt"}
            </button>
            <div className="my-1 border-t border-slate-100" />
            <button
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" /> Xóa
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}

export default function ExamAreasPage() {
  const router = useRouter();
  const { data, isLoading } = examAreasHooks.useList();
  const areas = useMemo(() => data?.rows ?? [], [data]);
  const total = data?.count ?? areas.length;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AreaForm>(createInitialForm);

  const [viewingArea, setViewingArea] = useState<ExamArea | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const createMutation = examAreasHooks.useCreate({
    onSuccess: () => {
      toast.success("Tạo khu vực khám thành công");
      closeModal();
    },
    onError: (err) => toast.error(err.message || "Tạo khu vực khám thất bại"),
  });

  const updateMutation = examAreasHooks.useUpdate({
    onSuccess: () => {
      toast.success("Cập nhật khu vực khám thành công");
      closeModal();
    },
    onError: (err) => toast.error(err.message || "Cập nhật khu vực khám thất bại"),
  });

  const deleteMutation = examAreasHooks.useDelete({
    onSuccess: () => toast.success("Xóa khu vực khám thành công"),
    onError: (err) => toast.error(err.message || "Xóa khu vực khám thất bại"),
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;
  const phoneError =
    form.phone.trim() && !isValidVietnamesePhone(form.phone)
      ? "Số điện thoại không đúng định dạng"
      : undefined;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return areas.filter((area) => {
      const matchSearch =
        !q ||
        area.code.toLowerCase().includes(q) ||
        area.name.toLowerCase().includes(q) ||
        (area.short_name ?? "").toLowerCase().includes(q) ||
        (area.address ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || area.status === statusFilter;
      // Hiện API chưa có field chi nhánh; giữ filter UI theo design.
      const matchBranch = branch === "all";
      return matchSearch && matchStatus && matchBranch;
    });
  }, [areas, search, statusFilter, branch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeCount = areas.filter((area) => area.status === "ACTIVE").length;
  const totalRooms = 0;
  const noRoomConfigured = areas.length;
  const activePct = total > 0 ? Math.round((activeCount / total) * 100) : 0;

  const stats = [
    { label: "Tổng khu vực khám", value: total, sub: "Khu vực", icon: Building2, tone: "bg-primary-100 text-primary-600" },
    { label: "Đang hoạt động", value: activeCount, sub: `${activePct}%`, icon: CheckCircle2, tone: "bg-success-light text-success" },
    { label: "Tổng phòng khám", value: totalRooms, sub: "Phòng", icon: DoorOpen, tone: "bg-warning-light text-warning" },
    { label: "Chưa cấu hình phòng", value: noRoomConfigured, sub: "Khu vực", icon: DoorOpen, tone: "bg-purple-100 text-purple-600" },
  ];

  async function handleExportExcel() {
    setIsExporting(true);
    try {
      const blob = await exportExamAreas();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `khu-vuc-kham-${Date.now()}.xlsx`;
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

  function openCreate() {
    setEditingId(null);
    setForm(createInitialForm());
    setModalOpen(true);
  }

  function openEdit(item: ExamArea) {
    setEditingId(item.id);
    setForm(mapItemToForm(item));
    setModalOpen(true);
  }

  function openView(item: ExamArea) {
    setViewingArea(item);
  }

  function viewRooms(item: ExamArea) {
    router.push(`/clinics?q=${encodeURIComponent(item.short_name || item.name)}`);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(createInitialForm());
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Vui lòng nhập mã và tên khu vực khám");
      return;
    }
    if (!isValidVietnamesePhone(form.phone)) {
      toast.error("Số điện thoại không đúng định dạng");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formToPayload(form) });
    } else {
      createMutation.mutate(formToPayload(form));
    }
  }

  function toggleStatus(item: ExamArea) {
    updateMutation.mutate({
      id: item.id,
      data: { status: item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
    });
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

  function resetFilters() {
    setSearch("");
    setBranch("all");
    setStatusFilter("all");
    setPage(1);
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Khu vực khám</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý khu vực khám, phòng khám và thông tin liên hệ tại bệnh viện
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface-secondary disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Đang xuất..." : "Xuất Excel"}
          </button> */}
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Thêm khu vực khám
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
            >
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên, mã khu vực, địa chỉ..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>

          {/* <div className="min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Chi nhánh</label>
            <select
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            >
              <option value="all">Tất cả</option>
              <option value="vh">Bệnh viện Vạn Hạnh</option>
            </select>
          </div> */}

          <div className="min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            >
              <option value="all">Tất cả</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Tạm tắt</option>
            </select>
          </div>

          <button
            onClick={resetFilters}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary"
          >
            <RefreshCw className="h-4 w-4" /> Đặt lại
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        {isLoading ? (
          <LoadingSection text="Đang tải khu vực khám..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3.5">STT</th>
                    <th className="px-5 py-3.5">ID Nội bộ</th>
                    <th className="px-5 py-3.5">Tên khu vực</th>
                    <th className="px-5 py-3.5">Tên viết tắt</th>
                    <th className="px-5 py-3.5">Chi nhánh</th>
                    <th className="px-5 py-3.5">Địa chỉ</th>
                    <th className="px-5 py-3.5">Số phòng khám</th>
                    <th className="px-5 py-3.5">Số điện thoại</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-5 py-12 text-center text-sm text-muted-foreground">
                        Không tìm thấy khu vực khám phù hợp.
                      </td>
                    </tr>
                  ) : (
                    paged.map((area, index) => (
                      <tr key={area.id} className="text-sm transition-colors hover:bg-slate-50/60">
                        <td className="px-5 py-4">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                            {(page - 1) * PAGE_SIZE + index + 1}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono font-semibold text-primary-600">{area.code}</td>
                        <td className="px-5 py-4 font-semibold text-slate-800">{area.name}</td>
                        <td className="px-5 py-4">
                          {area.short_name ? (
                            <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-600">
                              {area.short_name}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-600">Bệnh viện Vạn Hạnh</td>
                        <td className="max-w-xs px-5 py-4 text-slate-600">{area.address ?? "—"}</td>
                        <td className="px-5 py-4 font-semibold text-slate-700">0 phòng</td>
                        <td className="px-5 py-4 text-slate-600">{area.phone ?? "—"}</td>
                        <td className="px-5 py-4"><StatusBadge status={area.status} /></td>
                        <td className="px-5 py-4">
                          <RowMenu
                            item={area}
                            onView={() => openView(area)}
                            onEdit={() => openEdit(area)}
                            onViewRooms={() => viewRooms(area)}
                            onToggle={() => toggleStatus(area)}
                            onDelete={() => openConfirmDelete(area.id)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
              <TablePagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
              />
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
              <h2 className="text-lg font-semibold text-slate-800">
                {editingId ? "Chỉnh sửa khu vực khám" : "Thêm khu vực khám mới"}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="ID Nội bộ *" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="VD: KV-001" />
                <Input label="Tên khu vực khám *" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="VD: Khu khám chuyên sâu" />
                <Input label="Tên viết tắt" value={form.short_name} onChange={(e) => setForm((p) => ({ ...p, short_name: e.target.value }))} placeholder="VD: KCS" />
                <Input
                  label="Số điện thoại"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="VD: 0333748720"
                  inputMode="tel"
                  error={phoneError}
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as AreaForm["status"] }))}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Tạm tắt</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Mô tả khu khám</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Mô tả công năng khu khám"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Địa chỉ</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Địa chỉ hoặc vị trí khu khám"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isMutating || Boolean(phoneError)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {isMutating && <Spinner size="sm" />}
                  {editingId ? "Lưu thay đổi" : "Tạo khu vực khám"}
                </button>
                <button type="button" onClick={closeModal} className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200">
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {viewingArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewingArea(null)} />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">Chi tiết khu vực khám</h2>
              <button onClick={() => setViewingArea(null)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>

            <div className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-primary-600">{viewingArea.code}</span>
                <StatusBadge status={viewingArea.status} />
              </div>

              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Tên khu vực</dt>
                  <dd className="mt-0.5 text-sm font-medium text-slate-800">{viewingArea.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Tên viết tắt</dt>
                  <dd className="mt-0.5 text-sm text-slate-700">{viewingArea.short_name || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Số điện thoại</dt>
                  <dd className="mt-0.5 text-sm text-slate-700">{viewingArea.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Chi nhánh</dt>
                  <dd className="mt-0.5 text-sm text-slate-700">Bệnh viện Vạn Hạnh</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground">Địa chỉ</dt>
                  <dd className="mt-0.5 text-sm text-slate-700">{viewingArea.address || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground">Mô tả</dt>
                  <dd className="mt-0.5 text-sm text-slate-700">{viewingArea.description || "—"}</dd>
                </div>
              </dl>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => {
                  const area = viewingArea;
                  setViewingArea(null);
                  if (area) openEdit(area);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                <Pencil className="h-4 w-4" /> Chỉnh sửa
              </button>
              <button
                onClick={() => setViewingArea(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="delete"
        title="Xóa khu vực khám"
        description="Bạn có chắc muốn xóa khu vực khám này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

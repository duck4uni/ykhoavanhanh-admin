"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  FileText,
  Info,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { Input } from "@/components/ui/Input";
import { LoadingSection, Spinner } from "@/components/ui/Spinner";
import { roomsHooks, type HisRoom } from "@/api/roomsApi";
import { toast } from "@/components/ui/Toast";
import { useDebounce } from "@/hooks/useApiHelpers";

const PAGE_SIZE = 10;

function getExamAreaName(room: HisRoom): string {
  const text = `${room.roomname} ${room.description ?? ""}`.toUpperCase();
  const match = text.match(/KHU\s*([A-Z])/);
  return match ? `Khu ${match[1]}` : "Chưa phân khu";
}

function hasHisCode(room: HisRoom): boolean {
  return Boolean(room.mavp && room.mavp.trim() && room.mavp !== "—");
}

function formatUpdatedAt(value: string): string {
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

function StatusBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Hoạt động
    </span>
  );
}

type RoomForm = {
  room_id: string;
  room_name: string;
  description: string;
};

function mapRoomToForm(room: HisRoom): RoomForm {
  return {
    room_id: room.roomid,
    room_name: room.roomname,
    description: room.description ?? "",
  };
}

export default function ClinicsPage() {
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // Bộ lọc phía server theo tên phòng khám: filters=room_name@=<giá trị>
  const serverFilters = debouncedSearch.trim()
    ? `room_name@=${debouncedSearch.trim()}`
    : undefined;

  const { data: roomsData, isLoading } = roomsHooks.usePaginatedList({
    page,
    pageSize: PAGE_SIZE,
    filters: serverFilters,
  });
  const allRooms = useMemo(() => roomsData?.rows ?? [], [roomsData]);

  // Về trang 1 khi từ khóa tìm kiếm (đã debounce) thay đổi.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hisFilter, setHisFilter] = useState("all");
  const [editingRoom, setEditingRoom] = useState<HisRoom | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState<RoomForm>({ room_id: "", room_name: "", description: "" });

  // Điền sẵn ô tìm kiếm khi điều hướng từ trang "Xem phòng khám"
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearch(q);
  }, [searchParams]);

  const updateMutation = roomsHooks.useUpdate({
    onSuccess: () => {
      toast.success("Cập nhật phòng khám thành công");
      closeEditModal();
    },
    onError: (err) => toast.error(err.message || "Cập nhật phòng khám thất bại"),
  });

  const createMutation = roomsHooks.useCreate({
    onSuccess: () => {
      toast.success("Tạo phòng khám thành công");
      closeCreateModal();
    },
    onError: (err) => toast.error(err.message || "Tạo phòng khám thất bại"),
  });

  const examAreaOptions = useMemo(() => {
    return Array.from(new Set(allRooms.map(getExamAreaName))).filter(Boolean).sort();
  }, [allRooms]);

  const filtered = useMemo(() => {
    // Tìm kiếm theo tên phòng đã chuyển sang server (params.filters); tại đây chỉ lọc bổ sung.
    return allRooms.filter((room) => {
      const areaName = getExamAreaName(room);
      const matchArea = areaFilter === "all" || areaName === areaFilter;
      const matchStatus = statusFilter === "all" || statusFilter === "ACTIVE";
      const matchHis = hisFilter === "all" || (hisFilter === "has" ? hasHisCode(room) : !hasHisCode(room));
      return matchArea && matchStatus && matchHis;
    });
  }, [allRooms, areaFilter, statusFilter, hisFilter]);

  const totalPages = roomsData?.totalPages ?? Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered;

  const totalRooms = roomsData?.count ?? allRooms.length;
  const activeRooms = allRooms.length;
  const withHis = allRooms.filter(hasHisCode).length;
  const withoutDescription = allRooms.filter((room) => !room.description?.trim()).length;
  const activePct = totalRooms > 0 ? ((activeRooms / totalRooms) * 100).toFixed(2) : "0";
  const withHisPct = totalRooms > 0 ? ((withHis / totalRooms) * 100).toFixed(2) : "0";
  const noDescPct = totalRooms > 0 ? ((withoutDescription / totalRooms) * 100).toFixed(2) : "0";

  const stats = [
    { label: "Tổng phòng khám", value: totalRooms, sub: "Tất cả khu khám", icon: Building2, tone: "bg-primary-100 text-primary-600" },
    { label: "Đang hoạt động", value: activeRooms, sub: `${activePct}% tổng số`, icon: CheckCircle2, tone: "bg-success-light text-success" },
    { label: "Có mã HIS", value: withHis, sub: `${withHisPct}% tổng số`, icon: FileText, tone: "bg-purple-100 text-purple-600" },
    { label: "Chưa có mô tả", value: withoutDescription, sub: `${noDescPct}% tổng số`, icon: Info, tone: "bg-warning-light text-warning" },
  ];

  function resetFilters() {
    setSearch("");
    setAreaFilter("all");
    setStatusFilter("all");
    setHisFilter("all");
    setPage(1);
  }

  function showHisOnlyNotice(action: string) {
    toast.info(`Chưa hỗ trợ ${action} phòng khám từ HIS API`);
  }

  function openEditModal(room: HisRoom) {
    setEditingRoom(room);
    setForm(mapRoomToForm(room));
  }

  function closeEditModal() {
    setEditingRoom(null);
    setForm({ room_id: "", room_name: "", description: "" });
  }

  function openCreateModal() {
    setForm({ room_id: "", room_name: "", description: "" });
    setCreateModalOpen(true);
  }

  function closeCreateModal() {
    setCreateModalOpen(false);
    setForm({ room_id: "", room_name: "", description: "" });
  }

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!form.room_id.trim() || !form.room_name.trim()) {
      toast.error("Vui lòng nhập mã phòng và tên phòng khám");
      return;
    }

    const facilityId = allRooms[0]?.facility_id || "6b7caa40-1a83-4449-8b69-e8d19567c0f7";

    await createMutation.mutateAsync({
      facility_id: facilityId,
      room_id: form.room_id.trim(),
      room_name: form.room_name.trim(),
      description: form.description.trim() || null,
    });
  }

  async function handleUpdateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRoom) return;
    if (!form.room_id.trim() || !form.room_name.trim()) {
      toast.error("Vui lòng nhập mã phòng và tên phòng khám");
      return;
    }

    await updateMutation.mutateAsync({
      id: editingRoom.id,
      data: {
        room_id: form.room_id.trim(),
        room_name: form.room_name.trim(),
        description: form.description.trim() || null,
      },
    });
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Phòng khám</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý danh sách phòng khám, khu khám và mã đồng bộ HIS
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Thêm phòng khám
        </button>
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
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto_auto] lg:items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Tìm kiếm</label>
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Tìm theo tên phòng, mã phòng..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 pr-10 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Khu khám</label>
            <select
              value={areaFilter}
              onChange={(event) => {
                setAreaFilter(event.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            >
              <option value="all">Tất cả khu khám</option>
              {examAreaOptions.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Mã HIS</label>
            <select
              value={hisFilter}
              onChange={(event) => {
                setHisFilter(event.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            >
              <option value="all">Tất cả</option>
              <option value="has">Có mã HIS</option>
              <option value="none">Chưa có mã HIS</option>
            </select>
          </div>

          <button
            onClick={() => setPage(1)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Filter className="h-4 w-4" /> Lọc
          </button>
          <button
            onClick={resetFilters}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary"
          >
            <RotateCcw className="h-4 w-4" /> Đặt lại
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        {isLoading ? (
          <LoadingSection text="Đang tải phòng khám..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3.5">STT</th>
                    <th className="px-5 py-3.5">Mã phòng</th>
                    <th className="px-5 py-3.5">Tên phòng khám</th>
                    <th className="px-5 py-3.5">Khu khám</th>
                    <th className="px-5 py-3.5">Mã HIS</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5">Cập nhật lúc</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                        Không tìm thấy phòng khám phù hợp.
                      </td>
                    </tr>
                  ) : (
                    paged.map((room, index) => (
                      <tr key={room.id} className="text-sm transition-colors hover:bg-slate-50/60">
                        <td className="px-5 py-4">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                            {(page - 1) * PAGE_SIZE + index + 1}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono font-semibold text-slate-800">{room.roomid}</td>
                        <td className="px-5 py-4 font-semibold text-slate-800">{room.roomname}</td>
                        <td className="px-5 py-4 text-slate-700">{getExamAreaName(room)}</td>
                        <td className="px-5 py-4 font-mono text-slate-700">{hasHisCode(room) ? room.mavp : "—"}</td>
                        <td className="px-5 py-4"><StatusBadge /></td>
                        <td className="px-5 py-4 text-slate-600">{formatUpdatedAt(room.updatetime)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(room)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-primary transition-colors hover:bg-primary-50"
                              title="Sửa"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => showHisOnlyNotice("xóa")}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-500 transition-colors hover:bg-red-50"
                              title="Xóa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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
                totalItems={roomsData?.count ?? filtered.length}
                pageSize={PAGE_SIZE}
              />
            </div>
          </>
        )}
      </div>

      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeEditModal} />
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900">Chỉnh sửa phòng khám</h2>
              <button onClick={closeEditModal} className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRoom} className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Mã phòng *"
                  value={form.room_id}
                  onChange={(event) => setForm((current) => ({ ...current, room_id: event.target.value }))}
                  required
                />
                <Input
                  label="Tên phòng khám *"
                  value={form.room_name}
                  onChange={(event) => setForm((current) => ({ ...current, room_name: event.target.value }))}
                  required
                />
                <div className="md:col-span-2">
                  <Input
                    label="Mô tả"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Nhập mô tả phòng khám"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={updateMutation.isPending}
                  className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {updateMutation.isPending && <Spinner size="sm" />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCreateModal} />
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900">Thêm phòng khám mới</h2>
              <button onClick={closeCreateModal} className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Mã phòng *"
                  value={form.room_id}
                  onChange={(event) => setForm((current) => ({ ...current, room_id: event.target.value }))}
                  required
                />
                <Input
                  label="Tên phòng khám *"
                  value={form.room_name}
                  onChange={(event) => setForm((current) => ({ ...current, room_name: event.target.value }))}
                  required
                />
                <div className="md:col-span-2">
                  <Input
                    label="Mô tả"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Nhập mô tả phòng khám"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={createMutation.isPending}
                  className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {createMutation.isPending && <Spinner size="sm" />}
                  Tạo phòng khám
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

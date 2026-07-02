"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import { roomsHooks, type HisRoom } from "@/api/roomsApi";
import { toast } from "@/components/ui/Toast";

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

export default function ClinicsPage() {
  const { data: rooms, isLoading } = roomsHooks.useList();
  const allRooms = useMemo(() => rooms ?? [], [rooms]);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hisFilter, setHisFilter] = useState("all");

  const examAreaOptions = useMemo(() => {
    return Array.from(new Set(allRooms.map(getExamAreaName))).filter(Boolean).sort();
  }, [allRooms]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRooms.filter((room) => {
      const areaName = getExamAreaName(room);
      const matchSearch =
        !q ||
        room.roomid.toLowerCase().includes(q) ||
        room.roomname.toLowerCase().includes(q) ||
        (room.description ?? "").toLowerCase().includes(q) ||
        room.mavp.toLowerCase().includes(q);
      const matchArea = areaFilter === "all" || areaName === areaFilter;
      const matchStatus = statusFilter === "all" || statusFilter === "ACTIVE";
      const matchHis = hisFilter === "all" || (hisFilter === "has" ? hasHisCode(room) : !hasHisCode(room));
      return matchSearch && matchArea && matchStatus && matchHis;
    });
  }, [allRooms, search, areaFilter, statusFilter, hisFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalRooms = allRooms.length;
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
          onClick={() => showHisOnlyNotice("tạo")}
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
                              onClick={() => showHisOnlyNotice("cập nhật")}
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
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  doctorWorkSchedulesHooks,
  type DoctorWorkSchedule,
  type CreateDoctorWorkSchedulePayload,
} from "@/api/doctorWorkSchedulesApi";
import { examAreasHooks } from "@/api/examAreasApi";
import { doctorsHooks } from "@/api/doctorsApi";
import { toast } from "@/components/ui/Toast";
import { LoadingSection, Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/shares/dialog-confirm";
import { TablePagination } from "@/components/ui/TablePagination";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Calendar,
  CheckCircle2,
  Clock,
  Users,
  Filter,
  RotateCcw,
} from "lucide-react";

const PAGE_SIZE = 10;

const SHIFT_LABEL: Record<string, string> = {
  MORNING: "Sáng",
  AFTERNOON: "Chiều",
  EVENING: "Tối",
  NIGHT: "Đêm",
};

/* ─── Form types ─────────────────────────────────────────────────────────── */

type ScheduleForm = {
  doctor_id: string;
  exam_area_id: string;
  specialty_id: string;
  room_id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  shift_code: string;
  max_appointments: number;
  exam_fee: number;
  allow_booking: boolean;
  status: "ACTIVE" | "INACTIVE";
  note: string;
};

const createInitialForm = (): ScheduleForm => ({
  doctor_id: "",
  exam_area_id: "",
  specialty_id: "",
  room_id: "",
  schedule_date: "",
  start_time: "07:30",
  end_time: "11:30",
  shift_code: "MORNING",
  max_appointments: 20,
  exam_fee: 150000,
  allow_booking: true,
  status: "ACTIVE",
  note: "",
});

function mapItemToForm(item: DoctorWorkSchedule): ScheduleForm {
  return {
    doctor_id: item.doctor_id,
    exam_area_id: item.exam_area_id,
    specialty_id: item.specialty_id ?? "",
    room_id: item.room_id ?? "",
    schedule_date: item.schedule_date,
    start_time: item.start_time.slice(0, 5),
    end_time: item.end_time.slice(0, 5),
    shift_code: item.shift_code ?? "MORNING",
    max_appointments: item.max_appointments ?? 20,
    exam_fee: item.exam_fee ? Number(item.exam_fee) : 0,
    allow_booking: item.allow_booking,
    status: item.status,
    note: item.note ?? "",
  };
}

function formToPayload(form: ScheduleForm): CreateDoctorWorkSchedulePayload {
  return {
    doctor_id: form.doctor_id,
    exam_area_id: form.exam_area_id,
    specialty_id: form.specialty_id || undefined,
    room_id: form.room_id || undefined,
    schedule_date: form.schedule_date,
    start_time: `${form.start_time}:00`,
    end_time: `${form.end_time}:00`,
    shift_code: form.shift_code,
    max_appointments: form.max_appointments,
    exam_fee: String(form.exam_fee),
    allow_booking: form.allow_booking,
    status: form.status,
    note: form.note || undefined,
  };
}

/* ─── Slot progress ──────────────────────────────────────────────────────── */

function SlotBar({ booked, max }: { booked: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((booked / max) * 100)) : 0;
  const full = max > 0 && booked >= max;
  return (
    <div className="min-w-[110px]">
      <p className="text-sm font-medium text-slate-700">
        {booked}/{max}
      </p>
      <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
        <div
          className={`h-1.5 rounded-full ${full ? "bg-slate-400" : "bg-primary-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Status badge ───────────────────────────────────────────────────────── */

function StatusBadge({ item }: { item: DoctorWorkSchedule }) {
  const max = item.max_appointments ?? 0;
  const full = max > 0 && item.booked_count >= max;
  let label: string;
  let cls: string;
  if (item.status !== "ACTIVE") {
    label = "Tạm ngưng";
    cls = "bg-warning-light text-warning";
  } else if (full) {
    label = "Đã đầy";
    cls = "bg-primary-100 text-primary-600";
  } else {
    label = "Hoạt động";
    cls = "bg-success-light text-success";
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function AppointmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleForm>(createInitialForm);

  const { data, isLoading } = doctorWorkSchedulesHooks.useList();
  const schedules = useMemo(() => data?.rows ?? [], [data]);
  const totalCount = data?.count ?? schedules.length;

  const { data: areasData } = examAreasHooks.useList();
  const examAreas = areasData?.rows ?? [];

  const { data: doctors } = doctorsHooks.useList();
  const doctorList = doctors ?? [];

  /* ── Mutations ────────────────────────────────────────────────────────── */

  const createMutation = doctorWorkSchedulesHooks.useCreate({
    onSuccess: () => {
      toast.success("Tạo lịch khám thành công");
      closeModal();
    },
    onError: (err) => toast.error(err.message || "Tạo lịch khám thất bại"),
  });

  const updateMutation = doctorWorkSchedulesHooks.useUpdate({
    onSuccess: () => {
      toast.success("Cập nhật lịch khám thành công");
      closeModal();
    },
    onError: (err) => toast.error(err.message || "Cập nhật lịch khám thất bại"),
  });

  const deleteMutation = doctorWorkSchedulesHooks.useDelete({
    onSuccess: () => toast.success("Xóa lịch khám thành công"),
    onError: (err) => toast.error(err.message || "Xóa lịch khám thất bại"),
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  /* ── Filtering ────────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    return schedules.filter((s) => {
      const q = search.trim().toLowerCase();
      const matchQuery =
        !q ||
        (s.doctor?.doctor_name ?? "").toLowerCase().includes(q) ||
        (s.exam_area?.name ?? "").toLowerCase().includes(q);
      const matchDate = !dateFilter || s.schedule_date === dateFilter;
      const matchShift = !shiftFilter || s.shift_code === shiftFilter;
      const matchStatus = !statusFilter || s.status === statusFilter;
      return matchQuery && matchDate && matchShift && matchStatus;
    });
  }, [schedules, search, dateFilter, shiftFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Stats (từ dữ liệu thật) ──────────────────────────────────────────── */
  const activeCount = schedules.filter((s) => s.status === "ACTIVE").length;
  const totalSlots = schedules.reduce((sum, s) => sum + (s.max_appointments ?? 0), 0);
  const totalBooked = schedules.reduce((sum, s) => sum + (s.booked_count ?? 0), 0);

  const stats = [
    { label: "Tổng lịch khám", value: totalCount, sub: "Lịch", icon: Calendar, tone: "bg-primary-100 text-primary-600" },
    { label: "Đang hoạt động", value: activeCount, sub: "Lịch", icon: CheckCircle2, tone: "bg-success-light text-success" },
    { label: "Tổng slot", value: totalSlots, sub: "Slot", icon: Clock, tone: "bg-purple-100 text-purple-600" },
    { label: "Đã đặt", value: totalBooked, sub: "Lượt", icon: Users, tone: "bg-warning-light text-warning" },
  ];

  /* ── Actions ──────────────────────────────────────────────────────────── */

  function openCreate() {
    setEditingId(null);
    setForm(createInitialForm());
    setModalOpen(true);
  }

  function openEdit(item: DoctorWorkSchedule) {
    setEditingId(item.id);
    setForm(mapItemToForm(item));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(createInitialForm());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.doctor_id || !form.exam_area_id || !form.schedule_date) {
      toast.error("Vui lòng chọn bác sĩ, khu khám và ngày khám");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formToPayload(form) });
    } else {
      createMutation.mutate(formToPayload(form));
    }
  }

  function resetFilters() {
    setSearch("");
    setDateFilter("");
    setShiftFilter("");
    setStatusFilter("");
    setPage(1);
  }

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function openConfirmDelete(id: string) {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  }

  function handleConfirmDelete() {
    if (pendingDeleteId) {
      deleteMutation.mutate(pendingDeleteId);
      setPendingDeleteId(null);
      setConfirmOpen(false);
    }
  }

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lịch khám</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý lịch làm việc, khung giờ và số lượng slot khám của bác sĩ.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Thêm lịch khám
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${s.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm bác sĩ / khu khám..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>

          <div className="relative lg:w-52">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface-secondary pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>

          <select
            value={shiftFilter}
            onChange={(e) => {
              setShiftFilter(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 lg:w-40"
          >
            <option value="">Ca khám</option>
            <option value="MORNING">Sáng</option>
            <option value="AFTERNOON">Chiều</option>
            <option value="EVENING">Tối</option>
            <option value="NIGHT">Đêm</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-surface-secondary px-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 lg:w-40"
          >
            <option value="">Trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Tạm ngưng</option>
          </select>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(1)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Filter className="h-4 w-4" /> Lọc
            </button>
            <button
              onClick={resetFilters}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary"
            >
              <RotateCcw className="h-4 w-4" /> Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        {isLoading ? (
          <LoadingSection text="Đang tải lịch khám..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3.5">STT</th>
                    <th className="px-6 py-3.5">Bác sĩ</th>
                    <th className="px-6 py-3.5">Khu khám</th>
                    <th className="px-6 py-3.5">Ngày khám</th>
                    <th className="px-6 py-3.5">Giờ khám</th>
                    <th className="px-6 py-3.5">Ca</th>
                    <th className="px-6 py-3.5">Slot</th>
                    <th className="px-6 py-3.5">Phí khám</th>
                    <th className="px-6 py-3.5">Trạng thái</th>
                    <th className="px-6 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-sm text-muted-foreground">
                        Không tìm thấy lịch khám phù hợp.
                      </td>
                    </tr>
                  ) : (
                    paged.map((item, idx) => (
                      <tr key={item.id} className="text-sm hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 text-slate-500">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {item.doctor?.doctor_name ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{item.exam_area?.name ?? "—"}</td>
                        <td className="px-6 py-4 text-slate-600">{item.schedule_date}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {SHIFT_LABEL[item.shift_code ?? ""] ?? (item.shift_code || "—")}
                        </td>
                        <td className="px-6 py-4">
                          <SlotBar booked={item.booked_count ?? 0} max={item.max_appointments ?? 0} />
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {item.exam_fee ? `${Number(item.exam_fee).toLocaleString("vi-VN")} đ` : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge item={item} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(item)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-primary-200 hover:text-primary"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Sửa
                            </button>
                            <button
                              onClick={() => openConfirmDelete(item.id)}
                              disabled={deleteMutation.isPending}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filtered.length > 0 && (
              <div className="border-t border-slate-100 px-6 py-4">
                <TablePagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={filtered.length}
                  pageSize={PAGE_SIZE}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal create/edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingId ? "Chỉnh sửa lịch khám" : "Thêm lịch khám mới"}
              </h2>
              <button onClick={closeModal} className="text-slate-400 transition-colors hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Bác sĩ *"
                  value={form.doctor_id}
                  onChange={(e) => setForm((p) => ({ ...p, doctor_id: e.target.value }))}
                  options={[
                    { value: "", label: "-- Chọn bác sĩ --" },
                    ...doctorList.map((d) => ({ value: d.id, label: d.doctorname })),
                  ]}
                />
                <Select
                  label="Khu khám *"
                  value={form.exam_area_id}
                  onChange={(e) => setForm((p) => ({ ...p, exam_area_id: e.target.value }))}
                  options={[
                    { value: "", label: "-- Chọn khu khám --" },
                    ...examAreas.map((a) => ({ value: a.id, label: a.name })),
                  ]}
                />
                <Input
                  label="Ngày khám *"
                  type="date"
                  value={form.schedule_date}
                  onChange={(e) => setForm((p) => ({ ...p, schedule_date: e.target.value }))}
                />
                <Select
                  label="Ca khám"
                  value={form.shift_code}
                  onChange={(e) => setForm((p) => ({ ...p, shift_code: e.target.value }))}
                  options={[
                    { value: "MORNING", label: "Sáng" },
                    { value: "AFTERNOON", label: "Chiều" },
                    { value: "EVENING", label: "Tối" },
                    { value: "NIGHT", label: "Đêm" },
                  ]}
                />
                <Input
                  label="Giờ bắt đầu *"
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                />
                <Input
                  label="Giờ kết thúc *"
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                />
                <Input
                  label="Số slot tối đa"
                  type="number"
                  value={String(form.max_appointments)}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, max_appointments: Number(e.target.value) || 0 }))
                  }
                />
                <Input
                  label="Phí khám (VND)"
                  type="number"
                  value={String(form.exam_fee)}
                  onChange={(e) => setForm((p) => ({ ...p, exam_fee: Number(e.target.value) || 0 }))}
                />
                <Select
                  label="Cho phép đặt lịch"
                  value={String(form.allow_booking)}
                  onChange={(e) => setForm((p) => ({ ...p, allow_booking: e.target.value === "true" }))}
                  options={[
                    { value: "true", label: "Có" },
                    { value: "false", label: "Không" },
                  ]}
                />
                <Select
                  label="Trạng thái"
                  value={form.status}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, status: e.target.value as ScheduleForm["status"] }))
                  }
                  options={[
                    { value: "ACTIVE", label: "Hoạt động" },
                    { value: "INACTIVE", label: "Tạm ngưng" },
                  ]}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Ghi chú"
                    value={form.note}
                    onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                    placeholder="VD: Ca sáng thứ Tư"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isMutating}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {isMutating && <Spinner size="sm" />}
                  {editingId ? "Lưu thay đổi" : "Tạo lịch khám"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="delete"
        title="Xóa lịch khám"
        description="Bạn có chắc muốn xóa lịch khám này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

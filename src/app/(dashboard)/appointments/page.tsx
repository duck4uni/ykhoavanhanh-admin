"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  Info,
  RefreshCw,
} from "lucide-react";

const PAGE_SIZE = 10;

const SHIFT_LABEL: Record<string, string> = {
  MORNING: "Sáng",
  AFTERNOON: "Chiều",
  EVENING: "Tối",
  NIGHT: "Đêm",
};

/* ─── Form types ─────────────────────────────────────────────────────────── */

type WorkTimeSlot = {
  id: string;
  start: string;
  end: string;
  max_appointments: number;
};

type ScheduleForm = {
  doctor_id: string;
  doctor_name: string;
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
  doctor_name: "",
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

const createSlotId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createDefaultSlots = (): WorkTimeSlot[] => [
  { id: createSlotId(), start: "08:00", end: "09:00", max_appointments: 20 },
  { id: createSlotId(), start: "09:00", end: "10:00", max_appointments: 20 },
  { id: createSlotId(), start: "10:00", end: "11:00", max_appointments: 20 },
  { id: createSlotId(), start: "11:00", end: "12:00", max_appointments: 20 },
];

const createSlotFromForm = (form: ScheduleForm): WorkTimeSlot => ({
  id: createSlotId(),
  start: form.start_time,
  end: form.end_time,
  max_appointments: form.max_appointments,
});

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, h || 0, m || 0);
  date.setMinutes(date.getMinutes() + minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function normalizeTime(time?: string): string {
  return time?.slice(0, 5) || "";
}

function toApiTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

function getScheduleSlots(item: DoctorWorkSchedule): WorkTimeSlot[] {
  if (item.time_slots?.length) {
    return item.time_slots.map((slot) => ({
      id: createSlotId(),
      start: normalizeTime(slot.start),
      end: normalizeTime(slot.end),
      max_appointments: slot.max_appointments ?? item.max_appointments ?? 20,
    }));
  }

  return [
    {
      id: createSlotId(),
      start: normalizeTime(item.start_time),
      end: normalizeTime(item.end_time),
      max_appointments: item.max_appointments ?? 20,
    },
  ].filter((slot) => slot.start || slot.end);
}

function getScheduleTimeText(item: DoctorWorkSchedule): string {
  const slots = getScheduleSlots(item);
  if (!slots.length) return "—";
  if (slots.length === 1) return `${slots[0].start || "—"} - ${slots[0].end || "—"}`;
  return `${slots[0].start || "—"} - ${slots[slots.length - 1].end || "—"} (${slots.length} khung)`;
}

function mapItemToForm(item: DoctorWorkSchedule): ScheduleForm {
  const firstSlot = getScheduleSlots(item)[0];
  return {
    doctor_id: item.doctor_id,
    doctor_name: item.doctor?.doctor_name ?? "",
    exam_area_id: item.exam_area_id,
    specialty_id: item.specialty_id ?? "",
    room_id: item.room_id ?? "",
    schedule_date: item.schedule_date,
    start_time: firstSlot?.start || normalizeTime(item.start_time),
    end_time: firstSlot?.end || normalizeTime(item.end_time),
    shift_code: item.shift_code ?? "MORNING",
    max_appointments: item.max_appointments ?? 20,
    exam_fee: item.exam_fee ?? 0,
    allow_booking: item.allow_booking,
    status: item.status,
    note: item.note ?? "",
  };
}

function formToPayload(form: ScheduleForm, slots: WorkTimeSlot[]): CreateDoctorWorkSchedulePayload {
  return {
    doctor_id: form.doctor_id,
    exam_area_id: form.exam_area_id,
    specialty_id: form.specialty_id || undefined,
    room_id: form.room_id || undefined,
    schedule_date: form.schedule_date,
    shift_code: form.shift_code,
    max_appointments: form.max_appointments,
    exam_fee: form.exam_fee,
    allow_booking: form.allow_booking,
    status: form.status,
    note: form.note || undefined,
    time_slots: slots.map((slot) => ({
      start: toApiTime(slot.start),
      end: toApiTime(slot.end),
      max_appointments: slot.max_appointments,
    })),
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
  const [workSlots, setWorkSlots] = useState<WorkTimeSlot[]>(createDefaultSlots);

  const { data, isLoading } = doctorWorkSchedulesHooks.useList();
  const schedules = useMemo(() => data?.rows ?? [], [data]);
  const totalCount = data?.count ?? schedules.length;

  const { data: areasData } = examAreasHooks.useList();
  const examAreas = areasData?.rows ?? [];

  const { data: doctors, isLoading: isLoadingDoctors } = doctorsHooks.useList();
  const doctorList = doctors ?? [];

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

  const isMutating = updateMutation.isPending;

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

  function openEdit(item: DoctorWorkSchedule) {
    setEditingId(item.id);
    const nextForm = mapItemToForm(item);
    setForm(nextForm);
    setWorkSlots(getScheduleSlots(item));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(createInitialForm());
    setWorkSlots(createDefaultSlots());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.doctor_id || !form.exam_area_id || !form.schedule_date) {
      toast.error("Vui lòng chọn bác sĩ, khu khám và ngày khám");
      return;
    }
    if (workSlots.length === 0) {
      toast.error("Vui lòng thêm ít nhất một khung giờ làm việc");
      return;
    }

    try {
      if (!editingId) return;
      await updateMutation.mutateAsync({ id: editingId, data: formToPayload(form, workSlots) });
    } catch {
      // onError của mutation đã hiển thị toast.
    }
  }

  function updateSlot(id: string, patch: Partial<WorkTimeSlot>) {
    setWorkSlots((slots) => slots.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)));
  }

  function addSlot() {
    setWorkSlots((slots) => {
      const start = slots[slots.length - 1]?.end ?? form.start_time;
      return [...slots, { id: createSlotId(), start, end: addMinutes(start, 30), max_appointments: form.max_appointments }];
    });
  }

  function autoGenerateSlots() {
    const slots: WorkTimeSlot[] = [];
    let cursor = form.start_time;
    while (cursor < form.end_time) {
      const end = addMinutes(cursor, 30);
      slots.push({ id: createSlotId(), start: cursor, end: end > form.end_time ? form.end_time : end, max_appointments: form.max_appointments });
      cursor = end;
    }
    setWorkSlots(slots.length > 0 ? slots : [createSlotFromForm(form)]);
  }

  function removeSlot(id: string) {
    setWorkSlots((slots) => slots.filter((slot) => slot.id !== id));
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
        <Link
          href="/appointments/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Thêm lịch khám
        </Link>
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
                    <th className="px-6 py-3.5">Trạng thái</th>
                    <th className="px-6 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-sm text-muted-foreground">
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
                        <td className="px-6 py-4 text-slate-600">{getScheduleTimeText(item)}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {SHIFT_LABEL[item.shift_code ?? ""] ?? (item.shift_code || "—")}
                        </td>
                        <td className="px-6 py-4">
                          <SlotBar booked={item.booked_count ?? 0} max={item.max_appointments ?? 0} />
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
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? "Chỉnh sửa lịch khám" : "Thêm lịch khám mới"}
              </h2>
              <button onClick={closeModal} className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {editingId ? (
                    <Input label="Bác sĩ *" value={form.doctor_name || "—"} readOnly disabled />
                  ) : (
                    <Select
                      label="Bác sĩ *"
                      value={form.doctor_id}
                      onChange={(e) => setForm((p) => ({ ...p, doctor_id: e.target.value }))}
                      placeholder={isLoadingDoctors ? "Đang tải danh sách bác sĩ..." : "-- Chọn bác sĩ --"}
                      disabled={isLoadingDoctors}
                      options={doctorList.map((d) => ({
                        value: d.id,
                        label: d.doctorid ? `${d.doctorname} (${d.doctorid})` : d.doctorname,
                      }))}
                    />
                  )}
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
                  <Select
                    label="Trạng thái"
                    value={form.status}
                    onChange={(e) => {
                      const status = e.target.value as ScheduleForm["status"];
                      setForm((p) => ({ ...p, status }));
                    }}
                    options={[
                      { value: "ACTIVE", label: "Hoạt động" },
                      { value: "INACTIVE", label: "Tạm ngưng" },
                    ]}
                  />
                  <Input
                    label="Số lượt khám tối đa"
                    type="number"
                    min={0}
                    value={form.max_appointments}
                    onChange={(e) => setForm((p) => ({ ...p, max_appointments: Number(e.target.value) || 0 }))}
                  />
                  {/* <Input
                    label="Phí khám"
                    type="number"
                    min={0}
                    value={form.exam_fee}
                    onChange={(e) => setForm((p) => ({ ...p, exam_fee: Number(e.target.value) || 0 }))}
                  /> */}
                  <div className="md:col-span-2">
                    <Input
                      label="Ghi chú"
                      value={form.note}
                      onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                      placeholder="VD: Ca sáng thứ Tư"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="flex items-center gap-1.5 text-base font-semibold text-slate-900">
                        Khung giờ làm việc <Info className="h-4 w-4 text-slate-400" />
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">Các khe thời gian gửi trong trường time_slots theo API mới.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={autoGenerateSlots}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Tự sinh khung giờ
                      </button>
                      <button
                        type="button"
                        onClick={addSlot}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-2.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-100"
                      >
                        <Plus className="h-3.5 w-3.5" /> Thêm khung giờ
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="grid grid-cols-[1fr_1fr_120px_72px] bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                      <span>Bắt đầu</span>
                      <span>Kết thúc</span>
                      <span>Slot khám</span>
                      <span className="text-center">Thao tác</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {workSlots.map((slot) => (
                        <div key={slot.id} className="grid grid-cols-[1fr_1fr_120px_72px] items-center gap-3 px-3 py-2">
                          <div className="relative">
                            <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateSlot(slot.id, { start: e.target.value })}
                              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                            />
                          </div>
                          <div className="relative">
                            <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateSlot(slot.id, { end: e.target.value })}
                              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                            />
                          </div>
                          <div className="flex h-10 overflow-hidden rounded-lg border border-slate-200 bg-white">
                            <input
                              type="number"
                              min={0}
                              value={slot.max_appointments}
                              onChange={(e) => updateSlot(slot.id, { max_appointments: Number(e.target.value) || 0 })}
                              className="min-w-0 flex-1 px-3 text-sm outline-none"
                            />
                            <span className="flex items-center border-l border-slate-200 px-2 text-xs text-slate-500">slot</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSlot(slot.id)}
                            className="mx-auto inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            aria-label="Xóa khung giờ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {workSlots.length === 0 && (
                        <div className="px-3 py-6 text-center text-sm text-muted-foreground">Chưa có khung giờ làm việc.</div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tổng cộng: <b>{workSlots.length}</b> khung giờ · <b>{workSlots.reduce((sum, slot) => sum + slot.max_appointments, 0)}</b> slot khám
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t border-slate-100 p-6">
                <button
                  type="submit"
                  disabled={isMutating}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {isMutating && <Spinner size="sm" />}
                  {editingId ? "Lưu thay đổi" : "Tạo lịch khám"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200"
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

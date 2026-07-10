"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { doctorWorkSchedulesHooks, type CreateDoctorWorkSchedulePayload } from "@/api/doctorWorkSchedulesApi";
import { examAreasHooks } from "@/api/examAreasApi";
import { doctorsHooks, type HisDoctor } from "@/api/doctorsApi";
import { toast } from "@/components/ui/Toast";
import { ArrowLeft, Calendar, ChevronDown, Clock, Info, Plus, RefreshCw, Save, Search, Trash2, UserRound } from "lucide-react";

type WorkTimeSlot = {
  id: string;
  start: string;
  end: string;
  max_appointments: number;
};

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

function toApiTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
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

type DoctorComboboxProps = {
  value: string;
  doctors: HisDoctor[];
  search: string;
  isLoading: boolean;
  hasMore: boolean;
  onChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onLoadMore: () => void;
};

function DoctorCombobox({
  value,
  doctors,
  search,
  isLoading,
  hasMore,
  onChange,
  onSearchChange,
  onLoadMore,
}: DoctorComboboxProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedDoctor = doctors.find((doctor) => doctor.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="mb-1 block text-sm font-medium text-foreground">
        Bác sĩ <span className="text-red-500">*</span>
      </label>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <span className={selectedDoctor ? "text-slate-900" : "text-muted-foreground"}>
          {selectedDoctor
            ? selectedDoctor.doctorid
              ? `${selectedDoctor.doctorname} (${selectedDoctor.doctorid})`
              : selectedDoctor.doctorname
            : "-- Chọn bác sĩ --"}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="relative border-b border-slate-100 p-2">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tìm tên hoặc mã bác sĩ..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
              autoFocus
            />
          </div>
          <div
            className="max-h-72 overflow-y-auto py-1"
            onScroll={(event) => {
              const el = event.currentTarget;
              if (hasMore && !isLoading && el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
                onLoadMore();
              }
            }}
          >
            {doctors.map((doctor) => (
              <button
                key={doctor.id}
                type="button"
                onClick={() => {
                  onChange(doctor.id);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-primary-50 ${doctor.id === value ? "bg-primary-100 text-primary-700" : "text-slate-700"}`}
              >
                {doctor.doctorid ? `${doctor.doctorname} (${doctor.doctorid})` : doctor.doctorname}
              </button>
            ))}
            {isLoading && <div className="px-4 py-3 text-center text-sm text-muted-foreground">Đang tải bác sĩ...</div>}
            {!isLoading && doctors.length === 0 && <div className="px-4 py-3 text-center text-sm text-muted-foreground">Không tìm thấy bác sĩ phù hợp.</div>}
            {!isLoading && hasMore && (
              <button type="button" onClick={onLoadMore} className="w-full px-4 py-3 text-sm font-medium text-primary-600 hover:bg-primary-50">
                Tải thêm bác sĩ
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewAppointmentSchedulePage() {
  const router = useRouter();
  const [form, setForm] = useState<ScheduleForm>(createInitialForm);
  const [workSlots, setWorkSlots] = useState<WorkTimeSlot[]>(createDefaultSlots);

  const { data: areasData } = examAreasHooks.useList();
  const examAreas = areasData?.rows ?? [];

  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorPage, setDoctorPage] = useState(1);
  const [doctorList, setDoctorList] = useState<HisDoctor[]>([]);

  const { data: doctorsData, isLoading: isLoadingDoctors, isFetching: isFetchingDoctors } = doctorsHooks.usePaginatedList({
    currentPage: doctorPage,
    pageSize: 10,
  });

  useEffect(() => {
    const rows = doctorsData?.rows ?? [];
    setDoctorList((current) => {
      const next = doctorPage === 1 ? rows : [...current, ...rows];
      return Array.from(new Map(next.map((doctor) => [doctor.id, doctor])).values());
    });
  }, [doctorsData, doctorPage]);

  useEffect(() => {
    setDoctorPage(1);
  }, [doctorSearch]);

  const filteredDoctorList = useMemo(() => {
    const keyword = doctorSearch.trim().toLowerCase();
    if (!keyword) return doctorList;
    return doctorList.filter((doctor) =>
      [doctor.doctorname, doctor.doctorid].join(" ").toLowerCase().includes(keyword)
    );
  }, [doctorList, doctorSearch]);

  const hasMoreDoctors = (doctorsData?.currentPage ?? doctorPage) < (doctorsData?.totalPages ?? 1);

  const createMutation = doctorWorkSchedulesHooks.useCreate({
    onSuccess: () => {
      toast.success("Tạo lịch khám thành công");
      router.push("/appointments");
    },
    onError: (err) => toast.error(err.message || "Tạo lịch khám thất bại"),
  });

  const totalSlotCount = useMemo(
    () => workSlots.reduce((sum, slot) => sum + slot.max_appointments, 0),
    [workSlots]
  );

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

    await createMutation.mutateAsync(formToPayload(form, workSlots));
  }

  const isSaving = createMutation.isPending;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Thêm lịch khám mới</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tạo lịch làm việc và cấu hình khung giờ khám cho bác sĩ.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <UserRound className="h-5 w-5 text-primary-600" /> Thông tin lịch khám
              </h2>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              <DoctorCombobox
                value={form.doctor_id}
                doctors={filteredDoctorList}
                search={doctorSearch}
                isLoading={isLoadingDoctors || isFetchingDoctors}
                hasMore={hasMoreDoctors}
                onChange={(doctorId) => setForm((p) => ({ ...p, doctor_id: doctorId }))}
                onSearchChange={setDoctorSearch}
                onLoadMore={() => setDoctorPage((current) => current + 1)}
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
              {/* <Input
                label="Số lượt khám tối đa"
                type="number"
                min={0}
                value={form.max_appointments}
                onChange={(e) => setForm((p) => ({ ...p, max_appointments: Number(e.target.value) || 0 }))}
              /> */}
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
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Info className="h-5 w-5 text-primary-600" /> Khung giờ làm việc
                </h2>
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

            <div className="p-6">
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
              <p className="mt-3 text-sm text-muted-foreground">
                Tổng cộng: <b>{workSlots.length}</b> khung giờ · <b>{totalSlotCount}</b> slot khám
              </p>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="sticky top-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Calendar className="h-5 w-5 text-primary-600" /> Tóm tắt lịch khám
            </h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Ngày khám</span>
                <span className="font-medium text-slate-800">{form.schedule_date || "Chưa chọn"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Khung giờ</span>
                <span className="font-medium text-slate-800">{workSlots.length}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Tổng slot</span>
                <span className="font-medium text-slate-800">{totalSlotCount}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Phí khám</span>
                <span className="font-medium text-slate-800">{form.exam_fee.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-primary-100 bg-primary-50 p-4 text-sm text-primary-800">
              <p className="font-medium">Vui lòng kiểm tra thông tin trước khi tạo lịch.</p>
              <p className="mt-1 text-primary-700">Sau khi lưu, lịch khám sẽ hiển thị trong danh sách quản lý.</p>
            </div>

            <div className="mt-6 grid grid-cols-[1fr_2fr] gap-3">
              <button
                type="button"
                onClick={() => router.push("/appointments")}
                disabled={isSaving}
                className="h-11 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {isSaving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
                Tạo lịch khám
              </button>
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}

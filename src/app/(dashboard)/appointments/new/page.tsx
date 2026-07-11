"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  doctorWorkSchedulesHooks,
  type CreateDoctorWorkScheduleV2Payload,
  type WorkScheduleTimeSlotV2,
} from "@/api/doctorWorkSchedulesApi";
import { weekdayLabels } from "@/lib/hospital-admin";
import { examAreasHooks } from "@/api/examAreasApi";
import { specialtiesHooks } from "@/api/specialtiesApi";
import { roomsHooks } from "@/api/roomsApi";
import { hisServicesHooks } from "@/api/hisServicesApi";
import { doctorsHooks, type HisDoctor } from "@/api/doctorsApi";
import { toast } from "@/components/ui/Toast";
import { useDebounce } from "@/hooks/useApiHelpers";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  ChevronDown,
  Clock,
  Info,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Stethoscope,
  Building2,
  Trash2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ScheduleForm = {
  doctor_id: string;
  schedule_date: string;
  status: "ACTIVE" | "INACTIVE";
  note: string;
};

type ScopeRow = {
  clientId: string;
  specialty_id: string;
  area_id: string;
  room_id: string;
  service_id: string;
  fee: number;
  status: "ACTIVE" | "INACTIVE";
  note: string;
};

type TimeSlotRow = {
  id: string;
  start: string;
  end: string;
  slot_limit: number;
  weekdays: number[];
  scopeMode: "all" | "custom";
  scope_ids: string[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createInitialForm = (): ScheduleForm => ({
  doctor_id: "",
  schedule_date: "",
  status: "ACTIVE",
  note: "",
});

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, h || 0, m || 0);
  date.setMinutes(date.getMinutes() + minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function toApiTime(time: string): string {
  return time.length === 5 ? `${time}` : time.slice(0, 5);
}

function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatFee(value: number): string {
  return `${value.toLocaleString("vi-VN")}đ`;
}

const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];

function sortWeekdays(weekdays: number[]): number[] {
  return [...weekdays].sort((a, b) => weekdayOrder.indexOf(a) - weekdayOrder.indexOf(b));
}

function weekdayShortLabel(weekday: number): string {
  return weekday === 0 ? "CN" : `T${weekday + 1}`;
}

// ─── Doctor combobox (giữ nguyên từ bản cũ) ──────────────────────────────────

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

// ─── Combobox phân trang có search + scroll load-more (dùng chung) ───────────

type PickerOption = { value: string; label: string };

type PaginatedComboboxProps = {
  value: string;
  selectedLabel?: string;
  options: PickerOption[];
  search: string;
  isLoading: boolean;
  hasMore: boolean;
  placeholder: string;
  searchPlaceholder: string;
  onChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onLoadMore: () => void;
};

function PaginatedCombobox({
  value,
  selectedLabel,
  options,
  search,
  isLoading,
  hasMore,
  placeholder,
  searchPlaceholder,
  onChange,
  onSearchChange,
  onLoadMore,
}: PaginatedComboboxProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const label = selectedLabel || options.find((o) => o.value === value)?.label || "";

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
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
      >
        <span className={label ? "truncate text-slate-800" : "text-slate-400"}>{label || placeholder}</span>
        <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="relative border-b border-slate-100 p-2">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
              autoFocus
            />
          </div>
          <div
            className="max-h-60 overflow-y-auto py-1"
            onScroll={(event) => {
              const el = event.currentTarget;
              if (hasMore && !isLoading && el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
                onLoadMore();
              }
            }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-primary-50 ${opt.value === value ? "bg-primary-100 text-primary-700" : "text-slate-700"}`}
              >
                {opt.label}
              </button>
            ))}
            {isLoading && <div className="px-4 py-3 text-center text-sm text-muted-foreground">Đang tải...</div>}
            {!isLoading && options.length === 0 && <div className="px-4 py-3 text-center text-sm text-muted-foreground">Không có kết quả phù hợp.</div>}
            {!isLoading && hasMore && (
              <button type="button" onClick={onLoadMore} className="w-full px-4 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50">
                Tải thêm
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Tích lũy các trang đã tải; page===1 thì thay mới, khác thì nối thêm & khử trùng. */
function useAccumulatedRows<T>(rows: T[], page: number, keyOf: (item: T) => string): T[] {
  const [list, setList] = useState<T[]>([]);
  const keyRef = useRef(keyOf);
  keyRef.current = keyOf;
  useEffect(() => {
    setList((current) => {
      const next = page === 1 ? rows : [...current, ...rows];
      return Array.from(new Map(next.map((item) => [keyRef.current(item), item])).values());
    });
  }, [rows, page]);
  return list;
}

// ─── Section header với số thứ tự ────────────────────────────────────────────

function StepBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
      {n}
    </span>
  );
}

// ─── Field dạng label-trái / input-phải cho modal phạm vi ────────────────────

const scopeControlClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10";

function ScopeField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[132px_1fr] items-center gap-3">
      <label className="text-sm font-medium text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div>{children}</div>
    </div>
  );
}

// ─── Empty scope form ────────────────────────────────────────────────────────

const emptyScopeDraft = (): Omit<ScopeRow, "clientId"> => ({
  specialty_id: "",
  area_id: "",
  room_id: "",
  service_id: "",
  fee: 0,
  status: "ACTIVE",
  note: "",
});

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NewAppointmentSchedulePage() {
  const router = useRouter();
  const [form, setForm] = useState<ScheduleForm>(createInitialForm);
  const [scopes, setScopes] = useState<ScopeRow[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotRow[]>([]);

  // ── Danh mục cho thẻ đếm năng lực (đếm tổng, chỉ cần count) ──
  const { data: specialtyCountData } = specialtiesHooks.useList({ currentPage: 1, pageSize: 1 });
  const { data: areaCountData } = examAreasHooks.useList({ currentPage: 1, pageSize: 1 });
  const { data: serviceCountData } = hisServicesHooks.usePaginatedList({ currentPage: 1, pageSize: 1 });
  const specialtyTotal = specialtyCountData?.count ?? 0;
  const areaTotal = areaCountData?.count ?? 0;
  const serviceTotal = serviceCountData?.count ?? 0;

  // ── Chuyên khoa: search + phân trang ──
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [specialtyPage, setSpecialtyPage] = useState(1);
  const debouncedSpecialtySearch = useDebounce(specialtySearch, 400);
  useEffect(() => setSpecialtyPage(1), [debouncedSpecialtySearch]);
  const { data: specialtyPageData, isFetching: isFetchingSpecialties } = specialtiesHooks.useList({
    currentPage: specialtyPage,
    pageSize: 10,
    filters: debouncedSpecialtySearch.trim() ? `name@=${debouncedSpecialtySearch.trim()}` : undefined,
  });
  const specialties = useAccumulatedRows(
    useMemo(() => specialtyPageData?.rows ?? [], [specialtyPageData]),
    specialtyPage,
    (s) => s.id
  );
  const hasMoreSpecialties = (specialtyPageData?.currentPage ?? specialtyPage) < (specialtyPageData?.totalPages ?? 1);

  // ── Khu vực khám: search + phân trang ──
  const [areaSearch, setAreaSearch] = useState("");
  const [areaPage, setAreaPage] = useState(1);
  const debouncedAreaSearch = useDebounce(areaSearch, 400);
  useEffect(() => setAreaPage(1), [debouncedAreaSearch]);
  const { data: areaPageData, isFetching: isFetchingAreas } = examAreasHooks.useList({
    currentPage: areaPage,
    pageSize: 10,
    filters: debouncedAreaSearch.trim() ? `name@=${debouncedAreaSearch.trim()}` : undefined,
  });
  const examAreas = useAccumulatedRows(
    useMemo(() => areaPageData?.rows ?? [], [areaPageData]),
    areaPage,
    (a) => a.id
  );
  const hasMoreAreas = (areaPageData?.currentPage ?? areaPage) < (areaPageData?.totalPages ?? 1);

  // ── Phòng khám: search + phân trang ──
  const [roomSearch, setRoomSearch] = useState("");
  const [roomPage, setRoomPage] = useState(1);
  const debouncedRoomSearch = useDebounce(roomSearch, 400);
  useEffect(() => setRoomPage(1), [debouncedRoomSearch]);
  const { data: roomPageData, isFetching: isFetchingRooms } = roomsHooks.usePaginatedList({
    currentPage: roomPage,
    pageSize: 10,
    filters: debouncedRoomSearch.trim() ? `room_name@=${debouncedRoomSearch.trim()}` : undefined,
  });
  const rooms = useAccumulatedRows(
    useMemo(() => roomPageData?.rows ?? [], [roomPageData]),
    roomPage,
    (r) => r.id
  );
  const hasMoreRooms = (roomPageData?.currentPage ?? roomPage) < (roomPageData?.totalPages ?? 1);

  // ── Dịch vụ khám: search + phân trang ──
  const [serviceSearch, setServiceSearch] = useState("");
  const [servicePage, setServicePage] = useState(1);
  const debouncedServiceSearch = useDebounce(serviceSearch, 400);
  useEffect(() => setServicePage(1), [debouncedServiceSearch]);
  const { data: servicePageData, isFetching: isFetchingServices } = hisServicesHooks.usePaginatedList({
    currentPage: servicePage,
    pageSize: 10,
    filters: debouncedServiceSearch.trim() ? `service_name@=${debouncedServiceSearch.trim()}` : undefined,
  });
  const services = useAccumulatedRows(
    useMemo(() => servicePageData?.rows ?? [], [servicePageData]),
    servicePage,
    (s) => s.id
  );
  const hasMoreServices = (servicePageData?.currentPage ?? servicePage) < (servicePageData?.totalPages ?? 1);

  // ── Nhãn của mục đã chọn (giữ lại kể cả khi danh sách đã cuộn/lọc) ──
  const [labelCache, setLabelCache] = useState<Record<string, string>>({});
  const rememberLabel = (id: string, label: string) =>
    setLabelCache((prev) => (id && prev[id] !== label ? { ...prev, [id]: label } : prev));

  // ── Doctor combobox ──
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
  const selectedDoctor = doctorList.find((d) => d.id === form.doctor_id);

  // ── Lookup maps ──
  const specialtyName = (id: string) => specialties.find((s) => s.id === id)?.name ?? labelCache[id] ?? "—";
  const areaName = (id: string) => examAreas.find((a) => a.id === id)?.name ?? labelCache[id] ?? "—";
  const roomName = (id: string) => rooms.find((r) => r.id === id)?.roomname ?? labelCache[id] ?? "";
  const serviceName = (id: string) => services.find((s) => s.id === id)?.servicename ?? labelCache[id] ?? "—";
  const scopeShortLabel = (scope: ScopeRow) =>
    `${specialtyName(scope.specialty_id)} - ${serviceName(scope.service_id)}`;

  // ── Modal state: scope ──
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [editingScopeId, setEditingScopeId] = useState<string | null>(null);
  const [scopeDraft, setScopeDraft] = useState<Omit<ScopeRow, "clientId">>(emptyScopeDraft);

  function openAddScope() {
    setEditingScopeId(null);
    setScopeDraft(emptyScopeDraft());
    setScopeModalOpen(true);
  }

  function openEditScope(row: ScopeRow) {
    setEditingScopeId(row.clientId);
    const { clientId: _clientId, ...rest } = row;
    void _clientId;
    setScopeDraft(rest);
    setScopeModalOpen(true);
  }

  function saveScope() {
    if (!scopeDraft.specialty_id || !scopeDraft.area_id || !scopeDraft.service_id) {
      toast.error("Vui lòng chọn chuyên khoa, khu vực và dịch vụ khám.");
      return;
    }
    // Chặn trùng tổ hợp chuyên khoa + khu vực + phòng + dịch vụ
    const isDuplicate = scopes.some(
      (s) =>
        s.clientId !== editingScopeId &&
        s.specialty_id === scopeDraft.specialty_id &&
        s.area_id === scopeDraft.area_id &&
        s.room_id === scopeDraft.room_id &&
        s.service_id === scopeDraft.service_id
    );
    if (isDuplicate) {
      toast.error("Phạm vi khám này đã tồn tại (trùng chuyên khoa, khu vực/phòng và dịch vụ).");
      return;
    }
    if (scopeDraft.fee <= 0) {
      toast.warning("Dịch vụ đang có phí khám bằng 0đ. Vui lòng kiểm tra lại trước khi tạo lịch.");
    }

    if (editingScopeId) {
      setScopes((prev) => prev.map((s) => (s.clientId === editingScopeId ? { ...scopeDraft, clientId: editingScopeId } : s)));
    } else {
      setScopes((prev) => [...prev, { ...scopeDraft, clientId: createId() }]);
    }
    setScopeModalOpen(false);
  }

  function removeScope(clientId: string) {
    setScopes((prev) => prev.filter((s) => s.clientId !== clientId));
    // Gỡ scope khỏi các khung giờ đang tham chiếu
    setTimeSlots((prev) =>
      prev.map((slot) => ({
        ...slot,
        scope_ids: slot.scope_ids.filter((id) => id !== clientId),
      }))
    );
  }

  // Auto set fee mặc định theo dịch vụ khi đổi dịch vụ trong modal
  function onDraftServiceChange(serviceId: string) {
    const svc = services.find((s) => s.id === serviceId);
    const price = svc ? Number(svc.price) || 0 : 0;
    setScopeDraft((prev) => ({
      ...prev,
      service_id: serviceId,
      fee: prev.fee > 0 ? prev.fee : price,
      // Gợi ý chuyên khoa/khu vực theo dịch vụ nếu chưa chọn
      specialty_id: prev.specialty_id || svc?.specialty_id || "",
      area_id: prev.area_id || svc?.exam_area_id || "",
    }));
  }

  // Phòng gợi ý lọc theo khu vực đã chọn
  const draftRoomOptions = useMemo(() => {
    const list = scopeDraft.area_id
      ? rooms.filter((r) => !r.exam_area_id || r.exam_area_id === scopeDraft.area_id)
      : rooms;
    return list;
  }, [rooms, scopeDraft.area_id]);

  // Dịch vụ gợi ý lọc theo chuyên khoa đã chọn
  const draftServiceOptions = useMemo(() => {
    const list = scopeDraft.specialty_id
      ? services.filter((s) => !s.specialty_id || s.specialty_id === scopeDraft.specialty_id)
      : services;
    return list;
  }, [services, scopeDraft.specialty_id]);

  // ── Time slots ──
  function addSlot() {
    setTimeSlots((prev) => {
      const start = prev[prev.length - 1]?.end ?? "08:00";
      return [
        ...prev,
        { id: createId(), start, end: addMinutes(start, 30), slot_limit: 20, weekdays: [], scopeMode: "all", scope_ids: [] },
      ];
    });
  }

  function updateSlot(id: string, patch: Partial<TimeSlotRow>) {
    setTimeSlots((prev) => prev.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)));
  }

  function removeSlot(id: string) {
    setTimeSlots((prev) => prev.filter((slot) => slot.id !== id));
  }

  function toggleSlotScope(slotId: string, scopeClientId: string) {
    setTimeSlots((prev) =>
      prev.map((slot) => {
        if (slot.id !== slotId) return slot;
        const exists = slot.scope_ids.includes(scopeClientId);
        return {
          ...slot,
          scope_ids: exists
            ? slot.scope_ids.filter((id) => id !== scopeClientId)
            : [...slot.scope_ids, scopeClientId],
        };
      })
    );
  }

  function toggleSlotWeekday(slotId: string, weekday: number) {
    setTimeSlots((prev) =>
      prev.map((slot) => {
        if (slot.id !== slotId) return slot;
        const exists = slot.weekdays.includes(weekday);
        return {
          ...slot,
          weekdays: exists
            ? slot.weekdays.filter((day) => day !== weekday)
            : sortWeekdays([...slot.weekdays, weekday]),
        };
      })
    );
  }

  function setSlotWeekdays(slotId: string, weekdays: number[]) {
    setTimeSlots((prev) => prev.map((slot) => (slot.id === slotId ? { ...slot, weekdays } : slot)));
  }

  // ── Modal state: tự sinh khung giờ ──
  const [autoGenOpen, setAutoGenOpen] = useState(false);
  const [autoGen, setAutoGen] = useState({ start: "08:00", end: "12:00", stepMinutes: 30, slotLimit: 20 });

  function runAutoGenerate() {
    if (autoGen.start >= autoGen.end) {
      toast.error("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
      return;
    }
    if (autoGen.slotLimit <= 0) {
      toast.error("Số slot mỗi khung phải lớn hơn 0.");
      return;
    }
    const generated: TimeSlotRow[] = [];
    let cursor = autoGen.start;
    while (cursor < autoGen.end) {
      const end = addMinutes(cursor, autoGen.stepMinutes);
      const clamped = end > autoGen.end ? autoGen.end : end;
      generated.push({
        id: createId(),
        start: cursor,
        end: clamped,
        slot_limit: autoGen.slotLimit,
        weekdays: [],
        scopeMode: "all",
        scope_ids: [],
      });
      cursor = clamped;
    }
    setTimeSlots(generated);
    setAutoGenOpen(false);
    toast.success(`Đã sinh ${generated.length} khung giờ.`);
  }

  // ── Tổng hợp ──
  const totalSlotCount = useMemo(
    () => timeSlots.reduce((sum, slot) => sum + (slot.slot_limit || 0), 0),
    [timeSlots]
  );

  // ── Cảnh báo cấu hình ──
  const warnings = useMemo(() => {
    const list: string[] = [];
    if (!form.doctor_id) list.push("Chưa chọn bác sĩ");
    if (!form.schedule_date) list.push("Chưa chọn ngày khám");
    if (scopes.length === 0) list.push("Chưa có phạm vi khám");
    if (timeSlots.length === 0) list.push("Chưa có khung giờ làm việc");
    if (timeSlots.some((s) => s.weekdays.length === 0)) list.push("Có khung giờ chưa chọn thứ áp dụng");
    if (scopes.some((s) => s.fee <= 0)) list.push("Có dịch vụ chưa cấu hình phí khám");
    if (timeSlots.some((s) => s.scopeMode === "custom" && s.scope_ids.length === 0))
      list.push("Có khung giờ chưa chọn phạm vi áp dụng");
    return list;
  }, [form.doctor_id, form.schedule_date, scopes, timeSlots]);

  const canSubmit =
    Boolean(form.doctor_id) &&
    Boolean(form.schedule_date) &&
    scopes.length > 0 &&
    timeSlots.length > 0 &&
    !timeSlots.some((s) => s.weekdays.length === 0) &&
    !timeSlots.some((s) => s.scopeMode === "custom" && s.scope_ids.length === 0);

  const createMutation = doctorWorkSchedulesHooks.useCreateV2({
    onSuccess: () => {
      toast.success("Tạo lịch khám thành công");
      router.push("/appointments");
    },
    onError: (err) => toast.error(err.message || "Tạo lịch khám thất bại"),
  });
  const isSaving = createMutation.isPending;

  function buildPayload(): CreateDoctorWorkScheduleV2Payload {
    const selectedWeekdays = sortWeekdays(Array.from(new Set(timeSlots.flatMap((slot) => slot.weekdays))));
    const time_slots: WorkScheduleTimeSlotV2[] = timeSlots.flatMap((slot) =>
      slot.weekdays.map((weekday) => ({
        start_time: toApiTime(slot.start),
        end_time: toApiTime(slot.end),
        slot_limit: slot.slot_limit,
        weekday,
        scope_ids: slot.scopeMode === "all" ? "all" : slot.scope_ids,
      }))
    );
    return {
      doctor_id: form.doctor_id,
      date: form.schedule_date,
      weekdays: selectedWeekdays,
      status: form.status,
      note: form.note || undefined,
      scopes: scopes.map((s) => ({
        client_id: s.clientId,
        specialty_id: s.specialty_id,
        area_id: s.area_id,
        room_id: s.room_id,
        service_id: s.service_id,
        fee: s.fee,
        status: s.status,
        note: s.note || undefined,
      })),
      time_slots,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Vui lòng hoàn thiện thông tin lịch khám trước khi tạo.");
      return;
    }
    await createMutation.mutateAsync(buildPayload());
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
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
          <p className="mt-1 text-sm text-muted-foreground">Tạo lịch làm việc và cấu hình phạm vi khám cho bác sĩ.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {/* ── Khối 1: Thông tin lịch khám ── */}
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <StepBadge n={1} /> Thông tin lịch khám
              </h2>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-3">
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
                <Input
                  label="Ngày khám *"
                  type="date"
                  min={todayISO()}
                  value={form.schedule_date}
                  onChange={(e) => setForm((p) => ({ ...p, schedule_date: e.target.value }))}
                />
                <Select
                  label="Trạng thái"
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ScheduleForm["status"] }))}
                  options={[
                    { value: "ACTIVE", label: "Hoạt động" },
                    { value: "INACTIVE", label: "Tạm ngưng" },
                  ]}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,320px)_1fr]">
                {/* Mini card năng lực (tổng danh mục) */}
                <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-2">
                  <div className="flex flex-col items-center justify-center rounded-lg bg-white px-2 py-3 text-center">
                    <Stethoscope className="mb-1 h-4 w-4 text-primary-600" />
                    <span className="text-base font-bold text-slate-900">{specialtyTotal}</span>
                    <span className="text-[11px] text-muted-foreground">chuyên khoa</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg bg-white px-2 py-3 text-center">
                    <Layers className="mb-1 h-4 w-4 text-primary-600" />
                    <span className="text-base font-bold text-slate-900">{serviceTotal}</span>
                    <span className="text-[11px] text-muted-foreground">dịch vụ</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg bg-white px-2 py-3 text-center">
                    <Building2 className="mb-1 h-4 w-4 text-primary-600" />
                    <span className="text-base font-bold text-slate-900">{areaTotal}</span>
                    <span className="text-[11px] text-muted-foreground">khu vực khám</span>
                  </div>
                </div>
                <Input
                  label="Ghi chú"
                  value={form.note}
                  onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="VD: Ca sáng thứ Tư"
                />
              </div>
            </div>
          </section>

          {/* ── Khối 2: Phạm vi khám áp dụng ── */}
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <StepBadge n={2} /> Phạm vi khám áp dụng
              </h2>
              <button
                type="button"
                onClick={openAddScope}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50"
              >
                <Plus className="h-3.5 w-3.5" /> Thêm phạm vi khám
              </button>
            </div>

            <div className="p-6">
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="grid grid-cols-[1.2fr_1.2fr_1.4fr_100px_110px_84px] bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                  <span>Chuyên khoa</span>
                  <span>Khu vực / phòng</span>
                  <span>Dịch vụ khám</span>
                  <span className="text-right">Phí khám</span>
                  <span>Trạng thái</span>
                  <span className="text-center">Thao tác</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {scopes.map((scope) => (
                    <div key={scope.clientId} className="grid grid-cols-[1.2fr_1.2fr_1.4fr_100px_110px_84px] items-center gap-2 px-3 py-2.5 text-sm">
                      <span className="truncate text-slate-800">{specialtyName(scope.specialty_id)}</span>
                      <span className="truncate text-slate-700">
                        {areaName(scope.area_id)}
                        {roomName(scope.room_id) ? ` · ${roomName(scope.room_id)}` : ""}
                      </span>
                      <span className="truncate text-slate-700">{serviceName(scope.service_id)}</span>
                      <span className="text-right font-medium text-slate-800">{formatFee(scope.fee)}</span>
                      <span>
                        <Badge variant={scope.status === "ACTIVE" ? "success" : "default"}>
                          {scope.status === "ACTIVE" ? "Hoạt động" : "Tạm tắt"}
                        </Badge>
                      </span>
                      <span className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditScope(scope)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary-500 transition-colors hover:bg-primary-50"
                          aria-label="Sửa phạm vi"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeScope(scope.clientId)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label="Xóa phạm vi"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </span>
                    </div>
                  ))}
                  {scopes.length === 0 && (
                    <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                      Chưa có phạm vi khám. Bấm &quot;Thêm phạm vi khám&quot; để cấu hình.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ── Khối 3: Khung giờ làm việc ── */}
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <StepBadge n={3} /> Khung giờ làm việc
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAutoGenOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Tự sinh khung giờ
                </button>
                <button
                  type="button"
                  onClick={addSlot}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50"
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm khung giờ
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="grid grid-cols-[1fr_1fr_110px_1.5fr_1.4fr_64px] bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                  <span>Bắt đầu</span>
                  <span>Kết thúc</span>
                  <span>Slot khám</span>
                  <span>Thứ áp dụng</span>
                  <span>Áp dụng cho</span>
                  <span className="text-center">Thao tác</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {timeSlots.map((slot) => (
                    <div key={slot.id} className="grid grid-cols-[1fr_1fr_110px_1.5fr_1.4fr_64px] items-start gap-3 px-3 py-2.5">
                      <div className="relative">
                        <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) => updateSlot(slot.id, { start: e.target.value })}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-2 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                        />
                      </div>
                      <div className="relative">
                        <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) => updateSlot(slot.id, { end: e.target.value })}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-2 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                        />
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={slot.slot_limit}
                        onChange={(e) => updateSlot(slot.id, { slot_limit: Number(e.target.value) || 0 })}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                      />
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 gap-1.5">
                          {weekdayOrder.map((weekday) => {
                            const label = weekdayLabels[weekday];
                            const checked = slot.weekdays.includes(weekday);
                            return (
                              <button
                                key={weekday}
                                type="button"
                                title={label}
                                onClick={() => toggleSlotWeekday(slot.id, weekday)}
                                className={`h-8 rounded-lg text-xs font-semibold transition-colors ${
                                  checked
                                    ? "bg-primary-100 text-primary-700 ring-1 ring-primary-300"
                                    : "bg-slate-50 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {weekdayShortLabel(weekday)}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-1.5 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setSlotWeekdays(slot.id, weekdayOrder)}
                            className="font-medium text-primary-600 hover:text-primary-700"
                          >
                            Chọn cả tuần
                          </button>
                          <span className="text-slate-300">·</span>
                          <button
                            type="button"
                            onClick={() => setSlotWeekdays(slot.id, [])}
                            className="font-medium text-slate-500 hover:text-slate-700"
                          >
                            Bỏ chọn
                          </button>
                        </div>
                        {slot.weekdays.length === 0 && (
                          <p className="text-[11px] text-amber-600">Chưa chọn thứ áp dụng</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <select
                          value={slot.scopeMode}
                          onChange={(e) => {
                            const scopeMode = e.target.value as TimeSlotRow["scopeMode"];
                            if (scopeMode === "custom" && scopes.length === 0) {
                              toast.error("Vui lòng thêm ít nhất một phạm vi khám trước.");
                              return;
                            }
                            updateSlot(slot.id, { scopeMode });
                          }}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                        >
                          <option value="all">Tất cả phạm vi</option>
                          <option value="custom">Chọn phạm vi</option>
                        </select>
                        {slot.scopeMode === "custom" && (
                          <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-slate-50/60 p-2">
                            {scopes.map((scope) => {
                              const checked = slot.scope_ids.includes(scope.clientId);
                              return (
                                <button
                                  key={scope.clientId}
                                  type="button"
                                  onClick={() => toggleSlotScope(slot.id, scope.clientId)}
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                    checked
                                      ? "bg-primary-100 text-primary-700 ring-1 ring-primary-300"
                                      : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {scopeShortLabel(scope)}
                                </button>
                              );
                            })}
                            {slot.scope_ids.length === 0 && (
                              <span className="text-[11px] text-amber-600">Chưa chọn phạm vi nào</span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSlot(slot.id)}
                        className="mx-auto mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label="Xóa khung giờ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {timeSlots.length === 0 && (
                    <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                      Chưa có khung giờ làm việc. Bấm &quot;Tự sinh khung giờ&quot; hoặc &quot;Thêm khung giờ&quot;.
                    </div>
                  )}
                </div>
              </div>
              {timeSlots.length > 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Tổng cộng: <b>{timeSlots.length}</b> khung giờ · <b>{totalSlotCount}</b> slot khám · Chọn thứ áp dụng từ Thứ 2 đến Chủ nhật cho từng khung giờ
                </p>
              )}
            </div>
          </section>
        </div>

        {/* ── Card tóm tắt ── */}
        <aside className="space-y-5">
          <section className="sticky top-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Calendar className="h-5 w-5 text-primary-600" /> Tóm tắt lịch khám
            </h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Bác sĩ</span>
                <span className="max-w-[60%] truncate text-right font-medium text-slate-800">
                  {selectedDoctor?.doctorname || "Chưa chọn"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Ngày khám</span>
                <span className="font-medium text-slate-800">{form.schedule_date || "Chưa chọn"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Phạm vi áp dụng</span>
                <span className="font-medium text-slate-800">{scopes.length}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Khung giờ</span>
                <span className="font-medium text-slate-800">{timeSlots.length}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Thứ áp dụng</span>
                <span className="max-w-[60%] text-right font-medium text-slate-800">
                  {sortWeekdays(Array.from(new Set(timeSlots.flatMap((slot) => slot.weekdays))))
                    .map((weekday) => weekdayShortLabel(weekday))
                    .join(", ") || "Chưa chọn"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Tổng slot</span>
                <span className="font-medium text-slate-800">{totalSlotCount}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Dự kiến hiển thị</span>
                <Badge variant={form.status === "ACTIVE" ? "success" : "default"}>
                  {form.status === "ACTIVE" ? "Có" : "Không"}
                </Badge>
              </div>
            </div>

            {warnings.length > 0 ? (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4" /> Cảnh báo cấu hình
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-700">
                  {warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-primary-100 bg-primary-50 p-4 text-sm text-primary-800">
                <p className="flex items-center gap-2 font-medium">
                  <Info className="h-4 w-4" /> Vui lòng kiểm tra lại thông tin trước khi tạo lịch.
                </p>
                <p className="mt-1 text-primary-700">Các phạm vi khám và khung giờ sẽ hiển thị trong danh sách quản lý.</p>
              </div>
            )}

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
                disabled={isSaving || !canSubmit}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
                Tạo lịch khám
              </button>
            </div>
          </section>
        </aside>
      </form>

      {/* ── Modal thêm/sửa phạm vi khám ── */}
      <Modal
        isOpen={scopeModalOpen}
        onClose={() => setScopeModalOpen(false)}
        title={editingScopeId ? "Sửa phạm vi khám" : "Thêm phạm vi khám"}
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setScopeModalOpen(false)}
              className="h-10 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={saveScope}
              className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              {editingScopeId ? "Lưu thay đổi" : "Thêm phạm vi"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <ScopeField label="Chuyên khoa" required>
            <PaginatedCombobox
              value={scopeDraft.specialty_id}
              selectedLabel={scopeDraft.specialty_id ? specialtyName(scopeDraft.specialty_id) : undefined}
              options={specialties.map((s) => ({ value: s.id, label: s.name }))}
              search={specialtySearch}
              isLoading={isFetchingSpecialties}
              hasMore={hasMoreSpecialties}
              placeholder="Chọn chuyên khoa"
              searchPlaceholder="Tìm chuyên khoa..."
              onSearchChange={setSpecialtySearch}
              onLoadMore={() => setSpecialtyPage((p) => p + 1)}
              onChange={(value) => {
                const item = specialties.find((s) => s.id === value);
                rememberLabel(value, item?.name ?? "");
                setScopeDraft((p) => ({ ...p, specialty_id: value, service_id: "" }));
              }}
            />
          </ScopeField>

          <ScopeField label="Khu vực / phòng" required>
            <div className="grid grid-cols-2 gap-2">
              <PaginatedCombobox
                value={scopeDraft.area_id}
                selectedLabel={scopeDraft.area_id ? areaName(scopeDraft.area_id) : undefined}
                options={examAreas.map((a) => ({ value: a.id, label: a.name }))}
                search={areaSearch}
                isLoading={isFetchingAreas}
                hasMore={hasMoreAreas}
                placeholder="Chọn khu vực"
                searchPlaceholder="Tìm khu vực..."
                onSearchChange={setAreaSearch}
                onLoadMore={() => setAreaPage((p) => p + 1)}
                onChange={(value) => {
                  const item = examAreas.find((a) => a.id === value);
                  rememberLabel(value, item?.name ?? "");
                  setScopeDraft((p) => ({ ...p, area_id: value, room_id: "" }));
                }}
              />
              <PaginatedCombobox
                value={scopeDraft.room_id}
                selectedLabel={scopeDraft.room_id ? roomName(scopeDraft.room_id) : undefined}
                options={draftRoomOptions.map((r) => ({ value: r.id, label: r.roomname }))}
                search={roomSearch}
                isLoading={isFetchingRooms}
                hasMore={hasMoreRooms}
                placeholder="Chọn phòng"
                searchPlaceholder="Tìm phòng..."
                onSearchChange={setRoomSearch}
                onLoadMore={() => setRoomPage((p) => p + 1)}
                onChange={(value) => {
                  const item = draftRoomOptions.find((r) => r.id === value);
                  rememberLabel(value, item?.roomname ?? "");
                  setScopeDraft((p) => ({ ...p, room_id: value }));
                }}
              />
            </div>
          </ScopeField>

          <ScopeField label="Dịch vụ khám" required>
            <PaginatedCombobox
              value={scopeDraft.service_id}
              selectedLabel={scopeDraft.service_id ? serviceName(scopeDraft.service_id) : undefined}
              options={draftServiceOptions.map((s) => ({ value: s.id, label: s.servicename }))}
              search={serviceSearch}
              isLoading={isFetchingServices}
              hasMore={hasMoreServices}
              placeholder="Chọn dịch vụ khám"
              searchPlaceholder="Tìm dịch vụ khám..."
              onSearchChange={setServiceSearch}
              onLoadMore={() => setServicePage((p) => p + 1)}
              onChange={(value) => {
                const item = draftServiceOptions.find((s) => s.id === value);
                rememberLabel(value, item?.servicename ?? "");
                onDraftServiceChange(value);
              }}
            />
          </ScopeField>

          <ScopeField label="Phí khám (VND)" required>
            <div className="flex h-10 items-center overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10">
              <input
                type="number"
                min={0}
                value={scopeDraft.fee}
                onChange={(e) => setScopeDraft((p) => ({ ...p, fee: Number(e.target.value) || 0 }))}
                placeholder="Nhập phí khám"
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
              />
              <span className="flex h-full items-center border-l border-slate-200 px-3 text-xs font-medium text-slate-400">VND</span>
            </div>
          </ScopeField>

          <ScopeField label="Trạng thái">
            <select
              value={scopeDraft.status}
              onChange={(e) => setScopeDraft((p) => ({ ...p, status: e.target.value as ScopeRow["status"] }))}
              className={scopeControlClass}
            >
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Tạm tắt</option>
            </select>
          </ScopeField>

          <ScopeField label="Ghi chú">
            <input
              value={scopeDraft.note}
              onChange={(e) => setScopeDraft((p) => ({ ...p, note: e.target.value }))}
              placeholder="Nhập ghi chú (không bắt buộc)"
              className={scopeControlClass}
            />
          </ScopeField>

          <div className="flex items-start gap-2 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2.5 text-xs text-primary-700">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
            <span>Mỗi phạm vi khám xác định chuyên khoa, khu vực/phòng và dịch vụ bác sĩ được phép khám trong lịch này.</span>
          </div>
        </div>
      </Modal>

      {/* ── Modal tự sinh khung giờ ── */}
      <Modal
        isOpen={autoGenOpen}
        onClose={() => setAutoGenOpen(false)}
        title="Tự sinh khung giờ"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setAutoGenOpen(false)}
              className="h-10 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={runAutoGenerate}
              className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Sinh khung giờ
            </button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Thời gian bắt đầu</label>
            <input
              type="time"
              value={autoGen.start}
              onChange={(e) => setAutoGen((p) => ({ ...p, start: e.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Thời gian kết thúc</label>
            <input
              type="time"
              value={autoGen.end}
              onChange={(e) => setAutoGen((p) => ({ ...p, end: e.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
          <Select
            label="Mỗi khung"
            value={String(autoGen.stepMinutes)}
            onChange={(e) => setAutoGen((p) => ({ ...p, stepMinutes: Number(e.target.value) }))}
            options={[
              { value: "15", label: "15 phút" },
              { value: "20", label: "20 phút" },
              { value: "30", label: "30 phút" },
              { value: "45", label: "45 phút" },
              { value: "60", label: "60 phút" },
            ]}
          />
          <Input
            label="Slot mỗi khung"
            type="number"
            min={1}
            value={autoGen.slotLimit}
            onChange={(e) => setAutoGen((p) => ({ ...p, slotLimit: Number(e.target.value) || 0 }))}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Lưu ý: thao tác này sẽ thay thế toàn bộ khung giờ hiện có. Khung giờ sinh ra mặc định áp dụng cho tất cả phạm vi.
        </p>
      </Modal>
    </div>
  );
}

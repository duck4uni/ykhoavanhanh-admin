import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  doctorWorkSchedulesHooks,
  type CreateDoctorWorkScheduleV2Payload,
  type WorkScheduleTimeSlotV2,
} from "@/api/doctorWorkSchedulesApi";
import { examAreasHooks } from "@/api/examAreasApi";
import { specialtiesHooks } from "@/api/specialtiesApi";
import { roomsHooks } from "@/api/roomsApi";
import { hisServicesHooks } from "@/api/hisServicesApi";
import { doctorsHooks, type HisDoctor } from "@/api/doctorsApi";
import { toast } from "@/components/ui/Toast";
import { useAccumulatedRows } from "./useAccumulatedRows";
import { usePickerState } from "./usePickerState";
import {
  addMinutes,
  createId,
  createInitialForm,
  emptyScopeDraft,
  sortWeekdays,
  toApiTime,
  type AutoGenConfig,
  type ScheduleForm,
  type ScopeRow,
  type TimeSlotRow,
} from "../types";

/** Toàn bộ state + logic cho trang "Thêm lịch khám mới". */
export function useNewScheduleForm() {
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
  const specialtyPicker = usePickerState();
  const { data: specialtyPageData, isFetching: isFetchingSpecialties } = specialtiesHooks.useList({
    currentPage: specialtyPicker.page,
    pageSize: 10,
    filters: specialtyPicker.debouncedSearch.trim() ? `name@=${specialtyPicker.debouncedSearch.trim()}` : undefined,
  });
  const specialties = useAccumulatedRows(
    useMemo(() => specialtyPageData?.rows ?? [], [specialtyPageData]),
    specialtyPicker.page,
    (s) => s.id
  );
  const hasMoreSpecialties = (specialtyPageData?.currentPage ?? specialtyPicker.page) < (specialtyPageData?.totalPages ?? 1);

  // ── Khu vực khám: search + phân trang ──
  const areaPicker = usePickerState();
  const { data: areaPageData, isFetching: isFetchingAreas } = examAreasHooks.useList({
    currentPage: areaPicker.page,
    pageSize: 10,
    filters: areaPicker.debouncedSearch.trim() ? `name@=${areaPicker.debouncedSearch.trim()}` : undefined,
  });
  const examAreas = useAccumulatedRows(
    useMemo(() => areaPageData?.rows ?? [], [areaPageData]),
    areaPicker.page,
    (a) => a.id
  );
  const hasMoreAreas = (areaPageData?.currentPage ?? areaPicker.page) < (areaPageData?.totalPages ?? 1);

  // ── Phòng khám: search + phân trang ──
  const roomPicker = usePickerState();
  const { data: roomPageData, isFetching: isFetchingRooms } = roomsHooks.usePaginatedList({
    currentPage: roomPicker.page,
    pageSize: 10,
    filters: roomPicker.debouncedSearch.trim() ? `room_name@=${roomPicker.debouncedSearch.trim()}` : undefined,
  });
  const rooms = useAccumulatedRows(
    useMemo(() => roomPageData?.rows ?? [], [roomPageData]),
    roomPicker.page,
    (r) => r.id
  );
  const hasMoreRooms = (roomPageData?.currentPage ?? roomPicker.page) < (roomPageData?.totalPages ?? 1);

  // ── Dịch vụ khám: search + phân trang ──
  const servicePicker = usePickerState();
  const { data: servicePageData, isFetching: isFetchingServices } = hisServicesHooks.usePaginatedList({
    currentPage: servicePicker.page,
    pageSize: 10,
    filters: servicePicker.debouncedSearch.trim() ? `service_name@=${servicePicker.debouncedSearch.trim()}` : undefined,
  });
  const services = useAccumulatedRows(
    useMemo(() => servicePageData?.rows ?? [], [servicePageData]),
    servicePicker.page,
    (s) => s.id
  );
  const hasMoreServices = (servicePageData?.currentPage ?? servicePicker.page) < (servicePageData?.totalPages ?? 1);

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
  const [autoGen, setAutoGen] = useState<AutoGenConfig>({ start: "08:00", end: "12:00", stepMinutes: 30, slotLimit: 20 });

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

  return {
    router,
    // form chính
    form,
    setForm,
    scopes,
    timeSlots,
    // đếm tổng danh mục
    specialtyTotal,
    areaTotal,
    serviceTotal,
    // pickers (paginated combobox)
    specialtyPicker: { ...specialtyPicker, rows: specialties, isFetching: isFetchingSpecialties, hasMore: hasMoreSpecialties },
    areaPicker: { ...areaPicker, rows: examAreas, isFetching: isFetchingAreas, hasMore: hasMoreAreas },
    roomPicker: { ...roomPicker, rows: rooms, isFetching: isFetchingRooms, hasMore: hasMoreRooms },
    servicePicker: { ...servicePicker, rows: services, isFetching: isFetchingServices, hasMore: hasMoreServices },
    // doctor combobox
    doctor: {
      search: doctorSearch,
      setSearch: setDoctorSearch,
      list: filteredDoctorList,
      isLoading: isLoadingDoctors || isFetchingDoctors,
      hasMore: hasMoreDoctors,
      loadMore: () => setDoctorPage((current) => current + 1),
      selected: selectedDoctor,
    },
    // lookup labels
    specialtyName,
    areaName,
    roomName,
    serviceName,
    scopeShortLabel,
    rememberLabel,
    // scope modal
    scopeModalOpen,
    setScopeModalOpen,
    editingScopeId,
    scopeDraft,
    setScopeDraft,
    openAddScope,
    openEditScope,
    saveScope,
    removeScope,
    onDraftServiceChange,
    draftRoomOptions,
    draftServiceOptions,
    // time slots
    addSlot,
    updateSlot,
    removeSlot,
    toggleSlotScope,
    toggleSlotWeekday,
    setSlotWeekdays,
    // auto-gen modal
    autoGenOpen,
    setAutoGenOpen,
    autoGen,
    setAutoGen,
    runAutoGenerate,
    // tổng hợp & submit
    totalSlotCount,
    warnings,
    canSubmit,
    isSaving,
    handleSubmit,
  };
}

export type NewScheduleController = ReturnType<typeof useNewScheduleForm>;

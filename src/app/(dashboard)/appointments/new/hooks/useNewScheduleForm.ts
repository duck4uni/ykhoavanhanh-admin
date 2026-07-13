import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  doctorWorkSchedulesHooks,
} from "@/api/doctorWorkSchedulesApi";
import { examAreasHooks, examAreasService } from "@/api/examAreasApi";
import { specialtiesHooks, specialtiesService } from "@/api/specialtiesApi";
import { roomsHooks, roomsService } from "@/api/roomsApi";
import { hisServicesHooks, hisServicesService } from "@/api/hisServicesApi";
import { doctorsHooks, type HisDoctor } from "@/api/doctorsApi";
import { toast } from "@/components/ui/Toast";
import { useAccumulatedRows } from "./useAccumulatedRows";
import { usePickerState } from "./usePickerState";
import {
  addMinutes,
  buildSchedulePayload,
  createId,
  createInitialForm,
  emptyScopeDraft,
  getDatesByWeekday,
  hydrateScheduleEditor,
  isValidDateRange,
  sortWeekdays,
  weekdayOrder,
  type AutoGenConfig,
  type ScheduleForm,
  type ScopeRow,
  type TimeSlotRow,
} from "../types";

export type ScheduleEditorMode = "create" | "edit";

/** Toàn bộ state + logic dùng chung cho trang thêm và chỉnh sửa lịch khám. */
export function useScheduleForm({ mode, scheduleId }: { mode: ScheduleEditorMode; scheduleId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<ScheduleForm>(createInitialForm);
  const [scopes, setScopes] = useState<ScopeRow[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotRow[]>([]);
  const hydratedScheduleId = useRef<string | null>(null);
  const detailQuery = doctorWorkSchedulesHooks.useDetailV2(scheduleId, { enabled: mode === "edit" });

  const dateRangeValid = isValidDateRange(form.start_date, form.end_date);
  const datesByWeekday = useMemo(
    () => getDatesByWeekday(form.start_date, form.end_date),
    [form.start_date, form.end_date]
  );
  const availableWeekdays = useMemo(
    () => weekdayOrder.filter((weekday) => datesByWeekday[weekday].length > 0),
    [datesByWeekday]
  );
  const dateRangeError =
    form.start_date && form.end_date && !dateRangeValid
      ? "Ngày kết thúc phải bằng hoặc sau ngày bắt đầu"
      : undefined;

  // Chỉ loại ngày không còn hợp lệ khi người dùng đã chọn đủ một khoảng ngày hợp lệ.
  useEffect(() => {
    if (!dateRangeValid) return;
    setTimeSlots((current) =>
      current.map((slot) => ({
        ...slot,
        weekdays: slot.weekdays.filter((weekday) => availableWeekdays.includes(weekday)),
      }))
    );
  }, [availableWeekdays, dateRangeValid]);

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
      const next = doctorPage === 1 ? [...current.filter((doctor) => doctor.id === form.doctor_id), ...rows] : [...current, ...rows];
      return Array.from(new Map(next.map((doctor) => [doctor.id, doctor])).values());
    });
  }, [doctorsData, doctorPage, form.doctor_id]);

  useEffect(() => {
    if (mode !== "edit" || !scheduleId || !detailQuery.data || hydratedScheduleId.current === scheduleId) return;
    const hydrated = hydrateScheduleEditor(detailQuery.data);
    setForm(hydrated.form);
    setScopes(hydrated.scopes);
    setTimeSlots(hydrated.timeSlots);
    setLabelCache((current) => ({ ...current, ...hydrated.labels }));
    if (hydrated.doctor) {
      setDoctorList((current) => Array.from(new Map([hydrated.doctor!, ...current].map((doctor) => [doctor.id, doctor])).values()));
    }
    hydratedScheduleId.current = scheduleId;

    const loadMissingLabels = async () => {
      const entries = await Promise.all(
        hydrated.scopes.flatMap((scope) => [
          scope.specialty_id && !hydrated.labels[scope.specialty_id]
            ? specialtiesService.getById(scope.specialty_id).then((item) => [scope.specialty_id, item.name] as const).catch(() => null)
            : null,
          scope.area_id && !hydrated.labels[scope.area_id]
            ? examAreasService.getById(scope.area_id).then((item) => [scope.area_id, item.name] as const).catch(() => null)
            : null,
          scope.room_id && !hydrated.labels[scope.room_id]
            ? roomsService.getById(scope.room_id).then((item) => [scope.room_id, item.roomname] as const).catch(() => null)
            : null,
          scope.service_id && !hydrated.labels[scope.service_id]
            ? hisServicesService.getById(scope.service_id).then((item) => [scope.service_id, item.servicename] as const).catch(() => null)
            : null,
        ].filter((request): request is Promise<readonly [string, string] | null> => request !== null))
      );
      const labels = Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null));
      if (Object.keys(labels).length > 0) setLabelCache((current) => ({ ...current, ...labels }));
    };

    void loadMissingLabels();
  }, [detailQuery.data, mode, scheduleId]);

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
    if (!dateRangeValid || !availableWeekdays.includes(weekday)) return;
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
    const validWeekdays = dateRangeValid
      ? weekdays.filter((weekday) => availableWeekdays.includes(weekday))
      : [];
    setTimeSlots((prev) => prev.map((slot) => (slot.id === slotId ? { ...slot, weekdays: validWeekdays } : slot)));
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
  const selectedWeekdays = useMemo(
    () => sortWeekdays(Array.from(new Set(timeSlots.flatMap((slot) => slot.weekdays)))),
    [timeSlots]
  );
  const selectedConcreteDates = useMemo(
    () => Array.from(new Set(selectedWeekdays.flatMap((weekday) => datesByWeekday[weekday]))).sort(),
    [datesByWeekday, selectedWeekdays]
  );

  // ── Cảnh báo cấu hình ──
  const warnings = useMemo(() => {
    const list: string[] = [];
    if (!form.doctor_id) list.push("Chưa chọn bác sĩ");
    if (!form.start_date) list.push("Chưa chọn ngày bắt đầu");
    if (!form.end_date) list.push("Chưa chọn ngày kết thúc");
    if (form.start_date && form.end_date && !dateRangeValid) list.push("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu");
    if (scopes.length === 0) list.push("Chưa có phạm vi khám");
    if (timeSlots.length === 0) list.push("Chưa có khung giờ làm việc");
    if (timeSlots.some((s) => s.weekdays.length === 0)) list.push("Có khung giờ chưa chọn ngày áp dụng");
    if (timeSlots.some((s) => s.weekdays.some((weekday) => datesByWeekday[weekday].length === 0)))
      list.push("Có khung giờ chứa thứ không thuộc khoảng ngày");
    if (scopes.some((s) => s.fee <= 0)) list.push("Có dịch vụ chưa cấu hình phí khám");
    if (timeSlots.some((s) => s.scopeMode === "custom" && s.scope_ids.length === 0))
      list.push("Có khung giờ chưa chọn phạm vi áp dụng");
    return list;
  }, [dateRangeValid, datesByWeekday, form.doctor_id, form.end_date, form.start_date, scopes, timeSlots]);

  const canSubmit =
    Boolean(form.doctor_id) &&
    Boolean(form.start_date) &&
    Boolean(form.end_date) &&
    dateRangeValid &&
    scopes.length > 0 &&
    timeSlots.length > 0 &&
    !timeSlots.some((s) => s.weekdays.length === 0) &&
    !timeSlots.some((s) => s.weekdays.some((weekday) => datesByWeekday[weekday].length === 0)) &&
    !timeSlots.some((s) => s.scopeMode === "custom" && s.scope_ids.length === 0);

  const createMutation = doctorWorkSchedulesHooks.useCreateV2({
    onSuccess: () => {
      toast.success("Tạo lịch khám thành công");
      router.push("/appointments");
    },
    onError: (err) => toast.error(err.message || "Tạo lịch khám thất bại"),
  });
  const updateMutation = doctorWorkSchedulesHooks.useUpdateV2({
    onSuccess: () => {
      toast.success("Cập nhật lịch khám thành công");
      router.push("/appointments");
    },
    onError: (err) => toast.error(err.message || "Cập nhật lịch khám thất bại"),
  });
  const isSaving = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const knownScopeIds = new Set(scopes.map((scope) => scope.clientId));
    const hasDanglingScope = timeSlots.some((slot) =>
      slot.scopeMode === "custom" && slot.scope_ids.some((id) => !knownScopeIds.has(id))
    );
    if (!canSubmit || hasDanglingScope) {
      toast.error(`Vui lòng hoàn thiện thông tin lịch khám trước khi ${mode === "edit" ? "lưu" : "tạo"}.`);
      return;
    }
    const payload = buildSchedulePayload(form, scopes, timeSlots);
    if (mode === "edit") {
      if (!scheduleId) return;
      await updateMutation.mutateAsync({ id: scheduleId, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  }

  return {
    router,
    mode,
    isDetailLoading: mode === "edit" && detailQuery.isLoading,
    detailError: mode === "edit" ? detailQuery.error : null,
    retryDetail: detailQuery.refetch,
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
    // khoảng ngày
    datesByWeekday,
    availableWeekdays,
    selectedWeekdays,
    selectedConcreteDates,
    dateRangeError,
    dateRangeValid,
    // tổng hợp & submit
    totalSlotCount,
    warnings,
    canSubmit,
    isSaving,
    handleSubmit,
  };
}

export const useNewScheduleForm = () => useScheduleForm({ mode: "create" });

export type ScheduleEditorController = ReturnType<typeof useScheduleForm>;

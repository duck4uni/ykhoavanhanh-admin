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
import type { ApiError } from "@/lib/axios";
import { formatApiViolations } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import { useAccumulatedRows } from "./useAccumulatedRows";
import { usePickerState } from "./usePickerState";
import { buildServiceSearchFilter } from "./serviceSearchFilter";
import { reconcileSelectedDates, toggleSpecificDate, toggleWeekdayDates } from "../slotDateSelection";
import { reconcileDateOverrides, setDateSlotLimit } from "../dateSlotOverrides";
import { isDuplicateScope } from "../scopeIdentity";
import {
  activePriceLevels,
  addMinutes,
  buildSchedulePayload,
  createId,
  createInitialForm,
  defaultServicePrice,
  emptyScopeDraft,
  formatServiceOptionLabel,
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
  const [scopeDraft, setScopeDraft] = useState<Omit<ScopeRow, "clientId">>(emptyScopeDraft);
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
    const validDates = availableWeekdays.flatMap((weekday) => datesByWeekday[weekday]);
    setTimeSlots((current) =>
      current.map((slot) => {
        const dates = reconcileSelectedDates(slot.dates, validDates);
        return {
          ...slot,
          dates,
          date_overrides: reconcileDateOverrides(slot.date_overrides, dates, slot.slot_limit),
          weekdays: slot.weekdays.filter(
            (weekday) => availableWeekdays.includes(weekday) && datesByWeekday[weekday].some((date) => dates.includes(date))
          ),
        };
      })
    );
  }, [availableWeekdays, dateRangeValid, datesByWeekday]);

  // ── Danh mục cho thẻ đếm năng lực (đếm tổng, chỉ cần count) ──
  const { data: specialtyCountData } = specialtiesHooks.useList({ currentPage: 1, pageSize: 1 });
  const { data: areaCountData } = examAreasHooks.useList({ currentPage: 1, pageSize: 1 });
  const { data: serviceCountData } = hisServicesHooks.usePaginatedList({ currentPage: 1, pageSize: 1 });
  const specialtyTotal = specialtyCountData?.count ?? 0;
  const areaTotal = areaCountData?.count ?? 0;
  const serviceTotal = serviceCountData?.count ?? 0;

  // ── Chuyên khoa: search + phân trang, lọc theo khu vực đã chọn (nếu có) ──
  const specialtyPicker = usePickerState();
  const { data: specialtyPageData, isFetching: isFetchingSpecialties } = specialtiesHooks.useList({
    currentPage: specialtyPicker.page,
    pageSize: 10,
    filters: specialtyPicker.debouncedSearch.trim()
      ? `name@=${specialtyPicker.debouncedSearch.trim()},is_active==true`
      : "is_active==true",
    ...(scopeDraft.area_id ? { exam_area_id: scopeDraft.area_id } : {}),
  } as Record<string, unknown>);
  // Về trang 1 khi khu vực áp dụng cho bộ lọc chuyên khoa thay đổi.
  useEffect(() => {
    specialtyPicker.setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeDraft.area_id]);
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
    filters: areaPicker.debouncedSearch.trim()
      ? `name@=${areaPicker.debouncedSearch.trim()},status==ACTIVE`
      : "status==ACTIVE",
  });
  const examAreas = useAccumulatedRows(
    useMemo(() => areaPageData?.rows ?? [], [areaPageData]),
    areaPicker.page,
    (a) => a.id
  );
  const hasMoreAreas = (areaPageData?.currentPage ?? areaPicker.page) < (areaPageData?.totalPages ?? 1);

  // ── Phòng khám: search + phân trang, lọc theo khu vực đã chọn (server) ──
  const roomPicker = usePickerState();
  const { data: roomPageData, isFetching: isFetchingRooms } = roomsHooks.usePaginatedList({
    currentPage: roomPicker.page,
    pageSize: 10,
    filters: [
      roomPicker.debouncedSearch.trim() ? `room_name@=${roomPicker.debouncedSearch.trim()}` : "",
      "status==ACTIVE",
      scopeDraft.area_id ? `exam_area_id==${scopeDraft.area_id}` : "",
    ]
      .filter(Boolean)
      .join(","),
  });
  const roomsFetched = useAccumulatedRows(
    useMemo(() => roomPageData?.rows ?? [], [roomPageData]),
    roomPicker.page,
    (r) => r.id
  );
  // API rooms không hỗ trợ filter theo chuyên khoa (his_room_specialties là bảng nối, không lọc
  // được ở server) — lọc bổ sung phía client theo chuyên khoa đã chọn, dựa vào quan hệ đã include sẵn.
  const rooms = useMemo(() => {
    if (!scopeDraft.specialty_id) return roomsFetched;
    return roomsFetched.filter((r) =>
      (r.his_room_specialties ?? []).some((rel) => rel.specialty_id === scopeDraft.specialty_id)
    );
  }, [roomsFetched, scopeDraft.specialty_id]);
  const hasMoreRooms = (roomPageData?.currentPage ?? roomPicker.page) < (roomPageData?.totalPages ?? 1);
  // Về trang 1 khi khu vực áp dụng cho bộ lọc phòng thay đổi.
  useEffect(() => {
    roomPicker.setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeDraft.area_id]);

  // ── Dịch vụ khám: search + phân trang ──
  // Dịch vụ khám không ràng theo chuyên khoa/khu vực — một dịch vụ (kèm giá) dùng chung
  // cho mọi chuyên khoa, phòng khám và khu khám, nên KHÔNG lọc theo specialty_id.
  const servicePicker = usePickerState();
  const { data: servicePageData, isFetching: isFetchingServices } = hisServicesHooks.usePaginatedList({
    currentPage: servicePicker.page,
    pageSize: 10,
    filters: [
      buildServiceSearchFilter(servicePicker.debouncedSearch),
      "status==ACTIVE",
    ]
      .filter(Boolean)
      .join(","),
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

  // ── Doctor combobox: search + phân trang, lọc qua API (không lọc mảng phía client) ──
  const doctorPicker = usePickerState();
  const [doctorList, setDoctorList] = useState<HisDoctor[]>([]);
  const doctorKeyword = doctorPicker.debouncedSearch.trim();
  // Mã bác sĩ (doctor_id) thường toàn chữ số → từ khóa toàn số thì lọc theo mã,
  // ngược lại lọc theo tên (giống cách lọc dịch vụ khám theo service_id/service_name).
  const doctorFilters = doctorKeyword
    ? /^\d+$/.test(doctorKeyword)
      ? `doctor_id@=${doctorKeyword}`
      : `doctor_name@=${doctorKeyword}`
    : undefined;
  const { data: doctorsData, isLoading: isLoadingDoctors, isFetching: isFetchingDoctors } = doctorsHooks.usePaginatedList({
    currentPage: doctorPicker.page,
    pageSize: 10,
    filters: doctorFilters,
  });

  useEffect(() => {
    const rows = doctorsData?.rows ?? [];
    setDoctorList((current) => {
      const next = doctorPicker.page === 1 ? [...current.filter((doctor) => doctor.id === form.doctor_id), ...rows] : [...current, ...rows];
      return Array.from(new Map(next.map((doctor) => [doctor.id, doctor])).values());
    });
  }, [doctorsData, doctorPicker.page, form.doctor_id]);

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

  const hasMoreDoctors = (doctorsData?.currentPage ?? doctorPicker.page) < (doctorsData?.totalPages ?? 1);
  const selectedDoctor = doctorList.find((d) => d.id === form.doctor_id);

  // ── Lookup maps ──
  const specialtyName = (id: string) => specialties.find((s) => s.id === id)?.name ?? labelCache[id] ?? "—";
  const areaName = (id: string) => examAreas.find((a) => a.id === id)?.name ?? labelCache[id] ?? "—";
  const roomName = (id: string) => rooms.find((r) => r.id === id)?.roomname ?? labelCache[id] ?? "";
  const serviceName = (id: string) => services.find((s) => s.id === id)?.servicename ?? labelCache[id] ?? "—";
  const serviceOptionLabel = (id: string) => {
    const service = services.find((s) => s.id === id);
    return service ? formatServiceOptionLabel(service) : serviceName(id);
  };
  const servicePriceLevelLabel = (serviceId: string, priceLevelCode: string) => {
    const service = services.find((item) => item.id === serviceId);
    return activePriceLevels(service ?? { price_levels: [] }).find((level) => level.code === priceLevelCode)?.label
      ?? priceLevelCode;
  };
  const scopeShortLabel = (scope: ScopeRow) =>
    `${specialtyName(scope.specialty_id)} - ${serviceName(scope.service_id)}${scope.price_level_code ? ` (${servicePriceLevelLabel(scope.service_id, scope.price_level_code)})` : ""}`;

  // ── Modal state: scope ──
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [editingScopeId, setEditingScopeId] = useState<string | null>(null);

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
    // Chặn trùng tổ hợp chuyên khoa + khu vực + phòng + dịch vụ + loại/mức giá.
    const isDuplicate = isDuplicateScope(scopes, { ...scopeDraft, clientId: "" }, editingScopeId);
    if (isDuplicate) {
      toast.error("Phạm vi khám này đã tồn tại (trùng chuyên khoa, khu vực/phòng, dịch vụ và loại giá).");
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

  // Auto set fee mặc định theo dịch vụ khi đổi dịch vụ trong modal (dùng mức giá mặc định
  // của dịch vụ). Chuyên khoa/khu vực chỉ gợi ý khi dịch vụ có khai — dịch vụ không khai
  // vẫn chọn được cho mọi chuyên khoa/khu vực.
  function onDraftServiceChange(serviceId: string) {
    const svc = services.find((s) => s.id === serviceId);
    const [defaultLevel] = svc ? activePriceLevels(svc) : [];
    const price = defaultLevel?.price ?? (svc ? defaultServicePrice(svc) : 0);
    setScopeDraft((prev) => ({
      ...prev,
      service_id: serviceId,
      price_level_code: defaultLevel?.code ?? "",
      fee: price,
      specialty_id: prev.specialty_id || svc?.specialty_id || "",
      area_id: prev.area_id || svc?.exam_area_id || "",
    }));
  }

  // Đổi mức giá (theo loại BH) của dịch vụ đang chọn trong modal phạm vi.
  function onDraftPriceLevelChange(priceLevelCode: string) {
    setScopeDraft((prev) => {
      const service = services.find((item) => item.id === prev.service_id);
      const level = service ? activePriceLevels(service).find((item) => item.code === priceLevelCode) : undefined;
      return { ...prev, price_level_code: priceLevelCode, fee: level?.price ?? prev.fee };
    });
  }

  // Chọn thẳng một dòng dịch vụ + mức giá cụ thể (mỗi loại bảo hiểm là một dòng riêng trong dropdown).
  function onDraftServiceOptionChange(serviceId: string, priceLevelCode: string, price: number) {
    const svc = services.find((s) => s.id === serviceId);
    setScopeDraft((prev) => ({
      ...prev,
      service_id: serviceId,
      price_level_code: priceLevelCode,
      fee: price,
      specialty_id: prev.specialty_id || svc?.specialty_id || "",
      area_id: prev.area_id || svc?.exam_area_id || "",
    }));
  }

  // Phòng đã được lọc theo khu vực (server) + chuyên khoa (client, xem roomPicker phía trên).
  const draftRoomOptions = rooms;

  // Danh sách dịch vụ đầy đủ (không lọc theo chuyên khoa/khu vực — xem servicePicker phía trên).
  const draftServiceOptions = services;

  // ── Time slots ──
  function addSlot() {
    setTimeSlots((prev) => {
      const start = prev[prev.length - 1]?.end ?? "08:00";
      return [
        ...prev,
        { id: createId(), start, end: addMinutes(start, 30), slot_limit: 20, weekdays: [], dates: [], date_overrides: [], scopeMode: "all", scope_ids: [] },
      ];
    });
  }

  function updateSlot(id: string, patch: Partial<TimeSlotRow>) {
    setTimeSlots((prev) => prev.map((slot) => {
      if (slot.id !== id) return slot;
      const next = { ...slot, ...patch };
      return {
        ...next,
        date_overrides: reconcileDateOverrides(next.date_overrides, next.dates, next.slot_limit),
      };
    }));
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
        const dates = toggleWeekdayDates(slot.dates, datesByWeekday[weekday], !exists);
        return {
          ...slot,
          weekdays: exists
            ? slot.weekdays.filter((day) => day !== weekday)
            : sortWeekdays([...slot.weekdays, weekday]),
          dates,
          date_overrides: reconcileDateOverrides(slot.date_overrides, dates, slot.slot_limit),
        };
      })
    );
  }

  function setSlotWeekdays(slotId: string, weekdays: number[]) {
    const validWeekdays = dateRangeValid
      ? weekdays.filter((weekday) => availableWeekdays.includes(weekday))
      : [];
    setTimeSlots((prev) => prev.map((slot) => {
      if (slot.id !== slotId) return slot;
      let dates = slot.dates;
      availableWeekdays.forEach((weekday) => {
        const wasSelected = slot.weekdays.includes(weekday);
        const shouldSelect = validWeekdays.includes(weekday);
        if (wasSelected !== shouldSelect) dates = toggleWeekdayDates(dates, datesByWeekday[weekday], shouldSelect);
      });
      return {
        ...slot,
        weekdays: sortWeekdays(validWeekdays),
        dates,
        date_overrides: reconcileDateOverrides(slot.date_overrides, dates, slot.slot_limit),
      };
    }));
  }

  function toggleSlotDate(slotId: string, weekday: number, date: string) {
    setTimeSlots((prev) => prev.map((slot) => {
      if (slot.id !== slotId) return slot;
      const dates = toggleSpecificDate(slot.dates, date);
      const hasWeekdayDates = datesByWeekday[weekday].some((item) => dates.includes(item));
      return {
        ...slot,
        dates,
        date_overrides: reconcileDateOverrides(slot.date_overrides, dates, slot.slot_limit),
        weekdays: hasWeekdayDates
          ? sortWeekdays(Array.from(new Set([...slot.weekdays, weekday])))
          : slot.weekdays.filter((item) => item !== weekday),
      };
    }));
  }

  function setSlotDateLimit(slotId: string, date: string, limit: number) {
    if (!Number.isInteger(limit) || limit <= 0) return;
    setTimeSlots((prev) => prev.map((slot) => slot.id === slotId
      ? { ...slot, date_overrides: setDateSlotLimit(slot.date_overrides, date, limit, slot.slot_limit) }
      : slot));
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
        dates: [],
        date_overrides: [],
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
    () => Array.from(new Set(timeSlots.flatMap((slot) => slot.dates))).sort(),
    [timeSlots]
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
    if (timeSlots.some((s) => s.dates.length === 0)) list.push("Có khung giờ chưa chọn ngày cụ thể");
    if (timeSlots.some((s) => s.weekdays.some((weekday) => datesByWeekday[weekday].length === 0)))
      list.push("Có khung giờ chứa thứ không thuộc khoảng ngày");
    if (scopes.some((s) => s.fee <= 0)) list.push("Có dịch vụ chưa cấu hình phí khám");
    if (timeSlots.some((s) => s.scopeMode === "custom" && s.scope_ids.length === 0))
      list.push("Có khung giờ chưa chọn phạm vi áp dụng");
    if (timeSlots.some((s) => s.start && s.end && s.start >= s.end))
      list.push("Có khung giờ có giờ bắt đầu không nhỏ hơn giờ kết thúc");
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
    !timeSlots.some((s) => s.dates.length === 0) &&
    !timeSlots.some((s) => s.weekdays.some((weekday) => datesByWeekday[weekday].length === 0)) &&
    !timeSlots.some((s) => s.scopeMode === "custom" && s.scope_ids.length === 0) &&
    !timeSlots.some((s) => s.start && s.end && s.start >= s.end);

  const createMutation = doctorWorkSchedulesHooks.useCreateV2({
    onSuccess: () => {
      toast.success("Tạo lịch khám thành công");
      router.push("/appointments");
    },
    onError: (err) => toast.error(err.message || "Tạo lịch khám thất bại", {
      description: formatApiViolations((err as ApiError).violations),
    }),
  });
  const updateMutation = doctorWorkSchedulesHooks.useUpdateV2({
    onSuccess: () => {
      toast.success("Cập nhật lịch khám thành công");
      router.push("/appointments");
    },
    onError: (err) => toast.error(err.message || "Cập nhật lịch khám thất bại", {
      description: formatApiViolations((err as ApiError).violations),
    }),
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
      search: doctorPicker.search,
      setSearch: doctorPicker.setSearch,
      list: doctorList,
      isLoading: isLoadingDoctors || isFetchingDoctors,
      hasMore: hasMoreDoctors,
      loadMore: doctorPicker.loadMore,
      selected: selectedDoctor,
    },
    // lookup labels
    specialtyName,
    areaName,
    roomName,
    serviceName,
    serviceOptionLabel,
    servicePriceLevelLabel,
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
    onDraftPriceLevelChange,
    onDraftServiceOptionChange,
    draftRoomOptions,
    draftServiceOptions,
    // time slots
    addSlot,
    updateSlot,
    removeSlot,
    toggleSlotScope,
    toggleSlotWeekday,
    toggleSlotDate,
    setSlotDateLimit,
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

// Types & helpers cho editor lịch khám (doctor work schedule V2).

import type {
  CreateDoctorWorkScheduleV2Payload,
  DoctorWorkScheduleV2,
} from "@/api/doctorWorkSchedulesApi";
import type { HisDoctor } from "@/api/doctorsApi";
import type { HisService } from "@/api/hisServicesApi";
import type { DateSlotOverride } from "./dateSlotOverrides";

export type ScheduleForm = {
  doctor_id: string;
  start_date: string;
  end_date: string;
  status: "ACTIVE" | "INACTIVE";
  note: string;
};

export type ScopeRow = {
  clientId: string;
  persistedId?: string;
  specialty_id: string;
  area_id: string;
  room_id: string;
  service_id: string;
  price_level_code: string;
  fee: number;
  status: "ACTIVE" | "INACTIVE";
  note: string;
};

export type TimeSlotRow = {
  id: string;
  start: string;
  end: string;
  slot_limit: number;
  weekdays: number[];
  dates: string[];
  date_overrides: DateSlotOverride[];
  scopeMode: "all" | "custom";
  scope_ids: string[];
};

export type PickerOption = { value: string; label: string };

export type AutoGenConfig = {
  start: string;
  end: string;
  stepMinutes: number;
  slotLimit: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const createInitialForm = (): ScheduleForm => ({
  doctor_id: "",
  start_date: "",
  end_date: "",
  status: "ACTIVE",
  note: "",
});

export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, h || 0, m || 0);
  date.setMinutes(date.getMinutes() + minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function toApiTime(time: string): string {
  return time.length === 5 ? `${time}` : time.slice(0, 5);
}

export function todayISO(): string {
  const now = new Date();
  return formatLocalISODate(now);
}

/** Parse YYYY-MM-DD theo múi giờ local, tránh lệch ngày do UTC. */
export function parseLocalISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function formatLocalISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isValidDateRange(startDate: string, endDate: string): boolean {
  const start = parseLocalISODate(startDate);
  const end = parseLocalISODate(endDate);
  return Boolean(start && end && end.getTime() >= start.getTime());
}

export function getDatesByWeekday(startDate: string, endDate: string): Record<number, string[]> {
  const result: Record<number, string[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  const start = parseLocalISODate(startDate);
  const end = parseLocalISODate(endDate);
  if (!start || !end || end.getTime() < start.getTime()) return result;

  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    result[cursor.getDay()].push(formatLocalISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export function formatShortLocalDate(value: string, includeYear = false): string {
  const date = parseLocalISODate(value);
  if (!date) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return includeYear ? `${day}/${month}/${date.getFullYear()}` : `${day}/${month}`;
}

export function formatFee(value: number): string {
  return `${value.toLocaleString("vi-VN")}đ`;
}

/** Danh sách mức giá còn hoạt động của dịch vụ, mức mặc định (is_default) đứng trước. */
export function activePriceLevels(
  service: Pick<HisService, "price_levels">
): HisService["price_levels"] {
  return [...(service.price_levels ?? [])]
    .filter((level) => level.status !== "INACTIVE")
    .sort((a, b) => Number(b.is_default) - Number(a.is_default));
}

/** Giá mặc định của dịch vụ: mức is_default, mức active đầu tiên, hoặc price gốc. */
export function defaultServicePrice(
  service: Pick<HisService, "price" | "price_levels">
): number {
  const [firstLevel] = activePriceLevels(service);
  if (firstLevel) return firstLevel.price;
  const price = Number(service.price);
  return Number.isFinite(price) ? price : 0;
}

/** Danh sách loại bảo hiểm còn hoạt động của dịch vụ, hiển thị dạng "BHYT, Khám thường". */
export function formatInsuranceTypesLabel(
  service: Pick<HisService, "insurancetype" | "price_levels">
): string {
  const levels = activePriceLevels(service);
  if (levels.length > 0) return levels.map((level) => level.label).join(", ");
  return service.insurancetype && service.insurancetype !== "—"
    ? service.insurancetype.split("/").join(", ")
    : "";
}

/** Nhãn hiển thị dịch vụ khám trong dropdown: tên - loại bảo hiểm - giá mặc định - mã dịch vụ. */
export function formatServiceOptionLabel(
  service: Pick<HisService, "servicename" | "insurancetype" | "price" | "serviceid" | "price_levels">
): string {
  const insuranceLabel = formatInsuranceTypesLabel(service);
  const parts = [
    service.servicename || "—",
    ...(insuranceLabel ? [insuranceLabel] : []),
    formatFee(defaultServicePrice(service)),
    service.serviceid,
  ];
  return parts.join(" - ");
}

export const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];

export function sortWeekdays(weekdays: number[]): number[] {
  return [...weekdays].sort((a, b) => weekdayOrder.indexOf(a) - weekdayOrder.indexOf(b));
}

export function weekdayShortLabel(weekday: number): string {
  return weekday === 0 ? "CN" : `T${weekday + 1}`;
}

export const emptyScopeDraft = (): Omit<ScopeRow, "clientId"> => ({
  specialty_id: "",
  area_id: "",
  room_id: "",
  service_id: "",
  price_level_code: "",
  fee: 0,
  status: "ACTIVE",
  note: "",
});

export const scopeControlClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10";

const normalizeTime = (value: string) => value.slice(0, 5);
const cleanOptional = (value?: string | null) => value?.trim() || "";

export type HydratedScheduleEditor = {
  form: ScheduleForm;
  scopes: ScopeRow[];
  timeSlots: TimeSlotRow[];
  doctor?: HisDoctor;
  labels: Record<string, string>;
};

/** Chuyển detail V2 về state UI, gồm mapping persisted scope id -> client id. */
export function hydrateScheduleEditor(schedule: DoctorWorkScheduleV2): HydratedScheduleEditor {
  const scopes: ScopeRow[] = schedule.scopes.map((scope) => ({
    clientId: cleanOptional(scope.client_id) || createId(),
    persistedId: scope.id,
    specialty_id: cleanOptional(scope.specialty_id),
    area_id: cleanOptional(scope.area_id),
    room_id: cleanOptional(scope.room_id),
    service_id: cleanOptional(scope.service_id),
    price_level_code: cleanOptional(scope.price_level_code),
    fee: Number(scope.fee) || 0,
    status: scope.status ?? "ACTIVE",
    note: scope.note ?? "",
  }));
  const scopeReferenceMap = new Map<string, string>();
  scopes.forEach((scope) => {
    if (scope.persistedId) scopeReferenceMap.set(scope.persistedId, scope.clientId);
    scopeReferenceMap.set(scope.clientId, scope.clientId);
  });
  const allScopeIds = new Set(scopes.map((scope) => scope.clientId));
  const grouped = new Map<string, TimeSlotRow>();
  const scheduleDatesByWeekday = getDatesByWeekday(schedule.start_date, schedule.end_date);

  schedule.time_slots.forEach((slot) => {
    const mappedScopeIds = slot.scope_ids === "all"
      ? scopes.map((scope) => scope.clientId)
      : Array.from(new Set(slot.scope_ids.map((id) => scopeReferenceMap.get(id)).filter((id): id is string => Boolean(id))));
    const coversAll = allScopeIds.size > 0 && mappedScopeIds.length === allScopeIds.size && mappedScopeIds.every((id) => allScopeIds.has(id));
    const scopeMode: TimeSlotRow["scopeMode"] = slot.scope_ids === "all" || coversAll ? "all" : "custom";
    const scopeIds = scopeMode === "all" ? [] : mappedScopeIds;
    const slotDates = Array.isArray(slot.dates) ? slot.dates : scheduleDatesByWeekday[slot.weekday];
    const slotOverrides: DateSlotOverride[] = Array.isArray(slot.date_overrides)
      ? slot.date_overrides.map((override) => {
          let mappedOverrideScopeIds: "all" | string[] | undefined = undefined;
          if (override.scope_ids === "all") {
            mappedOverrideScopeIds = "all";
          } else if (Array.isArray(override.scope_ids)) {
            mappedOverrideScopeIds = Array.from(new Set(
              override.scope_ids.map((id) => scopeReferenceMap.get(id)).filter((id): id is string => Boolean(id))
            ));
          }
          return {
            date: override.date,
            ...(override.slot_limit !== undefined ? { slot_limit: override.slot_limit } : {}),
            ...(mappedOverrideScopeIds !== undefined ? { scope_ids: mappedOverrideScopeIds } : {}),
          };
        })
      : [];
    const key = [normalizeTime(slot.start_time), normalizeTime(slot.end_time), slot.slot_limit, scopeMode, ...[...scopeIds].sort()].join("|");
    const existing = grouped.get(key);
    if (existing) {
      existing.weekdays = sortWeekdays(Array.from(new Set([...existing.weekdays, slot.weekday])));
      existing.dates = Array.from(new Set([...existing.dates, ...slotDates])).sort();
      existing.date_overrides = [...existing.date_overrides, ...slotOverrides]
        .filter((override, overrideIndex, overrides) => overrides.findIndex((item) => item.date === override.date) === overrideIndex)
        .sort((a, b) => a.date.localeCompare(b.date));
    } else {
      grouped.set(key, {
        id: createId(),
        start: normalizeTime(slot.start_time),
        end: normalizeTime(slot.end_time),
        slot_limit: slot.slot_limit,
        weekdays: sortWeekdays([slot.weekday]),
        dates: Array.from(new Set(slotDates)).sort(),
        date_overrides: [...slotOverrides].sort((a, b) => a.date.localeCompare(b.date)),
        scopeMode,
        scope_ids: scopeIds,
      });
    }
  });

  const labels: Record<string, string> = {};
  schedule.scopes.forEach((scope) => {
    if (scope.specialty_id && scope.specialty?.name) labels[scope.specialty_id] = scope.specialty.name;
    const area = scope.area ?? scope.exam_area;
    if (scope.area_id && area?.name) labels[scope.area_id] = area.name;
    const roomName = scope.room?.roomname ?? scope.room?.room_name;
    if (scope.room_id && roomName) labels[scope.room_id] = roomName;
    const serviceName = scope.service?.servicename ?? scope.service?.service_name;
    if (scope.service_id && serviceName) labels[scope.service_id] = serviceName;
  });

  const doctor = schedule.doctor
    ? {
        id: schedule.doctor.id || schedule.doctor_id,
        doctorid: schedule.doctor.doctor_id,
        doctorname: schedule.doctor.doctor_name,
        description: null,
        updatetime: "",
      }
    : undefined;

  return {
    form: {
      doctor_id: schedule.doctor_id,
      start_date: schedule.start_date,
      end_date: schedule.end_date,
      status: schedule.status,
      note: schedule.note ?? "",
    },
    scopes,
    timeSlots: Array.from(grouped.values()),
    doctor,
    labels,
  };
}

/** Serializer duy nhất cho create/update; không phát optional ID key rỗng. */
export function buildSchedulePayload(
  form: ScheduleForm,
  scopes: ScopeRow[],
  timeSlots: TimeSlotRow[]
): CreateDoctorWorkScheduleV2Payload {
  const scopeClientIds = new Set(scopes.map((scope) => scope.clientId));
  const selectedWeekdays = sortWeekdays(Array.from(new Set(timeSlots.flatMap((slot) => slot.weekdays))));
  return {
    doctor_id: form.doctor_id,
    start_date: form.start_date,
    end_date: form.end_date,
    weekdays: selectedWeekdays,
    status: form.status,
    ...(form.note.trim() ? { note: form.note.trim() } : {}),
    scopes: scopes.map((scope) => ({
      ...(cleanOptional(scope.clientId) ? { client_id: scope.clientId.trim() } : {}),
      ...(cleanOptional(scope.specialty_id) ? { specialty_id: scope.specialty_id.trim() } : {}),
      ...(cleanOptional(scope.area_id) ? { area_id: scope.area_id.trim() } : {}),
      ...(cleanOptional(scope.room_id) ? { room_id: scope.room_id.trim() } : {}),
      ...(cleanOptional(scope.service_id) ? { service_id: scope.service_id.trim() } : {}),
      ...(cleanOptional(scope.price_level_code) ? { price_level_code: scope.price_level_code.trim() } : {}),
      fee: scope.fee,
      status: scope.status,
      ...(scope.note.trim() ? { note: scope.note.trim() } : {}),
    })),
    time_slots: timeSlots.flatMap((slot) => {
      const customIds = slot.scope_ids.filter((id) => scopeClientIds.has(id));
      return slot.weekdays.map((weekday) => {
        const dateOverrides = slot.date_overrides
          .filter((override) => slot.dates.includes(override.date) && parseLocalISODate(override.date)?.getDay() === weekday)
          .map((override) => {
            let sanitizedScopeIds: "all" | string[] | undefined = undefined;
            if (override.scope_ids === "all") {
              sanitizedScopeIds = "all";
            } else if (Array.isArray(override.scope_ids)) {
              sanitizedScopeIds = override.scope_ids.filter((id) => scopeClientIds.has(id));
            }
            return {
              date: override.date,
              ...(override.slot_limit !== undefined ? { slot_limit: override.slot_limit } : {}),
              ...(sanitizedScopeIds !== undefined ? { scope_ids: sanitizedScopeIds } : {}),
            };
          })
          .filter((override) => override.slot_limit !== undefined || override.scope_ids !== undefined);

        return {
          start_time: toApiTime(slot.start),
          end_time: toApiTime(slot.end),
          slot_limit: slot.slot_limit,
          weekday,
          dates: slot.dates.filter((date) => parseLocalISODate(date)?.getDay() === weekday),
          ...(dateOverrides.length > 0 ? { date_overrides: dateOverrides } : {}),
          scope_ids: slot.scopeMode === "all" ? ("all" as const) : customIds,
        };
      });
    }),
  };
}

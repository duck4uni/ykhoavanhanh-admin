// Types & helpers cho trang "Thêm lịch khám mới" (doctor work schedule V2).

export type ScheduleForm = {
  doctor_id: string;
  schedule_date: string;
  status: "ACTIVE" | "INACTIVE";
  note: string;
};

export type ScopeRow = {
  clientId: string;
  specialty_id: string;
  area_id: string;
  room_id: string;
  service_id: string;
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
  schedule_date: "",
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
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function formatFee(value: number): string {
  return `${value.toLocaleString("vi-VN")}đ`;
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
  fee: 0,
  status: "ACTIVE",
  note: "",
});

export const scopeControlClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10";

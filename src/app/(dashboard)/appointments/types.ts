import type { DoctorWorkSchedule } from "@/api/doctorWorkSchedulesApi";

export type AppointmentStatus =
  | "pending"     // Chờ xác nhận
  | "confirmed"   // Đã xác nhận
  | "completed"   // Đã khám
  | "cancelled"   // Đã hủy
  | "no_show";    // Vắng mặt

export interface Appointment {
  id: string;
  code: string; // Mã lịch hẹn
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  specialtyId: string;
  specialtyName: string;
  appointmentDate: string; // ISO date
  appointmentTime: string; // HH:mm
  status: AppointmentStatus;
  note?: string;
  isForSelf: boolean; // Đặt cho bản thân hay người thân
  familyMemberId?: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentSlot {
  id: string;
  doctorId: string;
  date: string;
  time: string;
  isAvailable: boolean;
  maxPatients: number;
  currentPatients: number;
}

export const APPOINTMENT_PAGE_SIZE = 10;

export const SHIFT_LABEL: Record<string, string> = {
  MORNING: "Sáng",
  AFTERNOON: "Chiều",
  EVENING: "Tối",
  NIGHT: "Đêm",
};

function normalizeTime(time?: string): string {
  return time?.slice(0, 5) || "";
}

function getSlotStart(slot: DoctorWorkSchedule["time_slots"][number]): string {
  return normalizeTime(slot.start_time ?? slot.start);
}

function getSlotEnd(slot: DoctorWorkSchedule["time_slots"][number]): string {
  return normalizeTime(slot.end_time ?? slot.end);
}

function formatIsoDate(value?: string): string {
  if (!value) return "";
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

const WEEKDAY_LABEL = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

function getWeekdayText(value?: string): string {
  if (!value) return "";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "" : WEEKDAY_LABEL[date.getDay()];
}

export function getScheduleDateText(item: DoctorWorkSchedule): string {
  if (item.schedule_date) return formatIsoDate(item.schedule_date);
  const start = formatIsoDate(item.start_date);
  const end = formatIsoDate(item.end_date);
  if (!start && !end) return "—";
  return !end || start === end ? start || end : `${start || "—"} - ${end}`;
}

/**
 * Trả về tên thứ (Thứ 2, Thứ 3, ...) cho ngày khám.
 * Nếu là khoảng ngày (start_date khác end_date) thì lấy thứ của ngày bắt đầu.
 */
export function getScheduleWeekdayText(item: DoctorWorkSchedule): string {
  return getWeekdayText(item.schedule_date || item.start_date);
}

export function getScheduleTimeText(item: DoctorWorkSchedule): string {
  const slots = item.time_slots ?? [];
  if (!slots.length) {
    const start = normalizeTime(item.start_time);
    const end = normalizeTime(item.end_time);
    return start || end ? `${start || "—"} - ${end || "—"}` : "—";
  }
  const starts = slots.map(getSlotStart).filter(Boolean).sort();
  const ends = slots.map(getSlotEnd).filter(Boolean).sort();
  const range = `${starts[0] || "—"} - ${ends.at(-1) || "—"}`;
  return slots.length === 1 ? range : `${range} (${slots.length} khung)`;
}

export function getScheduleCapacity(item: DoctorWorkSchedule): number {
  if ((item.max_appointments ?? 0) > 0) return item.max_appointments ?? 0;
  return (item.time_slots ?? []).reduce(
    (total, slot) => total + (slot.slot_limit ?? slot.max_appointments ?? 0),
    0,
  );
}

export function getScheduleShiftCode(item: DoctorWorkSchedule): string {
  if (item.shift_code) return item.shift_code;
  const firstStart = (item.time_slots ?? []).map(getSlotStart).filter(Boolean).sort()[0];
  if (!firstStart) return "";
  const hour = Number(firstStart.slice(0, 2));
  if (hour < 6) return "NIGHT";
  if (hour < 12) return "MORNING";
  if (hour < 18) return "AFTERNOON";
  if (hour < 22) return "EVENING";
  return "NIGHT";
}

/** Phòng khám nằm ở scope (v2, nhiều phòng) hoặc field room_id cấp lịch (legacy). */
export function scheduleIncludesRoom(item: DoctorWorkSchedule, roomId: string): boolean {
  if (!roomId) return true;
  if (item.room_id === roomId) return true;
  return (item.scopes ?? []).some((scope) => scope.room_id === roomId);
}

export function scheduleIncludesDate(item: DoctorWorkSchedule, date: string): boolean {
  if (!date) return true;
  if (item.schedule_date) return item.schedule_date.slice(0, 10) === date;
  if (!item.start_date || !item.end_date || date < item.start_date.slice(0, 10) || date > item.end_date.slice(0, 10)) {
    return false;
  }
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const weekdays = item.weekdays?.length
    ? item.weekdays
    : (item.time_slots ?? []).map((slot) => slot.weekday).filter((value): value is number => value !== undefined);
  return weekdays.length === 0 || weekdays.includes(weekday);
}

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

export function getScheduleTimeText(item: DoctorWorkSchedule): string {
  const slots = item.time_slots ?? [];
  if (!slots.length) {
    const start = normalizeTime(item.start_time);
    const end = normalizeTime(item.end_time);
    return start || end ? `${start || "—"} - ${end || "—"}` : "—";
  }
  const first = slots[0];
  const last = slots[slots.length - 1];
  const range = `${normalizeTime(first.start) || "—"} - ${normalizeTime(last.end) || "—"}`;
  return slots.length === 1 ? range : `${range} (${slots.length} khung)`;
}

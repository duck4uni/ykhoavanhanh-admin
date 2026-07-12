import type { CreateDoctorWorkSchedulePayload, DoctorWorkSchedule } from "@/api/doctorWorkSchedulesApi";

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

export type WorkTimeSlot = {
  id: string;
  start: string;
  end: string;
  max_appointments: number;
};

export type ScheduleFormValues = {
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

export function createInitialScheduleForm(): ScheduleFormValues {
  return {
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
  };
}

export const createSlotId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function createDefaultSlots(): WorkTimeSlot[] {
  return [
    { id: createSlotId(), start: "08:00", end: "09:00", max_appointments: 20 },
    { id: createSlotId(), start: "09:00", end: "10:00", max_appointments: 20 },
    { id: createSlotId(), start: "10:00", end: "11:00", max_appointments: 20 },
    { id: createSlotId(), start: "11:00", end: "12:00", max_appointments: 20 },
  ];
}

export function createSlotFromForm(form: ScheduleFormValues): WorkTimeSlot {
  return { id: createSlotId(), start: form.start_time, end: form.end_time, max_appointments: form.max_appointments };
}

export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, h || 0, m || 0);
  date.setMinutes(date.getMinutes() + minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function normalizeTime(time?: string): string {
  return time?.slice(0, 5) || "";
}

export function toApiTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

export function getScheduleSlots(item: DoctorWorkSchedule): WorkTimeSlot[] {
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

export function getScheduleTimeText(item: DoctorWorkSchedule): string {
  const slots = getScheduleSlots(item);
  if (!slots.length) return "—";
  if (slots.length === 1) return `${slots[0].start || "—"} - ${slots[0].end || "—"}`;
  return `${slots[0].start || "—"} - ${slots[slots.length - 1].end || "—"} (${slots.length} khung)`;
}

export function mapScheduleToForm(item: DoctorWorkSchedule): ScheduleFormValues {
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

export function scheduleFormToPayload(form: ScheduleFormValues, slots: WorkTimeSlot[]): CreateDoctorWorkSchedulePayload {
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
    time_slots: slots.map((slot) => ({ start: toApiTime(slot.start), end: toApiTime(slot.end), max_appointments: slot.max_appointments })),
  };
}

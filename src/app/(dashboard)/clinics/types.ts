import type { HisRoom } from "@/api/roomsApi";

// ─── Form ────────────────────────────────────────────────────────────────

export type ClinicFormValues = {
  room_id: string;
  room_name: string;
  description: string;
  exam_area_description: string;
  visit_instruction: string;
  clinic_type: string;
  exam_area_id: string;
  specialty_ids: string[];
  service_ids: string[];
};

export const EMPTY_CLINIC_FORM: ClinicFormValues = {
  room_id: "",
  room_name: "",
  description: "",
  exam_area_description: "",
  visit_instruction: "",
  clinic_type: "",
  exam_area_id: "",
  specialty_ids: [],
  service_ids: [],
};

/** Map một `HisRoom` (chi tiết phòng khám) sang giá trị form để chỉnh sửa. */
export function mapRoomToClinicForm(room: HisRoom): ClinicFormValues {
  return {
    room_id: room.roomid,
    room_name: room.roomname,
    description: room.description ?? "",
    exam_area_description: room.exam_area_description ?? "",
    visit_instruction: room.visit_instruction ?? "",
    clinic_type: room.clinic_type ?? "",
    exam_area_id: room.exam_area_id ?? "",
    specialty_ids: room.his_room_specialties?.map((item) => item.specialty_id) ?? [],
    service_ids: room.his_room_services?.map((item) => item.service_id) ?? [],
  };
}

// ─── Hằng số ─────────────────────────────────────────────────────────────

export const CLINIC_PAGE_SIZE = 10;
export const SPECIALTY_PAGE_SIZE = 20;
export const SERVICE_PAGE_SIZE = 20;

// ─── Helpers hiển thị ────────────────────────────────────────────────────

export function getExamAreaName(room: HisRoom): string {
  return room.exam_area_description?.trim() || "Chưa phân khu";
}

export function getExamAreaLabel(room: HisRoom): string {
  return room.exam_area?.name?.trim() || getExamAreaName(room);
}

export function hasAssignedServices(room: HisRoom): boolean {
  return (room.his_room_services?.length ?? 0) > 0;
}

export function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

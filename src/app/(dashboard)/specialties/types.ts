import type { AdminSpecialty } from "@/types/hospital-admin";

export const SPECIALTY_PAGE_SIZE = 10;

// ─── Form ────────────────────────────────────────────────────────────────

export type SpecialtyFormValues = {
  name: string;
  description: string;
  is_active: boolean;
  room_visit_instruction: string;
  booking_note: string;
  booking_group: string;
  display_priority: string;
  /** Danh sách UUID khu vực khám cần gán cho chuyên khoa. */
  exam_area_ids: string[];
};

export const EMPTY_SPECIALTY_FORM: SpecialtyFormValues = {
  name: "",
  description: "",
  is_active: true,
  room_visit_instruction: "",
  booking_note: "",
  booking_group: "",
  display_priority: "",
  exam_area_ids: [],
};

export function mapSpecialtyToForm(item: AdminSpecialty): SpecialtyFormValues {
  return {
    name: item.name,
    description: item.description ?? "",
    is_active: item.is_active,
    room_visit_instruction: item.room_visit_instruction ?? "",
    booking_note: item.booking_note ?? "",
    booking_group: item.booking_group ?? "",
    display_priority: item.display_priority != null ? String(item.display_priority) : "",
    exam_area_ids: (item.specialty_exam_areas ?? []).map((relation) => relation.exam_area_id),
  };
}

export function buildSpecialtyPayload(form: SpecialtyFormValues): Partial<AdminSpecialty> {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    is_active: form.is_active,
    room_visit_instruction: form.room_visit_instruction.trim() || null,
    booking_note: form.booking_note.trim() || null,
    booking_group: form.booking_group.trim() || null,
    display_priority: form.display_priority.trim() ? Number(form.display_priority) : null,
  };
}

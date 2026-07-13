import { apiPost } from "@/lib/axios";
import { createApi } from "./createApi";
import type { AdminSpecialty } from "@/types/hospital-admin";

export const {
  service: specialtiesService,
  keys: specialtiesKeys,
  hooks: specialtiesHooks,
} = createApi<AdminSpecialty>("specialties");

// ─── Gán khu vực khám cho chuyên khoa ──────────────────────────────────────

export interface AssignExamAreasResult {
  created: unknown[];
  skipped: string[];
}

/**
 * Gán nhiều khu khám cùng lúc cho chuyên khoa (bulkCreate vào specialty_exam_areas).
 * Khu khám nào đã gán thì bỏ qua, chỉ tạo các quan hệ chưa tồn tại.
 */
export async function assignSpecialtyExamAreas(
  specialtyId: string,
  examAreaIds: string[],
): Promise<AssignExamAreasResult> {
  const res = await apiPost<AssignExamAreasResult>(`/specialties/${specialtyId}/exam-areas`, {
    exam_area_ids: examAreaIds,
  });
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Gán khu vực khám cho chuyên khoa thất bại");
}

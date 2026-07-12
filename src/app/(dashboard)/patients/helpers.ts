import type { Patient, SearchPatientParams } from "@/types/patient";

// Helpers thuần cho trang danh sách bệnh nhân.
// (Lưu ý: `patients/types.ts` là type domain cũ, không liên quan trang list.)

export const PATIENT_PAGE_SIZE = 10;

export function getFullName(p: Patient): string {
  return p.patient_full_name || "—";
}

export function getGender(p: Patient): "Nam" | "Nữ" | "—" {
  if (!p.sex) return "—";
  const s = p.sex.toLowerCase();
  if (s === "nam" || s === "male" || s === "1") return "Nam";
  if (s === "nữ" || s === "nu" || s === "female" || s === "0") return "Nữ";
  return "—";
}

export function getBirthday(p: Patient): string {
  return p.birthday || p.birth_year || "—";
}

// Nguồn tạo hồ sơ — suy ra từ dữ liệu thật (HIS nếu có his_patient_id + synced_at)
export function getSource(p: Patient): { label: string; className: string } {
  if (p.his_patient_id && p.synced_at) return { label: "HIS", className: "bg-primary-100 text-primary-600" };
  return { label: "Admin", className: "bg-purple-100 text-purple-600" };
}

// Trạng thái đồng bộ HIS — suy ra từ synced_at / his_updated_at
export function getSyncStatus(p: Patient): { label: string; className: string } {
  if (p.synced_at) return { label: "Chưa đồng bộ", className: "bg-success-light text-success" };
  if (p.his_patient_id) return { label: "Chờ đồng bộ", className: "bg-warning-light text-warning" };
  return { label: "Chưa đồng bộ", className: "bg-error-light text-error" };
}

/**
 * Suy ra param tìm kiếm phù hợp từ ô nhập:
 * - Số điện thoại: bắt đầu bằng "0", gồm 10–11 chữ số  → patientphonenumber
 * - Chuỗi toàn chữ số khác (mã BN dạng số) → patientcode
 * - Có chữ cái / dấu gạch (mã BN dạng "BN-2025-001") → patientcode
 * - Còn lại (có khoảng trắng / chữ tiếng Việt) → patientname
 */
export function buildSearchParams(raw: string): SearchPatientParams {
  const trimmed = raw.trim();
  if (!trimmed) return {};

  const digitsOnly = /^\d+$/.test(trimmed);
  if (digitsOnly) {
    const isPhone = trimmed.startsWith("0") && trimmed.length >= 10 && trimmed.length <= 11;
    return isPhone ? { patientphonenumber: trimmed } : { patientcode: trimmed };
  }

  if (!/\s/.test(trimmed) && /\d/.test(trimmed)) {
    return { patientcode: trimmed };
  }

  return { patientname: trimmed };
}

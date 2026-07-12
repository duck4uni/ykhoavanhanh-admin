import {
  CalendarDays,
  CreditCard,
  FileText,
  Grid2X2,
  History,
  Star,
  UsersRound,
} from "lucide-react";
import type { Patient } from "@/types/patient";

// ─── Tabs ────────────────────────────────────────────────────────────────────

export const patientTabs = [
  { key: "overview", label: "Tổng quan", icon: Grid2X2 },
  { key: "appointments", label: "Lịch sử đặt khám", icon: CalendarDays },
  { key: "records", label: "Hồ sơ bệnh án", icon: FileText },
  { key: "payments", label: "Thanh toán", icon: CreditCard },
  { key: "reviews", label: "Đánh giá", icon: Star },
  { key: "family", label: "Người thân", icon: UsersRound },
  { key: "logs", label: "Nhật ký cập nhật", icon: History },
] as const;

export type TabKey = (typeof patientTabs)[number]["key"];

// ─── Pure helpers ────────────────────────────────────────────────────────────

export function getFullName(p: {
  patient_first_name: string | null;
  patient_last_name: string | null;
  patient_full_name?: string | null;
}): string {
  return (
    p.patient_full_name ||
    [p.patient_first_name, p.patient_last_name].filter(Boolean).join(" ") ||
    "—"
  );
}

export function getGender(sex: string | null): string {
  if (!sex) return "—";
  return sex.toLowerCase() === "nam"
    ? "Nam"
    : sex.toLowerCase() === "nữ" || sex.toLowerCase() === "nu"
      ? "Nữ"
      : sex;
}

export function getAge(birthday: string | null, birthYear: string | null): string {
  const year = birthday
    ? new Date(birthday).getFullYear()
    : birthYear
      ? Number(birthYear)
      : null;
  if (!year || Number.isNaN(year)) return "—";
  return `${new Date().getFullYear() - year} tuổi`;
}

export function toNumber(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v) || 0;
}

export function formatStatus(status: string | null | undefined): string {
  if (!status) return "—";
  const labels: Record<string, string> = {
    HIS_SYNCED: "Đã đồng bộ HIS",
    CONFIRMED: "Đã xác nhận",
    PAID: "Đã thanh toán",
    CANCELED: "Đã hủy",
    CANCELLED: "Đã hủy",
    PENDING: "Đang chờ",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    COMPLETED: "Hoàn tất",
    UNPAID: "Chưa thanh toán",
    PARTIAL: "Thanh toán một phần",
  };
  return labels[status] ?? status;
}

/** Mã bệnh nhân hiển thị (ưu tiên mã HIS). */
export function getPatientCode(patient: Patient): string {
  return patient.his_patient_id ?? patient.id;
}

/** Địa chỉ đầy đủ, ghép từ các thành phần nếu chưa có `address_full`. */
export function getAddress(patient: Patient): string {
  return (
    patient.address_full ??
    [
      patient.address_detail,
      patient.address_street,
      patient.ward_name,
      patient.district_name,
      patient.province_name,
    ]
      .filter(Boolean)
      .join(", ")
  );
}

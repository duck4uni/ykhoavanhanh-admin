import type { HisDoctor } from "@/api/doctorsApi";

// Helpers thuần cho trang danh sách bác sĩ.
// (Lưu ý: `doctors/types.ts` là type domain cũ, không liên quan trang list.)

export const DOCTORS_PAGE_SIZE = 10;

export function getImageSrc(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}${path.startsWith("/") ? path : `/${path}`}`;
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

export function inferSpecialtyName(doctor: HisDoctor): string {
  const desc = (doctor.description ?? "").toLowerCase();
  if (/sản|phụ|sa/i.test(desc)) return "Sản phụ khoa";
  if (/nội/i.test(desc)) return "Nội tổng quát";
  if (/ngoại/i.test(desc)) return "Ngoại tổng quát";
  if (/tai|mũi|họng/i.test(desc)) return "Tai Mũi Họng";
  if (/chẩn đoán|hình ảnh|xquang|x-quang|ct|mri/i.test(desc)) return "Chẩn đoán hình ảnh";
  return "—";
}

export function getClinicName(doctor: HisDoctor): string {
  const specialty = inferSpecialtyName(doctor);
  return specialty === "—" ? "—" : `PK ${specialty}`;
}

export function getScheduleCount(doctor: HisDoctor): number {
  const codeNumber = Number(doctor.doctorid.replace(/\D/g, "")) || 0;
  if (inferSpecialtyName(doctor) === "—") return 0;
  return codeNumber % 25;
}

export function getDoctorStatus(doctor: HisDoctor): { label: string; className: string } {
  if (doctor.status === "INACTIVE") {
    return { label: "Tạm ngưng", className: "bg-warning-light text-warning" };
  }
  if (doctor.status && doctor.status !== "ACTIVE") {
    return { label: doctor.status, className: "bg-slate-100 text-slate-600" };
  }
  return { label: "Hoạt động", className: "bg-success-light text-success" };
}

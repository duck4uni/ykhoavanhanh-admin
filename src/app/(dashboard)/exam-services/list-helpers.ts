import type { HisService } from "@/api/hisServicesApi";

// Helpers thuần cho trang danh sách dịch vụ khám.

export const EXAM_SERVICES_PAGE_SIZE = 10;

export function formatDateTime(value: string): string {
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

export function getSpecialtyName(service: HisService): string {
  return service.specialty?.name || "—";
}

export function supportsInsurance(service: HisService): boolean {
  return service.insurancetype.toLowerCase().includes("bh");
}

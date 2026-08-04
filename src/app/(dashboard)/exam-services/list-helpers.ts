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
  // Chuyên khoa không bắt buộc — dịch vụ để trống là dùng chung cho mọi chuyên khoa.
  return service.specialty?.name || "Dùng chung";
}

/** Các mức giá phụ (ngoài mức mặc định) để hiển thị gọn dưới cột Giá. */
export function getExtraPriceLevels(service: HisService) {
  if (service.price_levels.length <= 1) return [];
  const defaultIndex = Math.max(service.price_levels.findIndex((level) => level.is_default), 0);
  return service.price_levels.filter((_, index) => index !== defaultIndex);
}

export function supportsInsurance(service: HisService): boolean {
  return service.insurancetype.toLowerCase().includes("bh");
}

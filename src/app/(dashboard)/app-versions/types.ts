import type { AdminAppVersion, AppVersionPayload } from "@/api/appVersionsApi";

export const APP_VERSION_PAGE_SIZE = 10;

export const PLATFORM_OPTIONS = [
  { value: "android", label: "Android" },
  { value: "ios", label: "iOS" },
] as const;

export const UPDATE_TYPE_OPTIONS = [
  { value: "optional", label: "Tùy chọn" },
  { value: "force", label: "Bắt buộc" },
] as const;

export const STATUS_OPTIONS = [
  { value: "active", label: "Đang áp dụng" },
  { value: "inactive", label: "Ngừng áp dụng" },
] as const;

export type AppVersionFormValues = {
  platform: string;
  version_name: string;
  version_code: string;
  min_version: string;
  update_type: string;
  status: string;
  effective_date: string;
  update_title: string;
  update_content: string;
  cta_text: string;
  store_url: string;
  enabled: boolean;
};

export const EMPTY_APP_VERSION_FORM: AppVersionFormValues = {
  platform: "android",
  version_name: "",
  version_code: "",
  min_version: "",
  update_type: "optional",
  status: "active",
  effective_date: "",
  update_title: "",
  update_content: "",
  cta_text: "Cập nhật ngay",
  store_url: "",
  enabled: true,
};

/** Dữ liệu có thể lưu hoa/thường khác nhau (OPTIONAL / optional) → chuẩn hóa về chữ thường để so khớp. */
export function normalizeValue(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function mapAppVersionToForm(item: AdminAppVersion): AppVersionFormValues {
  const updateType = normalizeValue(item.update_type);
  return {
    platform: normalizeValue(item.platform) || "android",
    version_name: item.version_name ?? "",
    version_code: item.version_code ?? "",
    min_version: item.min_version ?? "",
    update_type: updateType === "required" ? "force" : updateType || "optional",
    status: normalizeValue(item.status) || "active",
    effective_date: item.effective_date?.slice(0, 10) ?? "",
    update_title: item.update_title ?? "",
    update_content: item.update_content ?? "",
    cta_text: item.cta_text ?? "",
    store_url: item.store_url ?? "",
    enabled: item.enabled ?? true,
  };
}

export function appVersionFormToPayload(form: AppVersionFormValues): AppVersionPayload {
  return {
    platform: form.platform,
    version_name: form.version_name.trim(),
    version_code: form.version_code.trim(),
    min_version: form.min_version.trim(),
    update_type: form.update_type,
    status: form.status,
    effective_date: form.effective_date,
    update_title: form.update_title.trim(),
    update_content: form.update_content.trim(),
    cta_text: form.cta_text.trim(),
    store_url: form.store_url.trim(),
    enabled: form.enabled,
  };
}

/** Trả về thông báo lỗi tiếng Việt cho trường đầu tiên chưa hợp lệ, hoặc null nếu hợp lệ. */
export function validateAppVersionForm(form: AppVersionFormValues): string | null {
  if (!form.version_name.trim()) return "Vui lòng nhập tên phiên bản";
  if (!form.version_code.trim()) return "Vui lòng nhập mã phiên bản (version code)";
  if (!form.min_version.trim()) return "Vui lòng nhập phiên bản tối thiểu";
  if (!form.effective_date) return "Vui lòng chọn ngày hiệu lực";
  if (!form.update_title.trim()) return "Vui lòng nhập tiêu đề thông báo cập nhật";
  if (!form.update_content.trim()) return "Vui lòng nhập nội dung cập nhật";
  if (!form.cta_text.trim()) return "Vui lòng nhập nội dung nút cập nhật";
  if (!/^https?:\/\//i.test(form.store_url.trim())) {
    return "Đường dẫn cửa hàng phải bắt đầu bằng http:// hoặc https://";
  }
  return null;
}

export function platformLabel(value: string): string {
  return PLATFORM_OPTIONS.find((o) => o.value === normalizeValue(value))?.label ?? value;
}

export function updateTypeLabel(value: string): string {
  const v = normalizeValue(value);
  if (v === "required") return "Bắt buộc";
  return UPDATE_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? value;
}

export function statusLabel(value: string): string {
  return STATUS_OPTIONS.find((o) => o.value === normalizeValue(value))?.label ?? value;
}

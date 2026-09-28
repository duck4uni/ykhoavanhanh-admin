import type { AdminPolicy } from "@/api/policiesApi";

export const POLICY_PAGE_SIZE = 10;

export type PolicyFormValues = {
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
};

export const EMPTY_POLICY_FORM: PolicyFormValues = {
  title: "",
  description: "",
  sort_order: 0,
  is_active: true,
};

export function mapPolicyToForm(policy: AdminPolicy): PolicyFormValues {
  return {
    title: policy.title,
    description: policy.description ?? "",
    sort_order: policy.sort_order ?? 0,
    is_active: policy.is_active ?? true,
  };
}

export function policyFormToPayload(form: PolicyFormValues) {
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    sort_order: Number(form.sort_order) || 0,
    is_active: form.is_active,
  };
}

/** Đoạn trích ngắn của mô tả, hiển thị dưới tiêu đề trong bảng danh sách. */
export function getExcerpt(text: string | null | undefined, maxLength = 90): string {
  if (!text) return "";
  // Nội dung được soạn bằng rich text editor (HTML) — bỏ thẻ HTML trước khi cắt gọn.
  const plain = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain) return "";
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trim()}…`;
}

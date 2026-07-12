import type { ExamArea, CreateExamAreaPayload } from "@/api/examAreasApi";

export const EXAM_AREA_PAGE_SIZE = 10;

export type ExamAreaFormValues = {
  code: string;
  name: string;
  short_name: string;
  address: string;
  phone: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
};

export const EMPTY_EXAM_AREA_FORM: ExamAreaFormValues = {
  code: "",
  name: "",
  short_name: "",
  address: "",
  phone: "",
  description: "",
  status: "ACTIVE",
};

export function mapExamAreaToForm(item: ExamArea): ExamAreaFormValues {
  return {
    code: item.code,
    name: item.name,
    short_name: item.short_name ?? "",
    address: item.address ?? "",
    phone: item.phone ?? "",
    description: item.description ?? "",
    status: item.status,
  };
}

export function examAreaFormToPayload(form: ExamAreaFormValues): CreateExamAreaPayload {
  return {
    code: form.code,
    name: form.name,
    short_name: form.short_name || undefined,
    address: form.address || undefined,
    phone: form.phone || undefined,
    description: form.description || undefined,
    status: form.status,
  };
}

export function isValidVietnamesePhone(value: string): boolean {
  const phone = value.trim();
  if (!phone) return true;
  return /^(?:\+84|84|0)(?:\d{9}|\d{10})$/.test(phone.replace(/[\s.-]/g, ""));
}

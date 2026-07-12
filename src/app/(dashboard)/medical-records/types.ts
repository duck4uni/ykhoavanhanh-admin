export const MEDICAL_RECORD_PAGE_SIZE = 10;

export const PAYMENT_BADGE: Record<string, { label: string; className: string }> = {
  PAID: { label: "Đã thanh toán", className: "bg-success-light text-success" },
  UNPAID: { label: "Chờ thanh toán", className: "bg-warning-light text-warning" },
  PARTIAL: { label: "Thanh toán 1 phần", className: "bg-primary-100 text-primary-600" },
};

export function toNumber(value: string | number | null): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value) || 0;
}

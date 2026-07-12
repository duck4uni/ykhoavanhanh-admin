import type { DashboardFilter } from "@/api/dashboardApi";

// ─── Formatters ──────────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function formatRevenueTick(value: number): string {
  if (value >= 1_000_000) return `${value / 1_000_000}M`;
  if (value >= 1_000) return `${value / 1_000}K`;
  return String(value);
}

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Cắt YYYY-MM-DD theo local time. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Chuyển key range → { fromDate, toDate } (YYYY-MM-DD). */
export function rangeToFilter(range: string): DashboardFilter {
  const now = new Date();
  const toDate = toISODate(now);
  if (range === "7d") {
    const from = new Date(now);
    from.setDate(from.getDate() - 6);
    return { fromDate: toISODate(from), toDate };
  }
  if (range === "30d") {
    const from = new Date(now);
    from.setDate(from.getDate() - 29);
    return { fromDate: toISODate(from), toDate };
  }
  // today
  return { fromDate: toDate, toDate };
}

export function formatChartDate(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}`;
}

export function fillRevenueByDay(
  rows: Array<{ date: string; revenue: number }> | undefined,
  filter: DashboardFilter
) {
  if (!filter.fromDate || !filter.toDate) return [];
  const byDate = new Map((rows ?? []).map((r) => [r.date, r.revenue]));
  const result: Array<{ date: string; label: string; revenue: number }> = [];
  const cursor = new Date(`${filter.fromDate}T00:00:00`);
  const end = new Date(`${filter.toDate}T00:00:00`);
  while (cursor <= end) {
    const date = toISODate(cursor);
    result.push({ date, label: formatChartDate(date), revenue: byDate.get(date) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const RANGE_OPTIONS = [
  { key: "today", label: "Hôm nay" },
  { key: "7d", label: "7 ngày" },
  { key: "30d", label: "30 ngày" },
] as const;

// Màu cho donut theo trạng thái phiếu
export const DONUT_COLORS = ["#1A6BBF", "#F5B942", "#E5484D", "#B39DDB", "#2BB673", "#8895A7"];

export const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  CONFIRMED: { label: "Đã xác nhận", className: "bg-success-light text-success" },
  PAID: { label: "Đã thanh toán", className: "bg-success-light text-success" },
  PENDING: { label: "Chờ xác nhận", className: "bg-warning-light text-warning" },
  WAITING_PAYMENT: { label: "Chờ thanh toán", className: "bg-primary-100 text-primary-600" },
  CANCELLED: { label: "Đã hủy", className: "bg-error-light text-error" },
};

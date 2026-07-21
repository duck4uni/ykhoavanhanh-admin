import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format date sang dạng dd/MM/yyyy hoặc theo locale */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", options ?? { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Format số tiền sang VNĐ */
export function formatCurrency(amount: number, currency = "VND"): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency }).format(amount);
}

/** Format date + time sang dạng dd/MM/yyyy HH:mm */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/** Gộp các lỗi validate (field + message) từ API thành text hiển thị cho người dùng, gộp các message trùng lặp. */
export function formatApiViolations(violations?: Array<{ field?: string; message: string }>): string | undefined {
  if (!violations || violations.length === 0) return undefined;
  const counts = new Map<string, number>();
  for (const v of violations) {
    counts.set(v.message, (counts.get(v.message) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([message, count]) => (count > 1 ? `${message} (${count} mục)` : message))
    .join("\n");
}

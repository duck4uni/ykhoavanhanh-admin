import type { NotificationCategory } from "@/api/notificationsApi";

export const NOTIFICATIONS_PAGE_SIZE = 10;

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  APPOINTMENT: "Lịch hẹn",
  SYSTEM: "Hệ thống",
  CHAT: "Chat CSKH",
};

export const CATEGORY_COLORS: Record<NotificationCategory, string> = {
  APPOINTMENT: "bg-blue-50 text-blue-600",
  SYSTEM: "bg-slate-100 text-slate-600",
  CHAT: "bg-emerald-50 text-emerald-600",
};

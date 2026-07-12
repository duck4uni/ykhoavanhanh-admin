import { AlertCircle, Archive, Clock, Globe } from "lucide-react";
import type { NewsStatus } from "./types";

type StatusMeta = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

/** Cấu hình hiển thị theo trạng thái bài viết (dùng chung cho trang tạo & sửa). */
export const STATUS_CONFIG: Record<NewsStatus, StatusMeta> = {
  DRAFT: { label: "Nháp", icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-200" },
  PUBLISHED: { label: "Đã xuất bản", icon: Globe, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  HIDDEN: { label: "Ẩn", icon: AlertCircle, color: "text-slate-500 bg-slate-50 border-slate-200" },
  ARCHIVED: { label: "Lưu trữ", icon: Archive, color: "text-slate-400 bg-slate-50 border-slate-200" },
};

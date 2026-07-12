import type { Post } from "@/api/postsApi";
import { Link as LinkIcon } from "@/lib/link";

export const NEWS_PAGE_SIZE = 10;

export const STATUS_CONFIG = {
  PUBLISHED: { label: "Đã xuất bản", color: "text-emerald-600 bg-emerald-50 border border-emerald-200", dot: "bg-emerald-500" },
  DRAFT: { label: "Nháp", color: "text-amber-600 bg-amber-50 border border-amber-200", dot: "bg-amber-500" },
  HIDDEN: { label: "Ẩn", color: "text-slate-500 bg-slate-50 border border-slate-200", dot: "bg-slate-400" },
  ARCHIVED: { label: "Lưu trữ", color: "text-slate-400 bg-slate-50 border border-slate-200", dot: "bg-slate-300" },
} as const;

export type NewsStatusFilter = "" | Post["status"];

export function getPostThumbnailUrl(post: Post): string | null {
  if (!post.thumbnail_path) return null;
  return post.thumbnail_path.startsWith("http") ? post.thumbnail_path : LinkIcon.imgEndpoid + post.thumbnail_path;
}

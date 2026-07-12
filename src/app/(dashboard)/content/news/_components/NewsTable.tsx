import Image from "next/image";
import Link from "next/link";
import { Eye, FileText, Pencil, Star, Trash2 } from "lucide-react";
import { LoadingSection } from "@/components/ui/Spinner";
import type { Post } from "@/api/postsApi";
import { formatDate } from "@/lib/utils";
import { NEWS_PAGE_SIZE, STATUS_CONFIG, getPostThumbnailUrl } from "../types";

interface NewsTableProps {
  rows: Post[];
  isFetching: boolean;
  page: number;
  total: number;
  totalPages: number;
  isDeleting: boolean;
  onPageChange: (page: number) => void;
  onDelete: (id: string) => void;
}

export function NewsTable({ rows, isFetching, page, total, totalPages, isDeleting, onPageChange, onDelete }: NewsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      {isFetching && <LoadingSection />}

      {!isFetching && rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <FileText className="h-7 w-7 text-slate-400" />
          </div>
          <p className="mb-1 text-sm font-medium text-slate-700">Chưa có tin tức nào</p>
          <p className="text-xs text-slate-400">Tạo tin tức đầu tiên để bắt đầu</p>
        </div>
      )}

      {!isFetching && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Bài viết</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Trạng thái</th>
                <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 lg:table-cell">Danh mục</th>
                <th className="hidden px-6 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500 xl:table-cell">Nổi bật</th>
                <th className="hidden px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 md:table-cell">Lượt xem</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((post) => {
                const statusConfig = STATUS_CONFIG[post.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.DRAFT;
                const thumbnailUrl = getPostThumbnailUrl(post);

                return (
                  <tr key={post.id} className="group transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border ${thumbnailUrl ? "border-slate-200" : "border-slate-200 bg-slate-100"}`}>
                          {thumbnailUrl ? (
                            <Image src={thumbnailUrl} alt={post.name} width={48} height={48} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <FileText className="h-5 w-5 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-xs truncate text-sm font-medium text-slate-800">{post.name}</p>
                          {post.description && <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">{post.description}</p>}
                          <p className="mt-0.5 text-xs text-slate-300">{post.created_at ? formatDate(post.created_at) : "—"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                        {statusConfig.label}
                      </div>
                    </td>

                    <td className="hidden px-6 py-4 lg:table-cell">
                      {post.category ? (
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{post.category.name}</span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>

                    <td className="hidden px-6 py-4 text-center xl:table-cell">
                      {post.is_featured ? (
                        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-50">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>

                    <td className="hidden px-6 py-4 text-right md:table-cell">
                      <div className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Eye className="h-3.5 w-3.5" />
                        {post.view_count?.toLocaleString() ?? 0}
                      </div>
                    </td>

                    <td className="py-4">
                      <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                        <Link href={`/content/news/${post.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-primary-50 hover:text-primary" title="Sửa">
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm("Bạn có chắc muốn xóa tin tức này?")) onDelete(post.id);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500"
                          title="Xóa"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <p className="text-xs text-slate-400">
            Hiển thị {(page - 1) * NEWS_PAGE_SIZE + 1}–{Math.min(page * NEWS_PAGE_SIZE, total)} trong {total} bài viết
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter((item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1)
              .map((item, index, array) => (
                <span key={item} className="contents">
                  {index > 0 && array[index - 1] !== item - 1 && <span className="px-1 text-sm text-slate-400">…</span>}
                  <button
                    onClick={() => onPageChange(item)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${
                      item === page ? "bg-primary text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item}
                  </button>
                </span>
              ))}
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { Check, Copy, FolderOpen, Info } from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import { StatusSwitch } from "@/components/ui/StatusSwitch";
import type { PostCategory } from "@/api/postCategoriesApi";
import { formatDate } from "@/lib/utils";
import { CATEGORY_PAGE_SIZE, getPostCount } from "../types";
import { RowMenu } from "./RowMenu";

interface CategoryTableProps {
  rows: PostCategory[];
  isFetching: boolean;
  page: number;
  totalPages: number;
  total: number;
  copiedSlug: string | null;
  isPatching: boolean;
  isDeleting: boolean;
  onPageChange: (page: number) => void;
  onCopySlug: (slug: string) => void;
  onToggleActive: (category: PostCategory) => void;
  onEdit: (category: PostCategory) => void;
  onDelete: (id: string) => void;
}

export function CategoryTable({
  rows,
  isFetching,
  page,
  totalPages,
  total,
  copiedSlug,
  isPatching,
  isDeleting,
  onPageChange,
  onCopySlug,
  onToggleActive,
  onEdit,
  onDelete,
}: CategoryTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      {isFetching && <LoadingSection />}

      {!isFetching && rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <FolderOpen className="h-7 w-7 text-slate-400" />
          </div>
          <p className="mb-1 text-sm font-medium text-slate-700">Chưa có danh mục nào</p>
          <p className="text-xs text-slate-400">Tạo danh mục đầu tiên để bắt đầu</p>
        </div>
      )}

      {!isFetching && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Danh mục</th>
                <th className="hidden px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500 md:table-cell">Slug</th>
                <th className="hidden px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500 lg:table-cell">Số bài viết</th>
                <th className="hidden px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500 lg:table-cell">
                  <span className="inline-flex items-center gap-1">Thứ tự <Info className="h-3 w-3 text-slate-400" /></span>
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Trạng thái</th>
                <th className="hidden px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500 sm:table-cell">Ngày tạo</th>
                <th className="px-6 py-3.5 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((category) => {
                const postCount = getPostCount(category);
                return (
                  <tr key={category.id} className="group transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <FolderOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[240px] truncate text-sm font-semibold text-slate-800">{category.name}</p>
                          {category.description && (
                            <p className="mt-0.5 max-w-[240px] truncate text-xs text-slate-400">{category.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="hidden px-6 py-4 md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">{category.slug}</span>
                        <button onClick={() => onCopySlug(category.slug)} className="text-slate-400 transition-colors hover:text-primary" title="Sao chép slug">
                          {copiedSlug === category.slug ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="hidden px-6 py-4 lg:table-cell"><span className="text-sm font-semibold text-primary-600">{postCount ?? "—"}</span></td>
                    <td className="hidden px-6 py-4 lg:table-cell"><span className="text-sm text-slate-600">{category.sort_order ?? 0}</span></td>

                    <td className="px-6 py-4">
                      <StatusSwitch
                        checked={category.is_active}
                        loading={isPatching}
                        onChange={() => onToggleActive(category)}
                        inactiveLabel="Tắt"
                      />
                    </td>

                    <td className="hidden px-6 py-4 sm:table-cell"><span className="text-xs text-slate-500">{category.created_at ? formatDate(category.created_at) : "—"}</span></td>
                    <td className="px-6 py-4">
                      <RowMenu onEdit={() => onEdit(category)} onDelete={() => onDelete(category.id)} disabled={isDeleting} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <div className="border-t border-slate-100 px-6 py-4">
          <TablePagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} totalItems={total} pageSize={CATEGORY_PAGE_SIZE} />
        </div>
      )}
    </div>
  );
}

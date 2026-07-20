import Image from "next/image";
import { ImageIcon, Pencil, Trash2 } from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import type { PageConfig } from "@/api/pageConfigApi";
import { formatDate } from "@/lib/utils";
import { getImageSrc } from "../types";

interface BannerTableProps {
  rows: PageConfig[];
  isFetching: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  isDeleting: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (banner: PageConfig) => void;
  onDelete: (id: string) => void;
}

export function BannerTable({ rows, isFetching, page, pageSize, totalPages, total, isDeleting, onPageChange, onPageSizeChange, onEdit, onDelete }: BannerTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      {isFetching && <LoadingSection />}

      {!isFetching && rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <ImageIcon className="h-7 w-7 text-slate-400" />
          </div>
          <p className="mb-1 text-sm font-medium text-slate-700">Chưa có banner nào</p>
          <p className="text-xs text-slate-400">Tạo banner đầu tiên để bắt đầu</p>
        </div>
      )}

      {!isFetching && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Banner</th>
                <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 md:table-cell">Mã</th>
                <th className="hidden px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 sm:table-cell">Ngày tạo</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((banner) => {
                const imageSrc = getImageSrc(banner.content);
                return (
                  <tr key={banner.id} className="group transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-12 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                          {imageSrc ? (
                            <Image src={imageSrc} alt={banner.name ?? "banner"} fill sizes="80px" className="object-cover" unoptimized />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate text-sm font-medium text-slate-800">{banner.name || "—"}</p>
                          {imageSrc && <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-400">{banner.content}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">{banner.code || "—"}</span>
                    </td>
                    <td className="hidden px-6 py-4 text-right sm:table-cell">
                      <span className="text-xs text-slate-400">{banner.created_at ? formatDate(banner.created_at) : "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                        <button onClick={() => onEdit(banner)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-primary-50 hover:text-primary" title="Sửa">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => onDelete(banner.id)} disabled={isDeleting} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500" title="Xóa">
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
        <div className="border-t border-slate-100 px-6 py-4">
          <TablePagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} totalItems={total} pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
        </div>
      )}
    </div>
  );
}

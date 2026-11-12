import { Eye, FileText, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import type { AdminPolicy } from "@/api/policiesApi";
import { formatDateTime } from "@/lib/utils";
import { getExcerpt } from "../types";
import { PolicyStatusBadge } from "./PolicyStatusBadge";

interface PolicyTableProps {
  rows: AdminPolicy[];
  isFetching: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onView: (policy: AdminPolicy) => void;
  onEdit: (policy: AdminPolicy) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function PolicyTable({
  rows,
  isFetching,
  page,
  pageSize,
  totalPages,
  total,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onDelete,
  isDeleting,
}: PolicyTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-slate-800">Danh sách chính sách</h2>
        <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-600">
          {total} chính sách
        </span>
      </div>

      {isFetching && <LoadingSection text="Đang tải chính sách..." />}

      {!isFetching && rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <FileText className="h-7 w-7 text-slate-400" />
          </div>
          <p className="mb-1 text-sm font-medium text-slate-700">Chưa có chính sách nào</p>
          <p className="text-xs text-slate-400">Tạo chính sách đầu tiên để bắt đầu</p>
        </div>
      )}

      {!isFetching && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3.5">STT</th>
                <th className="px-6 py-3.5">Tiêu đề chính sách</th>
                <th className="px-6 py-3.5">Trạng thái</th>
                <th className="px-6 py-3.5">Thứ tự hiển thị</th>
                <th className="px-6 py-3.5">Ngày tạo</th>
                <th className="px-6 py-3.5">Cập nhật lần cuối</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((policy, index) => (
                <tr key={policy.id} className="text-sm transition-colors hover:bg-slate-50/60">
                  <td className="px-6 py-4">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {(page - 1) * pageSize + index + 1}
                    </span>
                  </td>
                  <td className="max-w-sm px-6 py-4">
                    <p className="truncate font-semibold text-slate-800">{policy.title}</p>
                    {policy.description && (
                      <p className="mt-0.5 truncate text-xs text-slate-400">{getExcerpt(policy.description)}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <PolicyStatusBadge active={policy.is_active} />
                  </td>
                  <td className="px-6 py-4 text-slate-600">{policy.sort_order ?? 0}</td>
                  <td className="px-6 py-4">
                    <p className="text-slate-700">{policy.created_at ? formatDateTime(policy.created_at) : "—"}</p>
                    {policy.created_by && <p className="mt-0.5 text-xs text-slate-400">Admin</p>}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-700">{policy.updated_at ? formatDateTime(policy.updated_at) : "—"}</p>
                    {policy.updated_by && <p className="mt-0.5 text-xs text-slate-400">Admin</p>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => onView(policy)}>
                        <Eye className="h-4 w-4" /> Chi tiết
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onEdit(policy)}>
                        <Pencil className="h-4 w-4" /> Sửa
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(policy.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" /> Xoá
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <div className="border-t border-slate-100 px-6 py-4">
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalItems={total}
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
}

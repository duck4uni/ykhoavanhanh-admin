import { Pencil, Smartphone, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import { Switch } from "@/components/ui/Toggle";
import type { AdminAppVersion } from "@/api/appVersionsApi";
import { formatDate } from "@/lib/utils";
import { PlatformBadge, UpdateTypeBadge, VersionStatusBadge } from "./AppVersionBadges";

interface AppVersionTableProps {
  rows: AdminAppVersion[];
  isFetching: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onViewUsers: (item: AdminAppVersion) => void;
  onEdit: (item: AdminAppVersion) => void;
  onDelete: (id: string) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  isDeleting: boolean;
  isToggling: boolean;
}

export function AppVersionTable({
  rows,
  isFetching,
  page,
  pageSize,
  totalPages,
  total,
  onPageChange,
  onPageSizeChange,
  onViewUsers,
  onEdit,
  onDelete,
  onToggleEnabled,
  isDeleting,
  isToggling,
}: AppVersionTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-slate-800">Danh sách bản cập nhật</h2>
        <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-600">
          {total} bản cập nhật
        </span>
      </div>

      {isFetching && <LoadingSection text="Đang tải bản cập nhật..." />}

      {!isFetching && rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <Smartphone className="h-7 w-7 text-slate-400" />
          </div>
          <p className="mb-1 text-sm font-medium text-slate-700">Chưa có bản cập nhật nào</p>
          <p className="text-xs text-slate-400">Tạo bản cập nhật đầu tiên để bắt đầu</p>
        </div>
      )}

      {!isFetching && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3.5">STT</th>
                <th className="px-6 py-3.5">Phiên bản</th>
                <th className="px-6 py-3.5">Nền tảng</th>
                <th className="px-6 py-3.5">Loại cập nhật</th>
                <th className="px-6 py-3.5">Tối thiểu</th>
                <th className="px-6 py-3.5">Ngày hiệu lực</th>
                <th className="px-6 py-3.5">Trạng thái</th>
                <th className="px-6 py-3.5">Kích hoạt</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((item, index) => (
                <tr key={item.id} className="text-sm transition-colors hover:bg-slate-50/60">
                  <td className="px-6 py-4">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {(page - 1) * pageSize + index + 1}
                    </span>
                  </td>
                  <td className="max-w-xs px-6 py-4">
                    <p className="font-semibold text-slate-800">
                      {item.version_name} <span className="font-normal text-slate-400">({item.version_code})</span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">{item.update_title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <PlatformBadge value={item.platform} />
                  </td>
                  <td className="px-6 py-4">
                    <UpdateTypeBadge value={item.update_type} />
                  </td>
                  <td className="px-6 py-4 text-slate-600">{item.min_version}</td>
                  <td className="px-6 py-4 text-slate-700">{item.effective_date ? formatDate(item.effective_date) : "—"}</td>
                  <td className="px-6 py-4">
                    <VersionStatusBadge value={item.status} />
                  </td>
                  <td className="px-6 py-4">
                    <Switch
                      checked={item.enabled}
                      disabled={isToggling}
                      onCheckedChange={(checked) => onToggleEnabled(item.id, checked)}
                      aria-label="Bật/tắt bản cập nhật"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => onViewUsers(item)}>
                        <Users className="h-4 w-4" /> Người dùng
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                        <Pencil className="h-4 w-4" /> Sửa
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)} disabled={isDeleting}>
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

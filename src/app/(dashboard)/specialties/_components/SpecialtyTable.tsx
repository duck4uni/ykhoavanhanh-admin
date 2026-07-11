import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import type { AdminSpecialty } from "@/types/hospital-admin";
import { StatusBadge } from "./StatusBadge";
import { RowMenu } from "./RowMenu";

interface SpecialtyTableProps {
  rows: AdminSpecialty[];
  isLoading: boolean;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (item: AdminSpecialty) => void;
  onDelete: (id: string) => void;
}

export function SpecialtyTable({
  rows,
  isLoading,
  currentPage,
  pageSize,
  totalPages,
  total,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: SpecialtyTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      {isLoading ? (
        <LoadingSection text="Đang tải chuyên khoa..." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5">STT</th>
                  <th className="px-5 py-3.5">Tên chuyên khoa</th>
                  <th className="px-5 py-3.5">Mô tả</th>
                  <th className="px-5 py-3.5">Nhóm đặt khám</th>
                  <th className="px-5 py-3.5">Ưu tiên</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                      Không tìm thấy chuyên khoa phù hợp.
                    </td>
                  </tr>
                ) : (
                  rows.map((item, index) => (
                    <tr key={item.id} className="text-sm transition-colors hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {(currentPage - 1) * pageSize + index + 1}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{item.name}</td>
                      <td className="max-w-xs px-5 py-4 text-slate-600"><p className="line-clamp-2">{item.description || "—"}</p></td>
                      <td className="px-5 py-4 text-slate-700">{item.booking_group || "—"}</td>
                      <td className="px-5 py-4 font-semibold text-slate-700">{item.display_priority ?? "—"}</td>
                      <td className="px-5 py-4"><StatusBadge isActive={item.is_active} /></td>
                      <td className="px-5 py-4"><RowMenu onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 px-5 py-4">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              totalItems={total}
              pageSize={pageSize}
              onPageSizeChange={onPageSizeChange}
            />
          </div>
        </>
      )}
    </div>
  );
}

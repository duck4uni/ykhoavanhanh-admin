import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import { StatusSwitch } from "@/components/ui/StatusSwitch";
import type { ExamArea } from "@/api/examAreasApi";
import { RowMenu } from "./RowMenu";

interface ExamAreaTableProps {
  rows: ExamArea[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  filteredCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onView: (item: ExamArea) => void;
  onEdit: (item: ExamArea) => void;
  onViewRooms: (item: ExamArea) => void;
  onToggle: (item: ExamArea) => void;
  onDelete: (id: string) => void;
  togglingId?: string | null;
}

export function ExamAreaTable({
  rows,
  isLoading,
  page,
  pageSize,
  totalPages,
  filteredCount,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onViewRooms,
  onToggle,
  onDelete,
  togglingId,
}: ExamAreaTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      {isLoading ? (
        <LoadingSection text="Đang tải khu vực khám..." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5">STT</th>
                  <th className="px-5 py-3.5">ID Nội bộ</th>
                  <th className="px-5 py-3.5">Tên khu vực</th>
                  {/* <th className="px-5 py-3.5">Tên viết tắt</th> */}
                  {/* <th className="px-5 py-3.5">Chi nhánh</th> */}
                  <th className="px-5 py-3.5">Địa chỉ</th>
                  {/* <th className="px-5 py-3.5">Số phòng khám</th> */}
                  <th className="px-5 py-3.5">Số điện thoại</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-sm text-muted-foreground">
                      Không tìm thấy khu vực khám phù hợp.
                    </td>
                  </tr>
                ) : (
                  rows.map((area, index) => (
                    <tr key={area.id} className="text-sm transition-colors hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                          {(page - 1) * pageSize + index + 1}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono font-semibold text-primary-600">{area.code}</td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{area.name}</td>
                      {/* <td className="px-5 py-4">
                        {area.short_name ? (
                          <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-600">
                            {area.short_name}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td> */}
                      {/* <td className="px-5 py-4 text-slate-600">Bệnh viện Vạn Hạnh</td> */}
                      <td className="max-w-xs px-5 py-4 text-slate-600">{area.address ?? "—"}</td>
                      {/* <td className="px-5 py-4 font-semibold text-slate-700">0 phòng</td> */}
                      <td className="px-5 py-4 text-slate-600">{area.phone ?? "—"}</td>
                      <td className="px-5 py-4"><StatusSwitch checked={area.status === "ACTIVE"} loading={togglingId === area.id} onChange={() => onToggle(area)} inactiveLabel="Tạm tắt" /></td>
                      <td className="px-5 py-4">
                        <RowMenu
                          item={area}
                          onView={() => onView(area)}
                          onEdit={() => onEdit(area)}
                          onViewRooms={() => onViewRooms(area)}
                          onToggle={() => onToggle(area)}
                          onDelete={() => onDelete(area.id)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 px-5 py-4">
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
              totalItems={filteredCount}
              pageSize={pageSize}
              onPageSizeChange={onPageSizeChange}
            />
          </div>
        </>
      )}
    </div>
  );
}

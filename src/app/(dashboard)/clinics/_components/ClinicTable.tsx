import { Pencil, Trash2 } from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import { StatusSwitch } from "@/components/ui/StatusSwitch";
import type { HisRoom } from "@/api/roomsApi";
import { formatUpdatedAt, getExamAreaLabel } from "../types";

interface ClinicTableProps {
  rooms: HisRoom[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (room: HisRoom) => void;
  togglingId: string | null;
}

export function ClinicTable({
  rooms,
  isLoading,
  page,
  pageSize,
  totalPages,
  totalItems,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onToggleStatus,
  togglingId,
}: ClinicTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      {isLoading ? (
        <LoadingSection text="Đang tải phòng khám..." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5">STT</th>
                  <th className="px-5 py-3.5">ID nội bộ</th>
                  <th className="px-5 py-3.5">Tên phòng khám</th>
                  <th className="px-5 py-3.5">Loại phòng khám</th>
                  <th className="px-5 py-3.5">Khu khám bệnh</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Cập nhật lúc</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                      Không tìm thấy phòng khám phù hợp.
                    </td>
                  </tr>
                ) : (
                  rooms.map((room, index) => (
                    <tr key={room.id} className="text-sm transition-colors hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {(page - 1) * pageSize + index + 1}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono font-semibold text-slate-800">{room.roomid}</td>
                      <td className="max-w-xs px-5 py-4 font-semibold text-slate-800">{room.roomname}</td>
                      <td className="px-5 py-4 text-slate-700">{room.clinic_type || "—"}</td>
                      <td className="max-w-xs px-5 py-4 text-slate-700">{getExamAreaLabel(room) || "—"}</td>
                      <td className="px-5 py-4"><StatusSwitch checked={room.status === "ACTIVE"} loading={togglingId === room.id} onChange={() => onToggleStatus(room)} /></td>
                      <td className="px-5 py-4 text-slate-600">{formatUpdatedAt(room.updated_at || room.synced_at || room.updatetime)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onEdit(room.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-primary transition-colors hover:bg-primary-50"
                            title="Sửa"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDelete(room.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-500 transition-colors hover:bg-red-50"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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
              totalItems={totalItems}
              pageSize={pageSize}
              onPageSizeChange={onPageSizeChange}
            />
          </div>
        </>
      )}
    </div>
  );
}

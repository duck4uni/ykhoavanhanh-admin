import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { LoadingSection } from "@/components/ui/Spinner";
import { TablePagination } from "@/components/ui/TablePagination";
import { StatusSwitch } from "@/components/ui/StatusSwitch";
import type { DoctorWorkSchedule } from "@/api/doctorWorkSchedulesApi";
import {
  SHIFT_LABEL,
  getScheduleCapacity,
  getScheduleDateText,
  getScheduleShiftCode,
  getScheduleTimeText,
} from "../types";
import { SlotBar } from "./ScheduleBadges";
import { getScheduleScopeLabels, summarizeScopeLabels } from "./scheduleScopeLabels";

interface AppointmentScheduleTableProps {
  rows: DoctorWorkSchedule[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  filteredCount: number;
  isDeleting: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (item: DoctorWorkSchedule) => void;
  togglingId: string | null;
  selectedIds?: string[];
  onToggleSelectRow?: (id: string) => void;
  onToggleSelectAll?: (pageRows: DoctorWorkSchedule[]) => void;
  roomLookup?: Map<string, string>;
}

export function AppointmentScheduleTable({
  rows,
  isLoading,
  page,
  pageSize,
  totalPages,
  filteredCount,
  isDeleting,
  onPageChange,
  onPageSizeChange,
  onDelete,
  onToggleStatus,
  togglingId,
  selectedIds = [],
  onToggleSelectRow,
  onToggleSelectAll,
  roomLookup,
}: AppointmentScheduleTableProps) {
  const allCurrentPageSelected =
    rows.length > 0 && rows.every((item) => selectedIds.includes(item.id));
  const someCurrentPageSelected =
    rows.some((item) => selectedIds.includes(item.id)) && !allCurrentPageSelected;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      {isLoading ? (
        <LoadingSection text="Đang tải lịch khám..." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  {onToggleSelectRow && (
                    <th className="w-12 px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={allCurrentPageSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someCurrentPageSelected;
                        }}
                        onChange={() => onToggleSelectAll?.(rows)}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary-500"
                        title="Chọn tất cả trên trang này"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3.5">STT</th>
                  <th className="min-w-[180px] px-6 py-3.5">Bác sĩ</th>
                  <th className="min-w-[160px] px-6 py-3.5">Khu khám</th>
                  <th className="min-w-[240px] px-6 py-3.5">Phòng khám</th>
                  <th className="min-w-[220px] px-6 py-3.5">Dịch vụ khám</th>
                  <th className="min-w-[260px] px-6 py-3.5">Ngày khám</th>
                  <th className="min-w-[150px] px-6 py-3.5">Giờ khám</th>
                  <th className="min-w-[100px] px-6 py-3.5">Ca</th>
                  <th className="min-w-[180px] px-6 py-3.5">Số phiếu khám</th>
                  <th className="px-6 py-3.5">Trạng thái</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={onToggleSelectRow ? 12 : 11} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      Không tìm thấy lịch khám phù hợp.
                    </td>
                  </tr>
                ) : (
                  rows.map((item, index) => {
                    const capacity = getScheduleCapacity(item);
                    const shiftCode = getScheduleShiftCode(item);
                    const legacyRoomName = item.room?.room_name ?? item.room?.roomname ?? item.room_name ?? null;
                    const { roomLabels, serviceLabels } = getScheduleScopeLabels(
                      item,
                      item.room_id,
                      roomLookup,
                      legacyRoomName
                    );
                    const roomSummary = summarizeScopeLabels(roomLabels);
                    const serviceSummary = summarizeScopeLabels(serviceLabels);
                    const isSelected = selectedIds.includes(item.id);

                    return (
                    <tr
                      key={item.id}
                      className={`text-sm transition-colors ${
                        isSelected ? "bg-primary-50/40 hover:bg-primary-50/60" : "hover:bg-slate-50/60"
                      }`}
                    >
                      {onToggleSelectRow && (
                        <td className="w-12 px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelectRow(item.id)}
                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary-500"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 text-slate-500">{(page - 1) * pageSize + index + 1}</td>
                      <td className="min-w-[180px] px-6 py-4 font-semibold text-slate-800">{item.doctor?.doctor_name ?? "—"}</td>
                      <td className="min-w-[160px] px-6 py-4 text-slate-600">{item.exam_area?.name ?? "—"}</td>
                      <td className="min-w-[240px] max-w-[240px] px-6 py-4 text-slate-600" title={roomSummary.title}>
                        <span className="block truncate">{roomSummary.text}</span>
                      </td>
                      <td className="min-w-[220px] max-w-[220px] px-6 py-4 text-slate-600" title={serviceSummary.title}>
                        <span className="block truncate">{serviceSummary.text}</span>
                      </td>
                      <td className="min-w-[260px] whitespace-nowrap px-6 py-4 text-slate-600">{getScheduleDateText(item)}</td>
                      <td className="min-w-[150px] whitespace-nowrap px-6 py-4 text-slate-600">{getScheduleTimeText(item)}</td>
                      <td className="min-w-[100px] px-6 py-4 text-slate-600">{SHIFT_LABEL[shiftCode] ?? (shiftCode || "—")}</td>
                      <td className="min-w-[180px] px-6 py-4"><SlotBar booked={item.booked_count ?? 0} max={capacity} /></td>
                      <td className="px-6 py-4">
                        <StatusSwitch
                          checked={item.status === "ACTIVE"}
                          loading={togglingId === item.id}
                          onChange={() => onToggleStatus(item)}
                          activeLabel={capacity > 0 && item.booked_count >= capacity ? "Đã đầy" : "Hoạt động"}
                          inactiveLabel="Tạm ngưng"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/appointments/${item.id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-primary-200 hover:text-primary">
                            <Pencil className="h-3.5 w-3.5" /> Sửa
                          </Link>
                          <button onClick={() => onDelete(item.id)} disabled={isDeleting} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:border-red-200 hover:bg-red-50 disabled:opacity-50">
                            <Trash2 className="h-3.5 w-3.5" /> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredCount > 0 && (
            <div className="border-t border-slate-100 px-6 py-4">
              <TablePagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} totalItems={filteredCount} pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

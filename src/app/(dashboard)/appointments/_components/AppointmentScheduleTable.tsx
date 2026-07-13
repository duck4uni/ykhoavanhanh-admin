import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { LoadingSection } from "@/components/ui/Spinner";
import { TablePagination } from "@/components/ui/TablePagination";
import { StatusSwitch } from "@/components/ui/StatusSwitch";
import type { DoctorWorkSchedule } from "@/api/doctorWorkSchedulesApi";
import {
  APPOINTMENT_PAGE_SIZE,
  SHIFT_LABEL,
  getScheduleCapacity,
  getScheduleDateText,
  getScheduleShiftCode,
  getScheduleTimeText,
} from "../types";
import { SlotBar } from "./ScheduleBadges";

interface AppointmentScheduleTableProps {
  rows: DoctorWorkSchedule[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  filteredCount: number;
  isDeleting: boolean;
  onPageChange: (page: number) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (item: DoctorWorkSchedule) => void;
  togglingId: string | null;
}

export function AppointmentScheduleTable({
  rows,
  isLoading,
  page,
  totalPages,
  filteredCount,
  isDeleting,
  onPageChange,
  onDelete,
  onToggleStatus,
  togglingId,
}: AppointmentScheduleTableProps) {
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
                  <th className="px-6 py-3.5">STT</th>
                  <th className="px-6 py-3.5">Bác sĩ</th>
                  <th className="px-6 py-3.5">Khu khám</th>
                  <th className="px-6 py-3.5">Ngày khám</th>
                  <th className="px-6 py-3.5">Giờ khám</th>
                  <th className="px-6 py-3.5">Ca</th>
                  <th className="px-6 py-3.5">Số phiếu khám</th>
                  <th className="px-6 py-3.5">Trạng thái</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      Không tìm thấy lịch khám phù hợp.
                    </td>
                  </tr>
                ) : (
                  rows.map((item, index) => {
                    const capacity = getScheduleCapacity(item);
                    const shiftCode = getScheduleShiftCode(item);
                    return (
                    <tr key={item.id} className="text-sm transition-colors hover:bg-slate-50/60">
                      <td className="px-6 py-4 text-slate-500">{(page - 1) * APPOINTMENT_PAGE_SIZE + index + 1}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{item.doctor?.doctor_name ?? "—"}</td>
                      <td className="px-6 py-4 text-slate-600">{item.exam_area?.name ?? "—"}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">{getScheduleDateText(item)}</td>
                      <td className="px-6 py-4 text-slate-600">{getScheduleTimeText(item)}</td>
                      <td className="px-6 py-4 text-slate-600">{SHIFT_LABEL[shiftCode] ?? (shiftCode || "—")}</td>
                      <td className="px-6 py-4"><SlotBar booked={item.booked_count ?? 0} max={capacity} /></td>
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
              <TablePagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} totalItems={filteredCount} pageSize={APPOINTMENT_PAGE_SIZE} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

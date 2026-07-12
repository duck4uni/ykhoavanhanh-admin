import { AlertTriangle, Calendar, Info, Save } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { sortWeekdays, weekdayShortLabel } from "../types";
import type { NewScheduleController } from "../hooks/useNewScheduleForm";

/** Card tóm tắt (cột phải) + nút hành động. */
export function SummaryCard({ ctrl }: { ctrl: NewScheduleController }) {
  const { router, form, scopes, timeSlots, totalSlotCount, warnings, canSubmit, isSaving, doctor } = ctrl;

  return (
    <aside className="space-y-5">
      <section className="sticky top-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Calendar className="h-5 w-5 text-primary-600" /> Tóm tắt lịch khám
        </h2>
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Bác sĩ</span>
            <span className="max-w-[60%] truncate text-right font-medium text-slate-800">
              {doctor.selected?.doctorname || "Chưa chọn"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Ngày khám</span>
            <span className="font-medium text-slate-800">{form.schedule_date || "Chưa chọn"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Phạm vi áp dụng</span>
            <span className="font-medium text-slate-800">{scopes.length}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Khung giờ</span>
            <span className="font-medium text-slate-800">{timeSlots.length}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Thứ áp dụng</span>
            <span className="max-w-[60%] text-right font-medium text-slate-800">
              {sortWeekdays(Array.from(new Set(timeSlots.flatMap((slot) => slot.weekdays))))
                .map((weekday) => weekdayShortLabel(weekday))
                .join(", ") || "Chưa chọn"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Tổng slot</span>
            <span className="font-medium text-slate-800">{totalSlotCount}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Dự kiến hiển thị</span>
            <Badge variant={form.status === "ACTIVE" ? "success" : "default"}>
              {form.status === "ACTIVE" ? "Có" : "Không"}
            </Badge>
          </div>
        </div>

        {warnings.length > 0 ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" /> Cảnh báo cấu hình
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-700">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-primary-100 bg-primary-50 p-4 text-sm text-primary-800">
            <p className="flex items-center gap-2 font-medium">
              <Info className="h-4 w-4" /> Vui lòng kiểm tra lại thông tin trước khi tạo lịch.
            </p>
            <p className="mt-1 text-primary-700">Các phạm vi khám và khung giờ sẽ hiển thị trong danh sách quản lý.</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-[1fr_2fr] gap-3">
          <button
            type="button"
            onClick={() => router.push("/appointments")}
            disabled={isSaving}
            className="h-11 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSaving || !canSubmit}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
            Tạo lịch khám
          </button>
        </div>
      </section>
    </aside>
  );
}

import { Clock, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { weekdayLabels } from "@/lib/hospital-admin";
import { StepBadge } from "./StepBadge";
import { weekdayOrder, weekdayShortLabel, type TimeSlotRow } from "../types";
import type { NewScheduleController } from "../hooks/useNewScheduleForm";

/** Khối 3: Khung giờ làm việc. */
export function TimeSlotSection({ ctrl }: { ctrl: NewScheduleController }) {
  const {
    timeSlots,
    scopes,
    totalSlotCount,
    setAutoGenOpen,
    addSlot,
    updateSlot,
    removeSlot,
    toggleSlotScope,
    toggleSlotWeekday,
    setSlotWeekdays,
    scopeShortLabel,
  } = ctrl;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <StepBadge n={3} /> Khung giờ làm việc
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoGenOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Tự sinh khung giờ
          </button>
          <button
            type="button"
            onClick={addSlot}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50"
          >
            <Plus className="h-3.5 w-3.5" /> Thêm khung giờ
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-[1fr_1fr_110px_1.5fr_1.4fr_64px] bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
            <span>Bắt đầu</span>
            <span>Kết thúc</span>
            <span>Slot khám</span>
            <span>Thứ áp dụng</span>
            <span>Áp dụng cho</span>
            <span className="text-center">Thao tác</span>
          </div>
          <div className="divide-y divide-slate-100">
            {timeSlots.map((slot) => (
              <div key={slot.id} className="grid grid-cols-[1fr_1fr_110px_1.5fr_1.4fr_64px] items-start gap-3 px-3 py-2.5">
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="time"
                    value={slot.start}
                    onChange={(e) => updateSlot(slot.id, { start: e.target.value })}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-2 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                  />
                </div>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="time"
                    value={slot.end}
                    onChange={(e) => updateSlot(slot.id, { end: e.target.value })}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-2 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                  />
                </div>
                <input
                  type="number"
                  min={1}
                  value={slot.slot_limit}
                  onChange={(e) => updateSlot(slot.id, { slot_limit: Number(e.target.value) || 0 })}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                />
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-1.5">
                    {weekdayOrder.map((weekday) => {
                      const label = weekdayLabels[weekday];
                      const checked = slot.weekdays.includes(weekday);
                      return (
                        <button
                          key={weekday}
                          type="button"
                          title={label}
                          onClick={() => toggleSlotWeekday(slot.id, weekday)}
                          className={`h-8 rounded-lg text-xs font-semibold transition-colors ${
                            checked
                              ? "bg-primary-100 text-primary-700 ring-1 ring-primary-300"
                              : "bg-slate-50 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {weekdayShortLabel(weekday)}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSlotWeekdays(slot.id, weekdayOrder)}
                      className="font-medium text-primary-600 hover:text-primary-700"
                    >
                      Chọn cả tuần
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={() => setSlotWeekdays(slot.id, [])}
                      className="font-medium text-slate-500 hover:text-slate-700"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                  {slot.weekdays.length === 0 && (
                    <p className="text-[11px] text-amber-600">Chưa chọn thứ áp dụng</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <select
                    value={slot.scopeMode}
                    onChange={(e) => {
                      const scopeMode = e.target.value as TimeSlotRow["scopeMode"];
                      if (scopeMode === "custom" && scopes.length === 0) {
                        toast.error("Vui lòng thêm ít nhất một phạm vi khám trước.");
                        return;
                      }
                      updateSlot(slot.id, { scopeMode });
                    }}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                  >
                    <option value="all">Tất cả phạm vi</option>
                    <option value="custom">Chọn phạm vi</option>
                  </select>
                  {slot.scopeMode === "custom" && (
                    <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-slate-50/60 p-2">
                      {scopes.map((scope) => {
                        const checked = slot.scope_ids.includes(scope.clientId);
                        return (
                          <button
                            key={scope.clientId}
                            type="button"
                            onClick={() => toggleSlotScope(slot.id, scope.clientId)}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                              checked
                                ? "bg-primary-100 text-primary-700 ring-1 ring-primary-300"
                                : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {scopeShortLabel(scope)}
                          </button>
                        );
                      })}
                      {slot.scope_ids.length === 0 && (
                        <span className="text-[11px] text-amber-600">Chưa chọn phạm vi nào</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeSlot(slot.id)}
                  className="mx-auto mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label="Xóa khung giờ"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {timeSlots.length === 0 && (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                Chưa có khung giờ làm việc. Bấm &quot;Tự sinh khung giờ&quot; hoặc &quot;Thêm khung giờ&quot;.
              </div>
            )}
          </div>
        </div>
        {timeSlots.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Tổng cộng: <b>{timeSlots.length}</b> khung giờ · <b>{totalSlotCount}</b> slot khám · Chọn thứ áp dụng từ Thứ 2 đến Chủ nhật cho từng khung giờ
          </p>
        )}
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Check, ChevronDown, ChevronRight, Clock3, MapPin, Plus, RefreshCw, Ticket, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { weekdayLabels } from "@/lib/hospital-admin";
import { StepBadge } from "./StepBadge";
import { TimeSelect } from "./TimeSelect";
import { getDateSlotLimit } from "../dateSlotOverrides";
import { formatShortLocalDate, weekdayOrder, weekdayShortLabel, type TimeSlotRow } from "../types";
import type { ScheduleEditorController } from "../hooks/useNewScheduleForm";

/** Khối 3: Khung giờ làm việc theo khoảng ngày. */
export function TimeSlotSection({ ctrl }: { ctrl: ScheduleEditorController }) {
  const {
    timeSlots, scopes, totalSlotCount, datesByWeekday, availableWeekdays, dateRangeValid, form,
    setAutoGenOpen, addSlot, updateSlot, removeSlot, toggleSlotScope, toggleSlotWeekday,
    toggleSlotDate, setSlotDateLimit, setSlotWeekdays, scopeShortLabel,
  } = ctrl;
  const crossesYear = Boolean(form.start_date && form.end_date && form.start_date.slice(0, 4) !== form.end_date.slice(0, 4));
  const [collapsedSlotIds, setCollapsedSlotIds] = useState<Set<string>>(() => new Set());
  const [expandedDateRows, setExpandedDateRows] = useState<Set<string>>(() => new Set());
  const [expandedCapacitySlots, setExpandedCapacitySlots] = useState<Set<string>>(() => new Set());
  const slotIds = useMemo(() => timeSlots.map((slot) => slot.id), [timeSlots]);
  const allCollapsed = slotIds.length > 0 && slotIds.every((id) => collapsedSlotIds.has(id));

  useEffect(() => {
    const currentIds = new Set(slotIds);
    setCollapsedSlotIds((previous) => {
      if ([...previous].every((id) => currentIds.has(id))) return previous;
      return new Set([...previous].filter((id) => currentIds.has(id)));
    });
  }, [slotIds]);

  const toggleSlot = (slotId: string) => {
    setCollapsedSlotIds((previous) => {
      const next = new Set(previous);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  };

  const toggleAllSlots = () => {
    setCollapsedSlotIds(allCollapsed ? new Set() : new Set(slotIds));
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><StepBadge n={3} /> Khung giờ làm việc</h2>
          <p className="mt-1 text-xs text-slate-400">Thiết lập giờ khám, số phiếu và các ngày áp dụng trong khoảng đã chọn.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setAutoGenOpen(true)} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"><RefreshCw className="h-3.5 w-3.5" /> Tự sinh khung giờ</button>
          <button type="button" onClick={addSlot} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"><Plus className="h-3.5 w-3.5" /> Thêm khung giờ</button>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        {!dateRangeValid && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <CalendarDays className="mt-0.5 h-4 w-4 flex-shrink-0" /> Chọn ngày bắt đầu và ngày kết thúc hợp lệ để thiết lập các ngày áp dụng.
          </div>
        )}

        {timeSlots.length > 1 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={toggleAllSlots}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              {allCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              {allCollapsed ? "Mở rộng tất cả" : "Thu gọn tất cả"}
            </button>
          </div>
        )}

        {timeSlots.map((slot, index) => {
          const isCollapsed = collapsedSlotIds.has(slot.id);
          return (
          <article key={slot.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className={`flex items-center justify-between gap-3 bg-slate-50/60 px-3 sm:px-4 ${isCollapsed ? "py-2" : "border-b border-slate-100 py-2.5"}`}>
              <button
                type="button"
                onClick={() => toggleSlot(slot.id)}
                aria-expanded={!isCollapsed}
                aria-controls={`time-slot-content-${slot.id}`}
                aria-label={`${isCollapsed ? "Mở rộng" : "Thu gọn"} khung giờ ${index + 1}`}
                title={`${isCollapsed ? "Mở rộng" : "Thu gọn"} khung giờ ${index + 1}`}
                className="group flex min-w-0 flex-1 items-center gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-md text-slate-500 transition-colors group-hover:bg-slate-200/70 group-hover:text-slate-700">
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Khung giờ {index + 1}</span>
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-slate-400" /> <b className="font-medium text-slate-700">{slot.start || "--:--"} – {slot.end || "--:--"}</b></span>
                  <span className="inline-flex items-center gap-1.5"><Ticket className="h-3.5 w-3.5 text-slate-400" /> {slot.slot_limit} phiếu</span>
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-slate-400" /> {slot.weekdays.length} ngày / tuần</span>
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {weekdayOrder.filter((weekday) => slot.weekdays.includes(weekday)).map(weekdayShortLabel).join(", ") || "Chưa chọn"}</span>
                </span>
              </button>
              <button type="button" onClick={() => removeSlot(slot.id)} className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2" aria-label={`Xóa khung giờ ${index + 1}`} title={`Xóa khung giờ ${index + 1}`}><Trash2 className="h-4 w-4" /></button>
            </div>

            {!isCollapsed && <div id={`time-slot-content-${slot.id}`} className="space-y-5 p-4">
                <div className="grid gap-4 xl:grid-cols-[minmax(420px,1.5fr)_minmax(130px,0.45fr)_minmax(260px,1fr)]">
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-xs font-semibold text-slate-700">Thời gian khám</p>
                    <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
                      <TimeInput label="Bắt đầu" value={slot.start} onChange={(value) => updateSlot(slot.id, { start: value })} />
                      <span aria-hidden="true" className="hidden h-10 items-center justify-center text-slate-400 sm:flex">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                      <TimeInput label="Kết thúc" value={slot.end} onChange={(value) => updateSlot(slot.id, { end: value })} />
                    </div>
                  </div>
                  <label className="min-w-0 space-y-1.5">
                    <span className="block text-xs font-semibold text-slate-700">Số phiếu khám</span>
                    <input type="number" min={1} value={slot.slot_limit} onChange={(e) => updateSlot(slot.id, { slot_limit: Number(e.target.value) || 0 })} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10" />
                  </label>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Áp dụng cho phạm vi</label>
                    <select value={slot.scopeMode} onChange={(e) => { const scopeMode = e.target.value as TimeSlotRow["scopeMode"]; if (scopeMode === "custom" && scopes.length === 0) { toast.error("Vui lòng thêm ít nhất một phạm vi khám trước."); return; } updateSlot(slot.id, { scopeMode }); }} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"><option value="all">Tất cả phạm vi</option><option value="custom">Chọn phạm vi</option></select>
                    {slot.scopeMode === "all" ? <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">Khung giờ này áp dụng cho toàn bộ phạm vi khám đã cấu hình.</p> : (
                      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                        {scopes.map((scope) => { const checked = slot.scope_ids.includes(scope.clientId); return <button key={scope.clientId} type="button" aria-pressed={checked} onClick={() => toggleSlotScope(slot.id, scope.clientId)} className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${checked ? "bg-primary-100 text-primary-700 ring-1 ring-primary-300" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100"}`}>{scopeShortLabel(scope)}</button>; })}
                        {slot.scope_ids.length === 0 && <span className="text-[11px] text-amber-600">Chưa chọn phạm vi nào</span>}
                      </div>
                    )}
                  </div>
                </div>
                {slot.start && slot.end && slot.start >= slot.end && (
                  <p className="-mt-2 text-xs text-red-600">Giờ bắt đầu phải nhỏ hơn giờ kết thúc.</p>
                )}

                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ngày áp dụng</p>
                    <div className="flex gap-2 text-[11px]">
                      <button type="button" disabled={!dateRangeValid} onClick={() => setSlotWeekdays(slot.id, availableWeekdays)} className="font-medium text-primary-600 hover:text-primary-700 disabled:cursor-not-allowed disabled:text-slate-300">Chọn tất cả ngày trong khoảng</button>
                      <span className="text-slate-300">·</span>
                      <button type="button" onClick={() => setSlotWeekdays(slot.id, [])} className="font-medium text-slate-500 hover:text-slate-700">Bỏ chọn</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {weekdayOrder.map((weekday) => {
                      const checked = slot.weekdays.includes(weekday);
                      const available = dateRangeValid && availableWeekdays.includes(weekday);
                      return (
                        <button key={weekday} type="button" aria-pressed={checked} disabled={!available} title={available ? weekdayLabels[weekday] : `Không có ${weekdayLabels[weekday]} trong khoảng ngày`} onClick={() => toggleSlotWeekday(slot.id, weekday)} className={`relative min-h-12 rounded-lg px-1.5 py-1.5 text-center transition-colors ${checked ? "bg-primary text-white shadow-sm ring-1 ring-primary" : available ? "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50" : "cursor-not-allowed bg-slate-50 text-slate-300 ring-1 ring-slate-100"}`}>
                          {checked && <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5 rounded-full bg-white p-0.5 text-primary" />}
                          <span className="block text-xs font-semibold">{weekdayShortLabel(weekday)}</span><span className={`mt-0.5 block text-[10px] font-normal ${checked ? "text-white/85" : ""}`}>{datesByWeekday[weekday].length} ngày</span>
                        </button>
                      );
                    })}
                  </div>
                  {slot.weekdays.length > 0 ? (
                    <>
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-primary-700">Chọn ngày cụ thể</p>
                        <p className="text-[11px] text-slate-500">Chọn một hoặc nhiều ngày thuộc các thứ đã chọn.</p>
                      </div>
                      <div className="space-y-2.5">
                        {weekdayOrder.filter((weekday) => slot.weekdays.includes(weekday)).map((weekday) => {
                          const rowKey = `${slot.id}-${weekday}`;
                          const expanded = expandedDateRows.has(rowKey);
                          const weekdayDates = datesByWeekday[weekday];
                          const visibleDates = expanded ? weekdayDates : weekdayDates.slice(0, 10);
                          return (
                            <div key={weekday} className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="w-8 flex-shrink-0 rounded-md bg-white px-1.5 py-1 text-center font-semibold text-primary-700 ring-1 ring-slate-200">{weekdayShortLabel(weekday)}</span>
                              {visibleDates.map((date) => {
                                const selected = slot.dates.includes(date);
                                return (
                                  <button key={date} type="button" aria-pressed={selected} onClick={() => toggleSlotDate(slot.id, weekday, date)} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors ${selected ? "bg-white font-medium text-primary-700 ring-1 ring-primary-400" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:ring-primary-300"}`}>
                                    {formatShortLocalDate(date, crossesYear)}
                                    {selected && <Check className="h-3 w-3 rounded-full bg-primary text-white" />}
                                  </button>
                                );
                              })}
                              {weekdayDates.length > 10 && (
                                <button type="button" onClick={() => setExpandedDateRows((current) => { const next = new Set(current); if (next.has(rowKey)) next.delete(rowKey); else next.add(rowKey); return next; })} className="rounded-md bg-primary-50 px-2.5 py-1 font-medium text-primary-700 hover:bg-primary-100">
                                  {expanded ? "Thu gọn" : `+${weekdayDates.length - 10}`}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-primary-700">Cấu hình số phiếu theo từng ngày đã chọn</p>
                          <p className="mt-1 text-[11px] text-slate-500">Mặc định theo số phiếu chung; chỉ giá trị thay đổi mới được lưu riêng.</p>
                        </div>
                        {slot.dates.length > 6 && (
                          <button type="button" onClick={() => setExpandedCapacitySlots((current) => { const next = new Set(current); if (next.has(slot.id)) next.delete(slot.id); else next.add(slot.id); return next; })} className="rounded-md bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-700 hover:bg-primary-100">
                            {expandedCapacitySlots.has(slot.id) ? "Thu gọn" : `Xem thêm ${slot.dates.length - 6} ngày`}
                          </button>
                        )}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
                        {(expandedCapacitySlots.has(slot.id) ? slot.dates : slot.dates.slice(0, 6)).map((date) => {
                          const weekday = new Date(`${date}T00:00:00`).getDay();
                          return (
                            <div key={date} className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-2">
                              <span className="inline-flex flex-none items-center gap-1.5 rounded-md bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700"><CalendarDays className="h-3.5 w-3.5" /> {formatShortLocalDate(date, crossesYear)}</span>
                              <label className="ml-auto flex min-w-0 items-center gap-1.5 text-[11px] text-slate-500">
                                <span className="whitespace-nowrap">Số phiếu</span>
                                <input type="number" min={1} value={getDateSlotLimit(slot.date_overrides, date, slot.slot_limit)} onChange={(event) => setSlotDateLimit(slot.id, date, Number(event.target.value))} className="h-8 w-16 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10" />
                              </label>
                              <button type="button" onClick={() => toggleSlotDate(slot.id, weekday, date)} aria-label={`Bỏ ngày ${formatShortLocalDate(date, true)}`} className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-md text-red-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    </>
                  ) : <p className="mt-2 text-xs text-amber-600">Chưa chọn ngày áp dụng cho khung giờ này.</p>}
                </div>
            </div>}
          </article>
          );
        })}

        {timeSlots.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-muted-foreground">Chưa có khung giờ làm việc. Bấm &quot;Tự sinh khung giờ&quot; hoặc &quot;Thêm khung giờ&quot;.</div>}
        {timeSlots.length > 0 && <p className="text-sm text-muted-foreground">Tổng cộng: <b>{timeSlots.length}</b> cấu hình khung giờ · <b>{totalSlotCount}</b> phiếu khám cấu hình · Các khung giờ lặp trên những ngày được liệt kê ở từng thẻ.</p>}
      </div>
    </section>
  );
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="min-w-0 space-y-1.5"><span className="block text-xs font-medium text-slate-500">{label}</span><TimeSelect value={value} onChange={onChange} /></label>;
}

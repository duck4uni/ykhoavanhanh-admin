import { Clock, Info, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import type { ExamArea } from "@/api/examAreasApi";
import type { HisDoctor } from "@/api/doctorsApi";
import type { ScheduleFormValues, WorkTimeSlot } from "../types";

interface AppointmentScheduleModalProps {
  open: boolean;
  editingId: string | null;
  form: ScheduleFormValues;
  setForm: React.Dispatch<React.SetStateAction<ScheduleFormValues>>;
  workSlots: WorkTimeSlot[];
  examAreas: ExamArea[];
  doctorList: HisDoctor[];
  isLoadingDoctors: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onUpdateSlot: (id: string, patch: Partial<WorkTimeSlot>) => void;
  onAddSlot: () => void;
  onAutoGenerateSlots: () => void;
  onRemoveSlot: (id: string) => void;
}

export function AppointmentScheduleModal({
  open,
  editingId,
  form,
  setForm,
  workSlots,
  examAreas,
  doctorList,
  isLoadingDoctors,
  isSubmitting,
  onClose,
  onSubmit,
  onUpdateSlot,
  onAddSlot,
  onAutoGenerateSlots,
  onRemoveSlot,
}: AppointmentScheduleModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">{editingId ? "Chỉnh sửa lịch khám" : "Thêm lịch khám mới"}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
            <div className="grid gap-4 md:grid-cols-2">
              {editingId ? (
                <Input label="Bác sĩ *" value={form.doctor_name || "—"} readOnly disabled />
              ) : (
                <Select
                  label="Bác sĩ *"
                  value={form.doctor_id}
                  onChange={(event) => setForm((current) => ({ ...current, doctor_id: event.target.value }))}
                  placeholder={isLoadingDoctors ? "Đang tải danh sách bác sĩ..." : "-- Chọn bác sĩ --"}
                  disabled={isLoadingDoctors}
                  options={doctorList.map((doctor) => ({
                    value: doctor.id,
                    label: doctor.doctorid ? `${doctor.doctorname} (${doctor.doctorid})` : doctor.doctorname,
                  }))}
                />
              )}
              <Select
                label="Khu khám *"
                value={form.exam_area_id}
                onChange={(event) => setForm((current) => ({ ...current, exam_area_id: event.target.value }))}
                options={[{ value: "", label: "-- Chọn khu khám --" }, ...examAreas.map((area) => ({ value: area.id, label: area.name }))]}
              />
              <Input
                label="Ngày khám *"
                type="date"
                value={form.schedule_date}
                onChange={(event) => setForm((current) => ({ ...current, schedule_date: event.target.value }))}
              />
              <Select
                label="Ca khám"
                value={form.shift_code}
                onChange={(event) => setForm((current) => ({ ...current, shift_code: event.target.value }))}
                options={[
                  { value: "MORNING", label: "Sáng" },
                  { value: "AFTERNOON", label: "Chiều" },
                  { value: "EVENING", label: "Tối" },
                  { value: "NIGHT", label: "Đêm" },
                ]}
              />
              <Select
                label="Trạng thái"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ScheduleFormValues["status"] }))}
                options={[
                  { value: "ACTIVE", label: "Hoạt động" },
                  { value: "INACTIVE", label: "Tạm ngưng" },
                ]}
              />
              <Input
                label="Số lượt khám tối đa"
                type="number"
                min={0}
                value={form.max_appointments}
                onChange={(event) => setForm((current) => ({ ...current, max_appointments: Number(event.target.value) || 0 }))}
              />
              <div className="md:col-span-2">
                <Input
                  label="Ghi chú"
                  value={form.note}
                  onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                  placeholder="VD: Ca sáng thứ Tư"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-1.5 text-base font-semibold text-slate-900">
                    Khung giờ làm việc <Info className="h-4 w-4 text-slate-400" />
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">Các khe thời gian gửi trong trường time_slots theo API mới.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={onAutoGenerateSlots} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">
                    <RefreshCw className="h-3.5 w-3.5" /> Tự sinh khung giờ
                  </button>
                  <button type="button" onClick={onAddSlot} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-2.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-100">
                    <Plus className="h-3.5 w-3.5" /> Thêm khung giờ
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="grid grid-cols-[1fr_1fr_120px_72px] bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                  <span>Bắt đầu</span>
                  <span>Kết thúc</span>
                  <span>Slot khám</span>
                  <span className="text-center">Thao tác</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {workSlots.map((slot) => (
                    <div key={slot.id} className="grid grid-cols-[1fr_1fr_120px_72px] items-center gap-3 px-3 py-2">
                      <div className="relative">
                        <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input type="time" value={slot.start} onChange={(event) => onUpdateSlot(slot.id, { start: event.target.value })} className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10" />
                      </div>
                      <div className="relative">
                        <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input type="time" value={slot.end} onChange={(event) => onUpdateSlot(slot.id, { end: event.target.value })} className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10" />
                      </div>
                      <div className="flex h-10 overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <input type="number" min={0} value={slot.max_appointments} onChange={(event) => onUpdateSlot(slot.id, { max_appointments: Number(event.target.value) || 0 })} className="min-w-0 flex-1 px-3 text-sm outline-none" />
                        <span className="flex items-center border-l border-slate-200 px-2 text-xs text-slate-500">slot</span>
                      </div>
                      <button type="button" onClick={() => onRemoveSlot(slot.id)} className="mx-auto inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600" aria-label="Xóa khung giờ">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {workSlots.length === 0 && <div className="px-3 py-6 text-center text-sm text-muted-foreground">Chưa có khung giờ làm việc.</div>}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Tổng cộng: <b>{workSlots.length}</b> khung giờ · <b>{workSlots.reduce((sum, slot) => sum + slot.max_appointments, 0)}</b> slot khám
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t border-slate-100 p-6">
            <button type="submit" disabled={isSubmitting} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60">
              {isSubmitting && <Spinner size="sm" />}
              {editingId ? "Lưu thay đổi" : "Tạo lịch khám"}
            </button>
            <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200">
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

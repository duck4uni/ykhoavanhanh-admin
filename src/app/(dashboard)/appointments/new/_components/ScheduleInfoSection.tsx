import { CalendarDays } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StepBadge } from "./StepBadge";
import { DoctorCombobox } from "./DoctorCombobox";
import { todayISO, type ScheduleForm } from "../types";
import type { ScheduleEditorController } from "../hooks/useNewScheduleForm";

/** Khối 1: Thông tin lịch khám (bác sĩ, ngày, trạng thái, ghi chú). */
export function ScheduleInfoSection({ ctrl }: { ctrl: ScheduleEditorController }) {
  const { form, setForm, doctor, dateRangeError, mode } = ctrl;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <StepBadge n={1} /> Thông tin lịch khám
        </h2>
      </div>
      <div className="space-y-4 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DoctorCombobox
            value={form.doctor_id}
            doctors={doctor.list}
            search={doctor.search}
            isLoading={doctor.isLoading}
            hasMore={doctor.hasMore}
            onChange={(doctorId) => setForm((p) => ({ ...p, doctor_id: doctorId }))}
            onSearchChange={doctor.setSearch}
            onLoadMore={doctor.loadMore}
          />
          <DatePicker
            label="Ngày bắt đầu"
            required
            min={mode === "create" ? todayISO() : undefined}
            value={form.start_date}
            onChange={(startDate) => setForm((p) => ({ ...p, start_date: startDate }))}
          />
          <DatePicker
            label="Ngày kết thúc"
            required
            min={form.start_date || (mode === "create" ? todayISO() : undefined)}
            value={form.end_date}
            error={dateRangeError}
            onChange={(endDate) => setForm((p) => ({ ...p, end_date: endDate }))}
          />
          <Select
            label="Trạng thái"
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ScheduleForm["status"] }))}
            options={[
              { value: "ACTIVE", label: "Hoạt động" },
              { value: "INACTIVE", label: "Tạm ngưng" },
            ]}
          />
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">
          <CalendarDays className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>Lịch sẽ lặp theo các thứ đã chọn trong toàn bộ khoảng ngày, bao gồm cả ngày bắt đầu và ngày kết thúc.</p>
        </div>

        <Input
          label="Ghi chú"
          value={form.note}
          onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
          placeholder="VD: Lịch khám buổi sáng trong tháng"
        />
      </div>
    </section>
  );
}

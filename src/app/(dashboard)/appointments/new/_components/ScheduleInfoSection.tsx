import { Building2, Layers, Stethoscope } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StepBadge } from "./StepBadge";
import { DoctorCombobox } from "./DoctorCombobox";
import { todayISO, type ScheduleForm } from "../types";
import type { NewScheduleController } from "../hooks/useNewScheduleForm";

/** Khối 1: Thông tin lịch khám (bác sĩ, ngày, trạng thái, ghi chú). */
export function ScheduleInfoSection({ ctrl }: { ctrl: NewScheduleController }) {
  const { form, setForm, doctor, specialtyTotal, serviceTotal, areaTotal } = ctrl;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <StepBadge n={1} /> Thông tin lịch khám
        </h2>
      </div>
      <div className="space-y-4 p-6">
        <div className="grid gap-4 md:grid-cols-3">
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
          <Input
            label="Ngày khám *"
            type="date"
            min={todayISO()}
            value={form.schedule_date}
            onChange={(e) => setForm((p) => ({ ...p, schedule_date: e.target.value }))}
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

        <div className="grid gap-4 md:grid-cols-[minmax(0,320px)_1fr]">
          {/* Mini card năng lực (tổng danh mục) */}
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-2">
            <div className="flex flex-col items-center justify-center rounded-lg bg-white px-2 py-3 text-center">
              <Stethoscope className="mb-1 h-4 w-4 text-primary-600" />
              <span className="text-base font-bold text-slate-900">{specialtyTotal}</span>
              <span className="text-[11px] text-muted-foreground">chuyên khoa</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg bg-white px-2 py-3 text-center">
              <Layers className="mb-1 h-4 w-4 text-primary-600" />
              <span className="text-base font-bold text-slate-900">{serviceTotal}</span>
              <span className="text-[11px] text-muted-foreground">dịch vụ</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg bg-white px-2 py-3 text-center">
              <Building2 className="mb-1 h-4 w-4 text-primary-600" />
              <span className="text-base font-bold text-slate-900">{areaTotal}</span>
              <span className="text-[11px] text-muted-foreground">khu vực khám</span>
            </div>
          </div>
          <Input
            label="Ghi chú"
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            placeholder="VD: Ca sáng thứ Tư"
          />
        </div>
      </div>
    </section>
  );
}

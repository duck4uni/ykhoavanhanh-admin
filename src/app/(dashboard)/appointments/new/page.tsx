"use client";

import { ArrowLeft } from "lucide-react";
import { useNewScheduleForm } from "./hooks/useNewScheduleForm";
import { ScheduleInfoSection } from "./_components/ScheduleInfoSection";
import { ScopeSection } from "./_components/ScopeSection";
import { TimeSlotSection } from "./_components/TimeSlotSection";
import { SummaryCard } from "./_components/SummaryCard";
import { ScopeModal } from "./_components/ScopeModal";
import { AutoGenModal } from "./_components/AutoGenModal";

export default function NewAppointmentSchedulePage() {
  const ctrl = useNewScheduleForm();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => ctrl.router.back()}
          className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Thêm lịch khám mới</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tạo lịch làm việc và cấu hình phạm vi khám cho bác sĩ.</p>
        </div>
      </div>

      <form onSubmit={ctrl.handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <ScheduleInfoSection ctrl={ctrl} />
          <ScopeSection ctrl={ctrl} />
          <TimeSlotSection ctrl={ctrl} />
        </div>
        <SummaryCard ctrl={ctrl} />
      </form>

      <ScopeModal ctrl={ctrl} />
      <AutoGenModal ctrl={ctrl} />
    </div>
  );
}

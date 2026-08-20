"use client";

import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { LoadingSection } from "@/components/ui/Spinner";
import { useScheduleForm, type ScheduleEditorMode } from "../hooks/useNewScheduleForm";
import { ScheduleInfoSection } from "./ScheduleInfoSection";
import { ScopeSection } from "./ScopeSection";
import { TimeSlotSection } from "./TimeSlotSection";
import { SummaryCard } from "./SummaryCard";
import { ScopeModal } from "./ScopeModal";
import { AutoGenModal } from "./AutoGenModal";

export function ScheduleEditorPage({ mode, scheduleId }: { mode: ScheduleEditorMode; scheduleId?: string }) {
  const ctrl = useScheduleForm({ mode, scheduleId });
  const isEdit = mode === "edit";

  if (ctrl.isDetailLoading) {
    return <div className="p-6"><LoadingSection text="Đang tải lịch khám..." /></div>;
  }

  if (ctrl.detailError) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-4 text-xl font-bold text-slate-900">Không thể tải lịch khám</h1>
          <p className="mt-2 text-sm text-slate-500">{ctrl.detailError.message}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button type="button" onClick={() => ctrl.router.push("/appointments")} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">Quay lại</button>
            <button type="button" onClick={() => void ctrl.retryDetail()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"><RefreshCw className="h-4 w-4" /> Thử lại</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start gap-4">
        <button type="button" onClick={() => ctrl.router.back()} className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{isEdit ? "Chỉnh sửa lịch khám" : "Thêm lịch khám mới"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{isEdit ? "Cập nhật lịch làm việc và phạm vi khám của bác sĩ." : "Tạo lịch làm việc và cấu hình phạm vi khám cho bác sĩ."}</p>
        </div>
      </div>

      <form onSubmit={ctrl.handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
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

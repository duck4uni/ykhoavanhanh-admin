"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useNewMedicalRecordForm } from "./hooks/useNewMedicalRecordForm";
import { PatientPicker } from "./_components/PatientPicker";
import { ExamInfoSection } from "./_components/ExamInfoSection";
import { MedicalContentSection } from "./_components/MedicalContentSection";
import { CostSection } from "./_components/CostSection";
import { RecordSummary } from "./_components/RecordSummary";

export default function NewMedicalRecordPage() {
  const ctrl = useNewMedicalRecordForm();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" className="h-10 gap-2 text-primary-700 hover:bg-primary-50" onClick={() => ctrl.router.back()}>
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tạo hồ sơ bệnh án</h1>
            <p className="mt-1 text-sm text-muted-foreground">Chọn bệnh nhân có sẵn và tạo hồ sơ khám bệnh</p>
          </div>
        </div>
      </div>

      <form onSubmit={ctrl.handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <PatientPicker ctrl={ctrl} />
          <ExamInfoSection ctrl={ctrl} />
          <MedicalContentSection ctrl={ctrl} />
          {/* <CostSection ctrl={ctrl} /> */}
        </div>

        <RecordSummary ctrl={ctrl} />
      </form>
    </div>
  );
}

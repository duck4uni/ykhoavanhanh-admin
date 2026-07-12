"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useNewPatientForm } from "./hooks/useNewPatientForm";
import { IdentitySection } from "./_components/IdentitySection";
import { DocumentSection } from "./_components/DocumentSection";
import { ContactSection } from "./_components/ContactSection";
import { PatientSummary } from "./_components/PatientSummary";

export default function NewPatientPage() {
  const ctrl = useNewPatientForm();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" className="h-10 gap-2 text-primary-700 hover:bg-primary-50" onClick={() => ctrl.router.back()}>
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Thêm bệnh nhân mới</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tạo hồ sơ bệnh nhân mới trong hệ thống</p>
          </div>
        </div>
      </div>

      <form onSubmit={ctrl.handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <IdentitySection ctrl={ctrl} />
          <DocumentSection ctrl={ctrl} />
          <ContactSection ctrl={ctrl} />
        </div>

        <PatientSummary ctrl={ctrl} />
      </form>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/Card";
import { SectionTitle, TextArea } from "./primitives";
import type { NewMedicalRecordController } from "../hooks/useNewMedicalRecordForm";

/** Bước 3: nội dung khám bệnh. */
export function MedicalContentSection({ ctrl }: { ctrl: NewMedicalRecordController }) {
  const { form, handleChange } = ctrl;

  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <SectionTitle step={3} title="Nội dung khám bệnh" />
      <CardContent className="space-y-4 pt-2">
        <div className="grid gap-4">
          <TextArea label="Triệu chứng chính" name="chief_complaint" value={form.chief_complaint} onChange={handleChange} placeholder="Lý do khám / triệu chứng chính" />
          <TextArea label="Chẩn đoán" name="diagnosis" value={form.diagnosis} onChange={handleChange} placeholder="Chẩn đoán của bác sĩ" />
          <TextArea label="Kết luận" name="conclusion" value={form.conclusion} onChange={handleChange} placeholder="Kết luận" />
          <TextArea label="Kế hoạch điều trị" name="treatment_plan" value={form.treatment_plan} onChange={handleChange} placeholder="Hướng điều trị, kê đơn..." />
          <TextArea label="Ghi chú của bác sĩ" name="doctor_note" value={form.doctor_note} onChange={handleChange} placeholder="Ghi chú thêm" />
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SectionTitle } from "./primitives";
import { inputClass, selectClass } from "../types";
import type { NewPatientController } from "../hooks/useNewPatientForm";

/** Bước 1: Thông tin định danh. */
export function IdentitySection({ ctrl }: { ctrl: NewPatientController }) {
  const { form, setForm, handleChange } = ctrl;

  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <SectionTitle step={1} title="Thông tin định danh" />
      <CardContent className="space-y-4 pt-2">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            className={inputClass}
            label="Mã bệnh nhân (HIS) *"
            name="his_patient_id"
            value={form.his_patient_id}
            onChange={handleChange}
            placeholder="VD: BN-2025-001"
            hint="Mã duy nhất trong cơ sở y tế"
            required
          />
          <div />
          <Input className={inputClass} label="Họ, chữ lót *" name="patient_last_name" value={form.patient_last_name} onChange={handleChange} placeholder="Nhập họ, chữ lót" required />
          <Input className={inputClass} label="Tên *" name="patient_first_name" value={form.patient_first_name} onChange={handleChange} placeholder="Nhập tên" required />
          <Input className={inputClass} label="Ngày sinh" name="birthday" type="date" value={form.birthday} onChange={handleChange} />
          <Select
            label="Giới tính"
            value={form.sex}
            onValueChange={(val) => setForm((prev) => ({ ...prev, sex: val }))}
            options={[{ value: "MALE", label: "Nam" }, { value: "FEMALE", label: "Nữ" }]}
            placeholder="Chọn giới tính"
            className={selectClass}
          />
          <Input className={inputClass} label="Dân tộc" name="ethnic_name" value={form.ethnic_name} onChange={handleChange} placeholder="Nhập dân tộc" />
          <Input className={inputClass} label="Nghề nghiệp" name="profession_name" value={form.profession_name} onChange={handleChange} placeholder="Nhập nghề nghiệp" />
        </div>
      </CardContent>
    </Card>
  );
}

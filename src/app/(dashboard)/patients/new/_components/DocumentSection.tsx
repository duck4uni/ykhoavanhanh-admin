import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SectionTitle } from "./primitives";
import { inputClass } from "../types";
import type { NewPatientController } from "../hooks/useNewPatientForm";

/** Bước 2: Thông tin giấy tờ. */
export function DocumentSection({ ctrl }: { ctrl: NewPatientController }) {
  const { form, handleChange } = ctrl;

  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <SectionTitle step={2} title="Thông tin giấy tờ" />
      <CardContent className="space-y-4 pt-2">
        <div className="grid gap-4 md:grid-cols-2">
          <Input className={inputClass} label="Số CCCD" name="identity_number" value={form.identity_number} onChange={handleChange} placeholder="Nhập số CCCD" hint="CCCD gồm 12 chữ số" />
          <Input className={inputClass} label="Mã BHYT" name="insurance_number" value={form.insurance_number} onChange={handleChange} placeholder="Nhập mã BHYT" />
          <Input className={inputClass} label="Hạn BHYT" name="insurance_expired_date_text" type="date" value={form.insurance_expired_date_text} onChange={handleChange} />
        </div>
      </CardContent>
    </Card>
  );
}

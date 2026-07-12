import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SectionTitle } from "./primitives";
import { inputClass, selectClass } from "../types";
import type { NewMedicalRecordController } from "../hooks/useNewMedicalRecordForm";

/** Bước 4: chi phí & trạng thái. */
export function CostSection({ ctrl }: { ctrl: NewMedicalRecordController }) {
  const { form, setForm } = ctrl;

  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <SectionTitle step={4} title="Chi phí & trạng thái" />
      <CardContent className="space-y-4 pt-2">
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            className={inputClass}
            label="Tổng chi phí (VNĐ)"
            name="total_amount"
            inputMode="numeric"
            value={form.total_amount}
            onChange={(e) => setForm((prev) => ({ ...prev, total_amount: e.target.value.replace(/\D/g, "") }))}
            placeholder="0"
          />
          <Select
            label="Trạng thái thanh toán"
            value={form.payment_status}
            onValueChange={(val) => setForm((prev) => ({ ...prev, payment_status: val }))}
            options={[
              { value: "UNPAID", label: "Chờ thanh toán" },
              { value: "PAID", label: "Đã thanh toán" },
              { value: "PARTIAL", label: "Thanh toán 1 phần" },
            ]}
            className={selectClass}
          />
          <Select
            label="Trạng thái hồ sơ"
            value={form.record_status}
            onValueChange={(val) => setForm((prev) => ({ ...prev, record_status: val }))}
            options={[
              { value: "COMPLETED", label: "Hoàn tất" },
              { value: "DRAFT", label: "Nháp" },
              { value: "CANCELLED", label: "Đã hủy" },
            ]}
            className={selectClass}
          />
        </div>
      </CardContent>
    </Card>
  );
}

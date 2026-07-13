import { Building2, CalendarDays, ClipboardList, IdCard, Phone, ShieldCheck, UserRound } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { SummaryRow } from "./primitives";
import { formatDateLabel } from "../types";
import type { NewPatientController } from "../hooks/useNewPatientForm";

/** Cột phải: tóm tắt hồ sơ + nút hành động. */
export function PatientSummary({ ctrl }: { ctrl: NewPatientController }) {
  const { router, form, fullName, isSaving } = ctrl;

  return (
    <div className="space-y-5">
      <Card className="sticky top-6 rounded-2xl border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <ClipboardList className="h-5 w-5 text-primary-600" /> Tóm tắt hồ sơ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-4 border-b border-slate-100 pb-5">
            <SummaryRow icon={IdCard} label="Mã BN" value={form.his_patient_id || "Chưa nhập"} />
            <SummaryRow icon={UserRound} label="Họ tên" value={fullName || "Chưa nhập"} />
            <SummaryRow icon={CalendarDays} label="Ngày sinh" value={formatDateLabel(form.birthday)} />
            <SummaryRow icon={Phone} label="SĐT" value={form.phone_number || "Chưa nhập"} />
            <SummaryRow icon={ShieldCheck} label="BHYT" value={form.insurance_number || "Chưa nhập"} />
            <SummaryRow icon={Building2} label="Cơ sở" value="Mặc định" />
          </div>

          <div className="rounded-xl border border-primary-100 bg-primary-50 p-4 text-sm text-primary-800">
            <p className="font-medium">Vui lòng kiểm tra kỹ thông tin trước khi tạo hồ sơ.</p>
            <p className="mt-1 text-primary-700">Mã bệnh nhân phải là duy nhất trong cơ sở y tế.</p>
          </div>

          <div className="grid grid-cols-[1fr_2fr] gap-3 pt-1">
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => router.back()}>Hủy</Button>
            <Button type="submit" variant="primary" className="h-11 rounded-xl" disabled={isSaving}>
              {isSaving ? <><Spinner size="sm" className="mr-2" />Đang lưu...</> : "Tạo bệnh nhân"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

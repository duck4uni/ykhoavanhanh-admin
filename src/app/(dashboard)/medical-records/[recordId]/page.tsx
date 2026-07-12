"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSection } from "@/components/ui/Spinner";
import { medicalRecordsHooks } from "@/api/medicalRecordsApi";
import { formatDateTime, formatCurrency } from "@/lib/utils";

function toNumber(v: string | number | null): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v) || 0;
}

const PAYMENT_LABEL: Record<string, { label: string; variant: "success" | "warning" | "info" }> = {
  PAID: { label: "Đã thanh toán", variant: "success" },
  UNPAID: { label: "Chờ thanh toán", variant: "warning" },
  PARTIAL: { label: "Thanh toán 1 phần", variant: "info" },
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-gray-500">{label}:</span>{" "}
      <span className="ml-1 font-medium">{value ?? "—"}</span>
    </div>
  );
}

export default function MedicalRecordDetailPage() {
  const { recordId } = useParams<{ recordId: string }>();
  const router = useRouter();
  const { data: record, isLoading } = medicalRecordsHooks.useDetail(recordId);

  if (isLoading) return <LoadingSection text="Đang tải hồ sơ bệnh án..." />;

  if (!record)
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Không tìm thấy hồ sơ bệnh án.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Quay lại
        </Button>
      </div>
    );

  const payment = PAYMENT_LABEL[record.payment_status] ?? { label: record.payment_status || "—", variant: "info" as const };
  const total = toNumber(record.total_amount);
  const paid = toNumber(record.paid_amount);
  const remaining = Math.max(0, total - paid);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>← Quay lại</Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Hồ sơ bệnh án</h1>
          <p className="mt-0.5 text-sm text-gray-500">Mã hồ sơ: {record.record_code}</p>
        </div>
        <Badge variant={payment.variant}>{payment.label}</Badge>
      </div>

      {/* Thông tin khám */}
      <Card>
        <CardHeader><CardTitle>Thông tin khám</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Bệnh nhân" value={record.patient?.patient_full_name} />
          <Field label="SĐT" value={record.patient?.phone_number} />
          <Field label="Bác sĩ" value={record.doctor?.doctor_name} />
          <Field label="Chuyên khoa" value={record.specialty?.name} />
          <Field label="Phòng khám" value={record.room?.room_name} />
          <Field label="Dịch vụ" value={record.service?.service_name} />
          <Field label="Ngày khám" value={formatDateTime(record.examined_at)} />
          <Field label="Cơ sở" value={record.facility?.facility_name} />
          {record.chief_complaint && (
            <div className="col-span-2"><Field label="Triệu chứng chính" value={record.chief_complaint} /></div>
          )}
          <div className="col-span-2">
            <span className="text-gray-500">Chẩn đoán:</span>{" "}
            <span className="ml-1 font-semibold text-primary-700">{record.diagnosis ?? "—"}</span>
          </div>
          {record.conclusion && (
            <div className="col-span-2"><Field label="Kết luận" value={record.conclusion} /></div>
          )}
          {record.treatment_plan && (
            <div className="col-span-2">
              <span className="text-gray-500">Kế hoạch điều trị:</span>
              <p className="mt-1 leading-relaxed text-gray-700">{record.treatment_plan}</p>
            </div>
          )}
          {record.doctor_note && (
            <div className="col-span-2">
              <span className="text-gray-500">Ghi chú bác sĩ:</span>
              <p className="mt-1 leading-relaxed text-gray-700">{record.doctor_note}</p>
            </div>
          )}
          {record.patient_note && (
            <div className="col-span-2">
              <span className="text-gray-500">Ghi chú bệnh nhân:</span>
              <p className="mt-1 leading-relaxed text-gray-700">{record.patient_note}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chi phí */}
      {/* <Card>
        <CardHeader><CardTitle>Chi phí</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-secondary p-4">
              <p className="text-xs text-muted-foreground">Tổng chi phí</p>
              <p className="mt-1 text-lg font-bold text-foreground">{formatCurrency(total)}</p>
            </div>
            <div className="rounded-xl bg-surface-secondary p-4">
              <p className="text-xs text-muted-foreground">Đã thanh toán</p>
              <p className="mt-1 text-lg font-bold text-success">{formatCurrency(paid)}</p>
            </div>
            <div className="rounded-xl bg-surface-secondary p-4">
              <p className="text-xs text-muted-foreground">Còn lại</p>
              <p className="mt-1 text-lg font-bold text-warning">{formatCurrency(remaining)}</p>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}

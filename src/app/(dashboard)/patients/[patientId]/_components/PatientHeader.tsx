import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Patient } from "@/types/patient";
import { getAge, getFullName, getGender, getPatientCode } from "../types";

type PatientHeaderProps = {
  patient: Patient;
  patientId: string;
  bookingsCount: number;
  onBack: () => void;
};

export function PatientHeader({ patient, patientId, bookingsCount, onBack }: PatientHeaderProps) {
  const fullName = getFullName(patient);
  const patientCode = getPatientCode(patient);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-4">
        <Button variant="outline" className="h-10 gap-2 rounded-xl" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{fullName}</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-success-light px-3 py-1 text-xs font-semibold text-success">
              <ShieldCheck className="h-3.5 w-3.5" /> Hồ sơ chính
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span>
              Mã bệnh nhân: <b>{patientCode}</b>
            </span>
            <span>•</span>
            <span>{getGender(patient.sex)}</span>
            <span>•</span>
            <span>
              {patient.birthday
                ? `${formatDate(patient.birthday)} (${getAge(patient.birthday, patient.birth_year)})`
                : getAge(patient.birthday, patient.birth_year)}
            </span>
            <span>•</span>
            <span>{patient.phone_number ?? "—"}</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="rounded-lg bg-success-light px-2.5 py-1 text-success">Đã đồng bộ HIS</span>
            <span className="rounded-lg bg-primary-100 px-2.5 py-1 text-primary-600">
              {patient.insurance_number ? "Có BHYT" : "Chưa có BHYT"}
            </span>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">Nguồn: Mobile App</span>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">{bookingsCount} lượt đặt khám</span>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">
              Lần cập nhật: {patient.his_updated_at ? formatDateTime(patient.his_updated_at) : "—"}
            </span>
          </div>
        </div>
      </div>
      <Link href={`/medical-records/new?patientId=${patientId}`}>
        <Button variant="primary" className="h-11 gap-2 rounded-xl px-5">
          <FileText className="h-4 w-4" /> Tạo hồ sơ bệnh án
        </Button>
      </Link>
    </div>
  );
}

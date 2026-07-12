import type { Patient, SearchPatientParams } from "@/types/patient";

export const PATIENT_PAGE_SIZE = 8;

export const inputClass = "h-11 rounded-xl border-slate-200 bg-white shadow-none focus-visible:ring-primary-500/10";
export const selectClass = "h-11 rounded-xl border-slate-200 bg-white shadow-none focus-visible:ring-primary-500/10";

export type MedicalRecordForm = {
  examined_at: string;
  doctor_id: string;
  specialty_id: string;
  chief_complaint: string;
  diagnosis: string;
  conclusion: string;
  treatment_plan: string;
  doctor_note: string;
  total_amount: string;
  payment_status: string;
  record_status: string;
};

export const createInitialForm = (): MedicalRecordForm => ({
  examined_at: "",
  doctor_id: "",
  specialty_id: "",
  chief_complaint: "",
  diagnosis: "",
  conclusion: "",
  treatment_plan: "",
  doctor_note: "",
  total_amount: "",
  payment_status: "UNPAID",
  record_status: "COMPLETED",
});

export function patientFullName(p: Patient): string {
  return (
    p.patient_full_name ||
    [p.patient_last_name, p.patient_first_name].filter(Boolean).join(" ") ||
    "—"
  );
}

/** Suy ra param tìm kiếm: SĐT (bắt đầu "0", 10–11 số) vs mã BN (số/chữ) vs tên. */
export function buildPatientSearchParams(trimmed: string): SearchPatientParams {
  if (!trimmed) return {};
  if (/^\d+$/.test(trimmed)) {
    const isPhone = trimmed.startsWith("0") && trimmed.length >= 10 && trimmed.length <= 11;
    return isPhone ? { patientphonenumber: trimmed } : { patientcode: trimmed };
  }
  if (!/\s/.test(trimmed) && /\d/.test(trimmed)) return { patientcode: trimmed };
  return { patientname: trimmed };
}

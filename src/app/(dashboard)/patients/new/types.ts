export const FALLBACK_FACILITY_ID = "6b7caa40-1a83-4449-8b69-e8d19567c0f7";

export const inputClass = "h-11 rounded-xl border-slate-200 bg-white shadow-none focus-visible:ring-primary-500/10";
export const selectClass = "h-11 rounded-xl border-slate-200 bg-white shadow-none focus-visible:ring-primary-500/10";

export type NewPatientForm = {
  his_patient_id: string;
  patient_last_name: string;
  patient_first_name: string;
  birthday: string;
  sex: string;
  ethnic_name: string;
  profession_name: string;
  identity_number: string;
  insurance_number: string;
  insurance_expired_date_text: string;
  phone_number: string;
  address_detail: string;
  address_street: string;
  province_code: string;
  province_name: string;
  ward_code: string;
  ward_name: string;
  country_code: string;
  country_name: string;
};

export const createInitialForm = (): NewPatientForm => ({
  his_patient_id: "",
  patient_last_name: "",
  patient_first_name: "",
  birthday: "",
  sex: "",
  ethnic_name: "",
  profession_name: "",
  identity_number: "",
  insurance_number: "",
  insurance_expired_date_text: "",
  phone_number: "",
  address_detail: "",
  address_street: "",
  province_code: "",
  province_name: "",
  ward_code: "",
  ward_name: "",
  country_code: "VN",
  country_name: "Việt Nam",
});

export function formatDateLabel(value: string): string {
  if (!value) return "Chưa nhập";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

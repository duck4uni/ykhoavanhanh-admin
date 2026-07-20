export interface Patient {
  id: string;
  facility_id: string | null;
  his_patient_id: string | null;
  patient_first_name: string | null;
  patient_last_name: string | null;
  patient_full_name: string | null;
  national_code: string | null;
  birthday: string | null;
  birth_year: string | null;
  sex: string | null;
  ethnic_code: string | null;
  phone_number: string | null;
  address_detail: string | null;
  address_street: string | null;
  ward_code: string | null;
  district_code: string | null;
  province_code: string | null;
  country_code: string | null;
  profession_id: string | null;
  identity_number: string | null;
  insurance_number: string | null;
  insurance_expired_date_text: string | null;
  id_card_code: string | null;
  ethnic_name: string | null;
  ward_name: string | null;
  district_name: string | null;
  province_name: string | null;
  country_name: string | null;
  profession_name: string | null;
  address_full: string | null;
  his_updated_at: string | null;
  raw_data: Record<string, unknown> | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchPatientParams {
  ip?: string;
  /** Trang hiện tại */
  currentPage?: number;
  /** Số bản ghi mỗi trang (tối đa 100) */
  pageSize?: number;
  /** Mã đơn vị (lọc theo cơ sở) */
  idbv?: string;
  /** Mã bệnh nhân HIS (tìm chính xác) */
  patientcode?: string;
  /** Số điện thoại hoặc số CCCD (tìm gần đúng) */
  patientphonenumber?: string;
  /** Tên bệnh nhân (tìm gần đúng) */
  patientname?: string;
  /** Bộ lọc thô dạng field==value, nhiều điều kiện nối dấu phẩy */
  filters?: string;
}

export interface CreatePatientPayload {
  patientid: string;
  patientfirstname: string;
  patientlastname: string;
  patientnational?: string;
  patientbirthday?: string;
  patientbirthyear?: string;
  patientsex?: string;
  patientethnic?: string;
  patientphonenumber?: string;
  identifynumber?: string;
  insurancenumber?: string;
  addressdetail?: string;
  addressstreet?: string;
  addressward?: string;
  addresscity?: string;
  addressprovince?: string;
  addresscountry?: string;
  professionid?: string;
}
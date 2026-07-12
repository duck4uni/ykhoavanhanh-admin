/**
 * Admin Patients API — Tạo hồ sơ bệnh nhân (HIS patient)
 * Resource: POST /users/admin/patient
 * Base: /api/v1.0 (via axios baseURL)
 * Docs: src/docs/api/admin-patients-api.md
 */

import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { apiPost } from "@/lib/axios";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface AdminPatient {
  id: string;
  facility_id: string;
  his_patient_id: string;
  patient_first_name: string | null;
  patient_last_name: string | null;
  patient_full_name: string;
  national_code: string | null;
  birthday: string | null;
  birth_year: string | null;
  sex: string | null;
  ethnic_code: string | null;
  ethnic_name: string | null;
  phone_number: string | null;
  address_detail: string | null;
  address_street: string | null;
  ward_code: string | null;
  ward_name: string | null;
  district_code: string | null;
  district_name: string | null;
  province_code: string | null;
  province_name: string | null;
  country_code: string | null;
  country_name: string | null;
  profession_id: string | null;
  profession_name: string | null;
  identity_number: string | null;
  insurance_number: string | null;
  insurance_expired_date_text: string | null;
  id_card_code: string | null;
  address_full: string | null;
  his_updated_at: string | null;
  raw_data: unknown | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
  facility?: { id: string; idbv: string; facility_name: string };
}

export interface CreateAdminPatientPayload {
  facility_id: string;
  his_patient_id: string;
  patient_full_name: string;
  patient_first_name?: string;
  patient_last_name?: string;
  national_code?: string;
  birthday?: string;
  birth_year?: string;
  sex?: string;
  ethnic_code?: string;
  ethnic_name?: string;
  phone_number?: string;
  identity_number?: string;
  insurance_number?: string;
  insurance_expired_date_text?: string;
  id_card_code?: string;
  profession_id?: string;
  profession_name?: string;
  address_street?: string;
  address_detail?: string;
  ward_code?: string;
  ward_name?: string;
  district_code?: string;
  district_name?: string;
  province_code?: string;
  province_name?: string;
  country_code?: string;
  country_name?: string;
  address_full?: string;
  his_updated_at?: string;
  raw_data?: unknown;
}

// ─── Query Keys ────────────────────────────────────────────────────────────

export const adminPatientsKeys = {
  all: ["admin-patients"] as const,
};

// Endpoint /users/admin/patient trả envelope { success, message, data }
// khác chuẩn { status, responseData } của app — hỗ trợ cả hai.
type AdminPatientResponse = {
  status?: "success" | "fail";
  success?: boolean;
  responseData?: AdminPatient | null;
  data?: AdminPatient | null;
  message?: string;
  message_en?: string;
};

// ─── Service ───────────────────────────────────────────────────────────────

export const adminPatientsService = {
  create: async (payload: CreateAdminPatientPayload): Promise<AdminPatient> => {
    const res = await apiPost<AdminPatient>("/users/admin/patient", payload);
    const data = res.data as AdminPatientResponse;
    const responseData = data.responseData ?? data.data;

    // Backend tạo trên HIS trước, rồi best-effort lưu DB nội bộ. Khi API báo
    // success (kể cả khi không kèm data) thì coi là tạo thành công, không throw
    // để tránh hiển thị toast lỗi (đỏ) dù bệnh nhân đã được tạo.
    if (data.status === "success" || data.success === true) {
      return (responseData ?? ({} as AdminPatient));
    }

    throw new Error(data.message || "Tạo hồ sơ bệnh nhân thất bại");
  },
};

// ─── Hooks ─────────────────────────────────────────────────────────────────

export function useCreateAdminPatient(
  options?: UseMutationOptions<AdminPatient, Error, CreateAdminPatientPayload>
) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...rest } = options ?? {};

  return useMutation<AdminPatient, Error, CreateAdminPatientPayload>({
    mutationFn: (payload) => adminPatientsService.create(payload),
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: adminPatientsKeys.all });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      onSuccess?.(data, variables, context, mutation);
    },
    onError: (error, variables, context, mutation) => {
      onError?.(error, variables, context, mutation);
    },
    ...rest,
  });
}

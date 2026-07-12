/**
 * Medical Records API — Hồ sơ bệnh án (EMR)
 * Resource: /medical-records
 * Stats: /dashboard/medical-records-stats
 * Base: /api/v1.0 (via axios baseURL)
 */

import { createApi, type PaginatedResult } from "@/api/createApi";
import { apiGet, apiPost } from "@/lib/axios";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { PaginationParams } from "@/types/api-response";

// ─── Types ─────────────────────────────────────────────────────────────────

export type PaymentStatus = "UNPAID" | "PAID" | "PARTIAL";
export type RecordStatus = "DRAFT" | "COMPLETED" | "CANCELLED";

export interface MedicalRecord {
  id: string;
  record_code: string;
  facility_id: string;
  patient_id: string;
  appointment_id: string | null;
  examined_at: string;
  doctor_id: string | null;
  specialty_id: string | null;
  room_id: string | null;
  service_id: string | null;
  chief_complaint: string | null;
  diagnosis: string | null;
  conclusion: string | null;
  treatment_plan: string | null;
  doctor_note: string | null;
  patient_note: string | null;
  total_amount: string | number | null;
  paid_amount: string | number | null;
  payment_status: PaymentStatus | string;
  record_status: RecordStatus | string;
  source: string | null;
  raw_data: unknown | null;
  user_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  /** Included in list/detail responses */
  facility?: { id: string; facility_name: string; idbv: string; base_url?: string };
  patient?: {
    id: string;
    patient_full_name: string;
    phone_number: string | null;
    identity_number?: string | null;
  };
  doctor?: { id: string; doctor_id: string; doctor_name: string; description?: string | null };
  specialty?: { id: string; name: string; code?: string };
  room?: { id: string; room_id?: string; room_name: string };
  service?: { id: string; service_id?: string; service_name: string; price?: number };
  appointment?: { id: string; appointment_time?: string; booking_type?: string };
}

export interface MedicalRecordListParams extends PaginationParams {
  currentPage?: number;
  facility_id?: string;
  patient_id?: string;
  doctor_id?: string;
  payment_status?: string;
  record_status?: string;
}

export type CreateMedicalRecordPayload = {
  facility_id: string;
  patient_id: string;
  examined_at: string;
  record_code?: string;
  appointment_id?: string;
  doctor_id?: string;
  specialty_id?: string;
  room_id?: string;
  service_id?: string;
  chief_complaint?: string;
  diagnosis?: string;
  conclusion?: string;
  treatment_plan?: string;
  doctor_note?: string;
  patient_note?: string;
  total_amount?: number;
  paid_amount?: number;
  payment_status?: string;
  record_status?: string;
  source?: string;
  user_id?: string;
  raw_data?: unknown;
};

export type UpdateMedicalRecordPayload = Partial<CreateMedicalRecordPayload> & {
  updated_by?: string;
};

// ─── Stats ─────────────────────────────────────────────────────────────────

export interface MedicalRecordStats {
  totalRecords: number;
  thisMonthCount: number;
  lastMonthCount: number;
  monthChangePercent: number;
  totalCost: number;
  lastVisitAt: string | null;
}

// ─── Create API via factory ────────────────────────────────────────────────

const { service, keys, hooks } = createApi<MedicalRecord>("medical-records");

export const medicalRecordsKeys = {
  ...keys,
  stats: (facilityId?: string) => ["medical-records", "stats", facilityId ?? null] as const,
};

// POST /medical-records có thể trả envelope { status, responseData } (chuẩn app)
// hoặc { success, data } — hỗ trợ cả hai để không báo lỗi nhầm khi tạo thành công.
type MedicalRecordResponse = {
  status?: "success" | "fail";
  success?: boolean;
  responseData?: MedicalRecord | null;
  data?: MedicalRecord | null;
  message?: string;
  message_en?: string;
};

export const medicalRecordsService = {
  ...service,
  getList: async (params?: MedicalRecordListParams): Promise<PaginatedResult<MedicalRecord>> => {
    return service.getList(params as PaginationParams);
  },
  create: async (payload: CreateMedicalRecordPayload): Promise<MedicalRecord> => {
    const res = await apiPost<MedicalRecord>("/medical-records", payload as Record<string, unknown>);
    const data = res.data as MedicalRecordResponse;
    const responseData = data.responseData ?? data.data;

    if ((data.status === "success" || data.success === true) && responseData) {
      return responseData;
    }

    throw new Error(data.message || "Tạo hồ sơ bệnh án thất bại");
  },
};

// ─── Hooks ─────────────────────────────────────────────────────────────────

export const medicalRecordsHooks = {
  ...hooks,
  useList: (
    params?: MedicalRecordListParams,
    options?: { enabled?: boolean; staleTime?: number }
  ) => {
    return useQuery({
      queryKey: keys.list(params as PaginationParams),
      queryFn: () => medicalRecordsService.getList(params),
      staleTime: 1000 * 60 * 2,
      enabled: options?.enabled ?? true,
      ...options,
    });
  },
  useCreate: (
    options?: UseMutationOptions<MedicalRecord, Error, CreateMedicalRecordPayload>
  ) => {
    const qc = useQueryClient();
    const { onSuccess, onError, ...rest } = options ?? {};
    return useMutation<MedicalRecord, Error, CreateMedicalRecordPayload>({
      mutationFn: (payload) => medicalRecordsService.create(payload),
      onSuccess: (data, variables, context, mutation) => {
        qc.invalidateQueries({ queryKey: keys.all });
        onSuccess?.(data, variables, context, mutation);
      },
      onError: (error, variables, context, mutation) => {
        onError?.(error, variables, context, mutation);
      },
      ...rest,
    });
  },
};

async function fetchMedicalRecordStats(facilityId?: string): Promise<MedicalRecordStats> {
  const res = await apiGet<MedicalRecordStats>("/dashboard/medical-records-stats", {
    params: facilityId ? { facilityId } : undefined,
  });
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Không thể lấy thống kê hồ sơ bệnh án");
}

export function useMedicalRecordStats(facilityId?: string) {
  return useQuery({
    queryKey: medicalRecordsKeys.stats(facilityId),
    queryFn: () => fetchMedicalRecordStats(facilityId),
    staleTime: 1000 * 60 * 5,
  });
}

// Re-export for convenience
export type { PaginatedResult };

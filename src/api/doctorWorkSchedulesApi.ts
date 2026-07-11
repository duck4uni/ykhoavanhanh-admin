/**
 * Doctor Work Schedules API — Lịch làm việc bác sĩ
 * Resource: /doctor-work-schedules
 * Base: /api/v1.0 (via axios baseURL)
 */

import { createApi, type PaginatedResult } from "@/api/createApi";
import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { apiPost } from "@/lib/axios";
import type { PaginationParams } from "@/types/api-response";

// ─── Types ─────────────────────────────────────────────────────────────────

export type DoctorWorkScheduleTimeSlot = {
  start: string;
  end: string;
  max_appointments?: number;
};

export interface DoctorWorkSchedule {
  id: string;
  doctor_id: string;
  exam_area_id: string;
  specialty_id: string | null;
  room_id: string | null;
  schedule_date: string;
  /** Deprecated response shape kept for old backend compatibility. */
  start_time?: string;
  /** Deprecated response shape kept for old backend compatibility. */
  end_time?: string;
  shift_code: string | null;
  max_appointments: number | null;
  booked_count: number;
  exam_fee: number | null;
  allow_booking: boolean;
  status: "ACTIVE" | "INACTIVE";
  note: string | null;
  time_slots: DoctorWorkScheduleTimeSlot[];
  his_schedule_id: string | null;
  his_updated_at: string | null;
  raw_data: unknown | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
  /** Included in list/detail responses */
  doctor?: {
    id: string;
    doctor_id: string;
    doctor_name: string;
  };
  /** Included in list/detail responses */
  exam_area?: {
    id: string;
    code: string;
    name: string;
    short_name: string;
  };
}

export interface DoctorWorkScheduleListParams extends PaginationParams {
  doctor_id?: string;
  exam_area_id?: string;
  schedule_date?: string;
  date_from?: string;
  date_to?: string;
}

export type CreateDoctorWorkSchedulePayload = {
  doctor_id: string;
  exam_area_id: string;
  schedule_date: string;
  specialty_id?: string;
  room_id?: string;
  shift_code?: string;
  max_appointments?: number;
  booked_count?: number;
  exam_fee?: number;
  allow_booking?: boolean;
  status?: "ACTIVE" | "INACTIVE";
  note?: string;
  time_slots?: DoctorWorkScheduleTimeSlot[];
  his_schedule_id?: string;
  his_updated_at?: string;
  raw_data?: unknown;
  synced_at?: string;
};

export type UpdateDoctorWorkSchedulePayload = Partial<CreateDoctorWorkSchedulePayload>;

// ─── Payload V2 (nhiều phạm vi khám / khung giờ theo phạm vi) ───────────────
// Một lịch khám có thể chứa nhiều "phạm vi khám" (tổ hợp chuyên khoa + khu vực
// + phòng + dịch vụ + phí) và nhiều khung giờ; mỗi khung giờ áp dụng cho toàn
// bộ ("all") hoặc một số phạm vi cụ thể (mảng client-id của phạm vi).

export type WorkScheduleScope = {
  specialty_id: string;
  /** exam_area_id */
  area_id: string;
  room_id: string;
  service_id: string;
  fee: number;
  status: "ACTIVE" | "INACTIVE";
  note?: string;
};

export type WorkScheduleTimeSlotV2 = {
  /** "08:00" */
  start_time: string;
  /** "08:30" */
  end_time: string;
  slot_limit: number;
  /** "all" hoặc mảng client-id của phạm vi khám. */
  scope_ids: "all" | string[];
};

export type CreateDoctorWorkScheduleV2Payload = {
  doctor_id: string;
  /** YYYY-MM-DD */
  date: string;
  status: "ACTIVE" | "INACTIVE";
  note?: string;
  scopes: WorkScheduleScope[];
  time_slots: WorkScheduleTimeSlotV2[];
};

// ─── Create API via factory ────────────────────────────────────────────────

const { service, keys, hooks } = createApi<DoctorWorkSchedule>("doctor-work-schedules");

// ─── Service (hỗ trợ params lọc tùy chỉnh) ────────────────────────────────

export const doctorWorkSchedulesKeys = keys;

export const doctorWorkSchedulesService = {
  ...service,
  getList: async (params?: DoctorWorkScheduleListParams): Promise<PaginatedResult<DoctorWorkSchedule>> => {
    return service.getList(params as PaginationParams);
  },
  /** Tạo lịch khám với payload nhiều phạm vi khám (V2). */
  createV2: async (payload: CreateDoctorWorkScheduleV2Payload): Promise<DoctorWorkSchedule> => {
    const res = await apiPost<DoctorWorkSchedule>("/doctor-work-schedules", payload);
    if (res.data.status === "success" && res.data.responseData) {
      return res.data.responseData;
    }
    throw new Error(res.data.message || "Tạo lịch khám thất bại");
  },
};

// ─── Hooks ─────────────────────────────────────────────────────────────────

export const doctorWorkSchedulesHooks = {
  ...hooks,
  useList: (
    params?: DoctorWorkScheduleListParams,
    options?: { enabled?: boolean; staleTime?: number }
  ) => {
    return useQuery({
      queryKey: keys.list(params as PaginationParams),
      queryFn: () => doctorWorkSchedulesService.getList(params),
      staleTime: 1000 * 60 * 2,
      enabled: options?.enabled ?? true,
      ...options,
    });
  },
  /** Tạo lịch khám với payload nhiều phạm vi khám (V2). */
  useCreateV2: (
    options?: UseMutationOptions<DoctorWorkSchedule, Error, CreateDoctorWorkScheduleV2Payload>
  ) => {
    const queryClient = useQueryClient();
    const { onSuccess, onError, ...rest } = options ?? {};
    return useMutation<DoctorWorkSchedule, Error, CreateDoctorWorkScheduleV2Payload>({
      mutationFn: (payload) => doctorWorkSchedulesService.createV2(payload),
      onSuccess: (data, variables, context, mutation) => {
        queryClient.invalidateQueries({ queryKey: keys.all });
        onSuccess?.(data, variables, context, mutation);
      },
      onError: (error, variables, context, mutation) => {
        onError?.(error, variables, context, mutation);
      },
      ...rest,
    });
  },
};

// Re-export PaginatedResult for convenience
export type { PaginatedResult };

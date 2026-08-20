/**
 * Doctor Work Schedules API — Lịch làm việc bác sĩ
 * Resource: /doctor-work-schedules
 */

import { createApi, type PaginatedResult } from "@/api/createApi";
import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, ApiError } from "@/lib/axios";
import type { PaginationParams } from "@/types/api-response";

export type DoctorWorkScheduleTimeSlot = {
  id?: string;
  weekday?: number;
  start_time?: string;
  end_time?: string;
  slot_limit?: number;
  scope_ids?: "all" | string[];
  /** Legacy list schema. */
  start?: string;
  end?: string;
  max_appointments?: number;
};

/** Shape legacy vẫn được trang danh sách sử dụng. */
export interface DoctorWorkSchedule {
  id: string;
  doctor_id: string;
  exam_area_id: string;
  specialty_id: string | null;
  room_id: string | null;
  schedule_date?: string;
  start_date?: string;
  end_date?: string;
  weekdays?: number[];
  start_time?: string;
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
  doctor?: { id: string; doctor_id: string; doctor_name: string };
  exam_area?: { id: string; code: string; name: string; short_name: string | null };
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

export type WorkScheduleScope = {
  client_id?: string;
  specialty_id?: string;
  area_id?: string;
  room_id?: string;
  service_id?: string;
  fee: number;
  status: "ACTIVE" | "INACTIVE";
  note?: string;
};

export type WorkScheduleTimeSlotV2 = {
  start_time: string;
  end_time: string;
  slot_limit: number;
  weekday?: number;
  dates: string[];
  date_overrides?: Array<{ date: string; slot_limit: number }>;
  scope_ids: "all" | string[];
};

export type CreateDoctorWorkScheduleV2Payload = {
  doctor_id: string;
  start_date: string;
  end_date: string;
  weekdays?: number[];
  status: "ACTIVE" | "INACTIVE";
  note?: string;
  scopes: WorkScheduleScope[];
  time_slots: WorkScheduleTimeSlotV2[];
};

export type DoctorWorkScheduleScopeV2 = {
  id: string;
  client_id?: string | null;
  specialty_id?: string | null;
  area_id?: string | null;
  room_id?: string | null;
  service_id?: string | null;
  fee: number | string;
  status: "ACTIVE" | "INACTIVE";
  note?: string | null;
  specialty?: { id: string; name: string } | null;
  area?: { id: string; name: string } | null;
  exam_area?: { id: string; name: string } | null;
  room?: { id: string; room_name?: string; roomname?: string } | null;
  service?: { id: string; service_name?: string; servicename?: string } | null;
};

export type DoctorWorkScheduleTimeSlotV2 = {
  id?: string;
  start_time: string;
  end_time: string;
  slot_limit: number;
  weekday: number;
  /** Các ngày cụ thể áp dụng, format YYYY-MM-DD. Thiếu field = toàn bộ ngày khớp weekday (legacy). */
  dates?: string[];
  date_overrides?: Array<{ date: string; slot_limit: number }>;
  /** Detail trả persisted scope IDs; một số phiên bản có thể trả "all". */
  scope_ids: "all" | string[];
};

export type DoctorWorkScheduleV2 = {
  id: string;
  doctor_id: string;
  start_date: string;
  end_date: string;
  weekdays: number[];
  status: "ACTIVE" | "INACTIVE";
  note?: string | null;
  scopes: DoctorWorkScheduleScopeV2[];
  time_slots: DoctorWorkScheduleTimeSlotV2[];
  doctor?: { id: string; doctor_id: string; doctor_name: string } | null;
  created_at?: string;
  updated_at?: string;
};

type DetailResponse = DoctorWorkScheduleV2 | PaginatedResult<DoctorWorkScheduleV2>;

const { service, keys, hooks } = createApi<DoctorWorkSchedule>("doctor-work-schedules");

export const doctorWorkSchedulesKeys = keys;

function extractDetail(data: DetailResponse, id: string): DoctorWorkScheduleV2 {
  if ("rows" in data) {
    const schedule = data.rows.find((row) => row.id === id) ?? data.rows[0];
    if (schedule) return schedule;
  } else if (data?.id) {
    return data;
  }
  throw new Error("Không tìm thấy lịch khám");
}

export const doctorWorkSchedulesService = {
  ...service,
  getList: async (params?: DoctorWorkScheduleListParams): Promise<PaginatedResult<DoctorWorkSchedule>> =>
    service.getList(params as PaginationParams),
  getDetailV2: async (id: string): Promise<DoctorWorkScheduleV2> => {
    const res = await apiGet<DetailResponse>(`/doctor-work-schedules/${id}`);
    if (res.data.status === "success" && res.data.responseData) {
      return extractDetail(res.data.responseData, id);
    }
    throw new Error(res.data.message || "Không thể tải lịch khám");
  },
  createV2: async (payload: CreateDoctorWorkScheduleV2Payload): Promise<DoctorWorkScheduleV2> => {
    const res = await apiPost<DoctorWorkScheduleV2>("/doctor-work-schedules", payload);
    if (res.data.status === "success" && res.data.responseData) return res.data.responseData;
    throw new ApiError(res.data.message || "Tạo lịch khám thất bại", res.status, res.data.violations);
  },
  updateV2: async (id: string, payload: CreateDoctorWorkScheduleV2Payload): Promise<DoctorWorkScheduleV2> => {
    const res = await apiPut<DetailResponse>(`/doctor-work-schedules/${id}`, payload);
    if (res.data.status === "success" && res.data.responseData) {
      return extractDetail(res.data.responseData, id);
    }
    throw new ApiError(res.data.message || "Cập nhật lịch khám thất bại", res.status, res.data.violations);
  },
};

export const doctorWorkSchedulesHooks = {
  ...hooks,
  useList: (params?: DoctorWorkScheduleListParams, options?: { enabled?: boolean; staleTime?: number }) =>
    useQuery({
      queryKey: keys.list(params as PaginationParams),
      queryFn: () => doctorWorkSchedulesService.getList(params),
      staleTime: 1000 * 60 * 2,
      enabled: options?.enabled ?? true,
      ...options,
    }),
  useDetailV2: (id: string | null | undefined, options?: { enabled?: boolean; staleTime?: number }) =>
    useQuery<DoctorWorkScheduleV2, Error>({
      queryKey: keys.detail(id ?? ""),
      queryFn: () => doctorWorkSchedulesService.getDetailV2(id!),
      enabled: Boolean(id) && (options?.enabled ?? true),
      staleTime: 1000 * 60 * 5,
      ...options,
    }),
  useCreateV2: (options?: UseMutationOptions<DoctorWorkScheduleV2, Error, CreateDoctorWorkScheduleV2Payload>) => {
    const queryClient = useQueryClient();
    const { onSuccess, onError, ...rest } = options ?? {};
    return useMutation<DoctorWorkScheduleV2, Error, CreateDoctorWorkScheduleV2Payload>({
      mutationFn: doctorWorkSchedulesService.createV2,
      onSuccess: (data, variables, context, mutation) => {
        queryClient.invalidateQueries({ queryKey: keys.all });
        onSuccess?.(data, variables, context, mutation);
      },
      onError: (error, variables, context, mutation) => onError?.(error, variables, context, mutation),
      ...rest,
    });
  },
  useUpdateV2: (options?: UseMutationOptions<DoctorWorkScheduleV2, Error, { id: string; data: CreateDoctorWorkScheduleV2Payload }>) => {
    const queryClient = useQueryClient();
    const { onSuccess, onError, ...rest } = options ?? {};
    return useMutation<DoctorWorkScheduleV2, Error, { id: string; data: CreateDoctorWorkScheduleV2Payload }>({
      mutationFn: ({ id, data }) => doctorWorkSchedulesService.updateV2(id, data),
      onSuccess: (data, variables, context, mutation) => {
        queryClient.invalidateQueries({ queryKey: keys.all });
        queryClient.invalidateQueries({ queryKey: keys.detail(variables.id) });
        onSuccess?.(data, variables, context, mutation);
      },
      onError: (error, variables, context, mutation) => onError?.(error, variables, context, mutation),
      ...rest,
    });
  },
};

export type { PaginatedResult };

/**
 * Appointment Reviews API — Đánh giá lịch khám
 * Resource: /appointment-reviews
 * Base: /api/v1.0 (via axios baseURL)
 */

import { createApi, type PaginatedResult } from "@/api/createApi";
import { useQuery } from "@tanstack/react-query";
import type { PaginationParams } from "@/types/api-response";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface AppointmentReview {
  id: string;
  facility_id: string;
  appointment_id: string | null;
  patient_id: string | null;
  doctor_id: string | null;
  exam_area_id: string | null;
  specialty_id: string | null;
  room_id: string | null;
  overall_rating: number;
  doctor_rating: number | null;
  service_rating: number | null;
  facility_rating: number | null;
  waiting_time_rating: number | null;
  comment: string | null;
  admin_reply: string | null;
  admin_replied_at: string | null;
  is_anonymous: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  source: string | null;
  raw_data: unknown | null;
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
  /** Included in list/detail responses */
  facility?: {
    id: string;
    facility_name: string;
    idbv: string;
  };
  /** Included in list/detail responses */
  patient?: {
    id: string;
    patient_full_name: string;
    phone_number: string | null;
  };
}

export interface AppointmentReviewListParams extends PaginationParams {
  facility_id?: string;
  doctor_id?: string;
  exam_area_id?: string;
  patient_id?: string;
  appointment_id?: string;
  status?: string;
  source?: string;
  min_rating?: number;
  max_rating?: number;
}

export type CreateAppointmentReviewPayload = {
  facility_id: string;
  overall_rating: number;
  appointment_id?: string;
  patient_id?: string;
  doctor_id?: string;
  exam_area_id?: string;
  specialty_id?: string;
  room_id?: string;
  doctor_rating?: number;
  service_rating?: number;
  facility_rating?: number;
  waiting_time_rating?: number;
  comment?: string;
  is_anonymous?: boolean;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  source?: string;
  raw_data?: unknown;
};

export type UpdateAppointmentReviewPayload = Partial<CreateAppointmentReviewPayload> & {
  admin_reply?: string;
  admin_replied_at?: string;
};

// ─── Create API via factory ────────────────────────────────────────────────

const { service, keys, hooks } = createApi<AppointmentReview>("appointment-reviews");

// ─── Service (hỗ trợ params lọc tùy chỉnh) ────────────────────────────────

export const appointmentReviewsKeys = keys;

export const appointmentReviewsService = {
  ...service,
  getList: async (params?: AppointmentReviewListParams): Promise<PaginatedResult<AppointmentReview>> => {
    return service.getList(params as PaginationParams);
  },
};

// ─── Hooks ─────────────────────────────────────────────────────────────────

export const appointmentReviewsHooks = {
  ...hooks,
  useList: (
    params?: AppointmentReviewListParams,
    options?: { enabled?: boolean; staleTime?: number }
  ) => {
    return useQuery({
      queryKey: keys.list(params as PaginationParams),
      queryFn: () => appointmentReviewsService.getList(params),
      staleTime: 1000 * 60 * 2,
      enabled: options?.enabled ?? true,
      ...options,
    });
  },
};

// Re-export PaginatedResult for convenience
export type { PaginatedResult };

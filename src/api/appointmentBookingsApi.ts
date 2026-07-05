import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/axios";
import type { PaginationParams } from "@/types/api-response";

export interface AppointmentBooking {
  id: string;
  facility_id: string | null;
  idempotency_key: string | null;
  patient_id: string | null;
  his_patient_id: string | null;
  his_booking_id: string | null;
  his_mavaovien: string | null;
  request_booking_id: string | null;
  schedule_id: string | null;
  appointment_time: string | null;
  room_id: string | null;
  doctor_id: string | null;
  exam_object_code: string | null;
  service_id: string | null;
  request_mavaovien: string | null;
  request_stt: string | null;
  confirmed_stt: string | null;
  booking_type: string | null;
  source: string | null;
  local_status: string | null;
  his_action: string | null;
  his_status: string | null;
  his_error_code: string | null;
  his_error_message: string | null;
  retry_count: number | null;
  last_sync_at: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    his_patient_id: string | null;
    patient_full_name: string | null;
    phone_number: string | null;
  };
  facility?: {
    id: string;
    facility_name: string | null;
    idbv: string | null;
  };
}

export interface AppointmentBookingListParams extends PaginationParams {
  facility_id?: string;
  patient_id?: string;
  his_patient_id?: string;
  doctor_id?: string;
  room_id?: string;
  service_id?: string;
  status?: string;
  source?: string;
  from_date?: string;
  to_date?: string;
}

export interface PaginatedAppointmentBookings {
  count: number;
  rows: AppointmentBooking[];
  totalPages: number;
  currentPage: number;
}

type AppointmentBookingsResponse = {
  status?: "success" | "fail" | "error";
  success?: boolean;
  responseData?: PaginatedAppointmentBookings | null;
  data?: PaginatedAppointmentBookings | null;
  message?: string;
  message_en?: string;
};

export const appointmentBookingsKeys = {
  all: ["appointment-bookings"] as const,
  list: (params?: AppointmentBookingListParams) => ["appointment-bookings", "list", params] as const,
};

export const appointmentBookingsService = {
  getList: async (params?: AppointmentBookingListParams): Promise<PaginatedAppointmentBookings> => {
    const res = await apiGet<PaginatedAppointmentBookings>("/appointment-bookings", { params });
    const data = res.data as AppointmentBookingsResponse;
    const responseData = data.responseData ?? data.data;

    if ((data.status === "success" || data.success === true) && responseData) {
      return responseData;
    }

    throw new Error(data.message || "Không thể lấy danh sách lịch đặt khám");
  },
};

export const appointmentBookingsHooks = {
  useList: (
    params?: AppointmentBookingListParams,
    options?: { enabled?: boolean; staleTime?: number },
  ) => {
    return useQuery({
      queryKey: appointmentBookingsKeys.list(params),
      queryFn: () => appointmentBookingsService.getList(params),
      staleTime: options?.staleTime ?? 1000 * 60 * 2,
      enabled: options?.enabled ?? true,
    });
  },
};

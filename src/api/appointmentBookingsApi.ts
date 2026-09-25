import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/axios";
import type { PaginationParams } from "@/types/api-response";

export type AppointmentHisSyncStatus =
  | "PENDING"
  | "PROCESSING"
  | "SYNCED"
  | "FAILED"
  | "REVIEW_REQUIRED";

export interface AppointmentBooking {
  id: string;
  facility_id: string | null;
  idempotency_key: string | null;
  patient_id: string | null;
  his_patient_id: string | null;
  his_booking_id: string | null;
  his_mavaovien: string | null;
  his_stt?: string | null;
  his_sync_status?: AppointmentHisSyncStatus | null;
  synced_to_his_at?: string | null;
  last_his_sync_error?: string | null;
  last_his_sync_attempt_at?: string | null;
  request_booking_id: string | null;
  schedule_id: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  room_id: string | null;
  doctor_id: string | null;
  exam_area_id: string | null;
  specialty_id: string | null;
  queue_number: number | null;
  price: string | number | null;
  exam_object_code: string | null;
  /** Đối tượng khám (vd "BHYT" | "DV" | "Khám thường"). */
  exam_type: string | null;
  service_id: string | null;
  request_mavaovien: string | null;
  request_stt: string | null;
  confirmed_stt: string | null;
  booking_type: string | null;
  source: string | null;
  /** Trạng thái booking hiện hành (vd PENDING_PAYMENT/PAID/CANCELLED) — field thật BE trả về. */
  status: string | null;
  /** @deprecated Field cũ theo tài liệu trước đây; BE hiện trả `status`, không phải field này. */
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
  doctor?: {
    id: string;
    facility_id: string | null;
    doctor_id: string | null;
    doctor_name: string | null;
    specialty_id: string | null;
    avatar_url: string | null;
    description: string | null;
  } | null;
  room?: {
    id: string;
    facility_id: string | null;
    room_id: string | null;
    room_name: string | null;
    service_id: string | null;
    description: string | null;
  } | null;
  exam_area?: {
    id: string;
    code: string | null;
    name: string | null;
    short_name: string | null;
    address: string | null;
    phone: string | null;
    description: string | null;
    status: string | null;
  } | null;
  specialty?: {
    id: string;
    name: string | null;
    description: string | null;
    booking_note: string | null;
    room_visit_instruction: string | null;
    booking_group: string | null;
    display_priority: number | null;
  } | null;
  service?: {
    id: string;
    facility_id: string | null;
    service_id: string | null;
    service_name: string | null;
    price: number | string | null;
    specialty_id: string | null;
  } | null;
}

export interface AppointmentBookingListParams extends PaginationParams {
  facility_id?: string;
  patient_id?: string;
  his_patient_id?: string;
  doctor_id?: string;
  room_id?: string;
  service_id?: string;
  status?: string;
  his_sync_status?: AppointmentHisSyncStatus;
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

export interface AppointmentSyncToHisResultRow {
  appointment_id: string;
  status: "success" | "error" | "skipped";
  his_booking_id?: string | null;
  his_mavaovien?: string | null;
  his_stt?: string | null;
  message?: string;
}

export interface AppointmentSyncToHisResult {
  total: number;
  success: number;
  error: number;
  skipped: number;
  results: AppointmentSyncToHisResultRow[];
}

export interface AppointmentSyncAllParams {
  idbv?: string;
  limit?: number;
  from_date?: string;
  to_date?: string;
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

  /** Đồng bộ các lịch được chọn bằng UUID local (`appointment_bookings.id`). */
  syncToHis: async (appointmentIds: string[]): Promise<AppointmentSyncToHisResult> => {
    const res = await apiPost<AppointmentSyncToHisResult>("/appointments/sync-to-his", {
      appointment_ids: appointmentIds,
    });
    if (res.data.responseData) return res.data.responseData;
    throw new Error(res.data.message || "Đồng bộ lịch khám lên HIS thất bại");
  },

  /** Đồng bộ hàng loạt lịch PAID chưa SYNCED, có thể giới hạn theo ngày/cơ sở. */
  syncAllToHis: async (params?: AppointmentSyncAllParams): Promise<AppointmentSyncToHisResult> => {
    const res = await apiPost<AppointmentSyncToHisResult>(
      "/appointments/sync-to-his/all",
      undefined,
      { params },
    );
    if (res.data.responseData) return res.data.responseData;
    throw new Error(res.data.message || "Đồng bộ tất cả lịch khám lên HIS thất bại");
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

  useSyncToHis: (options?: {
    onSuccess?: (data: AppointmentSyncToHisResult) => void;
    onError?: (error: Error) => void;
  }) => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (appointmentIds: string[]) => appointmentBookingsService.syncToHis(appointmentIds),
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: appointmentBookingsKeys.all });
        options?.onSuccess?.(data);
      },
      onError: (error) => options?.onError?.(error),
    });
  },

  useSyncAllToHis: (options?: {
    onSuccess?: (data: AppointmentSyncToHisResult) => void;
    onError?: (error: Error) => void;
  }) => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (params?: AppointmentSyncAllParams) => appointmentBookingsService.syncAllToHis(params),
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: appointmentBookingsKeys.all });
        options?.onSuccess?.(data);
      },
      onError: (error) => options?.onError?.(error),
    });
  },
};

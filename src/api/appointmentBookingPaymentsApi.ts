import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/axios";
import type { PaginationParams } from "@/types/api-response";

/**
 * `GET /appointment-booking-payments` — danh sách thanh toán, chỉ dành cho
 * admin (verify + verifyAdmin). Endpoint tự join thêm thông tin booking,
 * người tạo booking, bệnh nhân và bản ghi hoàn tiền (nếu có) — xem
 * `docs/api/appointmentBookingPayment.md` mục 3.9 ở backend repo.
 *
 * Không có GET-by-id cho payments/refunds — trang chi tiết phải dùng
 * `filters=id==<id>&pageSize=1` trên chính endpoint danh sách này.
 */
export interface AppointmentBookingPayment {
  id: string;
  booking_id: string;
  /** Số tiền — BE trả dạng chuỗi thập phân (vd "230000.00"), cần Number() trước khi formatCurrency. */
  amount: string;
  payment_method: string | null;
  payment_gateway: "MOMO" | "VCB";
  transaction_id: string | null;
  payment_time: string | null;
  payment_status: "PENDING" | "PAID";
  qr_identifier: string | null;
  created_at: string;
  updated_at: string;
  booking?: {
    id: string;
    exam_area_id: string | null;
    specialty_id: string | null;
    service_id: string | null;
    doctor_id: string | null;
    price: string | number | null;
    appointment_date: string | null;
    appointment_time: string | null;
    status: string | null;
    queue_number: number | null;
  } | null;
  user?: {
    id: string;
    full_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  patient?: {
    id: string;
    his_patient_id: string | null;
    patient_full_name: string | null;
    phone_number: string | null;
  } | null;
  /** `null` nếu booking chưa từng có yêu cầu hoàn tiền nào. */
  refund: {
    refund_status: "PENDING" | "SUCCESS" | "FAILED";
    refund_amount: string | number;
    refund_gateway: string | null;
    processed_at: string | null;
  } | null;
}

export interface AppointmentBookingPaymentListParams extends PaginationParams {
  /**
   * Sieve filter. **Nếu không có mệnh đề `payment_status`, BE tự mặc định
   * thêm `payment_status=='PAID'`** — muốn lấy "Tất cả" phải gửi tường minh
   * `payment_status==PENDING|PAID` (cú pháp OR bằng dấu `|`).
   */
  filters?: string;
  payment_gateway?: string;
  booking_id?: string;
  /** `YYYY-MM-DD`, lọc theo `payment_time`. BE tự cộng 23:59:59.999 cho `to_date`. */
  from_date?: string;
  to_date?: string;
}

export interface PaginatedAppointmentBookingPayments {
  count: number;
  rows: AppointmentBookingPayment[];
  totalPages: number;
  currentPage: number;
}

type AppointmentBookingPaymentsResponse = {
  status?: "success" | "fail" | "error";
  success?: boolean;
  responseData?: PaginatedAppointmentBookingPayments | null;
  data?: PaginatedAppointmentBookingPayments | null;
  message?: string;
  message_en?: string;
};

export const appointmentBookingPaymentsKeys = {
  all: ["appointment-booking-payments"] as const,
  list: (params?: AppointmentBookingPaymentListParams) =>
    ["appointment-booking-payments", "list", params] as const,
};

export const appointmentBookingPaymentsService = {
  getList: async (
    params?: AppointmentBookingPaymentListParams,
  ): Promise<PaginatedAppointmentBookingPayments> => {
    const res = await apiGet<PaginatedAppointmentBookingPayments>("/appointment-booking-payments", { params });
    const data = res.data as AppointmentBookingPaymentsResponse;
    const responseData = data.responseData ?? data.data;

    if ((data.status === "success" || data.success === true) && responseData) {
      return responseData;
    }

    throw new Error(data.message || "Không thể lấy danh sách thanh toán");
  },
};

export const appointmentBookingPaymentsHooks = {
  useList: (
    params?: AppointmentBookingPaymentListParams,
    options?: { enabled?: boolean; staleTime?: number },
  ) => {
    return useQuery({
      queryKey: appointmentBookingPaymentsKeys.list(params),
      queryFn: () => appointmentBookingPaymentsService.getList(params),
      staleTime: options?.staleTime ?? 1000 * 60 * 2,
      enabled: options?.enabled ?? true,
    });
  },
};

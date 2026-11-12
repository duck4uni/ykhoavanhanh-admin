import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiDelete, apiGet, apiPost } from "@/lib/axios";
import type { PaginationParams } from "@/types/api-response";
import type { PaginatedResult } from "./createApi";
import { appointmentBookingsKeys, type AppointmentBooking } from "./appointmentBookingsApi";
import { appointmentBookingPaymentsKeys } from "./appointmentBookingPaymentsApi";

export type RefundStatus = "PENDING" | "SUCCESS" | "FAILED";

/** Một dòng hoàn tiền (`GET /appointment-booking-refunds`). Mỗi booking tối đa 1 dòng. */
export interface AppointmentBookingRefund {
  id: string;
  booking_id: string;
  payment_id: string | null;
  refund_code: string | null;
  refund_amount: number | string;
  refund_method: string | null;
  refund_gateway: string | null;
  refund_transaction_id: string | null;
  refund_reason: string | null;
  refund_status: RefundStatus;
  requested_by: string | null;
  requested_at: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentBookingRefundListParams extends PaginationParams {
  booking_id?: string;
  payment_id?: string;
  refund_status?: RefundStatus;
}

/** Thông tin hoàn tiền rút gọn do `DELETE /appointments/{id}` trả về. */
export interface CancelRefundInfo {
  id: string;
  refund_status: RefundStatus;
  refund_amount: number | string;
  refund_gateway?: string;
  refund_transaction_id?: string | null;
  processed_at?: string | null;
  /** Chỉ có khi `refund_status = FAILED`: mã lỗi (MISSING_VCB_TRANSACTION_ID, VCB_<errorCode>, VCB_REFUND_FAILED). */
  failure_code?: string;
  /** Chỉ có khi `refund_status = FAILED`: lý do hiển thị cho admin. */
  failure_reason?: string;
}

export type CancelledAppointment = Partial<AppointmentBooking> & { id: string };

export interface CancelAppointmentData {
  appointment: CancelledAppointment | null;
  refund: CancelRefundInfo | null;
  booking_group_id?: string;
  /** Chỉ có khi hủy cả nhóm công khám. */
  cancelled_bookings?: Array<{ appointment: CancelledAppointment; refund: CancelRefundInfo | null }>;
}

/** Body 409 `requires_group_cancel`: công khám đầu là mốc tính giá giảm, phải hủy cả nhóm. */
export interface GroupCancelRequired {
  requires_group_cancel: true;
  booking_group_id: string;
  cancel_url?: string;
  bookings: Array<{
    id: string;
    status: string | null;
    appointment_date: string | null;
    price: number | string | null;
    is_second_visit: boolean;
    is_target: boolean;
  }>;
}

export type CancelAppointmentResult =
  | { kind: "cancelled"; data: CancelAppointmentData; message: string }
  | { kind: "requires_group_cancel"; info: GroupCancelRequired; message: string };

export interface VcbRefundPayload {
  bookingId: string;
  remark?: string;
}

export interface VcbRefundResult {
  orderRef?: string;
  transRef?: string | null;
  refundStatus?: RefundStatus;
  amount?: number | string;
}

export const appointmentBookingRefundsKeys = {
  all: ["appointment-booking-refunds"] as const,
  list: (params?: AppointmentBookingRefundListParams) =>
    ["appointment-booking-refunds", "list", params] as const,
};

function isGroupCancelRequired(data: unknown): data is GroupCancelRequired {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { requires_group_cancel?: unknown }).requires_group_cancel === true
  );
}

export const appointmentBookingRefundsService = {
  getList: async (
    params?: AppointmentBookingRefundListParams,
  ): Promise<PaginatedResult<AppointmentBookingRefund>> => {
    const res = await apiGet<PaginatedResult<AppointmentBookingRefund>>("/appointment-booking-refunds", { params });
    if (res.data.responseData) return res.data.responseData;
    throw new Error(res.data.message || "Không thể lấy thông tin hoàn tiền");
  },

  /**
   * Hủy lịch (kèm hoàn tiền VCB nếu đã thanh toán). BE tự gọi hoàn tiền trong cùng request —
   * KHÔNG gọi thêm `POST /payment/vcb/refund` ngay sau đó.
   * 409 `requires_group_cancel` không phải lỗi: trả về để UI xin xác nhận hủy cả nhóm.
   */
  cancel: async (id: string, options?: { cancelGroup?: boolean }): Promise<CancelAppointmentResult> => {
    try {
      const res = await apiDelete<CancelAppointmentData>(`/appointments/${id}`, {
        params: options?.cancelGroup ? { cancel_group: true } : undefined,
      });
      if (!res.data.responseData) throw new Error(res.data.message || "Hủy lịch khám thất bại");
      return { kind: "cancelled", data: res.data.responseData, message: res.data.message ?? "" };
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && isGroupCancelRequired(error.data)) {
        return { kind: "requires_group_cancel", info: error.data, message: error.message };
      }
      throw error;
    }
  },

  /** Hoàn tiền toàn phần (chỉ gửi bookingId + remark; không gửi amount/orderRef/transTime). */
  refund: async (payload: VcbRefundPayload): Promise<VcbRefundResult> => {
    const res = await apiPost<VcbRefundResult>("/payment/vcb/refund", {
      bookingId: payload.bookingId,
      ...(payload.remark?.trim() ? { remark: payload.remark.trim() } : {}),
    });
    return res.data.responseData ?? {};
  },
};

/** Phân loại lỗi 502 của POST /payment/vcb/refund dựa vào `message_en`. */
export function isRefundPendingError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 502 &&
    (error.messageEn ?? "").toLowerCase().includes("pending")
  );
}

export const appointmentBookingRefundsHooks = {
  useList: (params?: AppointmentBookingRefundListParams, options?: { enabled?: boolean }) =>
    useQuery({
      queryKey: appointmentBookingRefundsKeys.list(params),
      queryFn: () => appointmentBookingRefundsService.getList(params),
      enabled: options?.enabled ?? true,
      // Trạng thái hoàn tiền thay đổi ngoài FE (callback VCB) nên luôn lấy mới khi mở.
      staleTime: 0,
    }),

  useCancel: (options?: {
    onSuccess?: (result: CancelAppointmentResult) => void;
    onError?: (error: Error) => void;
  }) => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (vars: { id: string; cancelGroup?: boolean }) =>
        appointmentBookingRefundsService.cancel(vars.id, { cancelGroup: vars.cancelGroup }),
      onSuccess: (result) => {
        if (result.kind === "cancelled") {
          qc.invalidateQueries({ queryKey: appointmentBookingsKeys.all });
          qc.invalidateQueries({ queryKey: appointmentBookingPaymentsKeys.all });
          qc.invalidateQueries({ queryKey: appointmentBookingRefundsKeys.all });
        }
        options?.onSuccess?.(result);
      },
      onError: (error) => options?.onError?.(error),
    });
  },

  useRefund: (options?: {
    onSuccess?: (result: VcbRefundResult) => void;
    onError?: (error: Error) => void;
  }) => {
    const qc = useQueryClient();
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: appointmentBookingsKeys.all });
      qc.invalidateQueries({ queryKey: appointmentBookingPaymentsKeys.all });
      qc.invalidateQueries({ queryKey: appointmentBookingRefundsKeys.all });
    };
    return useMutation({
      mutationFn: (payload: VcbRefundPayload) => appointmentBookingRefundsService.refund(payload),
      onSuccess: (result) => {
        invalidate();
        options?.onSuccess?.(result);
      },
      // 502 (PENDING/FAILED) vẫn đã ghi/cập nhật dòng refund ở BE → làm mới trạng thái.
      onError: (error) => {
        invalidate();
        options?.onError?.(error);
      },
    });
  },
};

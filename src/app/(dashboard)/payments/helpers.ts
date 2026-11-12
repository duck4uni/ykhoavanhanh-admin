import type { AppointmentBookingPayment } from "@/api/appointmentBookingPaymentsApi";

export const PAYMENTS_PAGE_SIZE = 10;

export const statusLabels: Record<AppointmentBookingPayment["payment_status"], string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
};

export function getStatusBadge(status: AppointmentBookingPayment["payment_status"]): string {
  switch (status) {
    case "PAID":
      return "bg-success-light text-success";
    case "PENDING":
      return "bg-warning-light text-warning";
    default:
      return "bg-surface-secondary text-muted-foreground";
  }
}

const refundStatusLabels: Record<string, string> = {
  PENDING: "Đang xử lý hoàn tiền",
  SUCCESS: "Đã hoàn tiền",
  FAILED: "Hoàn tiền thất bại",
};

/**
 * Trạng thái đối soát/hoàn tiền — đọc từ `refund` đã được BE join sẵn theo
 * `booking_id` (endpoint danh sách thanh toán không cần tự nối dữ liệu với
 * endpoint refunds riêng). `refund: null` nghĩa là booking chưa từng có yêu
 * cầu hoàn tiền nào.
 */
export function getReconcileMeta(payment: AppointmentBookingPayment): { label: string; className: string } {
  if (!payment.refund) {
    return payment.payment_status === "PAID"
      ? { label: "Đã đối soát", className: "bg-success-light text-success" }
      : { label: "Chưa đối soát", className: "bg-surface-secondary text-muted-foreground" };
  }
  const { refund_status } = payment.refund;
  const label = refundStatusLabels[refund_status] ?? refund_status;
  const className =
    refund_status === "SUCCESS"
      ? "bg-primary-100 text-primary-600"
      : refund_status === "FAILED"
        ? "bg-error-light text-error"
        : "bg-warning-light text-warning";
  return { label, className };
}

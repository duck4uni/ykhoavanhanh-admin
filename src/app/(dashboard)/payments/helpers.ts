import type { Payment } from "@/types/payment";

export const PAYMENTS_PAGE_SIZE = 10;

export const statusLabels: Record<Payment["status"], string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  refunded: "Đã hoàn tiền",
  expired: "Hết hạn",
};

export const methodLabels: Record<Payment["method"], string> = {
  vcb_qr: "QR VCB",
  vcb_transfer: "Chuyển khoản VCB",
  vcb_card: "Thẻ VCB",
  cash: "Tiền mặt",
};

export const patientPhones: Record<string, string> = {
  p001: "0901 234 567",
  p002: "0934 567 890",
  p003: "0912 345 678",
  p004: "0987 654 321",
  p005: "0963 852 741",
  p006: "0908 741 852",
  p008: "0911 222 333",
  p010: "0903 444 555",
};

export function getStatusBadge(status: Payment["status"]): string {
  switch (status) {
    case "paid":
      return "bg-success-light text-success";
    case "pending":
      return "bg-warning-light text-warning";
    case "refunded":
      return "bg-primary-100 text-primary-600";
    case "failed":
      return "bg-error-light text-error";
    default:
      return "bg-surface-secondary text-muted-foreground";
  }
}

export function getReconcileMeta(payment: Payment): { label: string; className: string } {
  if (payment.status === "paid" || payment.status === "refunded") {
    return { label: "Đã đối soát", className: "bg-success-light text-success" };
  }
  return { label: "Chưa đối soát", className: "bg-surface-secondary text-muted-foreground" };
}

export const BOOKING_PAGE_SIZE = 10;

export type BookingFilters = {
  facility_id: string;
  patient_id: string;
  his_patient_id: string;
  doctor_id: string;
  room_id: string;
  service_id: string;
  status: string;
  source: string;
  from_date: string;
  to_date: string;
};

export const initialFilters: BookingFilters = {
  facility_id: "",
  patient_id: "",
  his_patient_id: "",
  doctor_id: "",
  room_id: "",
  service_id: "",
  status: "",
  source: "",
  from_date: "",
  to_date: "",
};

export function formatBookingStatus(status: string | null | undefined): string {
  if (!status) return "—";
  const labels: Record<string, string> = {
    HIS_SYNCED: "Đã đồng bộ HIS",
    CONFIRMED: "Đã xác nhận",
    PAID: "Đã thanh toán",
    PENDING_PAYMENT: "Chờ thanh toán",
    CANCELED: "Đã hủy",
    CANCELLED: "Đã hủy",
    PENDING: "Đang chờ",
    COMPLETED: "Hoàn tất",
  };
  return labels[status] ?? status;
}

/** Màu badge trạng thái lịch đặt khám, dùng ở bảng danh sách. */
export function getBookingStatusBadge(status: string | null | undefined): string {
  switch (status) {
    case "PAID":
    case "COMPLETED":
      return "bg-success-light text-success";
    case "PENDING_PAYMENT":
    case "PENDING":
      return "bg-warning-light text-warning";
    case "CANCELED":
    case "CANCELLED":
      return "bg-error-light text-error";
    case "HIS_SYNCED":
    case "CONFIRMED":
      return "bg-primary-100 text-primary-600";
    default:
      return "bg-surface-secondary text-muted-foreground";
  }
}

/** Nhãn hiển thị đối tượng khám — mã ngắn suy ra tên đầy đủ, giá trị lạ hiển thị nguyên văn. */
export function formatExamType(examType: string | null | undefined): string {
  if (!examType) return "—";
  const labels: Record<string, string> = {
    BHYT: "BHYT",
    DV: "Dịch vụ",
    VIP: "Khám VIP",
  };
  return labels[examType] ?? examType;
}

export function formatHisSyncStatus(status: string | null | undefined): string {
  const labels: Record<string, string> = {
    PENDING: "Chưa đồng bộ",
    PROCESSING: "Đang xử lý",
    SYNCED: "Đã đồng bộ",
    FAILED: "Đồng bộ lỗi",
    REVIEW_REQUIRED: "Cần đối soát",
  };
  return status ? labels[status] ?? status : "Chưa đồng bộ";
}

export function getHisSyncStatusBadge(status: string | null | undefined): string {
  switch (status) {
    case "SYNCED":
      return "bg-success-light text-success";
    case "PROCESSING":
      return "bg-primary-100 text-primary-600";
    case "FAILED":
      return "bg-error-light text-error";
    case "REVIEW_REQUIRED":
      return "bg-orange-100 text-orange-700";
    case "PENDING":
    default:
      return "bg-warning-light text-warning";
  }
}

export function getHisSyncActionState(booking: {
  status?: string | null;
  queue_number?: number | null;
  his_sync_status?: string | null;
  patient?: { his_patient_id?: string | null } | null;
}): { enabled: boolean; reason: string } {
  if (booking.status === "CANCELLED" || booking.status === "CANCELED") {
    return { enabled: false, reason: "Lịch khám đã hủy" };
  }
  if (booking.status !== "PAID") {
    return { enabled: false, reason: "Lịch khám chưa thanh toán" };
  }
  if (booking.queue_number == null) {
    return { enabled: false, reason: "Lịch khám chưa có số thứ tự" };
  }
  if (!booking.patient?.his_patient_id) {
    return { enabled: false, reason: "Bệnh nhân chưa được đồng bộ lên HIS" };
  }
  if (booking.his_sync_status === "SYNCED") {
    return { enabled: false, reason: "Lịch đã được đồng bộ lên HIS" };
  }
  if (booking.his_sync_status === "PROCESSING") {
    return { enabled: false, reason: "Lịch đang được HIS xử lý" };
  }
  if (booking.his_sync_status === "FAILED") {
    return { enabled: true, reason: "Thử lại đồng bộ lịch khám lên HIS" };
  }
  if (booking.his_sync_status === "REVIEW_REQUIRED") {
    return { enabled: true, reason: "Cần đối soát HIS — bấm để backend kiểm tra lại" };
  }
  return { enabled: true, reason: "Đồng bộ lịch khám lên HIS" };
}

export function pruneEmptyFilters(filters: BookingFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value.trim() !== ""),
  ) as Partial<BookingFilters>;
}

/** Kết hợp appointment_date (yyyy-MM-dd) + appointment_time (HH:mm:ss) thành text hiển thị. */
export function getBookingDateTimeText(booking: { appointment_date?: string | null; appointment_time?: string | null }): string {
  const date = booking.appointment_date?.slice(0, 10);
  const time = booking.appointment_time?.slice(0, 5);
  if (date && time) {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year} ${time}`;
  }
  return date ?? time ?? "—";
}

export function getBookingPrice(price: string | number | null | undefined): number | null {
  if (price === null || price === undefined) return null;
  const value = typeof price === "string" ? Number(price) : price;
  return Number.isFinite(value) ? value : null;
}

// ─── Hủy lịch & hoàn tiền ─────────────────────────────────────────────────────

/** Trạng thái cho phép admin hủy lịch (DELETE /appointments/{id}). */
const CANCELLABLE_BOOKING_STATUSES = ["PENDING_PAYMENT", "PAID", "CONFIRMED"];

export function isCancelledBooking(status: string | null | undefined): boolean {
  return status === "CANCELLED" || status === "CANCELED";
}

/** Lịch chưa hoàn tất, chưa hủy và chưa qua ngày khám mới được hủy. */
export function getCancelActionState(booking: {
  status?: string | null;
  appointment_date?: string | null;
}): { enabled: boolean; reason: string } {
  if (isCancelledBooking(booking.status)) return { enabled: false, reason: "Lịch khám đã hủy" };
  if (booking.status === "COMPLETED") return { enabled: false, reason: "Lịch khám đã hoàn tất, không thể hủy" };
  if (!booking.status || !CANCELLABLE_BOOKING_STATUSES.includes(booking.status)) {
    return { enabled: false, reason: "Trạng thái lịch khám hiện tại không cho phép hủy" };
  }
  if (booking.appointment_date) {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (booking.appointment_date.slice(0, 10) < todayKey) {
      return { enabled: false, reason: "Đã qua ngày khám, không thể hủy lịch và hoàn tiền" };
    }
  }
  return { enabled: true, reason: "Hủy lịch khám và hoàn tiền" };
}

export const REFUND_STATUS_LABELS: Record<string, string> = {
  PENDING: "Đang xử lý hoàn tiền",
  SUCCESS: "Đã hoàn tiền",
  FAILED: "Hoàn tiền thất bại",
};

export function getRefundStatusBadge(status: string | null | undefined): string {
  switch (status) {
    case "SUCCESS":
      return "bg-success-light text-success";
    case "FAILED":
      return "bg-error-light text-error";
    default:
      return "bg-warning-light text-warning";
  }
}

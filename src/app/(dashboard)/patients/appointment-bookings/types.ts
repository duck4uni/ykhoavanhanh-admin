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
    CANCELED: "Đã hủy",
    CANCELLED: "Đã hủy",
    PENDING: "Đang chờ",
    COMPLETED: "Hoàn tất",
  };
  return labels[status] ?? status;
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

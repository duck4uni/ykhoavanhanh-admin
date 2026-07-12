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

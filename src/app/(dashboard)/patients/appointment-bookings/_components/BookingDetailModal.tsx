import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { AppointmentBooking } from "@/api/appointmentBookingsApi";
import { formatBookingStatus, getBookingDateTimeText, getBookingPrice } from "../types";

interface BookingDetailModalProps {
  booking: AppointmentBooking | null;
  onClose: () => void;
}

export function BookingDetailModal({ booking, onClose }: BookingDetailModalProps) {
  if (!booking) return null;

  const price = getBookingPrice(booking.price ?? booking.service?.price);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Chi tiết lịch đặt khám</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-semibold text-primary-600">
              {booking.his_booking_id ?? booking.request_booking_id ?? booking.id}
            </span>
            <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700">
              {formatBookingStatus(booking.local_status)}
            </span>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bệnh nhân</h3>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Họ tên</dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-800">{booking.patient?.patient_full_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Số điện thoại</dt>
                <dd className="mt-0.5 text-sm text-slate-700">{booking.patient?.phone_number || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">Mã BN HIS</dt>
                <dd className="mt-0.5 font-mono text-sm text-slate-700">
                  {booking.his_patient_id ?? booking.patient?.his_patient_id ?? "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lịch khám</h3>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Thời gian hẹn</dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-800">{getBookingDateTimeText(booking)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Số thứ tự</dt>
                <dd className="mt-0.5 text-sm text-slate-700">{booking.queue_number ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Khu khám</dt>
                <dd className="mt-0.5 text-sm text-slate-700">{booking.exam_area?.name || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Phòng khám</dt>
                <dd className="mt-0.5 text-sm text-slate-700">{booking.room?.room_name ?? booking.room_id ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Chuyên khoa</dt>
                <dd className="mt-0.5 text-sm text-slate-700">{booking.specialty?.name || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Bác sĩ</dt>
                <dd className="mt-0.5 text-sm text-slate-700">
                  {booking.doctor?.doctor_name ?? booking.doctor_id ?? "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">Dịch vụ</dt>
                <dd className="mt-0.5 text-sm text-slate-700">{booking.service?.service_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Giá dịch vụ</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-800">
                  {price !== null ? formatCurrency(price) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Nguồn</dt>
                <dd className="mt-0.5 text-sm text-slate-700">{booking.source || "—"}</dd>
              </div>
            </dl>
          </div>

          {booking.note && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ghi chú</h3>
              <p className="text-sm text-slate-700">{booking.note}</p>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thông tin hệ thống</h3>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Trạng thái HIS</dt>
                <dd className="mt-0.5 text-sm text-slate-700">{booking.his_status || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Hành động HIS</dt>
                <dd className="mt-0.5 text-sm text-slate-700">{booking.his_action || "—"}</dd>
              </div>
              {booking.his_error_message && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground">Lỗi HIS</dt>
                  <dd className="mt-0.5 text-sm text-red-600">{booking.his_error_message}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Ngày tạo</dt>
                <dd className="mt-0.5 text-sm text-slate-700">{formatDateTime(booking.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Cập nhật lúc</dt>
                <dd className="mt-0.5 text-sm text-slate-700">{formatDateTime(booking.updated_at)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

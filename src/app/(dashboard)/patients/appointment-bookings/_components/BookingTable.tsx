import { Card } from "@/components/ui/Card";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import { formatDateTime } from "@/lib/utils";
import { BOOKING_PAGE_SIZE, formatBookingStatus } from "../types";
import type { BookingListController } from "../hooks/useBookingList";

/** Bảng danh sách lịch đặt khám + phân trang. */
export function BookingTable({ ctrl }: { ctrl: BookingListController }) {
  const { isLoading, bookings, total, totalPages, currentPage, setPage } = ctrl;

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Danh sách lịch khám</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          {total} lịch khám
        </span>
      </div>

      {isLoading ? (
        <LoadingSection text="Đang tải danh sách lịch khám..." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3.5">Thời gian hẹn</th>
                  <th className="px-5 py-3.5">Bệnh nhân</th>
                  <th className="px-5 py-3.5">Mã BN HIS</th>
                  <th className="px-5 py-3.5">Mã đặt khám</th>
                  <th className="px-5 py-3.5">Cơ sở</th>
                  <th className="px-5 py-3.5">Bác sĩ</th>
                  <th className="px-5 py-3.5">Phòng</th>
                  <th className="px-5 py-3.5">Dịch vụ</th>
                  <th className="px-5 py-3.5">Nguồn</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-muted-foreground">
                      Không tìm thấy lịch khám phù hợp.
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-border transition-colors last:border-0 hover:bg-surface-secondary/40">
                      <td className="px-5 py-4 font-medium text-foreground">
                        {booking.appointment_time ? formatDateTime(booking.appointment_time) : "—"}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {booking.patient?.patient_full_name ?? booking.patient_id ?? "—"}
                      </td>
                      <td className="px-5 py-4 font-mono text-primary-600">
                        {booking.his_patient_id ?? booking.patient?.his_patient_id ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {booking.his_booking_id ?? booking.request_booking_id ?? booking.id}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {booking.facility?.facility_name ?? booking.facility_id ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {booking.doctor?.doctor_name ?? booking.doctor_id ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {booking.room?.room_name ?? booking.room_id ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {booking.service?.service_name ?? booking.service_id ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{booking.source ?? "—"}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700">
                          {formatBookingStatus(booking.local_status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={total}
              pageSize={BOOKING_PAGE_SIZE}
            />
          </div>
        </>
      )}
    </Card>
  );
}

import { LoadingSection } from "@/components/ui/Spinner";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { Patient } from "@/types/patient";
import { EmptyTab } from "./primitives";
import { formatStatus, toNumber } from "../types";
import type { BookingRow, RecordRow, ReviewRow } from "../hooks/usePatientDetail";

// ─── Lịch sử đặt khám ─────────────────────────────────────────────────────────

export function AppointmentsTab({
  bookings,
  bookingsLoading,
  bookingsCount,
}: {
  bookings: BookingRow[];
  bookingsLoading: boolean;
  bookingsCount: number;
}) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Lịch sử đặt khám</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          {bookingsCount} lượt
        </span>
      </div>
      {bookingsLoading ? (
        <LoadingSection text="Đang tải lịch sử đặt khám..." />
      ) : bookings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-medium text-slate-500">
                <th className="px-4 py-3">Thời gian hẹn</th>
                <th className="px-4 py-3">Mã đặt khám</th>
                <th className="px-4 py-3">Mã BN HIS</th>
                <th className="px-4 py-3">Phòng</th>
                <th className="px-4 py-3">Bác sĩ</th>
                <th className="px-4 py-3">Dịch vụ</th>
                <th className="px-4 py-3">Nguồn</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {booking.appointment_time ? formatDateTime(booking.appointment_time) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {booking.his_booking_id ?? booking.request_booking_id ?? booking.id}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {booking.his_patient_id ?? booking.patient?.his_patient_id ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{booking.room_id ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{booking.doctor_id ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{booking.service_id ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{booking.source ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700">
                      {formatStatus(booking.local_status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyTab text="Chưa có lịch sử đặt khám." />
      )}
    </>
  );
}

// ─── Hồ sơ bệnh án ────────────────────────────────────────────────────────────

export function RecordsTab({
  records,
  recordsLoading,
  recordsCount,
}: {
  records: RecordRow[];
  recordsLoading: boolean;
  recordsCount: number;
}) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Hồ sơ bệnh án</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          {recordsCount} hồ sơ
        </span>
      </div>
      {recordsLoading ? (
        <LoadingSection text="Đang tải hồ sơ bệnh án..." />
      ) : records.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-medium text-slate-500">
                <th className="px-4 py-3">Mã hồ sơ</th>
                <th className="px-4 py-3">Ngày khám</th>
                <th className="px-4 py-3">Bác sĩ</th>
                <th className="px-4 py-3">Chẩn đoán</th>
                <th className="px-4 py-3">Thanh toán</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-800">{record.record_code}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(record.examined_at)}</td>
                  <td className="px-4 py-3 text-slate-600">{record.doctor?.doctor_name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{record.diagnosis ?? record.conclusion ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {formatCurrency(toNumber(record.paid_amount || record.total_amount))}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-success-light px-2.5 py-1 text-xs font-medium text-success">
                      {formatStatus(record.record_status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyTab text="Chưa có hồ sơ bệnh án." />
      )}
    </>
  );
}

// ─── Thanh toán ───────────────────────────────────────────────────────────────

export function PaymentsTab({
  records,
  recordsLoading,
}: {
  records: RecordRow[];
  recordsLoading: boolean;
}) {
  return (
    <>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Thanh toán</h2>
      {recordsLoading ? (
        <LoadingSection text="Đang tải dữ liệu thanh toán..." />
      ) : records.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-medium text-slate-500">
                <th className="px-4 py-3">Mã hồ sơ</th>
                <th className="px-4 py-3">Ngày khám</th>
                <th className="px-4 py-3">Tổng tiền</th>
                <th className="px-4 py-3">Đã thanh toán</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-800">{record.record_code}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(record.examined_at)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {formatCurrency(toNumber(record.total_amount))}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {formatCurrency(toNumber(record.paid_amount))}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {formatStatus(record.payment_status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyTab text="Chưa có dữ liệu thanh toán." />
      )}
    </>
  );
}

// ─── Đánh giá ─────────────────────────────────────────────────────────────────

export function ReviewsTab({ latestReview }: { latestReview?: ReviewRow }) {
  return (
    <>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Đánh giá</h2>
      {latestReview ? (
        <div className="space-y-4 rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xl font-bold text-warning">{latestReview.overall_rating} ★</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {formatStatus(latestReview.status)}
            </span>
            <span className="text-sm text-muted-foreground">{formatDateTime(latestReview.created_at)}</span>
          </div>
          <p className="text-sm text-slate-700">{latestReview.comment || "Chưa có nội dung đánh giá."}</p>
          {latestReview.admin_reply && (
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <b>Phản hồi:</b> {latestReview.admin_reply}
            </div>
          )}
        </div>
      ) : (
        <EmptyTab text="Chưa có đánh giá." />
      )}
    </>
  );
}

// ─── Người thân ───────────────────────────────────────────────────────────────

export function FamilyTab() {
  return (
    <>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Người thân</h2>
      <EmptyTab text="Chưa có dữ liệu người thân." />
    </>
  );
}

// ─── Nhật ký cập nhật ─────────────────────────────────────────────────────────

export function LogsTab({ patient }: { patient: Patient }) {
  return (
    <>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Nhật ký cập nhật</h2>
      <div className="space-y-3 text-sm">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="font-medium text-slate-800">Cập nhật HIS gần nhất</p>
          <p className="mt-1 text-muted-foreground">
            {patient.his_updated_at ? formatDateTime(patient.his_updated_at) : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="font-medium text-slate-800">Đồng bộ vào hệ thống</p>
          <p className="mt-1 text-muted-foreground">
            {patient.synced_at ? formatDateTime(patient.synced_at) : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="font-medium text-slate-800">Cập nhật hồ sơ</p>
          <p className="mt-1 text-muted-foreground">
            {patient.updated_at ? formatDateTime(patient.updated_at) : "—"}
          </p>
        </div>
      </div>
    </>
  );
}

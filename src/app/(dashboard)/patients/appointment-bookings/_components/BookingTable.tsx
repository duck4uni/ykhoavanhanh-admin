"use client";

import { useState } from "react";
import { FiEye, FiRefreshCw } from "react-icons/fi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TablePagination } from "@/components/ui/TablePagination";
import { LoadingSection } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/utils";
import { appointmentBookingsHooks, type AppointmentBooking } from "@/api/appointmentBookingsApi";
import {
  formatBookingStatus,
  formatExamType,
  formatHisSyncStatus,
  getBookingDateTimeText,
  getBookingStatusBadge,
  getHisSyncActionState,
  getHisSyncStatusBadge,
} from "../types";
import type { BookingListController } from "../hooks/useBookingList";

interface BookingTableProps {
  ctrl: BookingListController;
  onViewDetail: (booking: AppointmentBooking) => void;
}

/** Bảng danh sách lịch đặt khám + phân trang. */
export function BookingTable({ ctrl, onViewDetail }: BookingTableProps) {
  const { isLoading, bookings, total, totalPages, currentPage, setPage, pageSize, setPageSize } = ctrl;
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const syncToHis = appointmentBookingsHooks.useSyncToHis({
    onSuccess: (data) => {
      setSyncingId(null);
      const result = data.results[0];
      if (result?.status === "error") {
        toast.error(result.message || "Đồng bộ lịch khám lên HIS thất bại");
      } else if (result?.status === "skipped") {
        toast.warning(result.message || "Lịch khám chưa đủ điều kiện đồng bộ");
      } else {
        toast.success("Đồng bộ lịch khám lên HIS thành công");
      }
    },
    onError: (error) => {
      setSyncingId(null);
      toast.error(error.message || "Đồng bộ lịch khám lên HIS thất bại");
    },
  });

  function handleSyncToHis(booking: AppointmentBooking) {
    const action = getHisSyncActionState(booking);
    if (!action.enabled) return;
    setSyncingId(booking.id);
    syncToHis.mutate([booking.id]);
  }

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
                  <th className="px-5 py-3.5 text-center">STT</th>
                  <th className="px-5 py-3.5">Bệnh nhân</th>
                  <th className="px-5 py-3.5">Mã BN HIS</th>
                  {/* <th className="px-5 py-3.5">Mã đặt khám</th> */}
                  <th className="px-5 py-3.5">Khu khám</th>
                  <th className="px-5 py-3.5">Bác sĩ</th>
                  <th className="px-5 py-3.5">Chuyên khoa</th>
                  <th className="px-5 py-3.5">Dịch vụ</th>
                  <th className="px-5 py-3.5">Đối tượng khám</th>
                  {/* <th className="px-5 py-3.5">Nguồn</th> */}
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Đồng bộ HIS</th>
                  <th className="px-5 py-3.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-5 py-12 text-center text-muted-foreground">
                      Không tìm thấy lịch khám phù hợp.
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => {
                    const syncAction = getHisSyncActionState(booking);
                    const isSyncing = syncingId === booking.id;
                    return (
                    <tr key={booking.id} className="border-b border-border transition-colors last:border-0 hover:bg-surface-secondary/40">
                      <td className="px-5 py-4 font-medium text-foreground">
                        {getBookingDateTimeText(booking)}
                      </td>
                      <td className="px-5 py-4 text-center font-semibold text-slate-700">
                        {booking.queue_number ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {booking.patient?.patient_full_name ?? booking.patient_id ?? "—"}
                      </td>
                      <td className="px-5 py-4 font-mono text-primary-600">
                        {booking.his_patient_id ?? booking.patient?.his_patient_id ?? "—"}
                      </td>
                      {/* <td className="px-5 py-4 text-muted-foreground">
                        {booking.his_booking_id ?? booking.request_booking_id ?? booking.id}
                      </td> */}
                      <td className="px-5 py-4 text-muted-foreground">
                        {booking.exam_area?.name ?? booking.exam_area_id ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {booking.doctor?.doctor_name ?? booking.doctor_id ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {booking.specialty?.name ?? booking.specialty_id ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {booking.service?.service_name ?? booking.service_id ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {formatExamType(booking.exam_type)}
                      </td>
                      {/* <td className="px-5 py-4 text-muted-foreground">{booking.source ?? "—"}</td> */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getBookingStatusBadge(booking.status ?? booking.local_status)}`}>
                          {formatBookingStatus(booking.status ?? booking.local_status)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="min-w-[145px]">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getHisSyncStatusBadge(booking.his_sync_status)}`}
                            title={booking.last_his_sync_error || undefined}
                          >
                            {formatHisSyncStatus(booking.his_sync_status)}
                          </span>
                          {booking.his_sync_status === "SYNCED" && (
                            booking.his_booking_id ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {booking.his_booking_id}
                                {booking.his_stt ? ` · STT ${booking.his_stt}` : ""}
                              </p>
                            ) : (
                              <p className="mt-1 text-xs text-warning">Thiếu mã booking HIS</p>
                            )
                          )}
                          {!syncAction.enabled && booking.his_sync_status !== "SYNCED" && booking.his_sync_status !== "PROCESSING" && (
                            <p className="mt-1 max-w-[180px] text-xs text-muted-foreground">
                              {syncAction.reason}
                            </p>
                          )}
                          {booking.synced_to_his_at && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatDateTime(booking.synced_to_his_at)}
                            </p>
                          )}
                          {(booking.his_sync_status === "FAILED" || booking.his_sync_status === "REVIEW_REQUIRED") && booking.last_his_sync_error && (
                            <p className="mt-1 max-w-[180px] truncate text-xs text-error" title={booking.last_his_sync_error}>
                              {booking.last_his_sync_error}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-primary-600" onClick={() => onViewDetail(booking)}>
                            <FiEye className="h-3.5 w-3.5" /> Chi tiết
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 rounded-lg"
                            disabled={!syncAction.enabled || isSyncing}
                            title={syncAction.reason}
                            onClick={() => handleSyncToHis(booking)}
                          >
                            <FiRefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                            Đồng bộ HIS
                          </Button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
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
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>
        </>
      )}
    </Card>
  );
}

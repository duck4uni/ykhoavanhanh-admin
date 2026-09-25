"use client";

import { useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import {
  appointmentBookingsHooks,
  type AppointmentBooking,
  type AppointmentSyncToHisResultRow,
} from "@/api/appointmentBookingsApi";
import { useBookingList } from "./hooks/useBookingList";
import { BookingFiltersBar } from "./_components/BookingFiltersBar";
import { BookingTable } from "./_components/BookingTable";
import { BookingDetailModal } from "./_components/BookingDetailModal";

export default function PatientAppointmentBookingsPage() {
  const ctrl = useBookingList();
  const [selectedBooking, setSelectedBooking] = useState<AppointmentBooking | null>(null);
  const [resultRows, setResultRows] = useState<AppointmentSyncToHisResultRow[] | null>(null);

  const syncAllToHis = appointmentBookingsHooks.useSyncAllToHis({
    onSuccess: (data) => {
      if (data.total === 0) {
        toast.success("Không có lịch khám nào đủ điều kiện đồng bộ lên HIS");
        return;
      }
      const parts = [`${data.success}/${data.total} thành công`];
      if (data.skipped > 0) parts.push(`${data.skipped} bỏ qua`);
      if (data.error > 0) parts.push(`${data.error} lỗi`);
      const summary = `Đồng bộ HIS: ${parts.join(", ")}`;
      data.error > 0 ? toast.error(summary) : toast.success(summary);
      const nonSuccessRows = data.results.filter((row) => row.status !== "success");
      if (nonSuccessRows.length > 0) setResultRows(nonSuccessRows);
    },
    onError: (error) => toast.error(error.message || "Đồng bộ tất cả lịch khám lên HIS thất bại"),
  });

  function handleSyncAll() {
    syncAllToHis.mutate({
      limit: 100,
      from_date: ctrl.appliedFilters.from_date || undefined,
      to_date: ctrl.appliedFilters.to_date || undefined,
    });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Danh sách lịch khám</h1>
          <p className="mt-1 text-sm text-muted-foreground">Quản lý lịch đặt khám của bệnh nhân</p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          disabled={syncAllToHis.isPending}
          onClick={handleSyncAll}
        >
          <RefreshCw className={`h-4 w-4 ${syncAllToHis.isPending ? "animate-spin" : ""}`} />
          Đồng bộ tất cả
        </Button>
      </div>

      <BookingFiltersBar ctrl={ctrl} />
      <BookingTable ctrl={ctrl} onViewDetail={setSelectedBooking} />

      <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />

      {resultRows && resultRows.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setResultRows(null)} />
          <div className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <AlertCircle className="h-5 w-5 text-warning" /> Lịch chưa đồng bộ ({resultRows.length})
              </h2>
              <button onClick={() => setResultRows(null)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="divide-y divide-slate-100">
              {resultRows.map((row, index) => (
                <div key={`${row.appointment_id}-${index}`} className="px-6 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-sm font-medium text-slate-800">{row.appointment_id}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.status === "error" ? "bg-error-light text-error" : "bg-warning-light text-warning"}`}>
                      {row.status === "error" ? "Lỗi" : "Bỏ qua"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{row.message || "Không có thông tin chi tiết"}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setResultRows(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

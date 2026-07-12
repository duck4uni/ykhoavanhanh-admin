import type { OperationsController } from "../hooks/useOperations";

/** 4 thẻ thống kê vận hành. */
export function OperationStats({ ctrl }: { ctrl: OperationsController }) {
  const { tickets, refundedOrCancelledTickets, syncJobs } = ctrl;

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">Phiếu chờ đồng bộ HIS</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">
          {tickets.filter((ticket) => ticket.his_sync_status === "pending").length}
        </p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">Phiếu hoàn/hủy</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{refundedOrCancelledTickets.length}</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">Phiếu đăng ký 2 phòng</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">
          {tickets.filter((ticket) => ticket.booked_clinic_ids.length > 1).length}
        </p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">Đồng bộ 23h</p>
        <p className="mt-2 text-lg font-bold text-gray-900">{syncJobs[0]?.next_run_at ?? "Chưa cấu hình"}</p>
      </div>
    </div>
  );
}

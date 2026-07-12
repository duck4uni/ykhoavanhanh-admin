import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getTicketStatusVariant, ticketStatusLabels } from "@/lib/hospital-admin";
import { formatDateTime } from "@/lib/utils";
import type { OperationsController } from "../hooks/useOperations";

/** Cột phải: báo cáo hoàn/hủy + đồng bộ 23h. */
export function ReportPanel({ ctrl }: { ctrl: OperationsController }) {
  const { refundedOrCancelledTickets, syncJobs, runSyncNow } = ctrl;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Báo cáo hoàn / hủy phiếu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {refundedOrCancelledTickets.map((ticket) => (
              <div key={ticket.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{ticket.ticket_number}</p>
                    <p className="text-sm text-gray-500">{ticket.patient_name}</p>
                  </div>
                  <Badge variant={getTicketStatusVariant(ticket.status)}>
                    {ticketStatusLabels[ticket.status]}
                  </Badge>
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p>Lý do: {ticket.refund_reason || ticket.cancel_reason || "Chưa ghi nhận"}</p>
                  <p>Ngày cập nhật: {formatDateTime(ticket.updated_at)}</p>
                  <p>Người cập nhật: {ticket.updated_by}</p>
                </div>
              </div>
            ))}
            {refundedOrCancelledTickets.length === 0 && (
              <p className="text-sm text-gray-500">Chưa có phiếu hoàn hoặc hủy cần báo cáo.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Đồng bộ phiếu khám 23h</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {syncJobs.map((job) => (
            <div key={job.id} className="rounded-xl border border-gray-200 p-4">
              <p className="font-semibold text-gray-900">{job.name}</p>
              <p className="mt-1 text-sm text-gray-500">Giờ chạy: {job.run_time}</p>
              <p className="text-sm text-gray-500">Lần chạy gần nhất: {job.last_run_at ?? "Chưa có"}</p>
              <p className="text-sm text-gray-500">Lần chạy tiếp theo: {job.next_run_at}</p>
            </div>
          ))}
          <Button variant="primary" onClick={runSyncNow}>Chạy đồng bộ ngay</Button>
        </CardContent>
      </Card>
    </div>
  );
}

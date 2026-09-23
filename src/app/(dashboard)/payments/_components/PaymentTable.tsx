import Link from "next/link";
import { Landmark, MoreVertical, Smartphone } from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { AppointmentBookingPayment } from "@/api/appointmentBookingPaymentsApi";
import { PAYMENTS_PAGE_SIZE, getReconcileMeta, getStatusBadge, statusLabels } from "../helpers";
import type { PaymentListController } from "../hooks/usePaymentList";

function getGatewayMeta(gateway: AppointmentBookingPayment["payment_gateway"]) {
  if (gateway === "VCB") {
    return { icon: Landmark, className: "bg-primary-100 text-primary-600", label: "VietcomBank" };
  }
  return { icon: Smartphone, className: "bg-success-light text-success", label: "MoMo" };
}

/** Bảng giao dịch thanh toán + phân trang, đọc trực tiếp từ API thật. */
export function PaymentTable({ ctrl }: { ctrl: PaymentListController }) {
  const { rows, isLoading, page, setPage, total, totalPages, getDescription } = ctrl;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3.5">Mã GD</th>
              <th className="px-5 py-3.5">Mã lịch hẹn</th>
              <th className="px-5 py-3.5">Bệnh nhân</th>
              <th className="px-5 py-3.5">Mô tả</th>
              <th className="px-5 py-3.5">Số tiền</th>
              <th className="px-5 py-3.5">Cổng</th>
              <th className="px-5 py-3.5">Trạng thái</th>
              <th className="px-5 py-3.5">Đối soát</th>
              <th className="px-5 py-3.5">Thời gian</th>
              <th className="px-5 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  Đang tải danh sách thanh toán...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  Không tìm thấy giao dịch phù hợp.
                </td>
              </tr>
            ) : (
              rows.map((p) => {
                const gatewayMeta = getGatewayMeta(p.payment_gateway);
                const GatewayIcon = gatewayMeta.icon;
                const reconcile = getReconcileMeta(p);
                return (
                  <tr key={p.id} className="text-sm transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-4 font-mono font-semibold text-primary-600">{p.transaction_id ?? "—"}</td>
                    <td className="px-5 py-4 font-mono text-slate-600">{p.booking_id}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{p.patient?.patient_full_name ?? "—"}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{p.patient?.phone_number ?? "—"}</p>
                    </td>
                    <td className="max-w-xs px-5 py-4 text-slate-600">{getDescription(p.booking)}</td>
                    <td className="px-5 py-4 font-bold text-foreground">{formatCurrency(Number(p.amount))}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 text-slate-600">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${gatewayMeta.className}`}>
                          <GatewayIcon className="h-3.5 w-3.5" />
                        </span>
                        {gatewayMeta.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadge(p.payment_status)}`}>
                        {statusLabels[p.payment_status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${reconcile.className}`}>
                        {reconcile.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatDateTime(p.payment_time ?? p.created_at)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/payments/${p.id}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-primary"
                        title="Chi tiết"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100 px-5 py-4">
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={total}
          pageSize={PAYMENTS_PAGE_SIZE}
        />
      </div>
    </div>
  );
}

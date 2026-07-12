import Link from "next/link";
import { Banknote, Landmark, MoreVertical, ReceiptText } from "lucide-react";
import { TablePagination } from "@/components/ui/TablePagination";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Payment } from "@/types/payment";
import { PAYMENTS_PAGE_SIZE, getReconcileMeta, getStatusBadge, methodLabels, patientPhones, statusLabels } from "../helpers";
import type { PaymentListController } from "../hooks/usePaymentList";

function getMethodMeta(method: Payment["method"]) {
  if (method === "cash") {
    return { icon: Banknote, className: "bg-success-light text-success" };
  }
  if (method === "vcb_transfer" || method === "vcb_card") {
    return { icon: Landmark, className: "bg-primary-100 text-primary-600" };
  }
  return { icon: ReceiptText, className: "bg-success-light text-success" };
}

/** Bảng giao dịch thanh toán + phân trang. */
export function PaymentTable({ ctrl }: { ctrl: PaymentListController }) {
  const { paged, page, setPage, total, totalPages } = ctrl;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3.5">Mã thanh toán</th>
              <th className="px-5 py-3.5">Mã phiếu khám</th>
              <th className="px-5 py-3.5">Bệnh nhân</th>
              <th className="px-5 py-3.5">Mô tả</th>
              <th className="px-5 py-3.5">Số tiền</th>
              <th className="px-5 py-3.5">Phương thức</th>
              <th className="px-5 py-3.5">Trạng thái</th>
              <th className="px-5 py-3.5">Đối soát</th>
              <th className="px-5 py-3.5">Ngày tạo</th>
              <th className="px-5 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  Không tìm thấy giao dịch phù hợp.
                </td>
              </tr>
            ) : (
              paged.map((p) => {
                const methodMeta = getMethodMeta(p.method);
                const MethodIcon = methodMeta.icon;
                const reconcile = getReconcileMeta(p);
                return (
                  <tr key={p.id} className="text-sm transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-4 font-mono font-semibold text-primary-600">{p.code}</td>
                    <td className="px-5 py-4 font-mono text-slate-600">{p.appointmentId ?? "—"}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{p.patientName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{patientPhones[p.patientId] ?? "—"}</p>
                    </td>
                    <td className="max-w-xs px-5 py-4 text-slate-600">{p.description}</td>
                    <td className="px-5 py-4 font-bold text-foreground">{formatCurrency(p.amount)}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 text-slate-600">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${methodMeta.className}`}>
                          <MethodIcon className="h-3.5 w-3.5" />
                        </span>
                        {methodLabels[p.method]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadge(p.status)}`}>
                        {statusLabels[p.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${reconcile.className}`}>
                        {reconcile.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatDateTime(p.createdAt)}</td>
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

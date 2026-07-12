import { CheckCircle2, Clock, ReceiptText, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PaymentListController } from "../hooks/usePaymentList";

/** Thẻ thống kê doanh thu / thanh toán. */
export function PaymentStatsCards({ stats }: { stats: PaymentListController["stats"] }) {
  const items = [
    { label: "Tổng doanh thu", value: formatCurrency(stats.totalRevenue), sub: `${stats.transactionCount} giao dịch`, icon: ReceiptText, tone: "bg-primary-100 text-primary-600" },
    { label: "Đã thanh toán", value: `${stats.paidCount} giao dịch`, sub: formatCurrency(stats.paidAmount), icon: CheckCircle2, tone: "bg-success-light text-success" },
    { label: "Chờ thanh toán", value: `${stats.pendingCount} giao dịch`, sub: formatCurrency(stats.pendingAmount), icon: Clock, tone: "bg-warning-light text-warning" },
    { label: "Đã hoàn tiền", value: `${stats.refundedCount} giao dịch`, sub: formatCurrency(stats.refundedAmount), icon: RotateCcw, tone: "bg-purple-100 text-purple-600" },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${s.tone}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-xl font-bold text-foreground">{s.value}</p>
                <p className={`mt-0.5 text-xs font-medium ${s.tone.includes("success") ? "text-success" : s.tone.includes("warning") ? "text-warning" : s.tone.includes("purple") ? "text-purple-600" : "text-muted-foreground"}`}>
                  {s.sub}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

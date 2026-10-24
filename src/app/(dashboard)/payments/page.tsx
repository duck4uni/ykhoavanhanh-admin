"use client";

import { Download, Loader2 } from "lucide-react";
import { usePaymentList } from "./hooks/usePaymentList";
import { PaymentFilters } from "./_components/PaymentFilters";
import { PaymentTable } from "./_components/PaymentTable";

/** Quyền truy cập (`accountant.report_bank`) chặn ở `layout.tsx` của thư mục này. */
export default function PaymentsPage() {
  const ctrl = usePaymentList();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Thanh toán</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý giao dịch thanh toán, đối soát và hoàn tiền
          </p>
        </div>

        {/* Xuất TOÀN BỘ dòng khớp bộ lọc hiện tại, không chỉ trang đang xem. */}
        <button
          type="button"
          onClick={ctrl.exportExcel}
          disabled={ctrl.isExporting}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {ctrl.isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {ctrl.isExporting ? "Đang xuất..." : "Xuất Excel"}
        </button>
      </div>

      <PaymentFilters ctrl={ctrl} />
      <PaymentTable ctrl={ctrl} />
    </div>
  );
}

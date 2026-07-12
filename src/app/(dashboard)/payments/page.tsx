"use client";

import { Plus } from "lucide-react";
import { usePaymentList } from "./hooks/usePaymentList";
import { PaymentStatsCards } from "./_components/PaymentStatsCards";
import { PaymentFilters } from "./_components/PaymentFilters";
import { PaymentTable } from "./_components/PaymentTable";

export default function PaymentsPage() {
  const ctrl = usePaymentList();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Thanh toán</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý giao dịch thanh toán, đối soát và hoàn tiền
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Tạo thanh toán
          </button>
        </div>
      </div>

      <PaymentStatsCards stats={ctrl.stats} />
      <PaymentFilters ctrl={ctrl} />
      <PaymentTable ctrl={ctrl} />
    </div>
  );
}

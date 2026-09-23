"use client";

import { usePaymentList } from "./hooks/usePaymentList";
import { PaymentFilters } from "./_components/PaymentFilters";
import { PaymentTable } from "./_components/PaymentTable";

export default function PaymentsPage() {
  const ctrl = usePaymentList();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Thanh toán</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý giao dịch thanh toán, đối soát và hoàn tiền
        </p>
      </div>

      <PaymentFilters ctrl={ctrl} />
      <PaymentTable ctrl={ctrl} />
    </div>
  );
}

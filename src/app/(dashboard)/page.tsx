"use client";

import { LoadingSpinner } from "@/components/ui/Spinner";
import { useDashboardData } from "./_home/hooks/useDashboardData";
import { RangeToggle } from "./_home/_components/primitives";
import { KpiGrid } from "./_home/_components/KpiGrid";
import { RevenueChart } from "./_home/_components/RevenueChart";
import { TicketRatioDonut } from "./_home/_components/TicketRatioDonut";
import { BottomPanels } from "./_home/_components/BottomPanels";

export default function DashboardPage() {
  const ctrl = useDashboardData();

  if (ctrl.isInitialLoading) {
    return (
      <div className="p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <LoadingSpinner text="Đang tải thống kê..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bảng điều khiển</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tổng quan hoạt động đặt khám, thanh toán và vận hành hệ thống Bệnh viện Vạn Hạnh.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RangeToggle value={ctrl.range} onChange={ctrl.setRange} />
        </div>
      </div>

      <KpiGrid ctrl={ctrl} />
      <RevenueChart ctrl={ctrl} />
      <TicketRatioDonut ctrl={ctrl} />
      <BottomPanels ctrl={ctrl} />
    </div>
  );
}

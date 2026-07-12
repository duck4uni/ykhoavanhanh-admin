"use client";

import { useOperations } from "./hooks/useOperations";
import { OperationStats } from "./_components/OperationStats";
import { TicketActionsPanel } from "./_components/TicketActionsPanel";
import { ReportPanel } from "./_components/ReportPanel";
import { ActionModal } from "./_components/ActionModal";

export default function OperationsPage() {
  const ctrl = useOperations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Công cụ vận hành khám bệnh</h1>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý đồng bộ HIS, cập nhật lại mã BN, đổi phòng khám hoặc bác sĩ, hoàn/hủy phiếu và theo dõi báo cáo hoàn hủy.
        </p>
      </div>

      <OperationStats ctrl={ctrl} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <TicketActionsPanel ctrl={ctrl} />
        <ReportPanel ctrl={ctrl} />
      </div>

      <ActionModal ctrl={ctrl} />
    </div>
  );
}

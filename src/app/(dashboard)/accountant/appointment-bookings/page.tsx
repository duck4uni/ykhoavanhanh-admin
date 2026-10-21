"use client";

import { AppointmentBookingsContent } from "../../patients/appointment-bookings/AppointmentBookingsContent";
import { usePermission } from "@/hooks/usePermission";

export default function AccountantAppointmentBookingsPage() {
  const { hasAnyPermission } = usePermission();
  const canCancelRefund = hasAnyPermission(["accountant.cancel_exam", "accountant.refund"]);

  return (
    <AppointmentBookingsContent
      canCancelRefund={canCancelRefund}
      subtitle="Quản lý hủy lịch khám và hoàn tiền cho bệnh nhân"
    />
  );
}

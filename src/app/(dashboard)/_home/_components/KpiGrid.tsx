import {
  FiActivity,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiStar,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import { KpiCard } from "./primitives";
import { formatCurrency, formatNumber } from "../types";
import type { DashboardController } from "../hooks/useDashboardData";

/** Lưới 8 thẻ KPI tổng quan. */
export function KpiGrid({ ctrl }: { ctrl: DashboardController }) {
  const { stats, paidRatio, pendingRatio, confirmationRatio } = ctrl;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Tổng doanh thu"
        value={stats ? formatCurrency(stats.totalRevenue) : "—"}
        icon={FiDollarSign}
        iconBg="bg-success"
        footer={stats ? `Doanh thu thuần: ${formatCurrency(stats.netRevenue)}` : undefined}
      />
      <KpiCard title="Tổng phiếu khám" value={stats ? formatNumber(stats.totalTickets) : "—"} icon={FiCalendar} iconBg="bg-primary-600" />
      <KpiCard
        title="Phiếu đã thanh toán"
        value={stats ? formatNumber(stats.paidTickets) : "—"}
        icon={FiActivity}
        iconBg="bg-secondary-500"
        footer={`Tỷ lệ: ${paidRatio}%`}
      />
      <KpiCard
        title="Phiếu chờ xác nhận"
        value={pendingRatio ? formatNumber(pendingRatio.totalCount) : "—"}
        icon={FiClock}
        iconBg="bg-accent-500"
        footer={pendingRatio ? `Tỷ lệ: ${pendingRatio.ratioPercent}%` : "Tỷ lệ: —"}
      />
      <KpiCard title="Phiếu đã hủy" value={stats ? formatNumber(stats.cancelledTickets) : "—"} icon={FiXCircle} iconBg="bg-error" />
      <KpiCard title="Tổng bác sĩ" value={stats ? formatNumber(stats.totalDoctors) : "—"} icon={FiUsers} iconBg="bg-purple-500" />
      <KpiCard
        title="Đánh giá trung bình"
        value={stats ? `${stats.avgRating.toFixed(1)}/5` : "—"}
        icon={FiStar}
        iconBg="bg-accent-400"
        footer={
          <span className="flex items-center justify-center gap-1 text-accent-600">
            {"★★★★★"} <span className="text-muted-foreground">{stats ? formatNumber(stats.totalReviews) : 0} đánh giá</span>
          </span>
        }
      />
      <KpiCard title="Tỷ lệ xác nhận" value={`${confirmationRatio}%`} icon={FiCheckCircle} iconBg="bg-success" />
    </div>
  );
}

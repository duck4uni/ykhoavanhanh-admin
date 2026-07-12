import { useMemo, useState } from "react";
import {
  useDashboardStats,
  useTicketRatios,
  useRevenueByDay,
  useRecentTickets,
  useUpcomingSchedules,
} from "@/api/dashboardApi";
import { fillRevenueByDay, rangeToFilter } from "../types";

/** State + toàn bộ dữ liệu cho trang bảng điều khiển. */
export function useDashboardData() {
  const [range, setRange] = useState<string>("today");
  const filter = useMemo(() => rangeToFilter(range), [range]);

  const { data: stats, isLoading: statsLoading } = useDashboardStats(filter);
  const { data: ratios, isLoading: ratiosLoading } = useTicketRatios(filter);
  const { data: revenueByDay, isLoading: revenueLoading } = useRevenueByDay(filter);
  const { data: recentTickets, isLoading: recentLoading } = useRecentTickets({ limit: 10 });
  const { data: upcoming, isLoading: upcomingLoading } = useUpcomingSchedules();

  const paidRatio =
    stats && stats.totalTickets > 0 ? ((stats.paidTickets / stats.totalTickets) * 100).toFixed(1) : "0";

  const confirmationRatio =
    stats && stats.totalTickets > 0 ? ((stats.paidTickets / stats.totalTickets) * 100).toFixed(1) : "0";

  const pendingRatio = useMemo(() => {
    if (!ratios) return null;
    return ratios.find((r) => /chờ|pending|wait/i.test(r.ticketStatus));
  }, [ratios]);

  const donutData = useMemo(() => {
    if (ratios && ratios.length > 0) {
      return ratios.map((r) => ({ name: r.ticketStatus, value: r.totalCount, percent: r.ratioPercent }));
    }
    return [];
  }, [ratios]);

  const totalTicketsForDonut = donutData.reduce((sum, d) => sum + d.value, 0);

  const revenueChartData = useMemo(() => fillRevenueByDay(revenueByDay, filter), [revenueByDay, filter]);

  return {
    range,
    setRange,
    filter,
    stats,
    isInitialLoading: statsLoading || ratiosLoading,
    paidRatio,
    confirmationRatio,
    pendingRatio,
    donutData,
    totalTicketsForDonut,
    revenueChartData,
    revenueLoading,
    recentTickets,
    recentLoading,
    upcoming,
    upcomingLoading,
  };
}

export type DashboardController = ReturnType<typeof useDashboardData>;

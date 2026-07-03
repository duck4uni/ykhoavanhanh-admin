"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/Spinner";
import {
  useDashboardStats,
  useTicketRatios,
  useRevenueByDay,
  useRecentTickets,
  useUpcomingSchedules,
  type DashboardFilter,
} from "@/api/dashboardApi";
import {
  FiDollarSign,
  FiCalendar,
  FiActivity,
  FiClock,
  FiXCircle,
  FiUsers,
  FiStar,
  FiCheckCircle,
  FiInfo,
  FiUser,
} from "react-icons/fi";
import {
  ResponsiveContainer,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatRevenueTick(value: number): string {
  if (value >= 1_000_000) return `${value / 1_000_000}M`;
  if (value >= 1_000) return `${value / 1_000}K`;
  return String(value);
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Cắt YYYY-MM-DD theo local time. */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Chuyển key range → { fromDate, toDate } (YYYY-MM-DD). */
function rangeToFilter(range: string): DashboardFilter {
  const now = new Date();
  const toDate = toISODate(now);
  if (range === "7d") {
    const from = new Date(now);
    from.setDate(from.getDate() - 6);
    return { fromDate: toISODate(from), toDate };
  }
  if (range === "30d") {
    const from = new Date(now);
    from.setDate(from.getDate() - 29);
    return { fromDate: toISODate(from), toDate };
  }
  // today
  return { fromDate: toDate, toDate };
}

function formatChartDate(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}`;
}

function fillRevenueByDay(
  rows: Array<{ date: string; revenue: number }> | undefined,
  filter: DashboardFilter
) {
  if (!filter.fromDate || !filter.toDate) return [];
  const byDate = new Map((rows ?? []).map((r) => [r.date, r.revenue]));
  const result: Array<{ date: string; label: string; revenue: number }> = [];
  const cursor = new Date(`${filter.fromDate}T00:00:00`);
  const end = new Date(`${filter.toDate}T00:00:00`);
  while (cursor <= end) {
    const date = toISODate(cursor);
    result.push({ date, label: formatChartDate(date), revenue: byDate.get(date) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

const RANGE_OPTIONS = [
  { key: "today", label: "Hôm nay" },
  { key: "7d", label: "7 ngày" },
  { key: "30d", label: "30 ngày" },
] as const;

// Màu cho donut theo trạng thái phiếu
const DONUT_COLORS = ["#1A6BBF", "#F5B942", "#E5484D", "#B39DDB", "#2BB673", "#8895A7"];

// ─── Small components ────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  footer?: React.ReactNode;
}

function KpiCard({ title, value, icon: Icon, iconBg, footer }: KpiCardProps) {
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="truncate">{title}</span>
            <FiInfo className="h-3.5 w-3.5 flex-shrink-0 text-text-disabled" />
          </div>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
      {footer && (
        <div className="mt-4 rounded-lg bg-surface-secondary px-3 py-2 text-center text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </Card>
  );
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  CONFIRMED: { label: "Đã xác nhận", className: "bg-success-light text-success" },
  PAID: { label: "Đã thanh toán", className: "bg-success-light text-success" },
  PENDING: { label: "Chờ xác nhận", className: "bg-warning-light text-warning" },
  WAITING_PAYMENT: { label: "Chờ thanh toán", className: "bg-primary-100 text-primary-600" },
  CANCELLED: { label: "Đã hủy", className: "bg-error-light text-error" },
};

function StatusBadge({ status }: { status: string | null }) {
  const key = (status ?? "").toUpperCase();
  const s = STATUS_BADGE[key] ?? { label: status || "—", className: "bg-surface-secondary text-muted-foreground" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

function RangeToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-surface-secondary p-1">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === opt.key
              ? "bg-white text-primary-600 shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [range, setRange] = useState<string>("today");

  const filter = useMemo(() => rangeToFilter(range), [range]);

  const { data: stats, isLoading: statsLoading } = useDashboardStats(filter);
  const { data: ratios, isLoading: ratiosLoading } = useTicketRatios(filter);
  const { data: revenueByDay, isLoading: revenueLoading } = useRevenueByDay(filter);
  const { data: recentTickets, isLoading: recentLoading } = useRecentTickets({ limit: 10 });
  const { data: upcoming, isLoading: upcomingLoading } = useUpcomingSchedules();

  const paidRatio =
    stats && stats.totalTickets > 0
      ? ((stats.paidTickets / stats.totalTickets) * 100).toFixed(1)
      : "0";

  const confirmationRatio =
    stats && stats.totalTickets > 0
      ? ((stats.paidTickets / stats.totalTickets) * 100).toFixed(1)
      : "0";

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

  const revenueChartData = useMemo(
    () => fillRevenueByDay(revenueByDay, filter),
    [revenueByDay, filter]
  );

  if (statsLoading || ratiosLoading) {
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
          <RangeToggle value={range} onChange={setRange} />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Tổng doanh thu"
          value={stats ? formatCurrency(stats.totalRevenue) : "—"}
          icon={FiDollarSign}
          iconBg="bg-success"
          footer={stats ? `Doanh thu thuần: ${formatCurrency(stats.netRevenue)}` : undefined}
        />
        <KpiCard
          title="Tổng phiếu khám"
          value={stats ? formatNumber(stats.totalTickets) : "—"}
          icon={FiCalendar}
          iconBg="bg-primary-600"
        />
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
        <KpiCard
          title="Phiếu đã hủy"
          value={stats ? formatNumber(stats.cancelledTickets) : "—"}
          icon={FiXCircle}
          iconBg="bg-error"
        />
        <KpiCard
          title="Tổng bác sĩ"
          value={stats ? formatNumber(stats.totalDoctors) : "—"}
          icon={FiUsers}
          iconBg="bg-purple-500"
        />
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
        <KpiCard
          title="Tỷ lệ xác nhận"
          value={`${confirmationRatio}%`}
          icon={FiCheckCircle}
          iconBg="bg-success"
        />
      </div>

      {/* Revenue by day */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Doanh thu theo ngày</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Dữ liệu từ {formatChartDate(filter.fromDate ?? "")} đến {formatChartDate(filter.toDate ?? "")}
            </p>
          </div>
        </div>
        {revenueLoading ? (
          <div className="flex h-[280px] items-center justify-center">
            <LoadingSpinner text="Đang tải doanh thu..." />
          </div>
        ) : revenueChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueChartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "#627D98" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "#627D98" }}
                tickFormatter={(v) => formatRevenueTick(Number(v))}
                domain={[0, (dataMax: number) => Math.max(dataMax, 1_000_000)]}
              />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v)), "Doanh thu"]}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { date?: string } | undefined;
                  return row?.date ? `Ngày ${formatChartDate(row.date)}` : "Doanh thu";
                }}
                cursor={{ fill: "rgba(11,92,173,0.06)" }}
              />
              <Bar dataKey="revenue" name="Doanh thu (đồng)" maxBarSize={72} radius={[6, 6, 0, 0]}>
                {revenueChartData.map((entry, index) => (
                  <Cell
                    key={entry.date}
                    fill={index === revenueChartData.length - 1 ? "#0B5CAD" : "#B3D1EF"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">Không có dữ liệu doanh thu.</p>
        )}
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary-300" /> Doanh thu đã thanh toán (VNĐ)
        </p>
      </Card>

      {/* Ticket status donut */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Tỷ lệ trạng thái phiếu khám</h2>
        </div>
        {donutData.length > 0 ? (
          <div className="flex flex-col items-center justify-center gap-8 lg:flex-row lg:justify-start">
            <div className="relative h-[220px] w-[220px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={entry.name} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${formatNumber(Number(v))} phiếu`, n as string]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{formatNumber(totalTicketsForDonut)}</span>
                <span className="text-xs text-muted-foreground">Tổng phiếu</span>
              </div>
            </div>
            <div className="w-full max-w-sm space-y-3 lg:flex-none">
              {donutData.map((d, index) => (
                <div key={d.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
                    />
                    <span className="text-sm text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {d.percent}% <span className="text-muted-foreground">({formatNumber(d.value)})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">Không có dữ liệu</p>
        )}
      </Card>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent tickets */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Phiếu khám gần đây</h2>
          </div>
          {recentLoading ? (
            <div className="py-10">
              <LoadingSpinner text="Đang tải..." />
            </div>
          ) : recentTickets && recentTickets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Thời gian</th>
                    <th className="pb-2 pr-3 font-medium">Bệnh nhân</th>
                    <th className="pb-2 pr-3 font-medium">Bác sĩ</th>
                    <th className="pb-2 pr-3 font-medium">Dịch vụ</th>
                    <th className="pb-2 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.map((t) => (
                    <tr key={t.bookingId} className="border-b border-border last:border-0">
                      <td className="py-3 pr-3 text-muted-foreground">
                        {formatDateTime(t.appointmentTime ?? t.createdAt)}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="flex items-center gap-1.5 text-foreground">
                          <FiUser className="h-3.5 w-3.5 text-text-disabled" />
                          {t.patientName ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-foreground">{t.doctorName ?? "—"}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{t.serviceName ?? "—"}</td>
                      <td className="py-3">
                        <StatusBadge status={t.localStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">Chưa có phiếu khám nào.</p>
          )}
        </Card>

        {/* Upcoming schedules */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Lịch khám sắp tới</h2>
          </div>
          {upcomingLoading ? (
            <div className="py-10">
              <LoadingSpinner text="Đang tải..." />
            </div>
          ) : upcoming && upcoming.length > 0 ? (
            <div className="space-y-1">
              {upcoming.map((s) => (
                <div key={s.scheduleId} className="flex items-start gap-3 rounded-lg px-2 py-3 hover:bg-surface-secondary">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    <FiCalendar className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{s.doctorName ?? "—"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {s.examAreaName ?? s.specialtyName ?? "—"}
                      {s.roomName ? ` · ${s.roomName}` : ""}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-medium text-foreground">
                      {s.startTime?.slice(0, 5)} - {s.endTime?.slice(0, 5)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {s.bookedCount}/{s.maxAppointments ?? "—"} slot
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">Không có lịch khám sắp tới.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
